import { describe, expect, it } from 'vitest';
import { rankForTotal, nextRankThreshold } from '../content/ranks';
import type { ProgressEvent } from '../logic/events';
import { canAfford, earnPoints, spendPoints } from '../logic/points';
import { createProgress } from '../logic/progress';

describe('points', () => {
  it('earn increases points and totalEarned and emits points.changed', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    earnPoints(p, 40, 'test', ev);
    expect(p.points).toBe(40);
    expect(p.totalEarned).toBe(40);
    expect(ev).toEqual([{ type: 'points.changed', delta: 40, points: 40, reason: 'test' }]);
  });

  it('ignores non-positive or non-finite amounts', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    earnPoints(p, 0, 'x', ev);
    earnPoints(p, -5, 'x', ev);
    earnPoints(p, Number.NaN, 'x', ev);
    expect(p.points).toBe(0);
    expect(ev).toEqual([]);
  });

  it('spend reduces points only; rejects when insufficient', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    earnPoints(p, 50, 'x', ev);
    expect(canAfford(p, 50)).toBe(true);
    expect(canAfford(p, 51)).toBe(false);
    expect(spendPoints(p, 51, 'buy', ev)).toBe(false);
    expect(p.points).toBe(50);
    expect(spendPoints(p, 30, 'buy', ev)).toBe(true);
    expect(p.points).toBe(20);
    expect(p.totalEarned).toBe(50);
    expect(ev.at(-1)).toEqual({ type: 'points.changed', delta: -30, points: 20, reason: 'buy' });
  });

  it('emits rank.changed when crossing a threshold', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    earnPoints(p, 99, 'x', ev);
    expect(ev.some((e) => e.type === 'rank.changed')).toBe(false);
    earnPoints(p, 1, 'x', ev);
    expect(ev.at(-1)).toEqual({ type: 'rank.changed', rank: '동네 탐험가' });
  });
});

describe('rankForTotal', () => {
  it('has the spec boundaries', () => {
    expect(rankForTotal(0)).toBe('새내기 여행자');
    expect(rankForTotal(99)).toBe('새내기 여행자');
    expect(rankForTotal(100)).toBe('동네 탐험가');
    expect(rankForTotal(249)).toBe('동네 탐험가');
    expect(rankForTotal(250)).toBe('대륙 탐험가');
    expect(rankForTotal(499)).toBe('대륙 탐험가');
    expect(rankForTotal(500)).toBe('세계 여행가');
    expect(rankForTotal(10000)).toBe('세계 여행가');
    expect(nextRankThreshold(0)?.min).toBe(100);
    expect(nextRankThreshold(500)).toBeNull();
  });
});
