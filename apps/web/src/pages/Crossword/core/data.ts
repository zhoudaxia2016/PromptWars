export const ROMA_TO_HIRA: Record<string, string> = {
  a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お',
  ka: 'か', ki: 'き', ku: 'く', ke: 'け', ko: 'こ',
  sa: 'さ', si: 'し', su: 'す', se: 'せ', so: 'そ',
  ta: 'た', ti: 'ち', tu: 'つ', te: 'て', to: 'と',
  na: 'な', ni: 'に', nu: 'ぬ', ne: 'ね', no: 'の',
  ha: 'は', hi: 'ひ', hu: 'ふ', he: 'へ', ho: 'ほ',
  ma: 'ま', mi: 'み', mu: 'む', me: 'め', mo: 'も',
  ya: 'や', yu: 'ゆ', yo: 'よ',
  ra: 'ら', ri: 'り', ru: 'る', re: 'れ', ro: 'ろ',
  wa: 'わ', wo: 'を', n: 'ん',
  ga: 'が', gi: 'ぎ', gu: 'ぐ', ge: 'げ', go: 'ご',
  za: 'ざ', zi: 'じ', zu: 'ず', ze: 'ぜ', zo: 'ぞ',
  da: 'だ', di: 'ぢ', du: 'づ', de: 'で', do: 'ど',
  ba: 'ば', bi: 'び', bu: 'ぶ', be: 'べ', bo: 'ぼ',
  pa: 'ぱ', pi: 'ぴ', pu: 'ぷ', pe: 'ぺ', po: 'ぽ',
  kya: 'きゃ', kyu: 'きゅ', kyo: 'きょ',
  sya: 'しゃ', syu: 'しゅ', syo: 'しょ',
  tya: 'ちゃ', tyu: 'ちゅ', tyo: 'ちょ',
  nya: 'にゃ', nyu: 'にゅ', nyo: 'にょ',
  hya: 'ひゃ', hyu: 'ひゅ', hyo: 'ひょ',
  mya: 'みゃ', myu: 'みゅ', myo: 'みょ',
  rya: 'りゃ', ryu: 'りゅ', ryo: 'りょ',
  gya: 'ぎゃ', gyu: 'ぎゅ', gyo: 'ぎょ',
  zya: 'じゃ', zyu: 'じゅ', zyo: 'じょ',
  dya: 'ぢゃ', dyu: 'ぢゅ', dyo: 'ぢょ',
  bya: 'びゃ', byu: 'びゅ', byo: 'びょ',
  pya: 'ぴゃ', pyu: 'ぴゅ', pyo: 'ぴょ',
};

export interface PuzzleWord {
  id: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  dir: 'across' | 'down';
  /** 罗马音，与 answer（假名）同时存在时用于展示 */
  romanji?: string;
}

export interface Puzzle {
  size: number;
  words: PuzzleWord[];
  /** 收藏时生成，用于标识和匹配 */
  id?: string;
  /** 收藏时间戳 */
  savedAt?: number;
}

export const PUZZLE: Puzzle = {
  size: 10,
  words: [
    { id: 1, clue: '你好（白天）', answer: 'konnichiwa', row: 3, col: 0, dir: 'across' },
    { id: 2, clue: '谢谢', answer: 'arigatou', row: 1, col: 4, dir: 'down' },
    { id: 3, clue: '是的', answer: 'hai', row: 0, col: 6, dir: 'down' },
    { id: 4, clue: '不、不是', answer: 'iie', row: 3, col: 7, dir: 'down' },
    { id: 5, clue: '早上好', answer: 'ohayou', row: 7, col: 0, dir: 'across' },
  ],
};

export function romaToHira(str: string): string {
  if (!str) return '';
  const c = str.toLowerCase();
  return ROMA_TO_HIRA[c] ?? c;
}
