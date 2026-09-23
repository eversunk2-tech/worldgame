// Plugin interface every minigame logic implements (spec 6.3).
import type { MinigameKind, MinigameResult, MinigameSpec, QuizItem } from '../../types';

export type { MinigameKind, MinigameResult, MinigameSpec } from '../../types';

export interface AnswerFeedback { correct: boolean; explanation: string }

export interface MinigameLogic<S> {
  kind: MinigameKind;
  /** Pick items with the seeded rng and build the session state. */
  create(spec: MinigameSpec, pool: QuizItem[], seed: number): S;
  /** Current item, or null when the session is over. */
  current(s: S): QuizItem | null;
  answer(s: S, choice: number | boolean): AnswerFeedback;
  isDone(s: S): boolean;
  /** success = correct >= passCount */
  result(s: S): MinigameResult;
}
