import { useState, useMemo } from 'react';
import { PUZZLE, buildGrid } from '../core';
import type { Puzzle } from '../core';
import { loadLastPuzzle } from '../storage';

export function useData() {
  const last = useMemo(loadLastPuzzle, []);
  const [puzzle, setPuzzle] = useState<Puzzle>(() => last?.puzzle ?? PUZZLE);

  const { grid, cellWords } = useMemo(() => buildGrid(puzzle), [puzzle]);

  const cellStartIds = useMemo(() => {
    const map: Record<string, number[]> = {};
    puzzle.words.forEach((w) => {
      const key = `${w.row},${w.col}`;
      if (!map[key]) map[key] = [];
      map[key].push(w.id);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a - b));
    return map;
  }, [puzzle.words]);

  const across = puzzle.words.filter((w) => w.dir === 'across');
  const down = puzzle.words.filter((w) => w.dir === 'down');

  return {
    puzzle,
    setPuzzle,
    grid,
    cellWords,
    cellStartIds,
    across,
    down,
    last,
  };
}
