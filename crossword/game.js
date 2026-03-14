/**
 * 日语填字游戏
 * 使用罗马音输入，显示平假名
 */
const ROMA_TO_HIRA = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  sa: 'さ', si: 'し', su: 'す', se: 'せ', so: 'そ',
  ta: 'た', ti: 'ち', tu: 'つ', te: 'て', to: 'と',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', hu: 'ふ', he: 'へ', ho: 'ほ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  wa: 'わ', wo: 'を', n: 'ん',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  za: 'ざ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
  dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ'
};

const HIRA_TO_ROMA = {};
Object.entries(ROMA_TO_HIRA).forEach(([r, h]) => { HIRA_TO_ROMA[h] = r; });

function romaToHira(str) {
  if (!str) return '';
  const c = str.toLowerCase();
  return ROMA_TO_HIRA[c] || c;
}

const PUZZLE = {
  size: 10,
  words: [
    { id: 1, clue: '你好（白天）', answer: 'konnichiwa', row: 3, col: 0, dir: 'across' },
    { id: 2, clue: '谢谢', answer: 'arigatou', row: 1, col: 4, dir: 'down' },
    { id: 3, clue: '是的', answer: 'hai', row: 0, col: 6, dir: 'down' },
    { id: 4, clue: '不、不是', answer: 'iie', row: 3, col: 7, dir: 'down' },
    { id: 5, clue: '早上好', answer: 'ohayou', row: 7, col: 0, dir: 'across' }
  ]
};

function buildGrid() {
  const { size, words } = PUZZLE;
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  const cellWords = {}; // (r,c) -> [wordId, index]

  words.forEach(w => {
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        grid[r][c] = { char: ans[i], words: [] };
        if (!cellWords[`${r},${c}`]) cellWords[`${r},${c}`] = [];
        cellWords[`${r},${c}`].push({ id: w.id, index: i });
      }
    }
  });

  return { grid, cellWords };
}

let state = { selectedCell: null, currentWord: null, userInput: {} };

function init() {
  const { grid, cellWords } = buildGrid();
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${PUZZLE.size}, 36px)`;
  gridEl.style.gridTemplateRows = `repeat(${PUZZLE.size}, 36px)`;

  for (let r = 0; r < PUZZLE.size; r++) {
    for (let c = 0; c < PUZZLE.size; c++) {
      const cell = document.createElement('div');
      if (grid[r][c]) {
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.textContent = '';
        cell.addEventListener('click', () => selectCell(r, c, grid, cellWords));
        gridEl.appendChild(cell);
      } else {
        cell.className = 'cell block';
        gridEl.appendChild(cell);
      }
    }
  }

  document.addEventListener('keydown', handleKey);

  renderClues(cellWords);
  document.getElementById('btnCheck').onclick = () => checkAnswers(grid, cellWords);
  document.getElementById('btnReset').onclick = () => {
    state.userInput = {};
    state.selectedCell = null;
    document.querySelectorAll('.cell:not(.block)').forEach(el => {
      el.textContent = '';
      el.classList.remove('correct', 'wrong', 'selected', 'highlight');
    });
    document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('active'));
    document.getElementById('status').textContent = '';
  };
}

function selectCell(r, c, grid, cellWords) {
  if (!grid[r][c]) return;
  document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'highlight'));
  document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('active'));

  const key = `${r},${c}`;
  const words = cellWords[key];
  if (!words) return;

  state.selectedCell = { r, c };
  const word = PUZZLE.words.find(w => w.id === words[0].id);
  state.currentWord = { word, index: words[0].index };

  document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`)?.classList.add('selected');

  PUZZLE.words.forEach(w => {
    if (w.id !== word.id) return;
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const rr = w.dir === 'across' ? w.row : w.row + i;
      const cc = w.dir === 'across' ? w.col + i : w.col;
      document.querySelector(`.cell[data-row="${rr}"][data-col="${cc}"]`)?.classList.add('highlight');
    }
  });

  document.querySelector(`.clue-item[data-id="${word.id}"]`)?.classList.add('active');
}

