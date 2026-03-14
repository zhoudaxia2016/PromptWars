import type { LLMProvider } from './config';

export function getChatUrl(p: LLMProvider): string {
  const base = (p.baseUrl ?? '').replace(/\/$/, '');
  return base ? `${base}/chat/completions` : '';
}
