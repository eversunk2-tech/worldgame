// XP accumulation and level-up (stats recompute, full heal).
import type { SimSystem } from '../types';
import { MAX_LEVEL, statsForLevel, xpToNext } from '../data/levels';

export const levelSim: SimSystem = (state, _cmd, _dt, events) => {
  const p = state.player;
  let gained = 0;
  for (const e of events) if (e.type === 'player:xp') gained += e.amount;
  if (gained <= 0) return;

  p.xp += gained;
  while (p.level < MAX_LEVEL && p.xp >= xpToNext(p.level)) {
    p.xp -= xpToNext(p.level);
    p.level++;
    const stats = statsForLevel(p.level);
    p.maxHp = stats.maxHp;
    p.atk = stats.atk;
    p.hp = p.maxHp;
    events.push({ type: 'player:levelup', level: p.level });
  }
  if (p.level >= MAX_LEVEL) p.xp = Math.min(p.xp, xpToNext(p.level));
};
