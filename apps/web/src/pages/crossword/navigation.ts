import type { Puzzle } from '@promptwars/crossword';
import type { GridCell } from '@promptwars/crossword';

type SetSelectedCell = (v: { r: number; c: number } | null) => void;
type SetCurrentWord = (v: {
  word: Puzzle['words'][0];
  index: number;
} | null) => void;

export function createMoveToNext(
  puzzle: Puzzle,
  grid: (GridCell | null)[][],
  cellWords: Record<string, { id: number; index: number }[]>,
  setSelectedCell: SetSelectedCell,
  setCurrentWord: SetCurrentWord
) {
  return (r: number, c: number) => {
    const words = puzzle.words.filter((w) => {
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
      if (rr === r && cc === c) {
        idx = i;
        break;
      }
    }
    if (idx < 0 || idx >= ans.length - 1) return;
    const nr = w.dir === 'across' ? r : r + 1;
    const nc = w.dir === 'across' ? c + 1 : c;
    if (
      nr >= 0 &&
      nr < puzzle.size &&
      nc >= 0 &&
      nc < puzzle.size &&
      grid[nr]?.[nc]
    ) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = puzzle.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };
}

export function createMoveToPrev(
  puzzle: Puzzle,
  grid: (GridCell | null)[][],
  cellWords: Record<string, { id: number; index: number }[]>,
  setSelectedCell: SetSelectedCell,
  setCurrentWord: SetCurrentWord
) {
  return (r: number, c: number) => {
    const words = puzzle.words.filter((w) => {
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
      if (rr === r && cc === c) {
        idx = i;
        break;
      }
    }
    if (idx <= 0) return;
    const nr = w.dir === 'across' ? r : r - 1;
    const nc = w.dir === 'across' ? c - 1 : c;
    if (
      nr >= 0 &&
      nr < puzzle.size &&
      nc >= 0 &&
      nc < puzzle.size &&
      grid[nr]?.[nc]
    ) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = puzzle.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };
}
