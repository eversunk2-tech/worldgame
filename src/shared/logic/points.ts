// Point earning / spending and rank lookups (spec 6.6).
import type { Progress } from '../types';
import { rankForTotal } from '../content/ranks';
import type { ProgressEvent } from './events';

export { rankForTotal } from '../content/ranks';

/** Add `delta` (>0) to points and totalEarned. Emits points.changed and rank.changed when the rank moves. */
export function earnPoints(progress: Progress, delta: number, reason: string, events: ProgressEvent[]): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  const amount = Math.floor(delta);
  const prevRank = rankForTotal(progress.totalEarned);
  progress.points += amount;
  progress.totalEarned += amount;
  events.push({ type: 'points.changed', delta: amount, points: progress.points, reason });
  const rank = rankForTotal(progress.totalEarned);
  if (rank !== prevRank) events.push({ type: 'rank.changed', rank });
}

export function canAfford(progress: Progress, amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && progress.points >= amount;
}

/** Spend points. Returns false (no change) when unaffordable. */
export function spendPoints(progress: Progress, amount: number, reason: string, events: ProgressEvent[]): boolean {
  if (!canAfford(progress, amount)) return false;
  const a = Math.floor(amount);
  if (a === 0) return true;
  progress.points -= a;
  events.push({ type: 'points.changed', delta: -a, points: progress.points, reason });
  return true;
}
