import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  initScene,
  createCube,
  generateScramble,
  normalizeFormula,
  CFOP,
  type StickerState,
} from '@promptwars/cubic';

const ROT_SPEED_KEY = 'cube.baseRotationDuration';
const flipRows = (arr: string[]) => [...arr.slice(6, 9), ...arr.slice(3, 6), ...arr.slice(0, 3)];
const AI_PROMPT_TEMPLATE = `请根据以下三阶魔方状态，输出还原公式。

魔方状态（54 字符贴纸表示，顺序：U/D/F/B/L/R 面各 9 格，每格字母表示该位置当前颜色，U=黄 D=白 F=红 B=橙 L=蓝 R=绿）：
{{STATE}}

请输出还原公式，使用 WCA 符号：U D L R F B 表示顺时针 90°，加 ' 表示逆时针，加 2 表示 180°。只输出公式，不要输出空格，直接连续输出如 RUR'U'。`;

export default function CubicPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<ReturnType<typeof createCube> | null>(null);
  const sceneRef = useRef<ReturnType<typeof initScene> | null>(null);
  const animRef = useRef<number>(0);
  const [stickerState, setStickerState] = useState<StickerState | null>(null);
  const [scramble, setScramble] = useState<string | null>(null);
  const [formulaInput, setFormulaInput] = useState('');
  const [rotationSpeed, setRotationSpeed] = useState(() => {
    const stored = parseInt(localStorage.getItem(ROT_SPEED_KEY) ?? '', 10);
    return Number.isFinite(stored) ? stored : 300;
  });
  const [cfopOpen, setCfopOpen] = useState(false);
  const [cfopTab, setCfopTab] = useState<'OLL' | 'PLL' | 'F2L'>('OLL');

  const updateStickerPanel = useCallback(() => {
    if (cubeRef.current) {
      setStickerState(cubeRef.current.getStickerState());
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scene, camera, renderer, controls, stars } = initScene(container);
    sceneRef.current = { scene, camera, renderer, controls, stars };

    const cube = createCube(scene, { onRotationEnd: updateStickerPanel });
    cubeRef.current = cube;
    cube.setBaseRotationDuration(rotationSpeed);
    updateStickerPanel();

    function animate() {
      animRef.current = requestAnimationFrame(animate);
      controls.update();
      stars.rotation.y += 0.0001;
      stars.rotation.x += 0.00005;
      renderer.render(scene, camera);
    }
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Drag-to-rotate: Raycaster + pointer events
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const worldFaceNormals: Record<string, THREE.Vector3> = {
      U: new THREE.Vector3(0, 1, 0),
      D: new THREE.Vector3(0, -1, 0),
      F: new THREE.Vector3(0, 0, 1),
      B: new THREE.Vector3(0, 0, -1),
      R: new THREE.Vector3(1, 0, 0),
      L: new THREE.Vector3(-1, 0, 0),
    };
    const localFaceNormals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    const DRAG_THRESHOLD = 30;
    let dragState: {
      face: string;
      cubePos: THREE.Vector3;
      startX: number;
      startY: number;
      accDx: number;
      accDy: number;
    } | null = null;

    function getPointerNDC(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    // 棱块：恰好一个坐标为 0（中间层）
    function isEdgePiece(pos: THREE.Vector3): boolean {
      const ax = Math.abs(pos.x) < 0.5;
      const ay = Math.abs(pos.y) < 0.5;
      const az = Math.abs(pos.z) < 0.5;
      return (ax ? 1 : 0) + (ay ? 1 : 0) + (az ? 1 : 0) === 1;
    }

    // 根据触摸面、拖拽方向、方块位置计算要旋转的面（类似真实魔方：手指按的面不转，推的是相邻层）
    function getMoveFromDrag(
      face: string,
      direction: 'up' | 'down' | 'left' | 'right',
      cubePos: THREE.Vector3
    ): string {
      const { x, y, z } = cubePos;
      const inFLayer = z > 0.5;
      const inRLayer = x > 0.5;

      // 棱块：旋转对应中间层 M(x=0) / E(y=0) / S(z=0)
      if (isEdgePiece(cubePos)) {
        const cw = direction === 'left' || direction === 'down';
        if (Math.abs(x) < 0.5) return cw ? 'M' : "M'";
        if (Math.abs(y) < 0.5) return cw ? "E'" : 'E';
        return cw ? 'S' : "S'";
      }

      if (direction === 'left' || direction === 'right') {
        // 左右拖拽：B/L/D 面旋转本层，其余由 y 决定 U 或 D
        if (face === 'B') return direction === 'left' ? 'B' : "B'";
        if (face === 'L') return direction === 'left' ? 'L' : "L'";
        if (face === 'D') return direction === 'left' ? 'D' : "D'";
        if (y >= 0) return direction === 'left' ? 'U' : "U'";
        return direction === 'left' ? "D'" : 'D';
      }
      // 上下拖拽：由触摸面和位置决定
      if (face === 'R' || face === 'L') {
        if (inFLayer || z >= 0) return direction === 'up' ? "F'" : 'F';
        return direction === 'up' ? 'B' : "B'";
      }
      if (face === 'F' || face === 'B') {
        if (inRLayer || x >= 0) return direction === 'up' ? 'R' : "R'";
        return direction === 'up' ? "L'" : 'L';
      }
      if (face === 'U') {
        if (inFLayer || z >= 0) return direction === 'up' ? "F'" : 'F';
        return direction === 'up' ? 'B' : "B'";
      }
      if (face === 'D') {
        if (inFLayer || z >= 0) return direction === 'up' ? 'F' : "F'";
        return direction === 'up' ? "B'" : 'B';
      }
      return '';
    }

    function hitToFace(intersect: THREE.Intersection): string | null {
      const mesh = intersect.object as THREE.Mesh;
      const faceIndex = intersect.faceIndex ?? 0;
      const localIdx = Math.min(Math.floor(faceIndex / 2), 5);
      const localN = localFaceNormals[localIdx].clone();
      mesh.updateMatrixWorld(true);
      const worldN = localN.applyQuaternion(mesh.quaternion);
      let bestFace = '';
      let bestDot = -2;
      for (const [face, n] of Object.entries(worldFaceNormals)) {
        const d = worldN.dot(n);
        if (d > bestDot) {
          bestDot = d;
          bestFace = face;
        }
      }
      return bestDot > 0.9 ? bestFace : null;
    }

    function onPointerDown(e: PointerEvent) {
      getPointerNDC(e);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cube.cubeGroup.children, true);
      if (intersects.length > 0) {
        const face = hitToFace(intersects[0]);
        const mesh = intersects[0].object as THREE.Mesh;
        if (face && mesh.position) {
          e.preventDefault();
          e.stopPropagation();
          dragState = {
            face,
            cubePos: mesh.position.clone(),
            startX: e.clientX,
            startY: e.clientY,
            accDx: 0,
            accDy: 0,
          };
          controls.enabled = false;
        }
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragState) return;
      e.preventDefault();
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      dragState.accDx += dx;
      dragState.accDy += dy;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      const { accDx, accDy, face, cubePos } = dragState;
      let move: string | null = null;
      if (Math.abs(accDy) > DRAG_THRESHOLD && Math.abs(accDy) >= Math.abs(accDx)) {
        move = getMoveFromDrag(face, accDy < 0 ? 'up' : 'down', cubePos);
      } else if (Math.abs(accDx) > DRAG_THRESHOLD && Math.abs(accDx) >= Math.abs(accDy)) {
        move = getMoveFromDrag(face, accDx < 0 ? 'left' : 'right', cubePos);
      }
      if (move) {
        cube.rotateFace(move);
        dragState = null;
        controls.enabled = true;
      }
    }

    function onPointerUp() {
      if (dragState) {
        dragState = null;
        controls.enabled = true;
      }
    }

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown, { capture: true });
    el.addEventListener('pointermove', onPointerMove, { capture: true });
    el.addEventListener('pointerup', onPointerUp, { capture: true });
    el.addEventListener('pointerleave', onPointerUp, { capture: true });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('pointermove', onPointerMove, true);
      el.removeEventListener('pointerup', onPointerUp, true);
      el.removeEventListener('pointerleave', onPointerUp, true);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animRef.current);
      cube.stopAnimation();
      renderer.dispose();
      container.innerHTML = '';
      cubeRef.current = null;
      sceneRef.current = null;
    };
  }, [updateStickerPanel]);

  useEffect(() => {
    if (cubeRef.current) {
      cubeRef.current.setBaseRotationDuration(rotationSpeed);
    }
    localStorage.setItem(ROT_SPEED_KEY, String(rotationSpeed));
  }, [rotationSpeed]);

  const handleRotate = (face: string) => cubeRef.current?.rotateFace(face);
  const handleReset = () => cubeRef.current?.resetCube();
  const handleGenerateScramble = () => {
    const s = generateScramble(20);
    setScramble(s);
  };
  const handleScrambleClick = () => {
    if (!scramble) return;
    const formula = normalizeFormula(scramble);
    if (formula) cubeRef.current?.queueScramble(formula);
  };
  const handleExecuteFormula = () => {
    const formula = normalizeFormula(formulaInput);
    if (!formula) return;
    cubeRef.current?.queueScramble(formula);
    setFormulaInput(formula);
  };
  const handleFormulaPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const raw = (e.clipboardData?.getData('text') ?? '').trim();
    if (raw) setFormulaInput(normalizeFormula(raw));
  };

  const copyState54 = () => {
    if (!stickerState) return;
    const order = ['U', 'D', 'F', 'B', 'L', 'R'];
    const str = order.map((f) => stickerState[f]?.join('') ?? '').join('');
    navigator.clipboard.writeText(str);
  };
  const copyAIPrompt = () => {
    if (!stickerState) return;
    const order = ['U', 'D', 'F', 'B', 'L', 'R'];
    const stateStr = order.map((f) => stickerState[f]?.join('') ?? '').join('');
    const prompt = AI_PROMPT_TEMPLATE.replace('{{STATE}}', stateStr);
    navigator.clipboard.writeText(prompt);
  };

  const cfopList = CFOP[cfopTab];

  return (
    <div style={{ margin: 0, overflow: 'hidden', minHeight: '100vh', background: '#0a0a12' }}>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 25,
        }}
      >
        <Link to="/" style={{ color: '#aaccff', textDecoration: 'none', fontSize: 14, flexShrink: 0 }}>← 返回</Link>
        <div
          id="info"
          style={{
            color: 'rgba(255,255,255,0.8)',
            background: 'rgba(20,20,30,0.6)',
            backdropFilter: 'blur(6px)',
            padding: '8px 18px',
            borderRadius: 40,
            fontSize: 14,
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          🎨 <span style={{ color: '#ffd966', fontWeight: 600 }}>标准魔方</span> · 前红 后橙 右绿 左蓝 上黄 下白
        </div>
      </div>

      <div className="top-panel" style={topPanelStyle}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="action-btn reset-btn" onClick={handleReset}>🔄 恢复魔方</button>
          <button className="action-btn" onClick={handleGenerateScramble}>🎲 生成WCA打乱</button>
          <button className="action-btn" onClick={() => setCfopOpen(true)}>📋 CFOP 公式</button>
        </div>
        <div
          className={`scramble-display ${!scramble ? 'placeholder' : ''}`}
          onClick={handleScrambleClick}
          style={scrambleDisplayStyle}
        >
          {scramble ? <><span style={{ color: '#ffd966', fontWeight: 600 }}>打乱公式</span> {scramble}</> : '点击生成打乱公式'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 500 }}>
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            onPaste={handleFormulaPaste}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteFormula()}
            placeholder="输入或粘贴公式，如 R U R' U'"
            style={formulaInputStyle}
          />
          <button className="action-btn" onClick={handleExecuteFormula}>执行公式</button>
        </div>
      </div>

      <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />

      {stickerState && (
        <div style={stickerPanelStyle}>
          <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>当前状态</div>
          <div className="cell cell-u sticker-face" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 2 }}>
            {flipRows(stickerState.U ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-l sticker-face" style={{ ...stickerFaceStyle, gridColumn: 1, gridRow: 3 }}>
            {(stickerState.L ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-f sticker-face" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 3 }}>
            {(stickerState.F ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-r sticker-face" style={{ ...stickerFaceStyle, gridColumn: 3, gridRow: 3 }}>
            {(stickerState.R ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-b sticker-face" style={{ ...stickerFaceStyle, gridColumn: 4, gridRow: 3 }}>
            {(stickerState.B ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-d sticker-face" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 4 }}>
            {flipRows(stickerState.D ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <button className="copy-btn" onClick={copyState54} style={{ ...copyBtnStyle, marginTop: 6 }}>复制贴纸状态</button>
          <button className="copy-btn" onClick={copyAIPrompt} style={{ ...copyBtnStyle, marginTop: 2 }}>复制 AI 还原提示词</button>
        </div>
      )}

      <div style={{ ...controlPanelStyle, flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['U', 'D', 'L', 'R', 'F', 'B'] as const).map((face) => (
              <button key={face} className="control-btn small-btn" data-face={face} onClick={() => handleRotate(face)} style={controlBtnStyle}>
                {face}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(["U'", "D'", "L'", "R'", "F'", "B'"] as const).map((face) => (
              <button key={face} className="control-btn small-btn" data-face={face} onClick={() => handleRotate(face)} style={controlBtnStyle}>
                {face}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, whiteSpace: 'nowrap' }}>🖱️ 鼠标拖拽自由视角 | 滚轮缩放 | 点击公式执行打乱</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              单次旋转时间 <span style={{ color: '#ffd966', fontWeight: 600 }}>{rotationSpeed} ms</span>
            </label>
            <input
              type="range"
              min={100}
              max={800}
              step={50}
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseInt(e.target.value, 10))}
              style={{ accentColor: '#ffd966' }}
            />
          </div>
        </div>
      </div>

      {cfopOpen && (
        <div style={modalOverlayStyle} onClick={() => setCfopOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['OLL', 'PLL', 'F2L'] as const).map((tab) => (
                  <button key={tab} onClick={() => setCfopTab(tab)} style={cfopTabStyle(cfopTab === tab)}>
                    {tab}
                  </button>
                ))}
              </div>
              <button onClick={() => setCfopOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 400, overflow: 'auto' }}>
              {cfopList.map((item) => (
                <div
                  key={item.id}
                  style={cfopItemStyle}
                  onClick={() => navigator.clipboard.writeText(item.formula)}
                  onDoubleClick={() => { cubeRef.current?.queueScramble(item.formula); setCfopOpen(false); }}
                >
                  <span style={{ color: '#ffd966', fontWeight: 600 }}>{item.id}</span> {item.name}: {item.formula}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .action-btn { background: rgba(50,50,70,0.9); border: 1px solid rgba(255,215,0,0.5); color: #ffd966; padding: 10px 20px; border-radius: 40px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .action-btn:hover { background: rgba(70,70,100,0.9); }
        .reset-btn { border-color: rgba(100,150,255,0.5); color: #aaccff; }
        .sticker-face { display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); gap: 2px; width: 54px; height: 54px; padding: 3px; background: rgba(0,0,0,0.4); border-radius: 6px; }
        .sticker.u { background: #ffdc00; } .sticker.d { background: #fff; border: 1px solid #e0e0e0; }
        .sticker.f { background: #ff4136; } .sticker.b { background: #ff851b; }
        .sticker.l { background: #0074d9; } .sticker.r { background: #2ecc40; }
        .control-btn { width: 45px; height: 45px; border-radius: 30px; border: none; background: rgba(20,20,28,0.9); color: white; font-size: 20px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .control-btn:hover { background: rgba(50,50,65,1); }
      `}</style>
    </div>
  );
}

const topPanelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  right: 20,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 10,
  zIndex: 20,
};

const scrambleDisplayStyle: React.CSSProperties = {
  background: 'rgba(20,20,30,0.8)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: 40,
  fontSize: 20,
  fontFamily: 'monospace',
  cursor: 'pointer',
  minWidth: 300,
};

const formulaInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: '10px 16px',
  fontSize: 14,
  fontFamily: 'monospace',
  background: 'rgba(20,20,30,0.9)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 24,
  color: '#fff',
  outline: 'none',
};

const stickerPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 30,
  right: 20,
  display: 'grid',
  gridTemplateColumns: 'auto auto auto auto',
  gridTemplateRows: 'auto auto auto auto auto',
  columnGap: 6,
  rowGap: 0,
  padding: '12px 14px',
  background: 'rgba(20,20,30,0.9)',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  zIndex: 20,
};

const stickerFaceStyle: React.CSSProperties = {};
const stickerStyle: React.CSSProperties = { width: 14, height: 14, borderRadius: 3 };
const copyBtnStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  padding: '6px 12px',
  fontSize: 12,
  background: 'rgba(50,50,70,0.9)',
  border: '1px solid rgba(255,215,0,0.4)',
  color: '#ffd966',
  borderRadius: 20,
  cursor: 'pointer',
};

const controlPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 30,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  gap: 15,
  background: 'rgba(30,30,40,0.7)',
  padding: '15px 25px',
  borderRadius: 60,
  border: '1px solid rgba(255,255,255,0.2)',
  zIndex: 20,
};

const controlBtnStyle: React.CSSProperties = {};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const modalContentStyle: React.CSSProperties = {
  background: '#1a1a2e',
  padding: 24,
  borderRadius: 12,
  maxWidth: 600,
  maxHeight: '80vh',
  overflow: 'auto',
};

const cfopTabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  background: active ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
});

const cfopItemStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  color: '#e8e8e8',
};
