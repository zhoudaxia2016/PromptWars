import { useState } from 'react';

export function useModals() {
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  return {
    vocabModalOpen,
    setVocabModalOpen,
    favoritesModalOpen,
    setFavoritesModalOpen,
  };
}
