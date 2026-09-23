// Deterministic monster spawn positions inside a zone (spec 6.5): even ring at radius*0.6, snapped to walkable tiles.
import type { CityDef, MonsterZone, TilePos } from '../../shared/types';
import { isWalkable } from '../../shared/content/tiles';

/** Nearest walkable tile to (tx,ty) by growing square rings; falls back to the input. */
export function snapToWalkable(city: CityDef, tx: number, ty: number): TilePos {
  const rx = Math.round(tx);
  const ry = Math.round(ty);
  if (isWalkable(city.rows, rx, ry)) return { tx: rx, ty: ry };
  for (let r = 1; r <= 6; r++) {
    let best: TilePos | null = null;
    let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const cx = rx + dx;
        const cy = ry + dy;
        if (!isWalkable(city.rows, cx, cy)) continue;
        const d = (cx - tx) ** 2 + (cy - ty) ** 2;
        if (d < bestD) { bestD = d; best = { tx: cx, ty: cy }; }
      }
    }
    if (best) return best;
  }
  return { tx: rx, ty: ry };
}

export function spawnPositions(city: CityDef, zone: MonsterZone): TilePos[] {
  const out: TilePos[] = [];
  const radius = zone.radiusTiles * 0.6;
  for (let i = 0; i < zone.count; i++) {
    const angle = (i / zone.count) * Math.PI * 2;
    const tx = zone.center.tx + Math.cos(angle) * radius;
    const ty = zone.center.ty + Math.sin(angle) * radius;
    out.push(snapToWalkable(city, tx, ty));
  }
  return out;
}
