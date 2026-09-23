// Player melee attack (front arc), damage to player, HP/death handling.
import type { GameState, SimEvent, SimSystem } from '../types';
import { getMonsterDef } from '../data/monsters';
import {
  ATTACK_ANIM_TIME, ATTACK_ARC, ATTACK_COOLDOWN, ATTACK_RANGE, HIT_FLASH_TIME, INVULN_TIME, RESPAWN_TIME,
} from '../constants';
import { distXZ, wrapAngle } from '../vec';

/** Apply damage to the player. Ignored while invulnerable. Exported for monsterSim. */
export function applyDamageToPlayer(state: GameState, amount: number, by: string, events: SimEvent[]): void {
  const p = state.player;
  if (!p.alive || p.invulnTimer > 0) return;
  p.hp -= amount;
  p.invulnTimer = INVULN_TIME;
  events.push({ type: 'player:damaged', amount, by });
  if (p.hp <= 0) {
    p.hp = 0;
    p.alive = false;
    p.respawnTimer = RESPAWN_TIME;
    p.vel.x = 0; p.vel.y = 0; p.vel.z = 0;
    events.push({ type: 'player:died' });
  }
}

export function playerAttack(state: GameState, events: SimEvent[]): void {
  const p = state.player;
  p.attackCooldown = ATTACK_COOLDOWN;
  p.attackAnim = ATTACK_ANIM_TIME;

  for (const m of state.monsters) {
    if (m.ai === 'dead') continue;
    if (distXZ(p.pos, m.pos) > ATTACK_RANGE) continue;
    const angleTo = Math.atan2(m.pos.x - p.pos.x, m.pos.z - p.pos.z);
    if (Math.abs(wrapAngle(angleTo - p.yaw)) > ATTACK_ARC / 2) continue;

    m.hp -= p.atk;
    m.hitFlash = HIT_FLASH_TIME;
    events.push({ type: 'monster:damaged', id: m.id, amount: p.atk });
    if (m.hp <= 0) {
      const def = getMonsterDef(m.typeId);
      m.hp = 0;
      m.ai = 'dead';
      m.respawnTimer = def.respawnTime;
      events.push({ type: 'monster:killed', id: m.id, typeId: m.typeId });
      events.push({ type: 'player:xp', amount: def.xpReward });
    }
  }
}

export const combatSim: SimSystem = (state, cmd, _dt, events) => {
  const p = state.player;
  if (cmd.attack && p.alive && p.attackCooldown <= 0) playerAttack(state, events);
};
