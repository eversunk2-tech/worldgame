// OX quiz session: seeded item selection, scoring, pass check.
import type { MinigameResult, QuizItem } from '../../types';
import { mulberry32 } from '../../rng';
import { wrongSpec, type ActFeedback, type QuizLikeLogic, type QuizSpec } from './types';

export type OxItem = Extract<QuizItem, { kind: 'ox' }>;

export interface OxState {
  spec: QuizSpec;
  items: OxItem[];
  index: number;
  correct: number;
  answeredIds: string[];
  passCount: number;
}

export function selectOxItems(spec: QuizSpec, pool: readonly QuizItem[], seed: number): OxItem[] {
  const rng = mulberry32(seed);
  const filtered = pool.filter(
    (q): q is OxItem => q.kind === 'ox' && q.cityId === spec.cityId && (!spec.topics || spec.topics.includes(q.topic)),
  );
  return rng.shuffle(filtered).slice(0, spec.count);
}

export const oxLogic: QuizLikeLogic<OxState> = {
  kind: 'ox',
  create(spec, pool, seed) {
    if (spec.kind !== 'ox') throw wrongSpec('ox', spec);
    const items = selectOxItems(spec, pool.quiz, seed);
    return { spec, items, index: 0, correct: 0, answeredIds: [], passCount: Math.min(spec.passCount, items.length) };
  },
  current(s) {
    return s.items[s.index] ?? null;
  },
  act(s, choice): ActFeedback {
    const item = s.items[s.index];
    if (!item) return { correct: false, explanation: '' };
    const correct = typeof choice === 'boolean' && choice === item.answer;
    if (correct) s.correct += 1;
    s.answeredIds.push(item.id);
    s.index += 1;
    return { correct, explanation: item.explanation };
  },
  isDone(s) {
    return s.index >= s.items.length;
  },
  result(s): MinigameResult {
    return { kind: 'ox', success: s.items.length > 0 && s.correct >= s.passCount, correct: s.correct, total: s.items.length, answeredIds: [...s.answeredIds] };
  },
};
