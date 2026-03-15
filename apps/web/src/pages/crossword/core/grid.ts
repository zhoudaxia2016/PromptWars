import type { Puzzle } from './data';

export interface GridCell {
  char: string;
  words: unknown[];
}

export interface CellWord {
  id: number;
  index: number;
}

export function buildGrid(puzzle: Puzzle) {
  const { size, words } = puzzle;
  const grid: (GridCell | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
  const cellWords: Record<string, CellWord[]> = {};

  words.forEach((w) => {
    const ans = w.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r = w.dir === 'across' ? w.row : w.row + i;
      const c = w.dir === 'across' ? w.col + i : w.col;
      if (r >= 0 && r < size && c >= 0 && c < size) {
        grid[r][c] = { char: ans[i], words: [] };
        const key = `${r},${c}`;
        if (!cellWords[key]) cellWords[key] = [];
        cellWords[key].push({ id: w.id, index: i });
      }
    }
  });

  return { grid, cellWords };
}
