import { placeWords } from './core';
import type { Puzzle } from './core';
import { getDefaultProvider, call } from '@promptwars/llm';
import {
  VOCAB_STORAGE_KEY,
  parseVocabLines,
  CLUE_SYSTEM,
} from './storage';

export async function generatePuzzle(): Promise<Puzzle> {
  const raw =
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem(VOCAB_STORAGE_KEY)
      : null) ?? '';
  const pairs = parseVocabLines(raw);
  if (pairs.length < 10) {
    throw new Error('词汇本至少需要 10 条（每行格式：单词 假名）');
  }
  const provider = getDefaultProvider();
  if (!provider) {
    throw new Error('未配置大模型，请在 packages/llm 中配置');
  }
  const shuffled = [...pairs].sort(() => Math.random() - 0.5);
  const chosenPairs = shuffled.slice(0, 10);
  const romanjiList = chosenPairs.map((p) => p.r.replace(/\s/g, '').toLowerCase());
  const wordList = romanjiList.map((w, i) => `${i + 1}. ${w}`).join('\n');
  const prompt = `请为以下 10 个单词分别写一条日文提示（每行一条，共 10 行，顺序与下列一致）：\n\n${wordList}`;
  const rawClues = await call(provider.name, {
    system: CLUE_SYSTEM,
    prompt,
    temperature: 0.5,
    maxTokens: 600,
  });
  const lines = rawClues
    .split(/\n/)
    .map((s) => s.replace(/^\d+[\.．]\s*/, '').trim())
    .filter(Boolean);
  const items: { answer: string; clue: string; romanji?: string }[] =
    chosenPairs.map((p, i) => ({
      answer: p.k || p.r,
      clue: lines[i] ?? p.r,
      ...(p.k ? { romanji: p.r } : undefined),
    }));
  return placeWords(items);
}
