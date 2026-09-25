// kind → logic. Add a new minigame here (plus a scene in client/scenes/minigames/MinigameHost.ts → MINIGAME_SCENE).
import type { MinigameKind } from '../../types';
import type { MinigameLogic } from './types';
import { quizLogic } from './quiz';
import { oxLogic } from './ox';
import { matchLogic } from './match';
import { mapfindLogic } from './mapfind';
import { orderLogic } from './order';
import { blankLogic } from './blank';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MINIGAME_LOGIC: Record<MinigameKind, MinigameLogic<any, any>> = {
  quiz: quizLogic,
  ox: oxLogic,
  match: matchLogic,
  mapfind: mapfindLogic,
  order: orderLogic,
  blank: blankLogic,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMinigameLogic(kind: MinigameKind): MinigameLogic<any, any> {
  const logic = MINIGAME_LOGIC[kind];
  if (!logic) throw new Error(`Unknown minigame kind: ${kind}`);
  return logic;
}