function handleKey(e) {
  if (!state.selectedCell) return;
  const { r, c } = state.selectedCell;
  const key = `${r},${c}`;

  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    e.preventDefault();
    const char = e.key.toLowerCase();
    state.userInput[key] = char;
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
      cell.textContent = ROMA_TO_HIRA[char] || char;
      cell.classList.remove('correct', 'wrong');
    }
    moveToNext(r, c);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    state.userInput[key] = '';
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
      cell.textContent = '';
      cell.classList.remove('correct', 'wrong');
    }
    moveToPrev(r, c);
  }
}

function moveToNext(r, c) {
  const { grid } = buildGrid();
  const words = PUZZLE.words.filter(w => {
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const rr = w.dir === 'across' ? w.row : w.row + i;
      const cc = w.dir === 'across' ? w.col + i : w.col;
      if (rr === r && cc === c) return true;
    }
    return false;
  });
  if (!words.length) return;
  const w = words[0];
  const ans = w.answer.replace(/\s/g, '');
  let idx = -1;
  for (let i = 0; i < ans.length; i++) {
    const rr = w.dir === 'across' ? w.row : w.row + i;
    const cc = w.dir === 'across' ? w.col + i : w.col;
    if (rr === r && cc === c) { idx = i; break; }
  }
  if (idx < 0 || idx >= ans.length - 1) return;
  const nr = w.dir === 'across' ? r : r + 1;
  const nc = w.dir === 'across' ? c + 1 : c;
  if (nr >= 0 && nr < PUZZLE.size && nc >= 0 && nc < PUZZLE.size && grid[nr][nc]) {
    document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`)?.click();
  }
}

function moveToPrev(r, c) {
  const { grid } = buildGrid();
  const words = PUZZLE.words.filter(w => {
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const rr = w.dir === 'across' ? w.row : w.row + i;
      const cc = w.dir === 'across' ? w.col + i : w.col;
      if (rr === r && cc === c) return true;
    }
    return false;
  });
  if (!words.length) return;
  const w = words[0];
  const ans = w.answer.replace(/\s/g, '');
  let idx = -1;
  for (let i = 0; i < ans.length; i++) {
    const rr = w.dir === 'across' ? w.row : w.row + i;
    const cc = w.dir === 'across' ? w.col + i : w.col;
    if (rr === r && cc === c) { idx = i; break; }
  }
  if (idx <= 0) return;
  const nr = w.dir === 'across' ? r : r - 1;
  const nc = w.dir === 'across' ? c - 1 : c;
  if (nr >= 0 && nr < PUZZLE.size && nc >= 0 && nc < PUZZLE.size && grid[nr][nc]) {
    document.querySelector(`.cell[data-row="${nr}"][data-col="${nc}"]`)?.click();
  }
}

function renderClues(cellWords) {
  const across = PUZZLE.words.filter(w => w.dir === 'across');
  const down = PUZZLE.words.filter(w => w.dir === 'down');

  const render = (list, elId) => {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    list.forEach(w => {
      const div = document.createElement('div');
      div.className = 'clue-item';
      div.dataset.id = w.id;
      div.innerHTML = `<span class="num">${w.id}.</span>${w.clue}<div class="kana-hint">${w.answer}</div>`;
      div.onclick = () => {
        const ans = w.answer.replace(/\s/g, '');
        const r = w.dir === 'across' ? w.row : w.row;
        const c = w.dir === 'across' ? w.col : w.col;
        document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`)?.click();
      };
      el.appendChild(div);
    });
  };
  render(across, 'cluesAcross');
  render(down, 'cluesDown');
}

function checkAnswers(grid, cellWords) {
  let correct = 0;
  let total = 0;
  PUZZLE.words.forEach(w => {
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col : w.col + i;
      const key = `${r},${c}`;
      const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
      if (!cell) continue;
      total++;
      const user = (state.userInput[key] || '').toLowerCase();
      const expected = ans[i].toLowerCase();
      if (user === expected) {
        cell.classList.add('correct');
        cell.classList.remove('wrong');
        correct++;
      } else {
        cell.classList.add('wrong');
        cell.classList.remove('correct');
      }
    }
  });
  const status = document.getElementById('status');
  status.textContent = total > 0 ? `正确 ${correct}/${total}` : '请先填写';
}

init();
