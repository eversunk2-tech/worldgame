import { describe, expect, it } from 'vitest';
import type { MinigameSpec } from '../types';
import { ALL_BLANKS, minigamePool } from '../content';
import { blankLogic, fillBlankText, INCOMPLETE_TEXT, parseBlankText, type BlankState } from '../logic/minigame/blank';
import { makePool } from '../logic/minigame/types';

const seoulSpec: MinigameSpec = { kind: 'blank', cityId: 'seoul', count: 4, passCount: 3 };
const parisSpec: MinigameSpec = { kind: 'blank', cityId: 'paris', count: 4, passCount: 3 };

/** Fill every blank of the current sentence (right or one wrong) and submit. */
function answer(s: BlankState, right: boolean) {
  const q = blankLogic.current(s)!;
  q.slots.forEach((slot, i) => {
    const pick = right || i > 0 ? slot.answer : (slot.answer + 1) % 4;
    blankLogic.act(s, { type: 'choose', blank: i, option: pick });
  });
  return blankLogic.act(s, { type: 'submit' });
}

describe('blank logic', () => {
  it('parses [n] marks: pieces = blanks + 1, also when a sentence starts with a blank', () => {
    expect(parseBlankText('서울은 [0] 대륙의 [1]에 있다.')).toEqual({ pieces: ['서울은 ', ' 대륙의 ', '에 있다.'], marks: [0, 1] });
    expect(parseBlankText('[0]이 만든 글자는 [1]이다.')).toEqual({ pieces: ['', '이 만든 글자는 ', '이다.'], marks: [0, 1] });
    expect(parseBlankText('빈칸 없음').pieces).toHaveLength(1);
    for (const b of ALL_BLANKS) expect(parseBlankText(b.text).pieces).toHaveLength(b.blanks.length + 1);
  });

  it('each explanation is the sentence completed with the answers', () => {
    for (const b of ALL_BLANKS) expect(fillBlankText(b.text, b.blanks.map((x) => x.answer))).toBe(b.explanation);
  });

  it('shuffles the options per blank but keeps the answer index on the right text', () => {
    let moved = false;
    for (let seed = 0; seed < 30; seed++) {
      const s = blankLogic.create(seoulSpec, minigamePool('seoul'), seed);
      for (const q of s.questions) {
        q.slots.forEach((slot, i) => {
          const src = q.item.blanks[i]!;
          expect(slot.options[slot.answer]).toBe(src.answer);
          expect([...slot.options].sort()).toEqual([...src.options].sort());
          if (slot.options.join() !== src.options.join()) moved = true;
        });
      }
    }
    expect(moved).toBe(true);
  });

  it('is deterministic for a seed and only uses the spec city', () => {
    const a = blankLogic.create(parisSpec, makePool({ blanks: [...minigamePool('seoul').blanks, ...minigamePool('paris').blanks] }), 5);
    const b = blankLogic.create(parisSpec, makePool({ blanks: [...minigamePool('seoul').blanks, ...minigamePool('paris').blanks] }), 5);
    expect(a).toEqual(b);
    expect(a.questions).toHaveLength(4);
    expect(a.questions.every((q) => q.item.cityId === 'paris')).toBe(true);
    expect(a.chosen).toEqual(a.questions[0]!.slots.map(() => null));
  });

  it('refuses to grade while a blank is empty', () => {
    const s = blankLogic.create(seoulSpec, minigamePool('seoul'), 1);
    // find a two-blank sentence position by answering one-blank ones right
    while (blankLogic.current(s)!.slots.length < 2) answer(s, true);
    const before = s.index;
    expect(blankLogic.act(s, { type: 'submit' })).toEqual({ correct: false, explanation: INCOMPLETE_TEXT, outcome: 'incomplete' });
    expect(blankLogic.act(s, { type: 'choose', blank: 0, option: 2 })).toEqual({ correct: false, explanation: '', outcome: 'chosen' });
    expect(blankLogic.act(s, { type: 'submit' }).outcome).toBe('incomplete');
    expect(s.index).toBe(before);
    expect(s.chosen).toEqual([2, null]);
  });

  it('grades the whole sentence with per-blank flags and the completed sentence', () => {
    const s = blankLogic.create(seoulSpec, minigamePool('seoul'), 2);
    const q = blankLogic.current(s)!;
    const right = answer(s, true);
    expect(right).toEqual({ correct: true, explanation: q.item.explanation, outcome: 'graded', perBlank: q.slots.map(() => true) });
    expect(s.index).toBe(1);
    const q2 = blankLogic.current(s)!;
    const wrong = answer(s, false);
    expect(wrong.correct).toBe(false);
    expect(wrong.perBlank![0]).toBe(false);
    expect(wrong.explanation).toBe(q2.item.explanation);
    expect(s.chosen).toEqual(blankLogic.current(s)!.slots.map(() => null)); // reset for the next sentence
  });

  it('passes at 3/4 and fails at 2/4', () => {
    const pass = blankLogic.create(parisSpec, minigamePool('paris'), 8);
    [true, true, false, true].forEach((r) => answer(pass, r));
    expect(blankLogic.isDone(pass)).toBe(true);
    expect(blankLogic.result(pass)).toMatchObject({ kind: 'blank', success: true, correct: 3, total: 4 });
    expect(blankLogic.result(pass).answeredIds).toHaveLength(4);

    const fail = blankLogic.create(parisSpec, minigamePool('paris'), 8);
    [true, false, false, true].forEach((r) => answer(fail, r));
    expect(blankLogic.result(fail)).toMatchObject({ success: false, correct: 2 });
  });

  it('ignores invalid choices and actions after the end', () => {
    const s = blankLogic.create(seoulSpec, minigamePool('seoul'), 3);
    expect(blankLogic.act(s, { type: 'choose', blank: 5, option: 0 }).outcome).toBe('ignored');
    expect(blankLogic.act(s, { type: 'choose', blank: 0, option: 4 }).outcome).toBe('ignored');
    expect(blankLogic.act(s, { type: 'choose', blank: 0, option: -1 }).outcome).toBe('ignored');
    while (!blankLogic.isDone(s)) answer(s, true);
    expect(blankLogic.act(s, { type: 'submit' }).outcome).toBe('ignored');
    expect(() => blankLogic.create({ kind: 'order', cityId: 'seoul', count: 2, passCount: 2, triesPerQuestion: 2 }, minigamePool('seoul'), 1)).toThrow();
  });
});
