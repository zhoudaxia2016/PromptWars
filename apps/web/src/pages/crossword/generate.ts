import { fetchCrosswordClues, isApiConfigured } from '@/api/crossword';
import { placeWords } from './core';
import type { Puzzle } from './core';
import { VOCAB_STORAGE_KEY, parseVocabLines } from './storage';

export async function generatePuzzle(): Promise<Puzzle> {
  if (!isApiConfigured()) {
    throw new Error('请配置 VITE_API_URL 使用接口');
  }
  const raw =
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem(VOCAB_STORAGE_KEY)
      : null) ?? '';
  const pairs = parseVocabLines(raw);
  if (pairs.length < 10) {
    throw new Error('词汇本至少需要 10 条（每行格式：单词 假名）');
  }

  const { pairs: chosenPairs, clues } = await fetchCrosswordClues(pairs);

  const items: { answer: string; clue: string; romanji?: string }[] = chosenPairs.map(
    (p, i) => ({
      answer: p.k || p.r,
      clue: clues[i] ?? p.r,
      ...(p.k ? { romanji: p.r } : undefined),
    })
  );
  return placeWords(items);
}
