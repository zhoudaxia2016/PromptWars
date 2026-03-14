import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PUZZLE, buildGrid, ROMA_TO_HIRA, placeWords } from '@promptwars/crossword';
import type { Puzzle } from '@promptwars/crossword';
import { getDefaultProvider, call } from '@promptwars/llm';

const VOCAB_STORAGE_KEY = 'crossword-vocab';
const FAVORITES_STORAGE_KEY = 'crossword-favorites';
const LAST_PUZZLE_STORAGE_KEY = 'crossword-last-puzzle';

function loadLastPuzzle(): { puzzle: Puzzle; userInput: Record<string, string>; favoriteId: string | null } | null {
  try {
    const raw = localStorage.getItem(LAST_PUZZLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { puzzle: Puzzle; userInput: Record<string, string>; favoriteId?: string | null };
    if (!parsed?.puzzle?.words?.length) return null;
    const favorites = loadFavorites();
    const favoriteId =
      typeof parsed.favoriteId === 'string' && parsed.favoriteId && favorites.some((f) => f.id === parsed.favoriteId)
        ? parsed.favoriteId
        : null;
    return {
      puzzle: parsed.puzzle,
      userInput: typeof parsed.userInput === 'object' && parsed.userInput !== null ? parsed.userInput : {},
      favoriteId,
    };
  } catch {
    return null;
  }
}

function saveLastPuzzle(puzzle: Puzzle, userInput: Record<string, string>, favoriteId: string | null): void {
  try {
    localStorage.setItem(LAST_PUZZLE_STORAGE_KEY, JSON.stringify({ puzzle, userInput, favoriteId }));
  } catch {
    // ignore
  }
}

interface SavedPuzzle {
  id: string;
  puzzle: Puzzle;
  savedAt: number;
}

function loadFavorites(): SavedPuzzle[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedPuzzle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavoritesToList(list: SavedPuzzle[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

/** 解析词汇本：每行「单词 假名」，按第一个空格分隔；无换行时按空格拆成仅单词 */
function parseVocabLines(text: string): { r: string; k: string }[] {
  const t = text.trim();
  if (!t) return [];
  if (!t.includes('\n')) {
    return t.split(/\s+/).filter(Boolean).map((r) => ({ r, k: '' }));
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

const CLUE_SYSTEM = `你是日语填词游戏出题助手。我会给你多个日语单词（罗马音），请为每个单词写一条简短的日文提示，让玩家能据此猜出该词。
要求：按我给出的单词顺序，每行只输出一条日文提示，不要编号、不要出现该单词本身或罗马音、不要任何解释。`;

export default function CrosswordPage() {
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
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [currentWord, setCurrentWord] = useState<{ word: Puzzle['words'][0]; index: number } | null>(null);
  const [userInput, setUserInput] = useState<Record<string, string>>(() => last?.userInput ?? {});
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(() => last?.favoriteId ?? null);

  useEffect(() => {
    saveLastPuzzle(puzzle, userInput, currentFavoriteId);
  }, [puzzle, userInput, currentFavoriteId]);

  const [pendingRomanji, setPendingRomanji] = useState('');
  const [status, setStatus] = useState('');
  const [checkResult, setCheckResult] = useState<Record<string, 'correct' | 'wrong'> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState<SavedPuzzle[]>(loadFavorites);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [vocabInput, setVocabInput] = useState(() => {
    try {
      return localStorage.getItem(VOCAB_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const selectCell = useCallback((r: number, c: number) => {
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
  }, [grid, cellWords, puzzle.words]);

  const getHighlightedCells = useCallback(() => {
    if (!currentWord) return new Set<string>();
    const s = new Set<string>();
    const ans = currentWord.word.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r = currentWord.word.dir === 'across' ? currentWord.word.row : currentWord.word.row + i;
      const c = currentWord.word.dir === 'across' ? currentWord.word.col + i : currentWord.word.col;
      s.add(`${r},${c}`);
    }
    return s;
  }, [currentWord]);

  const highlighted = getHighlightedCells();

  const isKanaPuzzle = puzzle.words.length > 0 && /[\u3040-\u309F\u30A0-\u30FF]/.test(puzzle.words[0].answer[0]);

  function formatAnswer(w: Puzzle['words'][0]): string {
    if (w.romanji != null && w.romanji !== '' && w.answer !== w.romanji) {
      return `${w.romanji}  ${w.answer}`;
    }
    const ans = w.answer.trim();
    const kanaPart = ans.replace(/[^\u3040-\u309F\u30A0-\u30FF]/g, '').trim();
    const romanjiPart = ans.replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ' ').replace(/\s+/g, ' ').trim();
    if (kanaPart && romanjiPart && kanaPart !== romanjiPart) {
      return `${romanjiPart}  ${kanaPart}`;
    }
    return w.answer;
  }

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
    [selectedCell, isKanaPuzzle, pendingRomanji]
  );

  const moveToNext = (r: number, c: number) => {
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
    if (nr >= 0 && nr < puzzle.size && nc >= 0 && nc < puzzle.size && grid[nr]?.[nc]) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = puzzle.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };

  const moveToPrev = (r: number, c: number) => {
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
    if (nr >= 0 && nr < puzzle.size && nc >= 0 && nc < puzzle.size && grid[nr]?.[nc]) {
      setSelectedCell({ r: nr, c: nc });
      const key2 = `${nr},${nc}`;
      const words2 = cellWords[key2];
      if (words2) {
        const word2 = puzzle.words.find((w2) => w2.id === words2[0].id);
        if (word2) setCurrentWord({ word: word2, index: words2[0].index });
      }
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;
    const result: Record<string, 'correct' | 'wrong'> = {};
    const isKanaChar = (ch: string) => /[\u3040-\u309F\u30A0-\u30FF]/.test(ch);
    puzzle.words.forEach((w) => {
      const ans = w.answer.replace(/\s/g, '');
      for (let i = 0; i < ans.length; i++) {
        const r = w.dir === 'across' ? w.row : w.row + i;
        const c = w.dir === 'across' ? w.col : w.col + i;
        const key = `${r},${c}`;
        total++;
        const user = userInput[key] ?? '';
        const expected = ans[i];
        const match = isKanaChar(expected) ? user === expected : user.toLowerCase() === expected.toLowerCase();
        result[key] = match ? 'correct' : 'wrong';
        if (match) correct++;
      }
    });
    setCheckResult(result);
    setStatus(total > 0 ? `正确 ${correct}/${total}` : '请先填写');
  };

  const saveVocab = useCallback(() => {
    const pairs = parseVocabLines(vocabInput);
    const value = pairs.map(({ r, k }) => (k ? `${r} ${k}` : r)).join('\n');
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, value);
      setVocabInput(value);
    } catch {
      // ignore
    }
  }, [vocabInput]);

  const addToFavorites = useCallback(() => {
    const item: SavedPuzzle = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      puzzle: { size: puzzle.size, words: puzzle.words.map((w) => ({ ...w })) },
      savedAt: Date.now(),
    };
    const next = [item, ...favoritesList];
    setFavoritesList(next);
    saveFavoritesToList(next);
    setCurrentFavoriteId(item.id);
  }, [puzzle, favoritesList]);

  const removeFromFavorites = useCallback((id: string) => {
    const next = favoritesList.filter((f) => f.id !== id);
    setFavoritesList(next);
    saveFavoritesToList(next);
    if (currentFavoriteId === id) setCurrentFavoriteId(null);
  }, [favoritesList, currentFavoriteId]);

  const openFavoritesModal = useCallback(() => {
    setFavoritesList(loadFavorites());
    setFavoritesModalOpen(true);
  }, []);

  const loadFavorite = useCallback((item: SavedPuzzle) => {
    setPuzzle(item.puzzle);
    setUserInput({});
    setSelectedCell(null);
    setCurrentWord(null);
    setStatus('');
    setCheckResult(null);
    setCurrentFavoriteId(item.id);
    setFavoritesModalOpen(false);
  }, []);

  const isCurrentFavorited = currentFavoriteId != null && favoritesList.some((f) => f.id === currentFavoriteId);

  const across = puzzle.words.filter((w) => w.dir === 'across');
  const down = puzzle.words.filter((w) => w.dir === 'down');

  const handleGenerate = useCallback(async () => {
    setGenerateError(null);
    const raw = (typeof localStorage !== 'undefined' ? localStorage.getItem(VOCAB_STORAGE_KEY) : null) ?? '';
    const pairs = parseVocabLines(raw);
    if (pairs.length < 10) {
      setGenerateError('词汇本至少需要 10 条（每行格式：单词 假名）');
      return;
    }
    const provider = getDefaultProvider();
    if (!provider) {
      setGenerateError('未配置大模型，请在 packages/llm 中配置');
      return;
    }
    setGenerating(true);
    try {
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
      const items: { answer: string; clue: string; romanji?: string }[] = chosenPairs.map((p, i) => ({
        answer: p.k || p.r,
        clue: lines[i] ?? p.r,
        ...(p.k ? { romanji: p.r } : undefined),
      }));
      const newPuzzle = placeWords(items);
      setPuzzle(newPuzzle);
      setUserInput({});
      setSelectedCell(null);
      setCurrentWord(null);
      setStatus('');
      setCheckResult(null);
      setCurrentFavoriteId(null);
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: "'Segoe UI', 'Hiragino Sans', sans-serif",
        color: '#e8e8e8',
        padding: 24,
        boxSizing: 'border-box',
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <Link to="/" style={{ color: '#aaccff', textDecoration: 'none' }}>← 返回</Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={openFavoritesModal}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#e8e8e8',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            收藏列表
          </button>
          <button
            type="button"
            onClick={() => setVocabModalOpen(true)}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: '#e8e8e8',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            录入单词
          </button>
        </div>
      </div>

      <h1 style={{ textAlign: 'center', color: '#e94560', fontSize: 28, marginBottom: 24, flexShrink: 0 }}>日语填字游戏</h1>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 32, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${puzzle.size}, 36px)`,
              gridTemplateRows: `repeat(${puzzle.size}, 36px)`,
              gap: 2,
              background: '#2d2d44',
              padding: 8,
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {grid.flatMap((row, r) =>
            row.map((cell, c) =>
              cell ? (
                <div
                  key={`${r}-${c}`}
                  onClick={() => selectCell(r, c)}
                  style={{
                    position: 'relative',
                    width: 36,
                    height: 36,
                    background: selectedCell?.r === r && selectedCell?.c === c ? '#e94560' : highlighted.has(`${r},${c}`) ? 'rgba(233,69,96,0.25)' : '#1a1a2e',
                    border: `1px solid ${selectedCell?.r === r && selectedCell?.c === c ? '#e94560' : '#3d3d5c'}`,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: checkResult?.[`${r},${c}`] === 'correct' ? '#4ecca3' : checkResult?.[`${r},${c}`] === 'wrong' ? '#e94560' : undefined,
                  }}
                >
                  {cellStartIds[`${r},${c}`] != null && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: 1,
                      }}
                    >
                      {cellStartIds[`${r},${c}`].join('-')}
                    </span>
                  )}
                  {(() => {
                    const val = userInput[`${r},${c}`] ?? '';
                    const isKanaCell = cell && /[\u3040-\u309F\u30A0-\u30FF]/.test(cell.char);
                    return isKanaCell ? val : (ROMA_TO_HIRA[val] ?? val);
                  })()}
                </div>
              ) : (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: 36,
                    height: 36,
                    background: '#2d2d44',
                    borderRadius: 6,
                  }}
                />
              )
            )
          )}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={checkAnswers}
              style={{
                padding: '10px 24px',
                background: '#4ecca3',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: 24,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              检查答案
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '10px 24px',
                background: generating ? 'rgba(233,69,96,0.5)' : '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                fontSize: 14,
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? '正在生成…' : '重新生成'}
            </button>
            <button
              type="button"
              onClick={isCurrentFavorited ? () => removeFromFavorites(currentFavoriteId!) : addToFavorites}
              style={{
                padding: '10px 24px',
                background: isCurrentFavorited ? 'rgba(233,69,96,0.25)' : 'rgba(255,255,255,0.12)',
                color: '#e8e8e8',
                border: `1px solid ${isCurrentFavorited ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.25)'}`,
                borderRadius: 24,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {isCurrentFavorited ? '取消收藏' : '收藏'}
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            minWidth: 320,
            maxWidth: 420,
            flex: 1,
            minHeight: 0,
            alignSelf: 'stretch',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <h3 style={{ color: '#e94560', fontSize: 16, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>横向（Across）</h3>
            <div style={{ flex: 1, minHeight: 0 }} className="crossword-clue-list">
              {across.map((w) => (
                <div
                  key={w.id}
                  onClick={() => selectCell(w.row, w.col)}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: currentWord?.word.id === w.id ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: '#e94560', fontWeight: 600, marginRight: 8 }}>{w.id}.</span>
                  {w.clue}
                  {checkResult != null && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>答：{formatAnswer(w)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <h3 style={{ color: '#e94560', fontSize: 16, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>纵向（Down）</h3>
            <div style={{ flex: 1, minHeight: 0 }} className="crossword-clue-list">
              {down.map((w) => (
                <div
                  key={w.id}
                  onClick={() => selectCell(w.row, w.col)}
                  style={{
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: currentWord?.word.id === w.id ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: '#e94560', fontWeight: 600, marginRight: 8 }}>{w.id}.</span>
                  {w.clue}
                  {checkResult != null && (
<div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>答：{formatAnswer(w)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'center', marginTop: 8, fontSize: 14 }}>
        {status && <span style={{ color: '#4ecca3' }}>{status}</span>}
        {generating && <span style={{ color: '#aaccff' }}>正在生成填字…</span>}
        {generateError && !vocabModalOpen && <span style={{ color: '#e94560', display: 'block', marginTop: 4 }}>{generateError}</span>}
      </div>

      {vocabModalOpen && (() => {
        const vocabPairs = parseVocabLines(vocabInput);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setVocabModalOpen(false)}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                padding: 28,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                maxWidth: 520,
                width: '92%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ color: '#e94560', fontSize: 18, margin: 0, fontWeight: 600 }}>词汇本</h3>
                <button
                  type="button"
                  onClick={() => setVocabModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    color: 'rgba(255,255,255,0.8)',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    fontSize: 18,
                    cursor: 'pointer',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 12px 0' }}>
                每行格式：<strong>单词 假名</strong>（按第一个空格分隔）。至少 10 条可生成填字。
              </p>
              <textarea
                value={vocabInput}
                onChange={(e) => setVocabInput(e.target.value)}
                placeholder={'例：\nkonnichiwa こんにちは\narigatou ありがとう\nohayou おはよう\n...'}
                style={{
                  width: '100%',
                  minHeight: 140,
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#e8e8e8',
                  fontSize: 14,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                spellCheck={false}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                  共 <strong style={{ color: vocabPairs.length >= 10 ? '#4ecca3' : '#e8e8e8' }}>{vocabPairs.length}</strong> 条
                </span>
                <button
                  type="button"
                  onClick={saveVocab}
                  style={{
                    padding: '10px 20px',
                    background: '#4ecca3',
                    color: '#1a1a2e',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  保存
                </button>
              </div>
              {vocabPairs.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>当前词汇</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                    {vocabPairs.map(({ r, k }, i) => (
                      <span
                        key={`${r}-${i}`}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(233,69,96,0.15)',
                          color: '#e8e8e8',
                          borderRadius: 20,
                          fontSize: 13,
                        }}
                      >
                        {r}
                        {k && <span style={{ opacity: 0.85, marginLeft: 6 }}>{k}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {favoritesModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setFavoritesModalOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
              padding: 28,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              maxWidth: 480,
              width: '92%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#e94560', fontSize: 18, margin: 0, fontWeight: 600 }}>收藏的题目</h3>
              <button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.8)',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            {favoritesList.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, padding: 24, textAlign: 'center' }}>
                暂无收藏，完成一局后点击「收藏」保存题目
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {favoritesList.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadFavorite(item)}
                    onKeyDown={(e) => e.key === 'Enter' && !(e.target as HTMLElement).closest('button') && loadFavorite(item)}
                    style={{
                      padding: '12px 16px',
                      marginBottom: 8,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      color: '#e8e8e8',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {new Date(item.savedAt).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        {item.puzzle.words.length} 道题 · 首条：{item.puzzle.words[0]?.clue?.slice(0, 20)}
                        {item.puzzle.words[0]?.clue && item.puzzle.words[0].clue.length > 20 ? '…' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavorites(item.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(233,69,96,0.2)',
                        color: '#e8e8e8',
                        border: '1px solid rgba(233,69,96,0.4)',
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      取消收藏
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
