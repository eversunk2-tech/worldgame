// 4-choice quiz session: seeded item + choice shuffle, scoring, pass check.
import type { MinigameResult, QuizItem } from '../../types';
import { mulberry32, type Rng } from '../../rng';
import { wrongSpec, type ActFeedback, type QuizLikeLogic, type QuizSpec } from './types';

export type ChoiceItem = Extract<QuizItem, { kind: 'choice' }>;

export interface QuizState {
  spec: QuizSpec;
  items: ChoiceItem[];      // choices already shuffled, `answer` re-pointed
  index: number;
  correct: number;
  answeredIds: string[];
  passCount: number;
}

function shuffleChoices(item: ChoiceItem, rng: Rng): ChoiceItem {
  const order = rng.shuffle([0, 1, 2, 3] as const);
  const choices = order.map((i) => item.choices[i]) as [string, string, string, string];
  const answer = order.indexOf(item.answer) as 0 | 1 | 2 | 3;
  return { ...item, choices, answer };
}

export function selectChoiceItems(spec: QuizSpec, pool: readonly QuizItem[], seed: number): ChoiceItem[] {
  const rng = mulberry32(seed);
  const filtered = pool.filter(
    (q): q is ChoiceItem => q.kind === 'choice' && q.cityId === spec.cityId && (!spec.topics || spec.topics.includes(q.topic)),
  );
  return rng.shuffle(filtered).slice(0, spec.count).map((q) => shuffleChoices(q, rng));
}

export const quizLogic: QuizLikeLogic<QuizState> = {
  kind: 'quiz',
  create(spec, pool, seed) {
    if (spec.kind !== 'quiz') throw wrongSpec('quiz', spec);
    const items = selectChoiceItems(spec, pool.quiz, seed);
    return { spec, items, index: 0, correct: 0, answeredIds: [], passCount: Math.min(spec.passCount, items.length) };
  },
  current(s) {
    return s.items[s.index] ?? null;
  },
  act(s, choice): ActFeedback {
    const item = s.items[s.index];
    if (!item) return { correct: false, explanation: '' };
    const correct = typeof choice === 'number' && choice === item.answer;
    if (correct) s.correct += 1;
    s.answeredIds.push(item.id);
    s.index += 1;
    return { correct, explanation: item.explanation };
  },
  isDone(s) {
    return s.index >= s.items.length;
  },
  result(s): MinigameResult {
    return { kind: 'quiz', success: s.items.length > 0 && s.correct >= s.passCount, correct: s.correct, total: s.items.length, answeredIds: [...s.answeredIds] };
  },
};
