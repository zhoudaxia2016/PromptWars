import { useState, useCallback } from 'react';
import type { Puzzle } from '../core';
import { loadFavorites, saveFavoritesToList } from '../storage';
import type { loadLastPuzzle } from '../storage';

interface UseFavoritesParams {
  puzzle: Puzzle;
  setPuzzle: (p: Puzzle) => void;
  last: ReturnType<typeof loadLastPuzzle>;
  resetInput: () => void;
  resetCheck: () => void;
  setFavoritesModalOpen: (open: boolean) => void;
}

export function useFavorites({
  puzzle,
  setPuzzle,
  last,
  resetInput,
  resetCheck,
  setFavoritesModalOpen,
}: UseFavoritesParams) {
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(
    () => last?.favoriteId ?? null
  );

  const addToFavorites = useCallback(() => {
    const item: Puzzle = {
      size: puzzle.size,
      words: puzzle.words.map((w) => ({ ...w })),
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: Date.now(),
    };
    const favorites = loadFavorites();
    const next = [item, ...favorites];
    saveFavoritesToList(next);
    setCurrentFavoriteId(item.id ?? null);
  }, [puzzle]);

  const removeFromFavorites = useCallback((id: string) => {
    if (currentFavoriteId === id) setCurrentFavoriteId(null);
  }, [currentFavoriteId]);

  const openFavoritesModal = useCallback(() => {
    setFavoritesModalOpen(true);
  }, [setFavoritesModalOpen]);

  const loadFavorite = useCallback(
    (item: Puzzle) => {
      setPuzzle(item);
      resetInput();
      resetCheck();
      setCurrentFavoriteId(item.id ?? null);
      setFavoritesModalOpen(false);
    },
    [setPuzzle, resetInput, resetCheck, setFavoritesModalOpen]
  );

  const isCurrentFavorited = currentFavoriteId != null;

  return {
    currentFavoriteId,
    setCurrentFavoriteId,
    isCurrentFavorited,
    addToFavorites,
    removeFromFavorites,
    openFavoritesModal,
    loadFavorite,
  };
}
