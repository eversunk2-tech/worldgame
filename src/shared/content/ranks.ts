// Traveller rank by total points earned (display only).

export interface RankDef { min: number; name: string }

export const RANKS: readonly RankDef[] = [
  { min: 0, name: '새내기 여행자' },
  { min: 100, name: '동네 탐험가' },
  { min: 250, name: '대륙 탐험가' },
  { min: 500, name: '세계 여행가' },
];

export function rankForTotal(totalEarned: number): string {
  let name = RANKS[0]!.name;
  for (const r of RANKS) {
    if (totalEarned >= r.min) name = r.name;
  }
  return name;
}

/** Next rank threshold above `totalEarned`, or null when at the top rank. */
export function nextRankThreshold(totalEarned: number): RankDef | null {
  for (const r of RANKS) {
    if (totalEarned < r.min) return r;
  }
  return null;
}
