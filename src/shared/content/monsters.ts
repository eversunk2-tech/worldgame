// Monster definitions (spec 5.7, v0.1 6.5): 12 kinds, two per playable city. Distances/speeds in px.
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
  // v0.2 Stage C (spec 5.7): two per new city, same fields as above
  scarab: {
    id: 'scarab', cityId: 'cairo', name: '반짝 풍뎅이', color: 0x2f7fc1,
    hp: 25, atk: 6, speed: 60, aggroRange: 140, attackRange: 24, attackInterval: 1.2, leashRange: 220,
    points: 2, respawnTime: 25,
  },
  mummy_cat: {
    id: 'mummy_cat', cityId: 'cairo', name: '붕대 고양이', color: 0xe8e0cc,
    hp: 40, atk: 9, speed: 55, aggroRange: 160, attackRange: 28, attackInterval: 1.4, leashRange: 260,
    points: 4, respawnTime: 30,
  },
  pizza_rat: {
    id: 'pizza_rat', cityId: 'newyork', name: '피자 생쥐', color: 0x9aa1ab,
    hp: 20, atk: 5, speed: 85, aggroRange: 150, attackRange: 24, attackInterval: 1.0, leashRange: 240,
    points: 2, respawnTime: 25,
  },
  taxi_bug: {
    id: 'taxi_bug', cityId: 'newyork', name: '노란 택시 벌레', color: 0xf5c518,
    hp: 35, atk: 8, speed: 90, aggroRange: 160, attackRange: 24, attackInterval: 1.1, leashRange: 260,
    points: 3, respawnTime: 30,
  },
  kangaroo: {
    id: 'kangaroo', cityId: 'sydney', name: '통통 캥거루', color: 0xb5783f,
    hp: 35, atk: 8, speed: 75, aggroRange: 150, attackRange: 26, attackInterval: 1.2, leashRange: 240,
    points: 3, respawnTime: 30,
  },
  seagull: {
    id: 'seagull', cityId: 'sydney', name: '심술 갈매기', color: 0xf2f4f6,
    hp: 20, atk: 5, speed: 85, aggroRange: 140, attackRange: 24, attackInterval: 1.0, leashRange: 220,
    points: 2, respawnTime: 25,
  },
  monkey: {
    id: 'monkey', cityId: 'rio', name: '장난꾸러기 원숭이', color: 0x8a5a3a,
    hp: 25, atk: 6, speed: 80, aggroRange: 150, attackRange: 24, attackInterval: 1.0, leashRange: 240,
    points: 2, respawnTime: 25,
  },
  toucan: {
    id: 'toucan', cityId: 'rio', name: '큰부리새', color: 0x26262c,
    hp: 30, atk: 7, speed: 70, aggroRange: 150, attackRange: 26, attackInterval: 1.2, leashRange: 240,
    points: 3, respawnTime: 30,
  },
};

export const ALL_MONSTERS: readonly MonsterDef[] = Object.values(MONSTERS);

export function getMonsterDef(id: string): MonsterDef {
  const def = MONSTERS[id];
  if (!def) throw new Error(`Unknown monster id: ${id}`);
  return def;
}
