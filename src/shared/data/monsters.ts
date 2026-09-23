import type { MonsterDef } from '../types';

export const MONSTERS: Record<string, MonsterDef> = {
  slime: {
    typeId: 'slime', name: '슬라임', color: 0x4fc3f7, size: { x: 1.0, y: 0.8, z: 1.0 },
    maxHp: 30, atk: 5, speed: 2.5,
    // leashRange: spec 초안 18 → 13 (Review 제안: 18이면 스폰 (24,0)에서 마을 x=6까지 끌려옴)
    aggroRange: 8, attackRange: 1.5, attackInterval: 1.2, leashRange: 13,
    xpReward: 20, respawnTime: 10,
  },
  golem: {
    typeId: 'golem', name: '골렘', color: 0x8d6e63, size: { x: 1.6, y: 2.2, z: 1.6 },
    maxHp: 120, atk: 18, speed: 2.0,
    aggroRange: 10, attackRange: 2.0, attackInterval: 1.8, leashRange: 22,
    xpReward: 80, respawnTime: 15,
  },
};

export function getMonsterDef(typeId: string): MonsterDef {
  const def = MONSTERS[typeId];
  if (!def) throw new Error(`Unknown monster typeId: ${typeId}`);
  return def;
}
