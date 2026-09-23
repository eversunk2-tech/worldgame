// Monster FSM: idle / chase / attack / dead, leash return, respawn.
import type { MonsterState, SimSystem } from '../types';
import { MAP, ALL_WALL_AABBS } from '../data/map';
import { getMonsterDef } from '../data/monsters';
import { MONSTER_ATTACK_LEAVE_FACTOR } from '../constants';
import { clampToBounds, resolveCircleVsAABBs } from './collision';
import { dist, distXZ, set } from '../vec';
import { applyDamageToPlayer } from './combatSim';
import { getTargetPlayer } from './createState';

function monsterRadius(m: MonsterState): number {
  const s = getMonsterDef(m.typeId).size;
  return Math.max(s.x, s.z) / 2;
}

/** Move toward target on XZ (never through walls; platforms are always walls for monsters). */
function moveToward(m: MonsterState, tx: number, tz: number, speed: number, dt: number): void {
  const dx = tx - m.pos.x;
  const dz = tz - m.pos.z;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1e-6) return;
  const step = Math.min(speed * dt, d);
  m.pos.x += (dx / d) * step;
  m.pos.z += (dz / d) * step;
  m.yaw = Math.atan2(dx, dz);
  resolveCircleVsAABBs(m.pos, monsterRadius(m), ALL_WALL_AABBS);
  clampToBounds(m.pos, MAP.bounds);
  m.pos.y = 0;
}

export const monsterSim: SimSystem = (state, _cmd, dt, events) => {
  const player = getTargetPlayer(state);

  for (const m of state.monsters) {
    const def = getMonsterDef(m.typeId);
    if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt);
    if (m.attackCooldown > 0) m.attackCooldown = Math.max(0, m.attackCooldown - dt);

    if (m.ai === 'dead') {
      m.respawnTimer -= dt;
      if (m.respawnTimer <= 0) {
        m.respawnTimer = 0;
        set(m.pos, m.spawnPos);
        m.hp = m.maxHp;
        m.ai = 'idle';
        m.attackCooldown = 0;
      }
      continue;
    }

    // Player dead → everyone walks home (no aggro while dead).
    if (!player.alive) {
      if (m.ai === 'chase' || m.ai === 'attack') m.ai = 'return';
      if (m.ai === 'return') returnHome(m, def.speed, dt);
      continue;
    }

    const dXZ = distXZ(player.pos, m.pos);
    const d3 = dist(player.pos, m.pos);

    switch (m.ai) {
      case 'idle': {
        if (dXZ < def.aggroRange) m.ai = 'chase';
        break;
      }
      case 'return': {
        // Ignore the player until home; heal + idle on arrival (handled in returnHome).
        returnHome(m, def.speed, dt);
        break;
      }
      case 'chase': {
        // Leash: too far from spawn → walk home (aggro ignored until arrival)
        if (distXZ(m.pos, m.spawnPos) > def.leashRange) {
          m.ai = 'return';
          break;
        }
        if (d3 <= def.attackRange) {
          m.ai = 'attack';
          break;
        }
        moveToward(m, player.pos.x, player.pos.z, def.speed, dt);
        break;
      }
      case 'attack': {
        m.yaw = Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
        if (d3 > def.attackRange * MONSTER_ATTACK_LEAVE_FACTOR) {
          m.ai = 'chase';
          break;
        }
        if (m.attackCooldown <= 0) {
          applyDamageToPlayer(state, def.atk, m.id, events);
          m.attackCooldown = def.attackInterval;
        }
        break;
      }
    }
  }
};

/** Walk back to spawn; on arrival heal fully (once) and become idle. */
function returnHome(m: MonsterState, speed: number, dt: number): void {
  const d = distXZ(m.pos, m.spawnPos);
  if (d > 0.2) {
    moveToward(m, m.spawnPos.x, m.spawnPos.z, speed, dt);
    return;
  }
  m.hp = m.maxHp;
  m.ai = 'idle';
}
