/**
 * 返回魔方公式中某一步的逆操作
 * 例如: R -> R', U' -> U, F2 -> F2
 */
export function invertMove(move: string): string {
  const trimmed = move.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith("2")) return trimmed; // 180° 的逆就是自身
  if (trimmed.endsWith("'")) return trimmed.slice(0, -1); // 逆时针 -> 顺时针
  return trimmed + "'"; // 顺时针 -> 逆时针
}
