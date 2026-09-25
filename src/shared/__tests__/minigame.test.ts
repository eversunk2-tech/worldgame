import { describe, expect, it } from 'vitest';
import type { MinigameKind, MinigameSpec, QuizItem } from '../types';
import { minigamePool, quizPool } from '../content';
import { quizLogic } from '../logic/minigame/quiz';
import { oxLogic } from '../logic/minigame/ox';
import { MINIGAME_LOGIC, getMinigameLogic } from '../logic/minigame/registry';
import { makePool } from '../logic/minigame/types';
import { mulberry32 } from '../rng';

const quizSpec: MinigameSpec = { kind: 'quiz', cityId: 'seoul', count: 5, passCount: 4 };
const oxSpec: MinigameSpec = { kind: 'ox', cityId: 'seoul', count: 5, passCount: 4 };

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a.next(), a.next(), a.int(10)]).toEqual([b.next(), b.next(), b.int(10)]);
    expect(mulberry32(1).shuffle([1, 2, 3, 4, 5])).toEqual(mulberry32(1).shuffle([1, 2, 3, 4, 5]));
    expect(mulberry32(1).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('quiz logic', () => {
  it('selects the same 5 choice items for the same seed, different for another', () => {
    const pool = minigamePool('seoul');
    const s1 = quizLogic.create(quizSpec, pool, 7);
    const s2 = quizLogic.create(quizSpec, pool, 7);
    const s3 = quizLogic.create(quizSpec, pool, 8);
    expect(s1.items.map((i) => i.id)).toEqual(s2.items.map((i) => i.id));
    expect(s1.items).toHaveLength(5);
    expect(s1.items.every((i) => i.kind === 'choice' && i.cityId === 'seoul')).toBe(true);
    expect(new Set(s1.items.map((i) => i.id)).size).toBe(5);
    const differs = s1.items.map((i) => i.id).join() !== s3.items.map((i) => i.id).join()
      || s1.items.map((i) => i.choices.join()).join('|') !== s3.items.map((i) => i.choices.join()).join('|');
    expect(differs).toBe(true);
  });

  it('shuffles choices but keeps the answer pointing at the correct text', () => {
    const pool = quizPool('seoul');
    for (let seed = 0; seed < 20; seed++) {
      const s = quizLogic.create(quizSpec, makePool({ quiz: pool }), seed);
      for (const item of s.items) {
        const original = pool.find((q) => q.id === item.id) as Extract<QuizItem, { kind: 'choice' }>;
        expect(item.choices[item.answer]).toBe(original.choices[original.answer]);
        expect([...item.choices].sort()).toEqual([...original.choices].sort());
      }
    }
  });

  it('scores answers and passes at 4/5', () => {
    const s = quizLogic.create(quizSpec, minigamePool('seoul'), 3);
    let n = 0;
    while (!quizLogic.isDone(s)) {
      const item = quizLogic.current(s)!;
      const fb = quizLogic.act(s, n < 4 ? item.answer : (Number(item.answer) + 1) % 4);
      expect(fb.correct).toBe(n < 4);
      expect(fb.explanation).toBe(item.explanation);
      n++;
    }
    expect(quizLogic.current(s)).toBeNull();
    const r = quizLogic.result(s);
    expect(r).toMatchObject({ kind: 'quiz', success: true, correct: 4, total: 5 });
    expect(r.answeredIds).toHaveLength(5);
  });

  it('fails at 3/5', () => {
    const s = quizLogic.create(quizSpec, minigamePool('seoul'), 3);
    let n = 0;
    while (!quizLogic.isDone(s)) {
      const item = quizLogic.current(s)!;
      quizLogic.act(s, n < 3 ? item.answer : (Number(item.answer) + 2) % 4);
      n++;
    }
    expect(quizLogic.result(s)).toMatchObject({ success: false, correct: 3, total: 5 });
  });

  it('handles a short pool: asks what exists and lowers passCount', () => {
    const pool = quizPool('seoul').filter((q) => q.kind === 'choice').slice(0, 3);
    const s = quizLogic.create(quizSpec, makePool({ quiz: pool }), 1);
    expect(s.items).toHaveLength(3);
    expect(s.passCount).toBe(3);
    for (const item of s.items) quizLogic.act(s, item.answer);
    expect(quizLogic.result(s)).toMatchObject({ success: true, correct: 3, total: 3 });
  });

  it('filters by topic when given', () => {
    const s = quizLogic.create({ ...quizSpec, topics: ['climate'] }, minigamePool('seoul'), 1);
    expect(s.items.length).toBe(2);
    expect(s.items.every((i) => i.topic === 'climate')).toBe(true);
  });

  it('empty pool → no success', () => {
    const s = quizLogic.create(quizSpec, makePool(), 1);
    expect(quizLogic.isDone(s)).toBe(true);
    expect(quizLogic.result(s).success).toBe(false);
  });
});

describe('ox logic', () => {
  it('selects only ox items deterministically and scores booleans', () => {
    const pool = minigamePool('seoul');
    const s = oxLogic.create(oxSpec, pool, 11);
    expect(s.items).toHaveLength(5);
    expect(s.items.every((i) => i.kind === 'ox')).toBe(true);
    expect(s.items.map((i) => i.id)).toEqual(oxLogic.create(oxSpec, pool, 11).items.map((i) => i.id));
    let n = 0;
    while (!oxLogic.isDone(s)) {
      const item = oxLogic.current(s)!;
      const fb = oxLogic.act(s, n === 0 ? !item.answer : item.answer);
      expect(fb.correct).toBe(n !== 0);
      n++;
    }
    expect(oxLogic.result(s)).toMatchObject({ kind: 'ox', success: true, correct: 4, total: 5 });
  });

  it('a number answer is never correct for ox', () => {
    const s = oxLogic.create(oxSpec, minigamePool('paris'), 2);
    expect(oxLogic.act(s, 1).correct).toBe(false);
  });
});

describe('registry', () => {
  it('maps all six kinds to their logic', () => {
    const kinds: MinigameKind[] = ['quiz', 'ox', 'match', 'mapfind', 'order', 'blank'];
    expect(Object.keys(MINIGAME_LOGIC).sort()).toEqual([...kinds].sort());
    for (const k of kinds) expect(getMinigameLogic(k).kind).toBe(k);
    expect(getMinigameLogic('ox')).toBe(oxLogic);
    expect(() => getMinigameLogic('chess' as MinigameKind)).toThrow();
  });

  it('every logic builds plain-JSON state from the city pool, deterministic for a seed', () => {
    const specs: MinigameSpec[] = [
      quizSpec, oxSpec,
      { kind: 'match', cityId: 'seoul', pairs: 6, maxAttempts: 14 },
      { kind: 'mapfind', cityId: 'seoul', count: 5, passCount: 4 },
      { kind: 'order', cityId: 'paris', count: 2, passCount: 2, triesPerQuestion: 2 },
      { kind: 'blank', cityId: 'paris', count: 4, passCount: 3 },
    ];
    for (const spec of specs) {
      const logic = getMinigameLogic(spec.kind);
      const a = logic.create(spec, minigamePool(spec.cityId), 123);
      expect(JSON.parse(JSON.stringify(a))).toEqual(a);
      expect(logic.create(spec, minigamePool(spec.cityId), 123)).toEqual(a);
      expect(logic.isDone(a)).toBe(false);
      expect(logic.result(a)).toMatchObject({ kind: spec.kind, success: false, correct: 0 });
    }
  });

  it('a logic refuses another kind of spec', () => {
    expect(() => quizLogic.create(oxSpec, minigamePool('seoul'), 1)).toThrow();
    expect(() => oxLogic.create(quizSpec, minigamePool('seoul'), 1)).toThrow();
  });
});
