export const MAX_LEVEL = 20;

/** XP needed to go from `level` to `level + 1`. Lv1→2: 100, Lv2→3: 200 … */
export function xpToNext(level: number): number {
  return 100 * level;
}

export function statsForLevel(level: number): { maxHp: number; atk: number } {
  return { maxHp: 100 + 20 * (level - 1), atk: 10 + 3 * (level - 1) };
}
