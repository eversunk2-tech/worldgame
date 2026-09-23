// Mission state transitions and NPC interaction decision (spec 6.3). Inherits the 4-step logic from the 3D questSim.
import type { CityId, MinigameResult, MinigameSpec, MissionDef, NpcDef, Progress } from '../types';
import { ALL_MISSIONS, getMission } from '../content';
import type { ProgressEvent } from './events';
import { earnPoints } from './points';

export type NpcAction =
  | { kind: 'showCard'; cardId: string }
  | { kind: 'turnIn'; missionId: string }
  | { kind: 'startMinigame'; missionId: string; spec: MinigameSpec }
  | { kind: 'progress'; missionId: string; text: string }
  | { kind: 'accept'; missionId: string }
  | { kind: 'talk'; text: string };

/** Decide what talking to `npc` does, without changing progress. */
export function decideNpcInteraction(progress: Progress, npc: NpcDef, _cityId: CityId): NpcAction {
  if (npc.role === 'guide' && npc.cardId && !progress.readCards.includes(npc.cardId)) {
    return { kind: 'showCard', cardId: npc.cardId };
  }
  const defs = npc.missionIds.map(getMission).filter((m): m is MissionDef => m !== undefined);
  const statusOf = (m: MissionDef) => progress.missions[m.id]?.status;

  const completed = defs.find((m) => statusOf(m) === 'completed');
  if (completed) return { kind: 'turnIn', missionId: completed.id };

  const active = defs.find((m) => statusOf(m) === 'active');
  if (active) {
    if (active.objective.type === 'minigame') return { kind: 'startMinigame', missionId: active.id, spec: active.objective.spec };
    const prog = progress.missions[active.id]!;
    return { kind: 'progress', missionId: active.id, text: `${active.progressText} (${prog.count}/${active.objective.count})` };
  }

  const available = defs.find((m) => statusOf(m) === 'available');
  if (available) return { kind: 'accept', missionId: available.id };

  return { kind: 'talk', text: npc.idleText };
}

export function unlockDependents(progress: Progress, turnedInId: string, events: ProgressEvent[]): void {
  for (const m of ALL_MISSIONS) {
    if (m.prerequisiteMissionId !== turnedInId) continue;
    const prog = progress.missions[m.id];
    if (prog && prog.status === 'locked') {
      prog.status = 'available';
      events.push({ type: 'mission.changed', missionId: m.id, status: 'available', count: prog.count });
    }
  }
}

export function acceptMission(progress: Progress, missionId: string, events: ProgressEvent[]): boolean {
  const def = getMission(missionId);
  const prog = progress.missions[missionId];
  if (!def || !prog) { events.push({ type: 'rejected', action: 'mission.accept', reason: '없는 미션' }); return false; }
  if (prog.status !== 'available') { events.push({ type: 'rejected', action: 'mission.accept', reason: `수락 불가 상태(${prog.status})` }); return false; }
  prog.status = 'active';
  prog.count = 0;
  events.push({ type: 'mission.changed', missionId, status: 'active', count: 0 });
  return true;
}

function completeAndReward(progress: Progress, def: MissionDef, events: ProgressEvent[]): void {
  const prog = progress.missions[def.id]!;
  prog.status = 'turnedIn';
  events.push({ type: 'mission.changed', missionId: def.id, status: 'turnedIn', count: prog.count });
  earnPoints(progress, def.rewardPoints, `mission:${def.id}`, events);
  unlockDependents(progress, def.id, events);
}

export function turnInMission(progress: Progress, missionId: string, events: ProgressEvent[]): boolean {
  const def = getMission(missionId);
  const prog = progress.missions[missionId];
  if (!def || !prog) { events.push({ type: 'rejected', action: 'mission.turnIn', reason: '없는 미션' }); return false; }
  if (prog.status !== 'completed') { events.push({ type: 'rejected', action: 'mission.turnIn', reason: `보고 불가 상태(${prog.status})` }); return false; }
  completeAndReward(progress, def, events);
  return true;
}

export function applyMinigameResult(progress: Progress, missionId: string, result: MinigameResult, events: ProgressEvent[]): boolean {
  const def = getMission(missionId);
  const prog = progress.missions[missionId];
  if (!def || !prog) { events.push({ type: 'rejected', action: 'mission.minigameResult', reason: '없는 미션' }); return false; }
  if (def.objective.type !== 'minigame') { events.push({ type: 'rejected', action: 'mission.minigameResult', reason: '미니게임 미션이 아님' }); return false; }
  if (prog.status !== 'active') { events.push({ type: 'rejected', action: 'mission.minigameResult', reason: `진행 중이 아님(${prog.status})` }); return false; }
  if (result.kind !== def.objective.spec.kind) { events.push({ type: 'rejected', action: 'mission.minigameResult', reason: '미니게임 종류 불일치' }); return false; }

  progress.stats.quizAnswered += Math.max(0, result.total);
  progress.stats.quizCorrect += Math.max(0, Math.min(result.correct, result.total));
  prog.attempts += 1;
  if (result.success) {
    prog.count = result.correct;
    completeAndReward(progress, def, events);
  } else {
    events.push({ type: 'mission.changed', missionId, status: 'active', count: prog.count });
  }
  return true;
}

/** Count a defeat toward every active defeat mission targeting `monsterId`. */
export function countDefeat(progress: Progress, monsterId: string, events: ProgressEvent[]): void {
  for (const m of ALL_MISSIONS) {
    if (m.objective.type !== 'defeat' || m.objective.monsterId !== monsterId) continue;
    const prog = progress.missions[m.id];
    if (!prog || prog.status !== 'active') continue;
    if (prog.count >= m.objective.count) continue;
    prog.count += 1;
    if (prog.count >= m.objective.count) {
      prog.status = 'completed';
      events.push({ type: 'mission.changed', missionId: m.id, status: 'completed', count: prog.count });
    } else {
      events.push({ type: 'mission.changed', missionId: m.id, status: 'active', count: prog.count });
    }
  }
}

export function missionsTurnedIn(progress: Progress, ids: readonly string[]): boolean {
  return ids.every((id) => progress.missions[id]?.status === 'turnedIn');
}
