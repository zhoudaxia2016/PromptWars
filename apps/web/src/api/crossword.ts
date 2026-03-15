import { apiPost, isApiConfigured } from './client';

export { isApiConfigured };

export interface CrosswordCluesRequest {
  words: Array<{ r: string; k: string }>;
}

export interface CrosswordCluesResponse {
  pairs: Array<{ r: string; k: string }>;
  clues: string[];
}

export async function fetchCrosswordClues(
  words: CrosswordCluesRequest['words']
): Promise<CrosswordCluesResponse> {
  return apiPost<CrosswordCluesResponse>('/api/crossword/clues', { words });
}
