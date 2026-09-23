// NPC interaction (accept / progress / turn-in), kill counting, reach-point checks.
import type { GameState, NPCDef, QuestDef, SimEvent, SimSystem } from '../types';
import { MAP } from '../data/map';
import { NPCS } from '../data/npcs';
import { QUESTS, getQuestDef } from '../data/quests';
import { NPC_INTERACT_RANGE } from '../constants';
import { dist, distXZ } from '../vec';

/** Nearest NPC within interact range of the player (XZ), or undefined. */
export function findNearbyNpc(state: GameState): NPCDef | undefined {
  const p = state.player;
  let best: NPCDef | undefined;
  let bestD = NPC_INTERACT_RANGE;
  for (const npc of NPCS) {
    const d = distXZ(p.pos, npc.pos);
    if (d <= bestD) { bestD = d; best = npc; }
  }
  return best;
}

function unlockDependents(state: GameState, turnedInId: string, events: SimEvent[]): void {
  for (const q of QUESTS) {
    if (q.prerequisiteQuestId !== turnedInId) continue;
    const prog = state.quests[q.id];
    if (prog && prog.status === 'locked') {
      prog.status = 'available';
      events.push({ type: 'ui:message', text: `새 미션 해금: ${q.title}` });
    }
  }
}

function interactWithNpc(state: GameState, npc: NPCDef, events: SimEvent[]): void {
  const defs = npc.questIds.map(getQuestDef).filter((q): q is QuestDef => q !== undefined);
  const progOf = (q: QuestDef) => state.quests[q.id];

  // 1. turn in a completed quest
  const completed = defs.find((q) => progOf(q)?.status === 'completed');
  if (completed) {
    const prog = progOf(completed)!;
    prog.status = 'turnedIn';
    events.push({ type: 'quest:turnedIn', questId: completed.id });
    events.push({ type: 'player:xp', amount: completed.rewardXp });
    events.push({ type: 'npc:talk', npcId: npc.id, text: completed.completeText });
    unlockDependents(state, completed.id, events);
    return;
  }
  // 2. progress report
  const active = defs.find((q) => progOf(q)?.status === 'active');
  if (active) {
    const prog = progOf(active)!;
    const suffix = active.objective.type === 'kill' ? ` (${prog.count}/${active.objective.count})` : '';
    events.push({ type: 'npc:talk', npcId: npc.id, text: active.progressText + suffix });
    return;
  }
  // 3. accept
  const available = defs.find((q) => progOf(q)?.status === 'available');
  if (available) {
    const prog = progOf(available)!;
    prog.status = 'active';
    prog.count = 0;
    events.push({ type: 'quest:accepted', questId: available.id });
    events.push({ type: 'npc:talk', npcId: npc.id, text: available.acceptText });
    return;
  }
  // 4. nothing
  events.push({ type: 'npc:talk', npcId: npc.id, text: '오늘은 부탁할 게 없네.' });
}

export const questSim: SimSystem = (state, cmd, _dt, events) => {
  const p = state.player;

  // kill objectives: read monster:killed events pushed earlier this tick by combatSim
  const kills = events.filter((e) => e.type === 'monster:killed');
  if (kills.length > 0) {
    for (const q of QUESTS) {
      if (q.objective.type !== 'kill') continue;
      const prog = state.quests[q.id];
      if (!prog || prog.status !== 'active') continue;
      const need = q.objective.count;
      for (const k of kills) {
        if (k.type !== 'monster:killed' || k.typeId !== q.objective.monsterTypeId) continue;
        if (prog.count >= need) break;
        prog.count++;
        events.push({ type: 'quest:progress', questId: q.id });
        if (prog.count >= need) {
          prog.status = 'completed';
          events.push({ type: 'quest:completed', questId: q.id });
        }
      }
    }
  }

  // reach objectives: 3D distance, only while active (checked every tick)
  if (p.alive) {
    for (const q of QUESTS) {
      const obj = q.objective;
      if (obj.type !== 'reach') continue;
      const prog = state.quests[q.id];
      if (!prog || prog.status !== 'active') continue;
      const rp = MAP.reachPoints.find((r) => r.id === obj.reachPointId);
      if (!rp) continue;
      if (dist(p.pos, rp.pos) <= rp.radius) {
        prog.status = 'completed';
        prog.count = 1;
        events.push({ type: 'quest:completed', questId: q.id });
      }
    }
  }

  // NPC interaction
  if (cmd.interact && p.alive) {
    const npc = findNearbyNpc(state);
    if (npc) interactWithNpc(state, npc, events);
  }
};
