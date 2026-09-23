// kind → logic factory. Add a new minigame here (plus a scene in client/scenes/minigames/MinigameHost.ts).
import type { MinigameKind } from '../../types';
import type { MinigameLogic } from './types';
import { quizLogic } from './quiz';
import { oxLogic } from './ox';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MINIGAME_LOGIC: Record<MinigameKind, MinigameLogic<any>> = {
  quiz: quizLogic,
  ox: oxLogic,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMinigameLogic(kind: MinigameKind): MinigameLogic<any> {
  const logic = MINIGAME_LOGIC[kind];
  if (!logic) throw new Error(`Unknown minigame kind: ${kind}`);
  return logic;
}
