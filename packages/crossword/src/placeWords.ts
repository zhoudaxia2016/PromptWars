import type { Puzzle, PuzzleWord } from './data';

const GRID_SIZE = 15;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 将多组 (answer, clue, romanji?) 排入网格，生成填字谜题
 */
export function placeWords(items: { answer: string; clue: string; romanji?: string }[]): Puzzle {
  const words: PuzzleWord[] = [];
  const grid: (string | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

  const norm = (w: string) => w.replace(/\s/g, '').toLowerCase();
  const placed: { answer: string; row: number; col: number; dir: 'across' | 'down' }[] = [];

  function canPlaceAcross(row: number, col: number, word: string): boolean {
    if (col + word.length > GRID_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const r = row;
      const c = col + i;
      const cur = grid[r][c];
      if (cur !== null && cur !== word[i]) return false;
    }
    return true;
  }

  function canPlaceDown(row: number, col: number, word: string): boolean {
    if (row + word.length > GRID_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const r = row + i;
      const c = col;
      const cur = grid[r][c];
      if (cur !== null && cur !== word[i]) return false;
    }
    return true;
  }

  function putAcross(row: number, col: number, word: string): void {
    for (let i = 0; i < word.length; i++) {
      grid[row][col + i] = word[i];
    }
    placed.push({ answer: word, row, col, dir: 'across' });
  }

  function putDown(row: number, col: number, word: string): void {
    for (let i = 0; i < word.length; i++) {
      grid[row + i][col] = word[i];
    }
    placed.push({ answer: word, row, col, dir: 'down' });
  }

  const sorted = [...items]
    .map((x) => ({ ...x, answer: norm(x.answer) }))
    .filter((x) => x.answer.length > 0 && x.answer.length <= GRID_SIZE)
    .sort((a, b) => b.answer.length - a.answer.length);

  if (sorted.length === 0) {
    return { size: GRID_SIZE, words: [] };
  }

  const first = sorted[0];
  const firstRow = Math.max(0, Math.floor((GRID_SIZE - first.answer.length) / 2));
  putAcross(firstRow, 0, first.answer);
  words.push({
    id: 1,
    clue: first.clue,
    answer: first.answer,
    row: firstRow,
    col: 0,
    dir: 'across',
    ...(first.romanji != null && { romanji: first.romanji }),
  });

  let nextId = 2;
  let nextFreeRow = 0;
  let nextFreeCol = 0;

  for (let k = 1; k < sorted.length; k++) {
    const item = sorted[k];
    const word = item.answer;
    let placedHere = false;

    for (let i = 0; i < word.length && !placedHere; i++) {
      const ch = word[i];
      for (const p of placed) {
        const pWord = p.answer;
        for (let j = 0; j < pWord.length; j++) {
          if (pWord[j] !== ch) continue;
          const pr = p.dir === 'across' ? p.row : p.row + j;
          const pc = p.dir === 'across' ? p.col + j : p.col;
          const acrossRow = pr;
          const acrossCol = pc - i;
          if (acrossCol >= 0 && canPlaceAcross(acrossRow, acrossCol, word)) {
            putAcross(acrossRow, acrossCol, word);
            words.push({
              id: nextId++,
              clue: item.clue,
              answer: word,
              row: acrossRow,
              col: acrossCol,
              dir: 'across',
              ...(item.romanji != null && { romanji: item.romanji }),
            });
            placedHere = true;
            break;
          }
          const downRow = pr - i;
          const downCol = pc;
          if (downRow >= 0 && canPlaceDown(downRow, downCol, word)) {
            putDown(downRow, downCol, word);
            words.push({
              id: nextId++,
              clue: item.clue,
              answer: word,
              row: downRow,
              col: downCol,
              dir: 'down',
              ...(item.romanji != null && { romanji: item.romanji }),
            });
            placedHere = true;
            break;
          }
        }
        if (placedHere) break;
      }
    }

    if (!placedHere) {
      while (nextFreeRow < GRID_SIZE && grid[nextFreeRow][0] !== null) nextFreeRow++;
      if (nextFreeRow < GRID_SIZE && canPlaceAcross(nextFreeRow, 0, word)) {
        putAcross(nextFreeRow, 0, word);
        words.push({
          id: nextId++,
          clue: item.clue,
          answer: word,
          row: nextFreeRow,
          col: 0,
          dir: 'across',
          ...(item.romanji != null && { romanji: item.romanji }),
        });
        nextFreeRow++;
      } else if (nextFreeCol < GRID_SIZE && canPlaceDown(0, nextFreeCol, word)) {
        putDown(0, nextFreeCol, word);
        words.push({
          id: nextId++,
          clue: item.clue,
          answer: word,
          row: 0,
          col: nextFreeCol,
          dir: 'down',
          ...(item.romanji != null && { romanji: item.romanji }),
        });
        nextFreeCol++;
      }
    }
  }

  return { size: GRID_SIZE, words };
}

export function pickRandomWords(vocabList: string[], count: number): string[] {
  if (vocabList.length <= count) return shuffle(vocabList);
  const shuffled = shuffle(vocabList);
  return shuffled.slice(0, count);
}
