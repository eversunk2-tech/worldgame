import { describe, expect, it } from 'vitest';
import type { MinigameSpec } from '../types';
import { minigamePool } from '../content';
import { matchLogic, matchStars, type MatchState } from '../logic/minigame/match';
import { makePool } from '../logic/minigame/types';

const spec6: MinigameSpec = { kind: 'match', cityId: 'seoul', pairs: 6, maxAttempts: 14 };
const spec8: MinigameSpec = { kind: 'match', cityId: 'paris', pairs: 8, maxAttempts: 20 };

/** Indices of the two cards of every pair, in card order of the first card. */
function pairsOf(s: MatchState): [number, number][] {
  const out = new Map<string, number[]>();
  s.cards.forEach((c, i) => out.set(c.pairId, [...(out.get(c.pairId) ?? []), i]));
  return [...out.values()].map((v) => [v[0]!, v[1]!]);
}

/** Two cards from different pairs. */
function wrongPair(s: MatchState): [number, number] {
  const i = s.cards.findIndex((_, k) => !s.matched[k]);
  const j = s.cards.findIndex((c, k) => !s.matched[k] && c.pairId !== s.cards[i]!.pairId);
  return [i, j];
}

function miss(s: MatchState): void {
  const [i, j] = wrongPair(s);
  matchLogic.act(s, { type: 'flip', index: i });
  expect(matchLogic.act(s, { type: 'flip', index: j }).outcome).toBe('mismatch');
  expect(matchLogic.act(s, { type: 'hide' }).outcome).toBe('hidden');
}

function solveAll(s: MatchState): void {
  for (const [a, b] of pairsOf(s)) {
    if (s.matched[a]) continue;
    matchLogic.act(s, { type: 'flip', index: a });
    matchLogic.act(s, { type: 'flip', index: b });
  }
}

