// Position-agnostic combat rules (spec 6.5). Entities keep the numbers; these functions only compute.
import { INVULN_TIME } from '../constants';

export interface PlayerDamageResult { hp: number; invulnLeft: number; applied: boolean }

/** Damage the player unless invulnerable. Returns the new hp/invuln; `applied=false` means ignored. */
export function damagePlayer(hp: number, invulnLeft: number, amount: number): PlayerDamageResult {
  if (hp <= 0 || invulnLeft > 0 || amount <= 0) return { hp, invulnLeft, applied: false };
  const next = Math.max(0, hp - amount);
  return { hp: next, invulnLeft: INVULN_TIME, applied: true };
}

export interface MonsterHitResult { hp: number; dead: boolean }

export function hitMonster(hp: number, atk: number): MonsterHitResult {
  if (hp <= 0) return { hp: 0, dead: true };
  const next = Math.max(0, hp - Math.max(0, atk));
  return { hp: next, dead: next <= 0 };
}

export type MonsterAiState = 'idle' | 'chase' | 'attack' | 'return' | 'dead';

export interface MonsterDecideInput {
  state: MonsterAiState;
  distToPlayer: number;
  distToSpawn: number;
  playerAlive: boolean;
  aggroRange: number;
  attackRange: number;
  leashRange: number;
  /** seconds spent in chase without meaningful movement */
  stuckTime: number;
  stuckLimit: number;
  /** distance considered "arrived home" */
  homeEpsilon: number;
}

/**
 * Pure FSM transition for monsters (spec 7.5): returns the next state given the current one and distances.
 * Timers (attack cooldown, respawn) are handled by the entity; this only decides the state.
 */
export function decideMonsterState(i: MonsterDecideInput): MonsterAiState {
  switch (i.state) {
    case 'dead':
      return 'dead';
    case 'return':
      return i.distToSpawn <= i.homeEpsilon ? 'idle' : 'return';
    case 'idle':
      if (!i.playerAlive) return 'idle';
      return i.distToPlayer < i.aggroRange ? 'chase' : 'idle';
    case 'chase':
      if (!i.playerAlive) return 'return';
      if (i.distToSpawn > i.leashRange) return 'return';
      if (i.stuckTime >= i.stuckLimit) return 'return';
      if (i.distToPlayer <= i.attackRange) return 'attack';
      return 'chase';
    case 'attack':
      if (!i.playerAlive) return 'return';
      if (i.distToSpawn > i.leashRange) return 'return';
      if (i.distToPlayer > i.attackRange * 1.3) return 'chase';
      return 'attack';
  }
}
