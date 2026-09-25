// Ordering (spec 7.3): each question starts from a seeded shuffle that is never already correct. swap/move only
// rearrange; submit grades. A wrong submit reports how many cards sit in place; after `triesPerQuestion` wrong
// submits the answer is revealed and the game moves on. correct = questions solved.
import type { MinigameResult, OrderItem } from '../../types';
import { mulberry32, type Rng } from '../../rng';
import { wrongSpec, type ActFeedback, type MinigameLogic, type OrderSpec } from './types';

export interface OrderQuestion {
  item: OrderItem;
  /** arrangement[pos] = index into item.items shown at position `pos` */
  arrangement: number[];
  /** wrong submissions so far */
  tries: number;
  solved: boolean;
  revealed: boolean;
}

export interface OrderState {
  spec: OrderSpec;
  questions: OrderQuestion[];
  index: number;
  passCount: number;
}

export type OrderAction = { type: 'swap'; a: number; b: number } | { type: 'move'; from: number; to: number } | { type: 'submit' };
export type OrderOutcome = 'ignored' | 'moved' | 'solved' | 'retry' | 'revealed';
export interface OrderFeedback extends ActFeedback {
  outcome: OrderOutcome;
  /** after a submit: whether each position held the right card */
  placed?: boolean[];
}

export interface OrderLogic extends MinigameLogic<OrderState, OrderAction> {
  act(s: OrderState, a: OrderAction): OrderFeedback;
  current(s: OrderState): OrderQuestion | null;
}

/** Item indices in answer order (value ascending or descending). */
export function correctArrangement(item: OrderItem): number[] {
  const idx = item.items.map((_, i) => i);
  const sign = item.direction === 'asc' ? 1 : -1;
  return idx.sort((a, b) => sign * (item.items[a]!.value - item.items[b]!.value));
}

export function placedFlags(arrangement: readonly number[], answer: readonly number[]): boolean[] {
  return arrangement.map((v, i) => v === answer[i]);
}

const same = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Seeded start order that differs from the answer (rotate as a last resort). */
function startArrangement(item: OrderItem, rng: Rng): number[] {
  const answer = correctArrangement(item);
  let arr = rng.shuffle(answer);
  for (let i = 0; i < 20 && same(arr, answer); i++) arr = rng.shuffle(answer);
  if (same(arr, answer) && arr.length > 1) arr = [...arr.slice(1), arr[0]!];
  return arr;
}

const IGNORED: OrderFeedback = { correct: false, explanation: '', outcome: 'ignored' };
const validPos = (q: OrderQuestion, p: number) => Number.isInteger(p) && p >= 0 && p < q.arrangement.length;

export const orderLogic: OrderLogic = {
  kind: 'order',
  create(spec, pool, seed) {
    if (spec.kind !== 'order') throw wrongSpec('order', spec);
    const rng = mulberry32(seed);
    const items = rng.shuffle(pool.orders.filter((o) => o.cityId === spec.cityId)).slice(0, spec.count);
    const questions = items.map((item): OrderQuestion => ({ item, arrangement: startArrangement(item, rng), tries: 0, solved: false, revealed: false }));
    return { spec, questions, index: 0, passCount: Math.min(spec.passCount, questions.length) };
  },
  current(s) {
    return s.questions[s.index] ?? null;
  },
  act(s, a): OrderFeedback {
    const q = s.questions[s.index];
    if (!q || !a) return IGNORED;
    switch (a.type) {
      case 'swap': {
        if (!validPos(q, a.a) || !validPos(q, a.b) || a.a === a.b) return IGNORED;
        const t = q.arrangement[a.a]!;
        q.arrangement[a.a] = q.arrangement[a.b]!;
        q.arrangement[a.b] = t;
        return { correct: false, explanation: '', outcome: 'moved' };
      }
      case 'move': {
        if (!validPos(q, a.from) || !validPos(q, a.to) || a.from === a.to) return IGNORED;
        const [v] = q.arrangement.splice(a.from, 1);
        q.arrangement.splice(a.to, 0, v!);
        return { correct: false, explanation: '', outcome: 'moved' };
      }
      case 'submit': {
        const answer = correctArrangement(q.item);
        const placed = placedFlags(q.arrangement, answer);
        if (placed.every(Boolean)) {
          q.solved = true;
          s.index += 1;
          return { correct: true, explanation: q.item.explanation, outcome: 'solved', placed };
        }
        q.tries += 1;
        const hint = `${placed.filter(Boolean).length}개가 제자리에 있어요`;
        if (q.tries >= s.spec.triesPerQuestion) {
          q.revealed = true;
          q.arrangement = answer;
          s.index += 1;
          return { correct: false, explanation: `${hint}. 정답 순서를 볼까요? ${q.item.explanation}`, outcome: 'revealed', placed };
        }
        return { correct: false, explanation: hint, outcome: 'retry', placed };
      }
      default:
        return IGNORED;
    }
  },
  isDone(s) {
    return s.index >= s.questions.length;
  },
  result(s): MinigameResult {
    const solved = s.questions.filter((q) => q.solved).length;
    return {
      kind: 'order', success: s.questions.length > 0 && solved >= s.passCount, correct: solved, total: s.questions.length,
      answeredIds: s.questions.filter((q) => q.solved || q.revealed).map((q) => q.item.id),
    };
  },
};
