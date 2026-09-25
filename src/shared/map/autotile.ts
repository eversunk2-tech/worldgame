// Pure auto-tiling helpers (spec 5.3): deterministic variation, water 8-neighbour masks (with 1-wide channels),
// road 4-neighbour masks, bridge / crosswalk / fence orientation. No rendering here — the client maps the returned
// variant names to frames.

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

/** The 13 shapes the tile sheets provide (edges and corners are named by their land sides: edge_n = land to the N). */
export type BaseWaterVariant =
  | 'fill' | 'edge_n' | 'edge_e' | 'edge_s' | 'edge_w'
  | 'c_ne' | 'c_nw' | 'c_se' | 'c_sw' | 'in_ne' | 'in_nw' | 'in_se' | 'in_sw';
/**
 * Shapes the sheets do not have; the client stitches them from quadrants of the base cells. Channels are 1 tile
 * wide: ch_h = land N and S (water runs E–W), ch_v = land E and W; ch_end_<d> = a channel's closed end, land on <d>
 * and both sides (e.g. ch_end_n = land N, E, W — the water continues S); lone = a 1-tile pool. Any other mix (an
 * edge or outer corner plus inner corners, several inner corners) is `q_<nw><ne><sw><se>` of quadrant codes.
 */
export type CompositeWaterVariant = 'ch_h' | 'ch_v' | 'ch_end_n' | 'ch_end_e' | 'ch_end_s' | 'ch_end_w' | 'lone' | `q_${string}`;
export type WaterVariant = BaseWaterVariant | CompositeWaterVariant;

/**
 * One water quadrant, from its two orthogonal neighbours and the diagonal between them: both land → outer corner 'c';
 * one land → that side's shore band 'n' | 'e' | 's' | 'w'; neither but the diagonal → inner corner 'i'; else open 'f'.
 */
export type WaterQuad = 'f' | 'n' | 'e' | 's' | 'w' | 'c' | 'i';
export const WATER_CORNERS = ['nw', 'ne', 'sw', 'se'] as const;
export type WaterCorner = (typeof WATER_CORNERS)[number];

/** Quadrants (order nw, ne, sw, se) of a water tile from its 8-neighbour mask (bit set = water-like). */
export function waterQuads(mask: number): [WaterQuad, WaterQuad, WaterQuad, WaterQuad] {
  const land = (bit: number) => (mask & bit) === 0;
  const quad = (a: number, b: number, diag: number, qa: WaterQuad, qb: WaterQuad): WaterQuad =>
    land(a) && land(b) ? 'c' : land(a) ? qa : land(b) ? qb : land(diag) ? 'i' : 'f';
  return [quad(N, W, NW, 'n', 'w'), quad(N, E, NE, 'n', 'e'), quad(S, W, SW, 's', 'w'), quad(S, E, SE, 's', 'e')];
}

/** Quadrant codes (nw ne sw se) of every named shape; everything else is `q_<codes>`. */
export const WATER_SHAPES: Readonly<Record<string, BaseWaterVariant | Exclude<CompositeWaterVariant, `q_${string}`>>> = {
  ffff: 'fill', nnff: 'edge_n', fefe: 'edge_e', ffss: 'edge_s', wfwf: 'edge_w',
  cnwf: 'c_nw', ncfe: 'c_ne', wfcs: 'c_sw', fesc: 'c_se',
  ifff: 'in_nw', fiff: 'in_ne', ffif: 'in_sw', fffi: 'in_se',
  nnss: 'ch_h', wewe: 'ch_v', ccwe: 'ch_end_n', ncsc: 'ch_end_e', wecc: 'ch_end_s', cncs: 'ch_end_w', cccc: 'lone',
};
const BASE_WATER = new Set<string>(['fill', 'edge_n', 'edge_e', 'edge_s', 'edge_w', 'c_ne', 'c_nw', 'c_se', 'c_sw', 'in_ne', 'in_nw', 'in_se', 'in_sw']);
export const isBaseWaterVariant = (v: string): v is BaseWaterVariant => BASE_WATER.has(v);

/**
 * Water tile shape from its 8-neighbour mask. Land on one side → edge; two adjacent sides → outer corner (c_nw = land
 * N and W); only a diagonal → inner corner. Land on opposite sides is a 1-wide channel with shore bands on both
 * banks (Stage C: Paris's Île de la Cité channels no longer lose their island-side border).
 */
export function waterVariant(mask: number): WaterVariant {
  const code = waterQuads(mask).join('');
  return WATER_SHAPES[code] ?? `q_${code}`;
}

/** Every shape `waterVariant` can return (all 256 masks) with its quadrants — the client builds one frame per shape. */
export function allWaterVariants(): { variant: WaterVariant; quads: [WaterQuad, WaterQuad, WaterQuad, WaterQuad] }[] {
  const seen = new Map<string, [WaterQuad, WaterQuad, WaterQuad, WaterQuad]>();
  for (let m = 0; m < 256; m++) { const v = waterVariant(m); if (!seen.has(v)) seen.set(v, waterQuads(m)); }
  return [...seen].map(([variant, quads]) => ({ variant: variant as WaterVariant, quads }));
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