describe('match logic', () => {
  it('same seed → same layout, other seeds → different layouts', () => {
    const pool = minigamePool('seoul');
    const a = matchLogic.create(spec6, pool, 42);
    const b = matchLogic.create(spec6, pool, 42);
    expect(a).toEqual(b);
    const layouts = new Set([1, 2, 3, 4, 5].map((seed) => matchLogic.create(spec6, pool, seed).cards.map((c) => c.text).join('|')));
    expect(layouts.size).toBeGreaterThan(1);
  });

  it('deals 2N cards with every pair id exactly twice (one left, one right)', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 7);
    expect(s.pairs).toHaveLength(6);
    expect(s.cards).toHaveLength(12);
    for (const p of s.pairs) {
      const cards = s.cards.filter((c) => c.pairId === p.id);
      expect(cards.map((c) => c.side).sort()).toEqual(['left', 'right']);
      expect(cards.map((c) => c.text).sort()).toEqual([p.left, p.right].sort());
    }
    const eight = matchLogic.create(spec8, minigamePool('paris'), 7);
    expect(eight.cards).toHaveLength(16);
  });

  it('ignores flipping the same card twice and a third card while two are face up', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 3);
    const [i, j] = wrongPair(s);
    expect(matchLogic.act(s, { type: 'flip', index: i }).outcome).toBe('flipped');
    expect(matchLogic.act(s, { type: 'flip', index: i })).toEqual({ correct: false, explanation: '', outcome: 'ignored' });
    expect(s.attempts).toBe(0);
    matchLogic.act(s, { type: 'flip', index: j });
    const third = s.cards.findIndex((_, k) => k !== i && k !== j);
    expect(matchLogic.act(s, { type: 'flip', index: third }).outcome).toBe('ignored');
    expect(s.faceUp).toEqual([i, j]);
    expect(matchLogic.act(s, { type: 'flip', index: 99 }).outcome).toBe('ignored');
    expect(matchLogic.act(s, { type: 'flip', index: -1 }).outcome).toBe('ignored');
  });

  it('a matching pair stays open, counts one attempt and explains the pair', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 5);
    const [a, b] = pairsOf(s)[0]!;
    matchLogic.act(s, { type: 'flip', index: a });
    const fb = matchLogic.act(s, { type: 'flip', index: b });
    const pair = s.pairs.find((p) => p.id === s.cards[a]!.pairId)!;
    expect(fb).toEqual({ correct: true, explanation: `${pair.left} — ${pair.right}`, outcome: 'match' });
    expect(s.matched[a] && s.matched[b]).toBe(true);
    expect(s.faceUp).toEqual([]);
    expect(s.attempts).toBe(1);
    expect(matchLogic.act(s, { type: 'flip', index: a }).outcome).toBe('ignored'); // matched cards stay put
  });

  it('a mismatch counts an attempt, explains, and hide turns both back', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 9);
    const [i, j] = wrongPair(s);
    matchLogic.act(s, { type: 'flip', index: i });
    expect(matchLogic.act(s, { type: 'flip', index: j })).toEqual({ correct: false, explanation: '다시 기억해 봐요', outcome: 'mismatch' });
    expect(s.attempts).toBe(1);
    expect(s.matched.some(Boolean)).toBe(false);
    expect(matchLogic.act(s, { type: 'hide' }).outcome).toBe('hidden');
    expect(s.faceUp).toEqual([]);
    expect(matchLogic.act(s, { type: 'hide' }).outcome).toBe('ignored');
    expect(matchLogic.act(s, { type: 'flip', index: i }).outcome).toBe('flipped');
  });

  it('stars: ≤ N+2 → 3, ≤ 2N → 2, otherwise 1', () => {
    expect([matchStars(6, 6), matchStars(8, 6), matchStars(9, 6), matchStars(12, 6), matchStars(13, 6), matchStars(14, 6)]).toEqual([3, 3, 2, 2, 1, 1]);
    expect([matchStars(10, 8), matchStars(11, 8), matchStars(16, 8), matchStars(17, 8)]).toEqual([3, 2, 2, 1]);
  });

  it('perfect play and the star boundaries through real games', () => {
    const perfect = matchLogic.create(spec6, minigamePool('seoul'), 1);
    solveAll(perfect);
    expect(matchLogic.isDone(perfect)).toBe(true);
    expect(matchLogic.result(perfect)).toEqual({ kind: 'match', success: true, correct: 6, total: 6, answeredIds: perfect.matchedIds, stars: 3 });

    const twoMiss = matchLogic.create(spec6, minigamePool('seoul'), 1);
    miss(twoMiss); miss(twoMiss); solveAll(twoMiss);
    expect(twoMiss.attempts).toBe(8); // N + 2
    expect(matchLogic.result(twoMiss).stars).toBe(3);

    const missX3 = matchLogic.create(spec6, minigamePool('seoul'), 1);
    miss(missX3); miss(missX3); miss(missX3); solveAll(missX3);
    expect(missX3.attempts).toBe(9);
    expect(matchLogic.result(missX3).stars).toBe(2);

    const sevenMiss = matchLogic.create(spec6, minigamePool('seoul'), 1);
    for (let k = 0; k < 7; k++) miss(sevenMiss);
    solveAll(sevenMiss);
    expect(sevenMiss.attempts).toBe(13); // > 2N
    expect(matchLogic.result(sevenMiss)).toMatchObject({ success: true, stars: 1 });
  });

  it('fails when the attempt limit runs out, then ignores further flips', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 2);
    for (let k = 0; k < 13; k++) miss(s);
    // the 14th attempt is another miss → out of attempts
    const [i, j] = wrongPair(s);
    matchLogic.act(s, { type: 'flip', index: i });
    matchLogic.act(s, { type: 'flip', index: j });
    expect(s.attempts).toBe(14);
    expect(matchLogic.isDone(s)).toBe(true);
    expect(matchLogic.act(s, { type: 'hide' }).outcome).toBe('hidden'); // the scene can still turn the last two back
    expect(matchLogic.act(s, { type: 'flip', index: 0 }).outcome).toBe('ignored');
    const r = matchLogic.result(s);
    expect(r).toEqual({ kind: 'match', success: false, correct: 0, total: 6, answeredIds: [] });
    expect(r.stars).toBeUndefined();
  });

  it('matching the last pair on the final allowed attempt still succeeds', () => {
    const s = matchLogic.create(spec6, minigamePool('seoul'), 4);
    for (let k = 0; k < 8; k++) miss(s); // 8 misses + 6 matches = 14 = maxAttempts
    solveAll(s);
    expect(s.attempts).toBe(14);
    expect(matchLogic.result(s)).toMatchObject({ success: true, correct: 6, stars: 1 });
  });

  it('shrinks to the pool when fewer pairs exist; empty pool is done and unsuccessful', () => {
    const pool = makePool({ pairs: minigamePool('seoul').pairs.slice(0, 4) });
    const s = matchLogic.create(spec6, pool, 1);
    expect(s.pairs).toHaveLength(4);
    expect(s.cards).toHaveLength(8);
    solveAll(s);
    expect(matchLogic.result(s)).toMatchObject({ success: true, correct: 4, total: 4, stars: 3 });

    const empty = matchLogic.create(spec6, makePool(), 1);
    expect(matchLogic.isDone(empty)).toBe(true);
    expect(matchLogic.result(empty).success).toBe(false);
  });

  it('only deals pairs of the spec city and rejects other specs', () => {
    const s = matchLogic.create(spec6, makePool({ pairs: [...minigamePool('seoul').pairs, ...minigamePool('paris').pairs] }), 8);
    expect(s.pairs.every((p) => p.cityId === 'seoul')).toBe(true);
    expect(() => matchLogic.create({ kind: 'blank', cityId: 'seoul', count: 4, passCount: 3 }, minigamePool('seoul'), 1)).toThrow();
    expect(JSON.parse(JSON.stringify(s))).toEqual(s); // plain JSON state
  });
});
