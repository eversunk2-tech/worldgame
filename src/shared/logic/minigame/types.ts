// Plugin interface every minigame logic implements (spec 7.0). State is plain JSON and changed in place by `act`;
// every random choice comes from mulberry32(seed), so a server can replay a session from (spec, seed, actions).
import type { ContentPool, MinigameKind, MinigameResult, MinigameSpec, QuizItem } from '../../types';

export type { ContentPool, MinigameKind, MinigameResult, MinigameSpec } from '../../types';

export interface ActFeedback { correct: boolean; explanation: string }

export interface MinigameLogic<S, A> {
  kind: MinigameKind;
  /** Pick items with the seeded rng and build the session state. */
  create(spec: MinigameSpec, pool: ContentPool, seed: number): S;
  /** Apply one player action to `s` (in place) and describe the outcome. Invalid actions change nothing. */
  act(s: S, action: A): ActFeedback;
  isDone(s: S): boolean;
  result(s: S): MinigameResult;
}

/** 4-choice / OX: one answer per item, `current` is the item being asked. */
export interface QuizLikeLogic<S> extends MinigameLogic<S, number | boolean> {
  current(s: S): QuizItem | null;
}

export type QuizSpec = Extract<MinigameSpec, { kind: 'quiz' | 'ox' }>;
export type MatchSpec = Extract<MinigameSpec, { kind: 'match' }>;
export type MapFindSpec = Extract<MinigameSpec, { kind: 'mapfind' }>;
export type OrderSpec = Extract<MinigameSpec, { kind: 'order' }>;
export type BlankSpec = Extract<MinigameSpec, { kind: 'blank' }>;

/** A pool with only the given parts (tests, tools). */
export function makePool(parts: Partial<ContentPool> = {}): ContentPool {
  return { quiz: parts.quiz ?? [], pairs: parts.pairs ?? [], mapTargets: parts.mapTargets ?? [], orders: parts.orders ?? [], blanks: parts.blanks ?? [] };
}

/** Programming-error guard: a logic was handed another game's spec. */
export function wrongSpec(logic: MinigameKind, spec: MinigameSpec): Error {
  return new Error(`${logic} logic cannot run a '${spec.kind}' spec`);
}
