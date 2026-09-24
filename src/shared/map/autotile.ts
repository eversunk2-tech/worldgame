// Pure auto-tiling helpers (spec 5.3): deterministic variation, water 8-neighbour masks, road 4-neighbour masks,
// bridge / crosswalk / fence orientation. No rendering here — the client maps the returned variant names to frames.

export type Rows = readonly string[];

/** Deterministic 32-bit hash of a tile position (seeded, no runtime randomness in shared code). */
export function hash(tx: number, ty: number): number {
  let h = (tx * 374761393 + ty * 668265263) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Variation index in [0, n) for a tile — 85 % return 0 when used as `variant(tx,ty,20) < 17` style buckets. */
export function variant(tx: number, ty: number, n: number): number {
  if (n <= 1) return 0;
  return hash(tx, ty) % n;
}

/** Ground variation bucket: 'base' (85 %), 'alt' (10 %), 'flower' (5 %). */
export function groundVariant(tx: number, ty: number): 'base' | 'alt' | 'flower' {
  const v = variant(tx, ty, 20);
  return v < 17 ? 'base' : v < 19 ? 'alt' : 'flower';
}

export const charAt = (rows: Rows, tx: number, ty: number): string | undefined => rows[ty]?.[tx];

// ------------------------------------------------------------------ water

/** Tiles that count as water for edge detection: water, bridges, entrances and the outside of the map. */
export function isWaterLike(rows: Rows, tx: number, ty: number): boolean {
  const ch = charAt(rows, tx, ty);
  if (ch === undefined) return true;
  return ch === '~' || ch === 'B' || ch === 'E';
}

// bit layout: N=1, NE=2, E=4, SE=8, S=16, SW=32, W=64, NW=128 (bit set = neighbour is water-like)
export const N = 1, NE = 2, E = 4, SE = 8, S = 16, SW = 32, W = 64, NW = 128;

export function waterMask(rows: Rows, tx: number, ty: number): number {
  let m = 0;
  if (isWaterLike(rows, tx, ty - 1)) m |= N;
  if (isWaterLike(rows, tx + 1, ty - 1)) m |= NE;
  if (isWaterLike(rows, tx + 1, ty)) m |= E;
  if (isWaterLike(rows, tx + 1, ty + 1)) m |= SE;
  if (isWaterLike(rows, tx, ty + 1)) m |= S;
  if (isWaterLike(rows, tx - 1, ty + 1)) m |= SW;
  if (isWaterLike(rows, tx - 1, ty)) m |= W;
  if (isWaterLike(rows, tx - 1, ty - 1)) m |= NW;
  return m;
}

export type WaterVariant =
  | 'fill' | 'edge_n' | 'edge_e' | 'edge_s' | 'edge_w'
  | 'c_ne' | 'c_nw' | 'c_se' | 'c_sw' | 'in_ne' | 'in_nw' | 'in_se' | 'in_sw';

/**
 * Water tile shape from its 8-neighbour mask. Land on one side → edge; land on two adjacent sides → outer corner
 * (named by the land sides, e.g. c_nw = land to the N and W); all four sides water but a diagonal is land → inner
 * corner. Degenerate cases (land on opposite sides / 3 sides) fall back to an edge or corner.
 */
export function waterVariant(mask: number): WaterVariant {
  const n = (mask & N) !== 0, e = (mask & E) !== 0, s = (mask & S) !== 0, w = (mask & W) !== 0;
  const landCount = [n, e, s, w].filter((x) => !x).length;
  if (landCount === 0) {
    if (!(mask & NE)) return 'in_ne';
    if (!(mask & NW)) return 'in_nw';
    if (!(mask & SE)) return 'in_se';
    if (!(mask & SW)) return 'in_sw';
    return 'fill';
  }
  if (landCount === 1) {
    if (!n) return 'edge_n';
    if (!e) return 'edge_e';
    if (!s) return 'edge_s';
    return 'edge_w';
  }
  if (!n && !w) return 'c_nw';
  if (!n && !e) return 'c_ne';
  if (!s && !w) return 'c_sw';
  if (!s && !e) return 'c_se';
  // opposite sides are land (1-wide channel): treat as an edge on the north/west side
  return !n ? 'edge_n' : 'edge_w';
}

// ------------------------------------------------------------------ roads

/** Chars a road connects to (spec 5.3): road, bridge, entrance, crosswalk. Outside the map counts as connected. */
export function isRoadLike(rows: Rows, tx: number, ty: number): boolean {
  const ch = charAt(rows, tx, ty);
  if (ch === undefined) return true;
  return ch === '=' || ch === 'B' || ch === 'E' || ch === 'x';
}

export const RN = 1, RE = 2, RS = 4, RW = 8;

export function roadMask(rows: Rows, tx: number, ty: number): number {
  let m = 0;
  if (isRoadLike(rows, tx, ty - 1)) m |= RN;
  if (isRoadLike(rows, tx + 1, ty)) m |= RE;
  if (isRoadLike(rows, tx, ty + 1)) m |= RS;
  if (isRoadLike(rows, tx - 1, ty)) m |= RW;
  return m;
}

export type RoadVariant =
  | 'h' | 'v' | 'cross' | 't_n' | 't_e' | 't_s' | 't_w'
  | 'c_ne' | 'c_nw' | 'c_se' | 'c_sw' | 'end_n' | 'end_e' | 'end_s' | 'end_w' | 'lone';

/**
 * Road piece from the 4-neighbour mask. `t_<d>` = T-junction whose stem points to <d> (open on <d> and the two
 * perpendicular sides); `c_<ab>` = corner open on a and b; `end_<d>` = dead end whose only neighbour is <d>.
 */
export function roadVariant(mask: number): RoadVariant {
  switch (mask) {
    case 0: return 'lone';
    case RN: return 'end_n';
    case RE: return 'end_e';
    case RS: return 'end_s';
    case RW: return 'end_w';
    case RN | RS: return 'v';
    case RE | RW: return 'h';
    case RN | RE: return 'c_ne';
    case RN | RW: return 'c_nw';
    case RS | RE: return 'c_se';
    case RS | RW: return 'c_sw';
    case RN | RE | RW: return 't_n';
    case RS | RE | RW: return 't_s';
    case RN | RS | RE: return 't_e';
    case RN | RS | RW: return 't_w';
    default: return 'cross';
  }
}

// ------------------------------------------------------------------ orientation helpers

const isWater = (rows: Rows, tx: number, ty: number): boolean => charAt(rows, tx, ty) === '~';

/** Bridge runs across the river: water to the E/W → the bridge runs N-S ('v'); water to the N/S → 'h'. */
export function bridgeVariant(rows: Rows, tx: number, ty: number): 'h' | 'v' {
  if (isWater(rows, tx - 1, ty) || isWater(rows, tx + 1, ty)) return 'v';
  if (isWater(rows, tx, ty - 1) || isWater(rows, tx, ty + 1)) return 'h';
  return 'v';
}

/** Crosswalk stripes follow the road direction: road to the E/W → 'h', otherwise 'v'. */
export function crosswalkVariant(rows: Rows, tx: number, ty: number): 'h' | 'v' {
  const road = (x: number, y: number) => { const c = charAt(rows, x, y); return c === '=' || c === 'x' || c === 'E'; };
  if (road(tx - 1, ty) || road(tx + 1, ty)) return 'h';
  if (road(tx, ty - 1) || road(tx, ty + 1)) return 'v';
  return 'h';
}

/** Fence piece: rails run to fence neighbours on the E/W → 'h', N/S → 'v', otherwise a lone post. */
export function fenceVariant(rows: Rows, tx: number, ty: number): 'h' | 'v' | 'post' {
  const f = (x: number, y: number) => charAt(rows, x, y) === 'f';
  if (f(tx - 1, ty) || f(tx + 1, ty)) return 'h';
  if (f(tx, ty - 1) || f(tx, ty + 1)) return 'v';
  return 'post';
}

/** Rock tiles fully surrounded by rock (4-neighbours) are the inside of a mass → 'hill'. */
export function rockVariant(rows: Rows, tx: number, ty: number): 'rock' | 'hill' {
  const r = (x: number, y: number) => { const c = charAt(rows, x, y); return c === undefined || c === 'R'; };
  return r(tx - 1, ty) && r(tx + 1, ty) && r(tx, ty - 1) && r(tx, ty + 1) ? 'hill' : 'rock';
}
