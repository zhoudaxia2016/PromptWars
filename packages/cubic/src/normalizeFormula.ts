const prime = /['\u2019\u2032]/;

export function normalizeFormula(raw: string): string {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const moves: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[UDLRFB]/i.test(c)) {
      let m = c.toUpperCase();
      i++;
      if (i < s.length && prime.test(s[i])) {
        m += "'";
        i++;
      }
      if (i < s.length && s[i] === '2') {
        m += '2';
        i++;
      }
      moves.push(m);
    } else {
      i++;
    }
  }
  return moves.join(' ');
}
