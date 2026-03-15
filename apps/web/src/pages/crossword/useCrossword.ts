import { useState, useCallback, useMemo, useEffect } from 'react';
import { PUZZLE, buildGrid, ROMA_TO_HIRA } from './core';
import type { Puzzle } from './core';
import {
  VOCAB_STORAGE_KEY,
  loadLastPuzzle,
  saveLastPuzzle,
  loadFavorites,
  saveFavoritesToList,
  parseVocabLines,
  formatAnswer,
  type SavedPuzzle,
} from './storage';
import { generatePuzzle } from './generate';
import { createMoveToNext, createMoveToPrev } from './navigation';

export { formatAnswer } from './storage';

export function useCrossword() {
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
  const [currentWord, setCurrentWord] = useState<{
    word: Puzzle['words'][0];
    index: number;
  } | null>(null);
  const [userInput, setUserInput] = useState<Record<string, string>>(() => last?.userInput ?? {});
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(
    () => last?.favoriteId ?? null
  );

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

  const getHighlightedCells = useCallback(() => {
    if (!currentWord) return new Set<string>();
    const s = new Set<string>();
    const ans = currentWord.word.answer.replace(/\s/g, '');
    for (let i = 0; i < ans.length; i++) {
      const r =
        currentWord.word.dir === 'across'
          ? currentWord.word.row
          : currentWord.word.row + i;
      const c =
        currentWord.word.dir === 'across'
          ? currentWord.word.col + i
          : currentWord.word.col;
      s.add(`${r},${c}`);
    }
    return s;
  }, [currentWord]);

  const highlighted = getHighlightedCells();

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

  const checkAnswers = useCallback(() => {
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
        const match = isKanaChar(expected)
          ? user === expected
          : user.toLowerCase() === expected.toLowerCase();
        result[key] = match ? 'correct' : 'wrong';
        if (match) correct++;
      }
    });
    setCheckResult(result);
    setStatus(total > 0 ? `正确 ${correct}/${total}` : '请先填写');
  }, [puzzle.words, userInput]);

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

  const removeFromFavorites = useCallback(
    (id: string) => {
      const next = favoritesList.filter((f) => f.id !== id);
      setFavoritesList(next);
      saveFavoritesToList(next);
      if (currentFavoriteId === id) setCurrentFavoriteId(null);
    },
    [favoritesList, currentFavoriteId]
  );

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

  const isCurrentFavorited =
    currentFavoriteId != null && favoritesList.some((f) => f.id === currentFavoriteId);

  const across = puzzle.words.filter((w) => w.dir === 'across');
  const down = puzzle.words.filter((w) => w.dir === 'down');

  const handleGenerate = useCallback(async () => {
    setGenerateError(null);
    setGenerating(true);
    try {
      const newPuzzle = await generatePuzzle();
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

  return {
    puzzle,
    grid,
    cellStartIds,
    cellWords,
    userInput,
    selectedCell,
    highlighted,
    checkResult,
    status,
    generating,
    generateError,
    vocabModalOpen,
    setVocabModalOpen,
    favoritesModalOpen,
    setFavoritesModalOpen,
    vocabInput,
    setVocabInput,
    favoritesList,
    currentFavoriteId,
    currentWord,
    across,
    down,
    selectCell,
    formatAnswer,
    handleKeyDown,
    checkAnswers,
    saveVocab,
    addToFavorites,
    removeFromFavorites,
    openFavoritesModal,
    loadFavorite,
    handleGenerate,
    isCurrentFavorited,
  };
}
