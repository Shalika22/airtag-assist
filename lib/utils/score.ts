export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function sortByScoreDesc<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}


