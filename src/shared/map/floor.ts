// Pure: the ground that shows through the transparent parts of a solid tile (roof corners, lamp posts, benches,
// trees, landmark edges). Review Stage C M5: it used to be the theme ground everywhere, which left grass squares under
// houses on dirt lanes and under lamps/benches on plazas and sidewalks. A solid tile now takes the most common walkable
// floor among its 4 neighbours; roads, bridges, entrances and water are paths or their own layers, not floors.
// Re-review N2: a tie picks no side (theme ground), and a landmark footprint ('P' region) takes one floor for all its
// cells — the most common floor on the ring around the whole region — so a landmark never stands on two floors split
// left/right (Gyeongbokgung's podium: plaza under one corner, grass under the other).
import { charAt, type Rows } from './autotile';

/** Walkable ground chars that continue under a neighbouring solid tile ('*' flowers count as grass '.'). */
export const FLOOR_CHARS: readonly string[] = ['.', ',', 'S', 's', 'F', 'd', '-', 'Q'];

const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
const AROUND = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]] as const;

/** Most common floor char in `chars` ('*' → '.'); null when there is none or when two floors share the top count. */
export function commonFloor(chars: readonly (string | undefined)[]): string | null {
  const counts = new Map<string, number>();
  for (const c of chars) {
    const ch = c === '*' ? '.' : c;
    if (ch === undefined || !FLOOR_CHARS.includes(ch)) continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  let tie = false;
  for (const [ch, n] of counts) {
    if (n > bestN) { best = ch; bestN = n; tie = false; } else if (n === bestN) tie = true;
  }
  return tie ? null : best;
}

/** The 'P' region (4-connected) containing (tx, ty), in flood-fill order. */
export function landmarkRegion(rows: Rows, tx: number, ty: number): [number, number][] {
  if (charAt(rows, tx, ty) !== 'P') return [];
  const seen = new Set<string>([`${tx},${ty}`]);
  const cells: [number, number][] = [[tx, ty]];
  for (let i = 0; i < cells.length; i++) {
    const [x, y] = cells[i]!;
    for (const [dx, dy] of SIDES) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && charAt(rows, x + dx, y + dy) === 'P') { seen.add(k); cells.push([x + dx, y + dy]); }
    }
  }
  return cells;
}

/** Floor of a whole landmark footprint: the most common floor on the ring of cells around the region (8-neighbours). */
export function landmarkFloor(rows: Rows, tx: number, ty: number): string | null {
  const region = landmarkRegion(rows, tx, ty);
  const inside = new Set(region.map(([x, y]) => `${x},${y}`));
  const ring = new Set<string>();
  const chars: (string | undefined)[] = [];
  for (const [x, y] of region) {
    for (const [dx, dy] of AROUND) {
      const k = `${x + dx},${y + dy}`;
      if (inside.has(k) || ring.has(k)) continue;
      ring.add(k);
      chars.push(charAt(rows, x + dx, y + dy));
    }
  }
  return commonFloor(chars);
}

/**
 * Ground under the solid tile (tx, ty), or null for the theme ground: a landmark cell ('P') takes its region's
 * `landmarkFloor`; any other solid tile the most common floor among its N, E, S, W neighbours. No floor around, or a
 * tie between two floors, gives null.
 */
export function floorUnder(rows: Rows, tx: number, ty: number): string | null {
  if (charAt(rows, tx, ty) === 'P') return landmarkFloor(rows, tx, ty);
  return commonFloor(SIDES.map(([dx, dy]) => charAt(rows, tx + dx, ty + dy)));
}
