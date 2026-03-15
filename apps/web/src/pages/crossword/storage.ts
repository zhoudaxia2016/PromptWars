import type { Puzzle, PuzzleWord } from '@promptwars/crossword';

export const VOCAB_STORAGE_KEY = 'crossword-vocab';
export const FAVORITES_STORAGE_KEY = 'crossword-favorites';
export const LAST_PUZZLE_STORAGE_KEY = 'crossword-last-puzzle';

export interface SavedPuzzle {
  id: string;
  puzzle: Puzzle;
  savedAt: number;
}

export function loadLastPuzzle(): {
  puzzle: Puzzle;
  userInput: Record<string, string>;
  favoriteId: string | null;
} | null {
  try {
    const raw = localStorage.getItem(LAST_PUZZLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      puzzle: Puzzle;
      userInput: Record<string, string>;
      favoriteId?: string | null;
    };
    if (!parsed?.puzzle?.words?.length) return null;
    const favorites = loadFavorites();
    const favoriteId =
      typeof parsed.favoriteId === 'string' &&
      parsed.favoriteId &&
      favorites.some((f) => f.id === parsed.favoriteId)
        ? parsed.favoriteId
        : null;
    return {
      puzzle: parsed.puzzle,
      userInput:
        typeof parsed.userInput === 'object' && parsed.userInput !== null ? parsed.userInput : {},
      favoriteId,
    };
  } catch {
    return null;
  }
}

export function saveLastPuzzle(
  puzzle: Puzzle,
  userInput: Record<string, string>,
  favoriteId: string | null
): void {
  try {
    localStorage.setItem(
      LAST_PUZZLE_STORAGE_KEY,
      JSON.stringify({ puzzle, userInput, favoriteId })
    );
  } catch {
    // ignore
  }
}

export function loadFavorites(): SavedPuzzle[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPuzzle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavoritesToList(list: SavedPuzzle[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** 解析词汇本：每行「单词 假名」，按第一个空格分隔；无换行时按空格拆成仅单词 */
export function parseVocabLines(text: string): { r: string; k: string }[] {
  const t = text.trim();
  if (!t) return [];
  if (!t.includes('\n')) {
    return t
      .split(/\s+/)
      .filter(Boolean)
      .map((r) => ({ r, k: '' }));
  }
  return t
    .split(/\n/)
    .map((line) => {
      const s = line.trim();
      const i = s.indexOf(' ');
      if (i >= 0) {
        return { r: s.slice(0, i).trim(), k: s.slice(i + 1).trim() };
      }
      return { r: s, k: '' };
    })
    .filter((p) => p.r.length > 0);
}

export const CLUE_SYSTEM = `你是日语填词游戏出题助手。我会给你多个日语单词（罗马音），请为每个单词写一条简短的日文提示，让玩家能据此猜出该词。
要求：按我给出的单词顺序，每行只输出一条日文提示，不要编号、不要出现该单词本身或罗马音、不要任何解释。`;

export function formatAnswer(w: PuzzleWord): string {
  if (w.romanji != null && w.romanji !== '' && w.answer !== w.romanji) {
    return `${w.romanji}  ${w.answer}`;
  }
  const ans = w.answer.trim();
  const kanaPart = ans.replace(/[^\u3040-\u309F\u30A0-\u30FF]/g, '').trim();
  const romanjiPart = ans
    .replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (kanaPart && romanjiPart && kanaPart !== romanjiPart) {
    return `${romanjiPart}  ${kanaPart}`;
  }
  return w.answer;
}
