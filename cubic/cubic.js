import { initScene } from './scene.js';
import { createCube } from './cube.js';
import { generateScramble } from './scramble.js';

const { scene, camera, renderer, controls, stars } = initScene();
const { rotateFace, resetCube, queueScramble, setBaseRotationDuration, getStickerState } = createCube(scene, {
  onRotationEnd: updateStickerPanel
});

// --- 贴纸状态面板 ---
const FACE_ORDER = ['U', 'L', 'F', 'R', 'B', 'D'];
function updateStickerPanel() {
  const state = getStickerState();
  FACE_ORDER.forEach((faceName) => {
    const el = document.getElementById(`face-${faceName}`);
    if (!el) return;
    const arr = state[faceName];
    if (!arr || arr.length !== 9) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    arr.forEach((letter) => {
      const div = document.createElement('div');
      div.className = 'sticker ' + (letter === '?' ? 'u' : letter.toLowerCase());
      el.appendChild(div);
    });
  });
}

// --- UI 绑定 ---
const scrambleDisplay = document.getElementById('scrambleDisplay');
const rotationSpeedSlider = document.getElementById('rotationSpeed');
const rotationSpeedValue = document.getElementById('rotationSpeedValue');

// 从 localStorage 初始化旋转时长
const ROT_SPEED_KEY = 'cube.baseRotationDuration';
const storedSpeed = parseInt(localStorage.getItem(ROT_SPEED_KEY), 10);
// 默认转动时间稍慢一点
const defaultSpeed = Number.isFinite(storedSpeed) ? storedSpeed : 300;

setBaseRotationDuration(defaultSpeed);
if (rotationSpeedSlider) {
  rotationSpeedSlider.value = String(defaultSpeed);
}
if (rotationSpeedValue) {
  rotationSpeedValue.textContent = `${defaultSpeed} ms`;
}

document.getElementById('btnU').addEventListener('click', () => rotateFace('U'));
document.getElementById("btnU'").addEventListener('click', () => rotateFace("U'"));
document.getElementById('btnD').addEventListener('click', () => rotateFace('D'));
document.getElementById("btnD'").addEventListener('click', () => rotateFace("D'"));
document.getElementById('btnL').addEventListener('click', () => rotateFace('L'));
document.getElementById("btnL'").addEventListener('click', () => rotateFace("L'"));
document.getElementById('btnR').addEventListener('click', () => rotateFace('R'));
document.getElementById("btnR'").addEventListener('click', () => rotateFace("R'"));
document.getElementById('btnF').addEventListener('click', () => rotateFace('F'));
document.getElementById("btnF'").addEventListener('click', () => rotateFace("F'"));
document.getElementById('btnB').addEventListener('click', () => rotateFace('B'));
document.getElementById("btnB'").addEventListener('click', () => rotateFace("B'"));

document.getElementById('resetCube').addEventListener('click', () => {
  resetCube();
});

const generateBtn = document.getElementById('generateScramble');

generateBtn.addEventListener('click', () => {
  const scramble = generateScramble(20);
  scrambleDisplay.classList.remove('placeholder');
  scrambleDisplay.innerHTML = `<span>打乱公式</span> ${scramble}`;
});

scrambleDisplay.addEventListener('click', () => {
  if (scrambleDisplay.classList.contains('placeholder')) {
    return;
  }

  const text = scrambleDisplay.innerText.replace('打乱公式', '').trim();
  const scramble = normalizeFormula(text);
  if (scramble) {
    queueScramble(scramble);
  }
});

function normalizeFormula(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const prime = /['\u2019\u2032]/;
  const moves = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[UDLRFB]/i.test(c)) {
      let m = c.toUpperCase();
      i++;
      if (i < s.length && prime.test(s[i])) {
        m += "'";
        i++;
      }
      if (i < s.length && s[i] === '2') {
        m += '2';
        i++;
      }
      moves.push(m);
    } else {
      i++;
    }
  }
  return moves.join(' ');
}

function executeFormulaInput() {
  const input = document.getElementById('formulaInput');
  const raw = input?.value?.trim();
  if (!raw) return;
  const formula = normalizeFormula(raw);
  if (!formula) return;
  queueScramble(formula);
  input.value = formula; // 修改 input.value
  input.readOnly = true;
}
document.getElementById('executeFormula')?.addEventListener('click', executeFormulaInput);
document.getElementById('formulaInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') executeFormulaInput();
});
document.getElementById('formulaInput')?.addEventListener('click', () => {
  const input = document.getElementById('formulaInput');
  if (input?.readOnly) {
    input.readOnly = false;
    input.focus();
  }
});

document.getElementById('formulaInput')?.addEventListener('paste', (e) => {
  e.preventDefault();
  const raw = (e.clipboardData?.getData('text') || '').trim();
  if (!raw) return;
  const formula = normalizeFormula(raw);
  const input = document.getElementById('formulaInput');
  if (input) {
    input.value = formula;
    input.readOnly = false;
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target?.id !== 'formulaInput') return;
  const input = e.target;
  if (input.readOnly) return;
  const raw = input.value?.trim();
  if (raw) {
    input.value = normalizeFormula(raw);
  }
});

if (rotationSpeedSlider) {
  rotationSpeedSlider.addEventListener('input', () => {
    const ms = parseInt(rotationSpeedSlider.value, 10);
    if (!Number.isFinite(ms) || ms <= 0) return;
    setBaseRotationDuration(ms);
    localStorage.setItem(ROT_SPEED_KEY, String(ms));
    if (rotationSpeedValue) {
      rotationSpeedValue.textContent = `${ms} ms`;
    }
  });
}

updateStickerPanel();

// 复制为 54 字符 (U D F B L R 顺序，每面 9 格)
document.getElementById('copyState54')?.addEventListener('click', () => {
  const state = getStickerState();
  const order = ['U', 'D', 'F', 'B', 'L', 'R'];
  const str = order.map((f) => state[f].join('')).join('');
  navigator.clipboard.writeText(str).then(() => {
    const btn = document.getElementById('copyState54');
    const orig = btn.textContent;
    btn.textContent = '已复制';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  });
});

// 复制 AI 还原提示词
const AI_PROMPT_TEMPLATE = `请根据以下三阶魔方状态，输出还原公式。

魔方状态（54 字符贴纸表示，顺序：U/D/F/B/L/R 面各 9 格，每格字母表示该位置当前颜色，U=黄 D=白 F=红 B=橙 L=蓝 R=绿）：
{{STATE}}

请输出还原公式，使用 WCA 符号：U D L R F B 表示顺时针 90°，加 ' 表示逆时针，加 2 表示 180°。只输出公式，不要输出空格，直接连续输出如 RUR'U'。`;

document.getElementById('copyAIPrompt')?.addEventListener('click', () => {
  const state = getStickerState();
  const order = ['U', 'D', 'F', 'B', 'L', 'R'];
  const stateStr = order.map((f) => state[f].join('')).join('');
  const prompt = AI_PROMPT_TEMPLATE.replace('{{STATE}}', stateStr);
  navigator.clipboard.writeText(prompt).then(() => {
    const btn = document.getElementById('copyAIPrompt');
    const orig = btn.textContent;
    btn.textContent = '已复制';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  });
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  stars.rotation.y += 0.0001;
  stars.rotation.x += 0.00005;
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

