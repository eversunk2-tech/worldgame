// Pure building geometry (spec 5.3): 4-connected '#' regions must be rectangles (w ≥ 2, h ≥ 2); parts are laid out
// as roof rows (rh = max(1, floor(h/2))) over wall rows with a door in the middle of the bottom row and windows on
// every wall row at odd offsets from the door column (±1, ±3, …), which keeps the facade symmetric around the door
// (review Stage A #8).

export interface BuildingRect { x0: number; y0: number; w: number; h: number }
export type BuildingPart =
  | 'roof_tl' | 'roof_t' | 'roof_tr' | 'roof_l' | 'roof_m' | 'roof_r'
  | 'wall_l' | 'wall_m' | 'wall_r' | 'door' | 'window';
export const BUILDING_PARTS: readonly BuildingPart[] = ['roof_tl', 'roof_t', 'roof_tr', 'roof_l', 'roof_m', 'roof_r', 'wall_l', 'wall_m', 'wall_r', 'door', 'window'];

export interface BuildingScan { rects: BuildingRect[]; errors: string[] }

/** Find every 4-connected region of `ch`; each must be a filled rectangle at least 2×2. */
export function findBuildings(rows: readonly string[], ch = '#'): BuildingScan {
  const h = rows.length;
  const seen = new Set<string>();
  const rects: BuildingRect[] = [];
  const errors: string[] = [];
  const key = (x: number, y: number) => `${x},${y}`;
  for (let y = 0; y < h; y++) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== ch || seen.has(key(x, y))) continue;
      // flood fill
      const stack: [number, number][] = [[x, y]];
      seen.add(key(x, y));
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        count++;
        minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const nx = cx + dx, ny = cy + dy;
          if (rows[ny]?.[nx] !== ch || seen.has(key(nx, ny))) continue;
          seen.add(key(nx, ny));
          stack.push([nx, ny]);
        }
      }
      const rect: BuildingRect = { x0: minX, y0: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
      if (count !== rect.w * rect.h) errors.push(`building at (${rect.x0},${rect.y0}) is not a filled rectangle`);
      else if (rect.w < 2 || rect.h < 2) errors.push(`building at (${rect.x0},${rect.y0}) is ${rect.w}x${rect.h} (need at least 2x2)`);
      else rects.push(rect);
    }
  }
  rects.sort((a, b) => (a.y0 - b.y0) || (a.x0 - b.x0));
  return { rects, errors };
}

export interface PlacedPart { tx: number; ty: number; part: BuildingPart }

export function roofRows(h: number): number {
  return Math.max(1, Math.floor(h / 2));
}

/** Part for every cell of the rectangle, row-major. */
export function buildingParts(b: BuildingRect): PlacedPart[] {
  const rh = roofRows(b.h);
  const doorX = b.x0 + Math.floor(b.w / 2);
  const out: PlacedPart[] = [];
  for (let dy = 0; dy < b.h; dy++) {
    const ty = b.y0 + dy;
    const last = dy === b.h - 1;
    for (let dx = 0; dx < b.w; dx++) {
      const tx = b.x0 + dx;
      const left = dx === 0;
      const right = dx === b.w - 1;
      let part: BuildingPart;
      if (dy < rh) {
        if (dy === 0) part = left ? 'roof_tl' : right ? 'roof_tr' : 'roof_t';
        else part = left ? 'roof_l' : right ? 'roof_r' : 'roof_m';
      } else {
        const off = tx - doorX;
        if (last && off === 0) part = 'door';
        else if (Math.abs(off) % 2 === 1) part = 'window';
        else part = left ? 'wall_l' : right ? 'wall_r' : 'wall_m';
      }
      out.push({ tx, ty, part });
    }
  }
  return out;
}

/** True when every cell of the rectangle holds `ch` (used for landmark validation). */
export function rectFilledWith(rows: readonly string[], x0: number, y0: number, w: number, h: number, ch: string): boolean {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (rows[y]?.[x] !== ch) return false;
  return true;
}
