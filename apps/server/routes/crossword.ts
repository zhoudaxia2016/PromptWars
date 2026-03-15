import { json } from '../lib/cors.ts';
import { callLLM } from '../lib/llm.ts';

const CLUE_SYSTEM = `你是日语填词游戏出题助手。我会给你多个日语单词（罗马音），请为每个单词写一条简短的日文提示，让玩家能据此猜出该词。
要求：按我给出的单词顺序，每行只输出一条日文提示，不要编号、不要出现该单词本身或罗马音、不要任何解释。`;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function handleCrosswordClues(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { words?: Array<{ r: string; k: string }> };
    const words = body?.words;
    if (!Array.isArray(words) || words.length < 10) {
      return json({ error: '需要至少 10 条词汇（words: [{r, k}, ...]）' }, 400);
    }

    const shuffled = shuffle(words);
    const chosen = shuffled.slice(0, 10);
    const romanjiList = chosen.map((p) => (p.r ?? '').replace(/\s/g, '').toLowerCase());
    const wordList = romanjiList.map((w, i) => `${i + 1}. ${w}`).join('\n');
    const prompt = `请为以下 10 个单词分别写一条日文提示（每行一条，共 10 行，顺序与下列一致）：\n\n${wordList}`;

    const rawClues = await callLLM(CLUE_SYSTEM, prompt, {
      temperature: 0.5,
      maxTokens: 600,
    });
    const lines = rawClues
      .split(/\n/)
      .map((s) => s.replace(/^\d+[\.．]\s*/, '').trim())
      .filter(Boolean);

    const clues = chosen.map((_, i) => lines[i] ?? chosen[i].r);

    return json({ pairs: chosen, clues });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '生成失败';
    return json({ error: msg }, 500);
  }
}
