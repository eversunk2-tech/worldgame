// Fill in the blanks (spec 7.4): seeded sentences, seeded option order per blank (answer index re-pointed). choose
// fills one blank; submit refuses while a blank is empty, otherwise grades the whole sentence and moves on.
import type { BlankItem, MinigameResult } from '../../types';
import { mulberry32 } from '../../rng';
import { wrongSpec, type ActFeedback, type BlankSpec, type MinigameLogic } from './types';

export interface BlankSlot { options: [string, string, string, string]; answer: number }
export interface BlankQuestion { item: BlankItem; /** text around the blanks: pieces.length = slots.length + 1 */ pieces: string[]; slots: BlankSlot[] }

export interface BlankState {
  spec: BlankSpec;
  questions: BlankQuestion[];
  index: number;
  /** chosen option per blank of the current question */
  chosen: (number | null)[];
  correct: number;
  answeredIds: string[];
  passCount: number;
}

export type BlankAction = { type: 'choose'; blank: number; option: number } | { type: 'submit' };
export type BlankOutcome = 'ignored' | 'chosen' | 'incomplete' | 'graded';
export interface BlankFeedback extends ActFeedback {
  outcome: BlankOutcome;
  /** after grading: right/wrong per blank */
  perBlank?: boolean[];
}

export interface BlankLogic extends MinigameLogic<BlankState, BlankAction> {
  act(s: BlankState, a: BlankAction): BlankFeedback;
  current(s: BlankState): BlankQuestion | null;
}

export const INCOMPLETE_TEXT = '빈칸을 모두 채워요';

/** Split '서울은 [0] 대륙의 [1]에 있다.' into the text pieces and the blank numbers in reading order. */
export function parseBlankText(text: string): { pieces: string[]; marks: number[] } {
  const parts = text.split(/\[(\d+)\]/);
  const pieces: string[] = [];
  const marks: number[] = [];
  parts.forEach((p, i) => (i % 2 === 0 ? pieces.push(p) : marks.push(Number(p))));
  return { pieces, marks };
}

/** The sentence with `fills[n]` written into blank [n]. */
export function fillBlankText(text: string, fills: readonly string[]): string {
  return text.replace(/\[(\d+)\]/g, (_, n: string) => fills[Number(n)] ?? '___');
}

const IGNORED: BlankFeedback = { correct: false, explanation: '', outcome: 'ignored' };

export const blankLogic: BlankLogic = {
  kind: 'blank',
  create(spec, pool, seed) {
    if (spec.kind !== 'blank') throw wrongSpec('blank', spec);
    const rng = mulberry32(seed);
    const items = rng.shuffle(pool.blanks.filter((b) => b.cityId === spec.cityId)).slice(0, spec.count);
    const questions = items.map((item): BlankQuestion => {
      const { pieces } = parseBlankText(item.text);
      const slots = item.blanks.map((b): BlankSlot => {
        const options = rng.shuffle(b.options) as [string, string, string, string];
        return { options, answer: options.indexOf(b.answer) };
      });
      return { item, pieces, slots };
    });
    return {
      spec, questions, index: 0, chosen: questions[0]?.slots.map(() => null) ?? [], correct: 0, answeredIds: [],
      passCount: Math.min(spec.passCount, questions.length),
    };
  },
  current(s) {
    return s.questions[s.index] ?? null;
  },
  act(s, a): BlankFeedback {
    const q = s.questions[s.index];
    if (!q || !a) return IGNORED;
    if (a.type === 'choose') {
      const slot = q.slots[a.blank];
      if (!slot || !Number.isInteger(a.blank) || !Number.isInteger(a.option) || a.option < 0 || a.option >= slot.options.length) return IGNORED;
      s.chosen[a.blank] = a.option;
      return { correct: false, explanation: '', outcome: 'chosen' };
    }
    if (a.type !== 'submit') return IGNORED;
    if (s.chosen.length !== q.slots.length || s.chosen.some((c) => c === null)) {
      return { correct: false, explanation: INCOMPLETE_TEXT, outcome: 'incomplete' };
    }
    const perBlank = q.slots.map((slot, i) => s.chosen[i] === slot.answer);
    const correct = perBlank.every(Boolean);
    if (correct) s.correct += 1;
    s.answeredIds.push(q.item.id);
    s.index += 1;
    s.chosen = s.questions[s.index]?.slots.map(() => null) ?? [];
    return { correct, explanation: q.item.explanation, outcome: 'graded', perBlank };
  },
  isDone(s) {
    return s.index >= s.questions.length;
  },
  result(s): MinigameResult {
    return { kind: 'blank', success: s.questions.length > 0 && s.correct >= s.passCount, correct: s.correct, total: s.questions.length, answeredIds: [...s.answeredIds] };
  },
};
