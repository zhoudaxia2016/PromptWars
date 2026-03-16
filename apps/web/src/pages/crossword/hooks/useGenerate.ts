import { useState, useCallback } from 'react';
import type { Puzzle } from '../core';
import { generatePuzzle } from '../generate';

interface UseGenerateParams {
  setPuzzle: (p: Puzzle) => void;
  resetInput: () => void;
  resetCheck: () => void;
  setCurrentFavoriteId: (id: string | null) => void;
}

export function useGenerate({
  setPuzzle,
  resetInput,
  resetCheck,
  setCurrentFavoriteId,
}: UseGenerateParams) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerateError(null);
    setGenerating(true);
    try {
      const newPuzzle = await generatePuzzle();
      setPuzzle(newPuzzle);
      resetInput();
      resetCheck();
      setCurrentFavoriteId(null);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  }, [setPuzzle, resetInput, resetCheck, setCurrentFavoriteId]);

  return {
    generating,
    generateError,
    handleGenerate,
  };
}
