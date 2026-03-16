import { useState, useCallback, useMemo } from 'react';
import { ROMA_TO_HIRA } from '../core';
import type { Puzzle, GridCell } from '../core';
import { createMoveToNext, createMoveToPrev } from '../navigation';
import type { loadLastPuzzle } from '../storage';

interface UseInputParams {
  puzzle: Puzzle;
  grid: (GridCell | null)[][];
  cellWords: Record<string, { id: number; index: number }[]>;
  last: ReturnType<typeof loadLastPuzzle>;
}

export function useInput({ puzzle, grid, cellWords, last }: UseInputParams) {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [currentWord, setCurrentWord] = useState<{
    word: Puzzle['words'][0];
    index: number;
  } | null>(null);
  const [userInput, setUserInput] = useState<Record<string, string>>(
    () => last?.userInput ?? {}
  );
  const [pendingRomanji, setPendingRomanji] = useState('');

  const moveToNext = useMemo(
    () =>
      createMoveToNext(
        puzzle,
        grid,
        cellWords,
        setSelectedCell,
        setCurrentWord
      ),
    [puzzle, grid, cellWords]
  );

  const moveToPrev = useMemo(
    () =>
      createMoveToPrev(
        puzzle,
        grid,
        cellWords,
        setSelectedCell,
        setCurrentWord
      ),
    [puzzle, grid, cellWords]
  );

  const selectCell = useCallback(
    (r: number, c: number) => {
      const cell = grid[r]?.[c];
      if (!cell) return;

      const key = `${r},${c}`;
      const words = cellWords[key];
      if (!words) return;

      const word = puzzle.words.find((w) => w.id === words[0].id);
      if (!word) return;

      setSelectedCell({ r, c });
      setCurrentWord({ word, index: words[0].index });
      setPendingRomanji('');
    },
    [grid, cellWords, puzzle.words]
  );

  const isKanaPuzzle =
    puzzle.words.length > 0 &&
    /[\u3040-\u309F\u30A0-\u30FF]/.test(puzzle.words[0].answer[0]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('textarea, input') || e.ctrlKey || e.metaKey) return;
      if (!selectedCell) return;
      const { r, c } = selectedCell;
      const key = `${r},${c}`;

      if (e.key.length === 1) {
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(e.key)) {
          e.preventDefault();
          setUserInput((prev) => ({ ...prev, [key]: e.key }));
          setPendingRomanji('');
          moveToNext(r, c);
          return;
        }
        if (!/[a-zA-Z]/.test(e.key)) return;
        const lower = e.key.toLowerCase();

        if (isKanaPuzzle) {
          e.preventDefault();
          const combined = (pendingRomanji + lower).toLowerCase();
          if (ROMA_TO_HIRA[combined]) {
            setUserInput((prev) => ({ ...prev, [key]: ROMA_TO_HIRA[combined] }));
            setPendingRomanji('');
            moveToNext(r, c);
          } else if (ROMA_TO_HIRA[lower]) {
            setUserInput((prev) => ({ ...prev, [key]: ROMA_TO_HIRA[lower] }));
            setPendingRomanji('');
            moveToNext(r, c);
          } else {
            setPendingRomanji(combined.length <= 2 ? combined : lower);
          }
          return;
        }

        const char = ROMA_TO_HIRA[lower] ?? lower;
        e.preventDefault();
        setUserInput((prev) => ({ ...prev, [key]: char }));
        setPendingRomanji('');
        moveToNext(r, c);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (pendingRomanji) {
          setPendingRomanji('');
        } else {
          setUserInput((prev) => ({ ...prev, [key]: '' }));
          moveToPrev(r, c);
        }
      }
    },
    [selectedCell, isKanaPuzzle, pendingRomanji, moveToNext, moveToPrev]
  );

  const resetInput = useCallback(() => {
    setUserInput({});
    setSelectedCell(null);
    setCurrentWord(null);
    setPendingRomanji('');
  }, []);

  return {
    userInput,
    setUserInput,
    selectedCell,
    currentWord,
    selectCell,
    handleKeyDown,
    resetInput,
  };
}
