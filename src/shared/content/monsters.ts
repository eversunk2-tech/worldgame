// Monster definitions (spec 6.5). Distances/speeds in px.
// respawnTime raised from spec's 8~12s to 25~30s after review (farming measured ≈40 pt/min vs target ≤15).
import type { MonsterDef } from '../types';

export const MONSTERS: Record<string, MonsterDef> = {
  dust_dokkaebi: {
    id: 'dust_dokkaebi', cityId: 'seoul', name: '먼지 도깨비', color: 0x9e9e9e,
    hp: 20, atk: 5, speed: 50, aggroRange: 140, attackRange: 24, attackInterval: 1.2, leashRange: 220,
    points: 2, respawnTime: 25,
  },
  magpie: {
    id: 'magpie', cityId: 'seoul', name: '장난꾸러기 까치', color: 0x37474f,
    hp: 30, atk: 8, speed: 80, aggroRange: 160, attackRange: 24, attackInterval: 1.0, leashRange: 260,
    points: 3, respawnTime: 30,
  },
  pigeon: {
    id: 'pigeon', cityId: 'paris', name: '심술 비둘기', color: 0x8d99ae,
    hp: 20, atk: 5, speed: 70, aggroRange: 140, attackRange: 24, attackInterval: 1.2, leashRange: 220,
    points: 2, respawnTime: 25,
  },
  gargoyle: {
    id: 'gargoyle', cityId: 'paris', name: '꼬마 가고일', color: 0x6d6875,
    hp: 40, atk: 10, speed: 45, aggroRange: 160, attackRange: 28, attackInterval: 1.5, leashRange: 260,
    points: 4, respawnTime: 30,
  },
};

export const ALL_MONSTERS: readonly MonsterDef[] = Object.values(MONSTERS);

export function getMonsterDef(id: string): MonsterDef {
  const def = MONSTERS[id];
  if (!def) throw new Error(`Unknown monster id: ${id}`);
  return def;
}
