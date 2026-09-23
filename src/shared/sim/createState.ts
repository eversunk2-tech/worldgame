// Initial GameState: player at spawn, monsters placed deterministically in spawn zones, quest table.
import type { GameState, MonsterState, PlayerState, QuestProgress } from '../types';
import { MAP } from '../data/map';
import { getMonsterDef } from '../data/monsters';
import { QUESTS } from '../data/quests';
import { statsForLevel } from '../data/levels';
import { clone } from '../vec';

export function createPlayer(): PlayerState {
  const stats = statsForLevel(1);
  return {
    id: 'p1',
    pos: clone(MAP.playerSpawn), vel: { x: 0, y: 0, z: 0 }, yaw: 0,
    onGround: false,
    hp: stats.maxHp, maxHp: stats.maxHp, atk: stats.atk,
    level: 1, xp: 0,
    alive: true, respawnTimer: 0,
    attackCooldown: 0, attackAnim: 0,
    invulnTimer: 0,
  };
}

/**
 * Monsters are spread evenly on a ring inside each spawn zone (deterministic —
 * no random calls in shared code so server/client produce the same layout).
 */
export function createMonsters(): MonsterState[] {
  const list: MonsterState[] = [];
  let seq = 0;
  for (const zone of MAP.monsterSpawns) {
    const def = getMonsterDef(zone.typeId);
    for (let i = 0; i < zone.count; i++) {
      const angle = (i / zone.count) * Math.PI * 2;
      const radius = zone.radius * 0.6;
      const spawnPos = {
        x: zone.center.x + Math.cos(angle) * radius,
        y: 0,
        z: zone.center.z + Math.sin(angle) * radius,
      };
      list.push({
        id: `m${seq++}_${zone.typeId}`, typeId: zone.typeId,
        pos: clone(spawnPos), yaw: 0, spawnPos,
        hp: def.maxHp, maxHp: def.maxHp,
        ai: 'idle',
        attackCooldown: 0, respawnTimer: 0, hitFlash: 0,
      });
    }
  }
  return list;
}

export function createQuestTable(): Record<string, QuestProgress> {
  const table: Record<string, QuestProgress> = {};
  for (const q of QUESTS) {
    table[q.id] = { questId: q.id, status: q.prerequisiteQuestId ? 'locked' : 'available', count: 0 };
  }
  return table;
}

export function createState(): GameState {
  return {
    tick: 0, time: 0,
    player: createPlayer(),
    monsters: createMonsters(),
    quests: createQuestTable(),
  };
}

/** Single access point for "the player a monster targets" — swap for a lookup when players become many. */
export function getTargetPlayer(state: GameState): PlayerState {
  return state.player;
}
