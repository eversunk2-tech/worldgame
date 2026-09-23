// Circle(XZ) vs AABB collision resolution, platform ground-height query, bounds clamp.
import type { AABB, Vec3, MapDef } from '../types';
import { STEP_TOLERANCE } from '../constants';

/**
 * Push `pos` (modified in place) out of every AABB it overlaps on the XZ plane,
 * treating the mover as a circle of radius `r`. Resolves along the axis with
 * the smaller penetration. Runs two passes so corner cases settle.
 */
export function resolveCircleVsAABBs(pos: Vec3, r: number, boxes: readonly AABB[]): void {
  for (let pass = 0; pass < 2; pass++) {
    for (const b of boxes) {
      // closest point on the box (XZ) to the circle center
      const cx = pos.x < b.min.x ? b.min.x : pos.x > b.max.x ? b.max.x : pos.x;
      const cz = pos.z < b.min.z ? b.min.z : pos.z > b.max.z ? b.max.z : pos.z;
      const dx = pos.x - cx;
      const dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;

      if (d2 > 1e-10) {
        // center is outside the box: push along the (center - closest) direction
        const d = Math.sqrt(d2);
        const push = r - d;
        pos.x += (dx / d) * push;
        pos.z += (dz / d) * push;
      } else {
        // center is inside the box: push out along the axis with minimal penetration
        const penLeft = pos.x - b.min.x + r;
        const penRight = b.max.x - pos.x + r;
        const penBack = pos.z - b.min.z + r;
        const penFront = b.max.z - pos.z + r;
        const m = Math.min(penLeft, penRight, penBack, penFront);
        if (m === penLeft) pos.x = b.min.x - r;
        else if (m === penRight) pos.x = b.max.x + r;
        else if (m === penBack) pos.z = b.min.z - r;
        else pos.z = b.max.z + r;
      }
    }
  }
}

/** Does the XZ circle at `pos` overlap the AABB's XZ footprint? */
export function circleOverlapsFootprint(pos: Vec3, r: number, b: AABB): boolean {
  const cx = pos.x < b.min.x ? b.min.x : pos.x > b.max.x ? b.max.x : pos.x;
  const cz = pos.z < b.min.z ? b.min.z : pos.z > b.max.z ? b.max.z : pos.z;
  const dx = pos.x - cx;
  const dz = pos.z - cz;
  return dx * dx + dz * dz < r * r;
}

/**
 * Highest platform top the player can stand on: footprint overlaps and
 * `top <= pos.y + STEP_TOLERANCE`. Returns 0 (ground) if none.
 */
export function groundHeightAt(pos: Vec3, r: number, platforms: readonly AABB[]): number {
  let floor = 0;
  for (const p of platforms) {
    const top = p.max.y;
    if (top <= floor) continue;
    if (top > pos.y + STEP_TOLERANCE) continue;
    if (circleOverlapsFootprint(pos, r, p)) floor = top;
  }
  return floor;
}

/** Platforms that count as walls for a mover whose feet are at `pos.y`. */
export function platformsAsWalls(pos: Vec3, platforms: readonly AABB[]): AABB[] {
  const out: AABB[] = [];
  for (const p of platforms) if (p.max.y > pos.y + STEP_TOLERANCE) out.push(p);
  return out;
}

export function clampToBounds(pos: Vec3, bounds: MapDef['bounds']): void {
  if (pos.x < bounds.minX) pos.x = bounds.minX;
  else if (pos.x > bounds.maxX) pos.x = bounds.maxX;
  if (pos.z < bounds.minZ) pos.z = bounds.minZ;
  else if (pos.z > bounds.maxZ) pos.z = bounds.maxZ;
}
