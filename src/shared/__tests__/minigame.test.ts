import { describe, expect, it } from 'vitest';
import type { MinigameSpec, QuizItem } from '../types';
import { quizPool } from '../content';
import { quizLogic } from '../logic/minigame/quiz';
import { oxLogic } from '../logic/minigame/ox';
import { MINIGAME_LOGIC, getMinigameLogic } from '../logic/minigame/registry';
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
    const pool = quizPool('seoul');
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
      const s = quizLogic.create(quizSpec, pool, seed);
      for (const item of s.items) {
        const original = pool.find((q) => q.id === item.id) as Extract<QuizItem, { kind: 'choice' }>;
        expect(item.choices[item.answer]).toBe(original.choices[original.answer]);
        expect([...item.choices].sort()).toEqual([...original.choices].sort());
      }
    }
  });

  it('scores answers and passes at 4/5', () => {
    const pool = quizPool('seoul');
    const s = quizLogic.create(quizSpec, pool, 3);
    let n = 0;
    while (!quizLogic.isDone(s)) {
      const item = quizLogic.current(s)!;
      const fb = quizLogic.answer(s, n < 4 ? item.answer : (Number(item.answer) + 1) % 4);
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
    const s = quizLogic.create(quizSpec, quizPool('seoul'), 3);
    let n = 0;
    while (!quizLogic.isDone(s)) {
      const item = quizLogic.current(s)!;
      quizLogic.answer(s, n < 3 ? item.answer : (Number(item.answer) + 2) % 4);
      n++;
    }
    expect(quizLogic.result(s)).toMatchObject({ success: false, correct: 3, total: 5 });
  });

  it('handles a short pool: asks what exists and lowers passCount', () => {
    const pool = quizPool('seoul').filter((q) => q.kind === 'choice').slice(0, 3);
    const s = quizLogic.create(quizSpec, pool, 1);
    expect(s.items).toHaveLength(3);
    expect(s.passCount).toBe(3);
    for (const item of s.items) quizLogic.answer(s, item.answer);
    expect(quizLogic.result(s)).toMatchObject({ success: true, correct: 3, total: 3 });
  });

  it('filters by topic when given', () => {
    const s = quizLogic.create({ ...quizSpec, topics: ['climate'] }, quizPool('seoul'), 1);
    expect(s.items.length).toBe(2);
    expect(s.items.every((i) => i.topic === 'climate')).toBe(true);
  });

  it('empty pool → no success', () => {
    const s = quizLogic.create(quizSpec, [], 1);
    expect(quizLogic.isDone(s)).toBe(true);
    expect(quizLogic.result(s).success).toBe(false);
  });
});

describe('ox logic', () => {
  it('selects only ox items deterministically and scores booleans', () => {
    const pool = quizPool('seoul');
    const s = oxLogic.create(oxSpec, pool, 11);
    expect(s.items).toHaveLength(5);
    expect(s.items.every((i) => i.kind === 'ox')).toBe(true);
    expect(s.items.map((i) => i.id)).toEqual(oxLogic.create(oxSpec, pool, 11).items.map((i) => i.id));
    let n = 0;
    while (!oxLogic.isDone(s)) {
      const item = oxLogic.current(s)!;
      const fb = oxLogic.answer(s, n === 0 ? !item.answer : item.answer);
      expect(fb.correct).toBe(n !== 0);
      n++;
    }
    expect(oxLogic.result(s)).toMatchObject({ kind: 'ox', success: true, correct: 4, total: 5 });
  });

  it('a number answer is never correct for ox', () => {
    const s = oxLogic.create(oxSpec, quizPool('paris'), 2);
    expect(oxLogic.answer(s, 1).correct).toBe(false);
  });
});

describe('registry', () => {
  it('maps kinds to logic', () => {
    expect(MINIGAME_LOGIC.quiz.kind).toBe('quiz');
    expect(MINIGAME_LOGIC.ox.kind).toBe('ox');
    expect(getMinigameLogic('ox')).toBe(oxLogic);
  });
});
