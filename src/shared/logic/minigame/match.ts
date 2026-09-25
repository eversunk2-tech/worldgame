// Memory match (spec 7.1): N seeded pairs → 2N shuffled cards. Flip two; same pair → matched, otherwise the scene
// sends `hide` after a short delay. Done when every pair is matched or the attempt limit is used up.
import type { MatchPair, MinigameResult } from '../../types';
import { mulberry32 } from '../../rng';
import { wrongSpec, type ActFeedback, type MatchSpec, type MinigameLogic } from './types';

export interface MatchCard { pairId: string; side: 'left' | 'right'; text: string }

export interface MatchState {
  spec: MatchSpec;
  /** the N pairs in play (N = spec.pairs, or fewer when the pool is short) */
  pairs: MatchPair[];
  cards: MatchCard[];
  /** indices of face-up, unmatched cards (0–2) */
  faceUp: number[];
  matched: boolean[];
  /** one attempt = one pair of cards turned over */
  attempts: number;
  /** pair ids in the order they were matched */
  matchedIds: string[];
  done: boolean;
}

export type MatchAction = { type: 'flip'; index: number } | { type: 'hide' };
export type MatchOutcome = 'ignored' | 'flipped' | 'match' | 'mismatch' | 'hidden';
export interface MatchFeedback extends ActFeedback { outcome: MatchOutcome }

const IGNORED: MatchFeedback = { correct: false, explanation: '', outcome: 'ignored' };

/** 3★ within N+2 attempts, 2★ within 2N, otherwise 1★ (spec 7.1). */
export function matchStars(attempts: number, pairs: number): 1 | 2 | 3 {
  if (attempts <= pairs + 2) return 3;
  if (attempts <= pairs * 2) return 2;
  return 1;
}

function allMatched(s: MatchState): boolean {
  return s.cards.length > 0 && s.matched.every(Boolean);
}

export interface MatchLogic extends MinigameLogic<MatchState, MatchAction> {
  act(s: MatchState, a: MatchAction): MatchFeedback;
}

export const matchLogic: MatchLogic = {
  kind: 'match',
  create(spec, pool, seed) {
    if (spec.kind !== 'match') throw wrongSpec('match', spec);
    const rng = mulberry32(seed);
    const pairs = rng.shuffle(pool.pairs.filter((p) => p.cityId === spec.cityId)).slice(0, spec.pairs);
    const cards = rng.shuffle(
      pairs.flatMap((p): MatchCard[] => [
        { pairId: p.id, side: 'left', text: p.left },
        { pairId: p.id, side: 'right', text: p.right },
      ]),
    );
    return { spec, pairs, cards, faceUp: [], matched: cards.map(() => false), attempts: 0, matchedIds: [], done: cards.length === 0 };
  },
  act(s, a): MatchFeedback {
    if (a.type === 'hide') {
      if (s.faceUp.length === 0) return IGNORED;
      s.faceUp = [];
      return { correct: false, explanation: '', outcome: 'hidden' };
    }
    const i = a.index;
    if (s.done || !Number.isInteger(i) || i < 0 || i >= s.cards.length) return IGNORED;
    if (s.matched[i] || s.faceUp.includes(i) || s.faceUp.length >= 2) return IGNORED;
    s.faceUp.push(i);
    if (s.faceUp.length < 2) return { correct: false, explanation: '', outcome: 'flipped' };

    s.attempts += 1;
    const [a0, b0] = s.faceUp as [number, number];
    const ca = s.cards[a0]!;
    const cb = s.cards[b0]!;
    if (ca.pairId === cb.pairId) {
      s.matched[a0] = true;
      s.matched[b0] = true;
      s.faceUp = [];
      s.matchedIds.push(ca.pairId);
      s.done = allMatched(s) || s.attempts >= s.spec.maxAttempts;
      const pair = s.pairs.find((p) => p.id === ca.pairId);
      return { correct: true, explanation: pair ? `${pair.left} — ${pair.right}` : '', outcome: 'match' };
    }
    s.done = s.attempts >= s.spec.maxAttempts;
    return { correct: false, explanation: '다시 기억해 봐요', outcome: 'mismatch' };
  },
  isDone(s) {
    return s.done || allMatched(s) || s.attempts >= s.spec.maxAttempts;
  },
  result(s): MinigameResult {
    const total = s.pairs.length;
    const success = allMatched(s);
    const r: MinigameResult = { kind: 'match', success, correct: s.matchedIds.length, total, answeredIds: [...s.matchedIds] };
    if (success) r.stars = matchStars(s.attempts, total);
    return r;
  },
};
