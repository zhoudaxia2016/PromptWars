import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  initScene,
  createCube,
  generateScramble,
  normalizeFormula,
  CFOP,
  type StickerState,
} from '@promptwars/cubic';

const ROT_SPEED_KEY = 'cube.baseRotationDuration';
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

    return () => {
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
        id="info"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: 'rgba(255,255,255,0.8)',
          background: 'rgba(20,20,30,0.6)',
          backdropFilter: 'blur(6px)',
          padding: '8px 18px',
          borderRadius: 40,
          fontSize: 14,
          zIndex: 10,
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        🎨 <span style={{ color: '#ffd966', fontWeight: 600 }}>标准魔方</span> · 前红 后橙 右绿 左蓝 上黄 下白
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 25 }}>
        <Link to="/" style={{ color: '#aaccff', textDecoration: 'none', fontSize: 14 }}>← 返回</Link>
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

      <div style={instructionStyle}>🖱️ 鼠标拖拽自由视角 | 滚轮缩放 | 点击公式执行打乱</div>

      <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />

      {stickerState && (
        <div style={stickerPanelStyle}>
          <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>当前状态</div>
          <div className="cell cell-u" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 2 }}>
            {(stickerState.U ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-l" style={{ ...stickerFaceStyle, gridColumn: 1, gridRow: 3 }}>
            {(stickerState.L ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-f" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 3 }}>
            {(stickerState.F ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-r" style={{ ...stickerFaceStyle, gridColumn: 3, gridRow: 3 }}>
            {(stickerState.R ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-b" style={{ ...stickerFaceStyle, gridColumn: 4, gridRow: 3 }}>
            {(stickerState.B ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <div className="cell cell-d" style={{ ...stickerFaceStyle, gridColumn: 2, gridRow: 4 }}>
            {(stickerState.D ?? []).map((letter, i) => (
              <div key={i} className={`sticker ${letter === '?' ? 'u' : letter.toLowerCase()}`} style={stickerStyle} />
            ))}
          </div>
          <button className="copy-btn" onClick={copyState54} style={copyBtnStyle}>复制贴纸状态</button>
          <button className="copy-btn" onClick={copyAIPrompt} style={copyBtnStyle}>复制 AI 还原提示词</button>
        </div>
      )}

      <div style={controlPanelStyle}>
        {(['U', "U'", 'D', "D'", 'L', "L'", 'R', "R'", 'F', "F'", 'B', "B'"] as const).map((face) => (
          <button key={face} className="control-btn small-btn" data-face={face} onClick={() => handleRotate(face)} style={controlBtnStyle}>
            {face}
          </button>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
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

const instructionStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 140,
  left: '50%',
  transform: 'translateX(-50%)',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 13,
  zIndex: 15,
};

const stickerPanelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 30,
  right: 20,
  display: 'grid',
  gridTemplateColumns: 'auto auto auto auto',
  gridTemplateRows: 'auto auto auto auto auto',
  gap: 6,
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
