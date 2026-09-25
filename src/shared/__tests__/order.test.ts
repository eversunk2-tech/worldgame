import { describe, expect, it } from 'vitest';
import type { MinigameSpec, OrderItem } from '../types';
import { minigamePool } from '../content';
import { correctArrangement, orderLogic, placedFlags, type OrderState } from '../logic/minigame/order';
import { makePool } from '../logic/minigame/types';

const seoulSpec: MinigameSpec = { kind: 'order', cityId: 'seoul', count: 2, passCount: 2, triesPerQuestion: 2 };
const parisSpec: MinigameSpec = { kind: 'order', cityId: 'paris', count: 2, passCount: 2, triesPerQuestion: 2 };

const item = (id: string): OrderItem => [...minigamePool('seoul').orders, ...minigamePool('paris').orders].find((o) => o.id === id)!;
const labels = (o: OrderItem, arr: readonly number[]) => arr.map((i) => o.items[i]!.label);

/** Rearrange the current question into `target` with swaps only. */
function arrange(s: OrderState, target: readonly number[]): void {
  const q = orderLogic.current(s)!;
  for (let pos = 0; pos < target.length; pos++) {
    const from = q.arrangement.indexOf(target[pos]!);
    if (from !== pos) orderLogic.act(s, { type: 'swap', a: pos, b: from });
  }
}

describe('order logic', () => {
  it('answer order follows value and direction (asc and desc)', () => {
    const near = item('seoul_r01');
    expect(labels(near, correctArrangement(near))).toEqual(['베이징', '시드니', '파리', '뉴욕']);
    const north = item('seoul_r02');
    expect(north.direction).toBe('desc');
    expect(labels(north, correctArrangement(north))).toEqual(['파리', '서울', '카이로', '시드니']);
    const built = item('paris_r01');
    expect(labels(built, correctArrangement(built))).toEqual(['노트르담 대성당', '개선문', '에펠탑', '루브르 유리 피라미드']);
  });

  it('never starts in the right order, whatever the seed', () => {
    for (let seed = 0; seed < 200; seed++) {
      const s = orderLogic.create(seoulSpec, minigamePool('seoul'), seed);
      for (const q of s.questions) {
        expect(q.arrangement).not.toEqual(correctArrangement(q.item));
        expect([...q.arrangement].sort()).toEqual(q.item.items.map((_, i) => i));
      }
    }
  });

  it('is deterministic for a seed', () => {
    const a = orderLogic.create(parisSpec, minigamePool('paris'), 77);
    expect(orderLogic.create(parisSpec, minigamePool('paris'), 77)).toEqual(a);
    expect(a.questions).toHaveLength(2);
    expect(a.passCount).toBe(2);
  });

  it('swap and move only rearrange; bad positions are ignored', () => {
    const s = orderLogic.create(seoulSpec, minigamePool('seoul'), 4);
    const q = orderLogic.current(s)!;
    const start = [...q.arrangement];
    expect(orderLogic.act(s, { type: 'swap', a: 0, b: 3 })).toEqual({ correct: false, explanation: '', outcome: 'moved' });
    expect(q.arrangement).toEqual([start[3], start[1], start[2], start[0]]);
    orderLogic.act(s, { type: 'swap', a: 0, b: 3 });
    expect(orderLogic.act(s, { type: 'move', from: 0, to: 2 }).outcome).toBe('moved');
    expect(q.arrangement).toEqual([start[1], start[2], start[0], start[3]]);
    expect(orderLogic.act(s, { type: 'move', from: 2, to: 2 }).outcome).toBe('ignored');
    expect(orderLogic.act(s, { type: 'swap', a: 0, b: 9 }).outcome).toBe('ignored');
    expect(orderLogic.act(s, { type: 'swap', a: -1, b: 1 }).outcome).toBe('ignored');
    expect(s.index).toBe(0);
    expect(q.tries).toBe(0);
  });

  it('a correct submit solves the question and moves on', () => {
    const s = orderLogic.create(seoulSpec, minigamePool('seoul'), 9);
    const q = orderLogic.current(s)!;
    arrange(s, correctArrangement(q.item));
    const fb = orderLogic.act(s, { type: 'submit' });
    expect(fb).toEqual({ correct: true, explanation: q.item.explanation, outcome: 'solved', placed: [true, true, true, true] });
    expect(q.solved).toBe(true);
    expect(s.index).toBe(1);
  });

  it('a wrong submit reports cards in place; the second wrong submit reveals the answer and moves on', () => {
    const s = orderLogic.create(seoulSpec, minigamePool('seoul'), 12);
    const q = orderLogic.current(s)!;
    const answer = correctArrangement(q.item);
    // put exactly two cards in place: answer with the last two swapped
    arrange(s, [answer[0]!, answer[1]!, answer[3]!, answer[2]!]);
    const first = orderLogic.act(s, { type: 'submit' });
    expect(first).toEqual({ correct: false, explanation: '2개가 제자리에 있어요', outcome: 'retry', placed: [true, true, false, false] });
    expect(q.tries).toBe(1);
    expect(s.index).toBe(0);
    const second = orderLogic.act(s, { type: 'submit' });
    expect(second.outcome).toBe('revealed');
    expect(second.explanation).toContain('2개가 제자리에 있어요');
    expect(second.explanation).toContain(q.item.explanation);
    expect(q.revealed).toBe(true);
    expect(q.solved).toBe(false);
    expect(q.arrangement).toEqual(answer);
    expect(s.index).toBe(1);
  });

  it('result: correct = solved questions; both needed to pass (2/2)', () => {
    const win = orderLogic.create(parisSpec, minigamePool('paris'), 3);
    while (!orderLogic.isDone(win)) {
      arrange(win, correctArrangement(orderLogic.current(win)!.item));
      orderLogic.act(win, { type: 'submit' });
    }
    expect(orderLogic.result(win)).toMatchObject({ kind: 'order', success: true, correct: 2, total: 2 });
    expect(orderLogic.result(win).answeredIds.sort()).toEqual(['paris_r01', 'paris_r02']);

    const half = orderLogic.create(parisSpec, minigamePool('paris'), 3);
    arrange(half, correctArrangement(orderLogic.current(half)!.item));
    orderLogic.act(half, { type: 'submit' }); // solved
    orderLogic.act(half, { type: 'submit' }); // wrong (start order is never right)
    orderLogic.act(half, { type: 'submit' }); // wrong again → revealed
    expect(orderLogic.isDone(half)).toBe(true);
    expect(orderLogic.result(half)).toMatchObject({ success: false, correct: 1, total: 2 });
    expect(orderLogic.act(half, { type: 'submit' }).outcome).toBe('ignored');
  });

  it('placedFlags compares position by position; short pools and wrong specs', () => {
    expect(placedFlags([2, 1, 0], [0, 1, 2])).toEqual([false, true, false]);
    const short = orderLogic.create(seoulSpec, makePool({ orders: [item('seoul_r01')] }), 1);
    expect(short.questions).toHaveLength(1);
    expect(short.passCount).toBe(1);
    expect(() => orderLogic.create({ kind: 'mapfind', cityId: 'seoul', count: 5, passCount: 4 }, minigamePool('seoul'), 1)).toThrow();
  });
});
