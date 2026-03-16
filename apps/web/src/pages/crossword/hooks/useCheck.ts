import { useState, useCallback } from 'react';
import type { Puzzle } from '../core';

interface UseCheckParams {
  puzzleWords: Puzzle['words'];
  userInput: Record<string, string>;
}

export function useCheck({ puzzleWords, userInput }: UseCheckParams) {
  const [checkResult, setCheckResult] = useState<Record<string, 'correct' | 'wrong'> | null>(
    null
  );
  const [status, setStatus] = useState('');

  const checkAnswers = useCallback(() => {
    let correct = 0;
    let total = 0;
    const result: Record<string, 'correct' | 'wrong'> = {};
    const isKanaChar = (ch: string) => /[\u3040-\u309F\u30A0-\u30FF]/.test(ch);
    puzzleWords.forEach((w) => {
      const ans = w.answer.replace(/\s/g, '');
      for (let i = 0; i < ans.length; i++) {
        const r = w.dir === 'across' ? w.row : w.row + i;
        const c = w.dir === 'across' ? w.col : w.col + i;
        const key = `${r},${c}`;
        total++;
        const user = userInput[key] ?? '';
        const expected = ans[i];
        const match = isKanaChar(expected)
          ? user === expected
          : user.toLowerCase() === expected.toLowerCase();
        result[key] = match ? 'correct' : 'wrong';
        if (match) correct++;
      }
    });
    setCheckResult(result);
    setStatus(total > 0 ? `正确 ${correct}/${total}` : '请先填写');
  }, [puzzleWords, userInput]);

  const resetCheck = useCallback(() => {
    setCheckResult(null);
    setStatus('');
  }, []);

  return {
    checkResult,
    status,
    checkAnswers,
    resetCheck,
  };
}
