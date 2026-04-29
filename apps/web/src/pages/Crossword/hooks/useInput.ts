import { useState, useCallback, useMemo, useRef } from 'react';
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
  const composingRef = useRef(false);
  const inputFiredRef = useRef(false);

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
    },
    [grid, cellWords, puzzle.words]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (composingRef.current) {
        inputFiredRef.current = true;
        return;
      }
      if (!selectedCell) return;
      const { r, c } = selectedCell;
      const key = `${r},${c}`;
      const val = e.target.value;
      if (val.length > 0) {
        setUserInput((prev) => ({ ...prev, [key]: val }));
        e.target.value = '';
        moveToNext(r, c);
      }
    },
    [selectedCell, moveToNext]
  );

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
    inputFiredRef.current = false;
  }, []);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      if (!selectedCell) return;
      const { r, c } = selectedCell;
      const key = `${r},${c}`;
      setUserInput((prev) => ({ ...prev, [key]: e.data }));
    },
    [selectedCell]
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      composingRef.current = false;
      if (!selectedCell) return;
      const { r, c } = selectedCell;
      const key = `${r},${c}`;
      const composed = e.data;
      if (composed.length > 0) {
        setUserInput((prev) => ({ ...prev, [key]: composed }));
        if (!inputFiredRef.current) {
          moveToNext(r, c);
        }
      }
      inputFiredRef.current = false;
    },
    [selectedCell, moveToNext]
  );

  const handleBackspace = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !composingRef.current) {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        const key = `${r},${c}`;
        setUserInput((prev) => ({ ...prev, [key]: '' }));
        moveToPrev(r, c);
      }
    },
    [selectedCell, moveToPrev]
  );

  const resetInput = useCallback(() => {
    setUserInput({});
    setSelectedCell(null);
    setCurrentWord(null);
  }, []);

  return {
    userInput,
    setUserInput,
    selectedCell,
    currentWord,
    selectCell,
    handleInput,
    handleCompositionStart,
    handleCompositionUpdate,
    handleCompositionEnd,
    handleBackspace,
    resetInput,
  };
}
