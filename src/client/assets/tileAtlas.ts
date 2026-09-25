// Semantic tile names → Kenney sheet cells or code drawings (spec 3.6), building palettes, theme lookups and the
// furniture/room definitions. Indices were read with tools/tile-index.html; each comment gives sheet (col,row).
// Sheets: rpg 57×31 (index = col + row*57), city 37×28, indoor 27×18.
import type { BuildingStyle, CityTheme, RoadStyle, TreeKind } from '../../shared/types';
import { allWaterVariants, isBaseWaterVariant, WATER_CORNERS, type BaseWaterVariant, type RoadVariant, type WaterCorner, type WaterQuad, type WaterVariant } from '../../shared/map/autotile';
import { BUILDING_PARTS, type BuildingPart } from '../../shared/map/buildings';
import type Phaser from 'phaser';
import { ITEMS } from '../../shared/content/items';
import { buildAtlas, resolveEntry, type BuiltAtlas, type CellRef, type CodeDrawer, type LayerRef, type TileEntry } from './atlasBuilder';
import { ROOM_SCALE, TEX, TILE_SCALE } from './manifest';
import { disc, hline, makeCanvas, px, rect, registerImage, scaleCanvas, tri, vline } from './pixelArt';
import { fallbackCell } from './placeholders';
import { ICON_DRAWERS } from './uiSkin';
import { vendorSheets } from './vendorSheets';

const rpg = (index: number, extra: Partial<CellRef> = {}): CellRef => ({ sheet: 'rpg', index, ...extra });
const city = (index: number, extra: Partial<CellRef> = {}): CellRef => ({ sheet: 'city', index, ...extra });
const indoor = (index: number, extra: Partial<CellRef> = {}): CellRef => ({ sheet: 'indoor', index, ...extra });
const code = (kind: string, color?: number): TileEntry => (color === undefined ? { code: kind } : { code: kind, color });
const layers = (...ls: LayerRef[]): TileEntry => ({ layers: ls });

// ---------------------------------------------------------------- road / path sets (rpg)
// Dirt path blob set, rpg cols 5-9 rows 7-12: 3×3 rounded blob + 1-wide strips + caps. The cobblestone set has the
// same layout six rows lower (index + 342) and the sand set twelve rows lower (+684).
const DIRT: Record<RoadVariant, number> = {
  h: 465,      // (9,8)  1-wide strip, outlines top+bottom
  v: 408,      // (9,7)  1-wide strip, outlines left+right
  cross: 578,  // (8,10) plain fill
  t_s: 521,    // (8,9)  top edge (open S,E,W)
  t_n: 635,    // (8,11) bottom edge (open N,E,W)
  t_e: 577,    // (7,10) left edge (open N,S,E)
  t_w: 579,    // (9,10) right edge (open N,S,W)
  c_se: 520,   // (7,9)  rounded NW corner (open S,E)
  c_sw: 522,   // (9,9)  rounded NE corner (open S,W)
  c_ne: 634,   // (7,11) rounded SW corner (open N,E)
  c_nw: 636,   // (9,11) rounded SE corner (open N,W)
  end_n: 632,  // (5,11) vertical cap, closed bottom
  end_s: 633,  // (6,11) vertical cap, closed top
  end_e: 690,  // (6,12) horizontal cap, closed left
  end_w: 689,  // (5,12) horizontal cap, closed right
  lone: 692,   // (8,12) rounded single
};
const ROAD_VARIANTS = Object.keys(DIRT) as RoadVariant[];

function roadSet(prefix: string, offset: number): Record<string, TileEntry> {
  const out: Record<string, TileEntry> = {};
  for (const v of ROAD_VARIANTS) out[`${prefix}_${v}`] = rpg(DIRT[v] + offset);
  return out;
}

// City asphalt: plain dark tile (11,19) everywhere except straight runs, which carry the double yellow centre line.
function asphaltSet(): Record<string, TileEntry> {
  const out: Record<string, TileEntry> = {};
  for (const v of ROAD_VARIANTS) out[`road_asphalt_${v}`] = city(714); // (11,19) plain asphalt
  out.road_asphalt_h = city(716); // (13,19) double yellow line, horizontal
  out.road_asphalt_v = city(753); // (13,20) double yellow line, vertical
  return out;
}

// ---------------------------------------------------------------- water sets (rpg)
// Pond block rpg (2..4, 0..2): grass-rimmed water. Names are from the water tile's point of view (edge_n = land N).
const RIVER: Record<BaseWaterVariant, number> = {
  fill: 60,     // (3,1)
  edge_n: 3,    // (3,0)
  edge_w: 59,   // (2,1)
  edge_e: 61,   // (4,1)
  edge_s: 117,  // (3,2)
  c_nw: 2,      // (2,0)
  c_ne: 4,      // (4,0)
  c_sw: 116,    // (2,2)
  c_se: 118,    // (4,2)
  in_ne: 60, in_nw: 60, in_se: 60, in_sw: 60, // base fill; the corner bands are code-drawn on top (innerCorner)
};
// Sea block rpg (10..12, 22..24): cyan water with a sand rim.
const SEA: Record<BaseWaterVariant, number> = {
  fill: 1322, edge_n: 1265, edge_w: 1321, edge_e: 1323, edge_s: 1379,
  c_nw: 1264, c_ne: 1266, c_sw: 1378, c_se: 1380,
  in_ne: 1322, in_nw: 1322, in_se: 1322, in_sw: 1322,
};
/**
 * Water names for one theme. Inner corners (diagonal-only land) do not exist in the packs, so they are the plain
 * fill plus a code-drawn quarter-circle of the edge tile's shore bands (review Stage A #4). The sea block's land
 * rows are transparent (meant to overlay sand), so sea edges/corners sit on a sand cell.
 */
function waterSet(prefix: 'water' | 'sea', set: Record<BaseWaterVariant, number>): Record<string, TileEntry> {
  const out: Record<string, TileEntry> = {};
  const base = (idx: number): TileEntry => (prefix === 'sea' && idx !== set.fill ? layers(rpg(8), rpg(idx)) : rpg(idx));
  for (const [v, idx] of Object.entries(set) as [BaseWaterVariant, number][]) {
    if (v.startsWith('in_')) out[`${prefix}_${v}`] = layers(rpg(set.fill), { code: `${prefix}_${v}` });
    else out[v === 'fill' ? prefix : `${prefix}_${v}`] = base(idx);
  }
  return out;
}

/**
 * Water shapes the sheets lack — 1-wide channels (ch_h / ch_v), channel ends, lone pools and edge/corner + inner
 * corner mixes (autotile `waterVariant`). Each quadrant is copied from the base cell of the same theme whose shore
 * matches that quadrant (e.g. ch_h = top half of edge_n + bottom half of edge_s), so bands line up with neighbours.
 */
const WATER_COMPOSITES = allWaterVariants().filter((v) => !isBaseWaterVariant(v.variant));

/** Base frame name that provides quadrant `kind` at `corner` (fill, shore side, outer or inner corner). */
function waterQuadSource(prefix: 'water' | 'sea', kind: WaterQuad, corner: WaterCorner): string {
  switch (kind) {
    case 'f': return prefix;
    case 'c': return `${prefix}_c_${corner}`;
    case 'i': return `${prefix}_in_${corner}`;
    default: return `${prefix}_edge_${kind}`;
  }
}

function waterCompositeNames(prefix: 'water' | 'sea'): Record<string, TileEntry> {
  return Object.fromEntries(WATER_COMPOSITES.map(({ variant }) => [`${prefix}_${variant}`, code(`${prefix}_${variant}`)]));
}

function waterCompositeDrawers(prefix: 'water' | 'sea'): Record<string, CodeDrawer> {
  const drawer = (quads: readonly WaterQuad[]): CodeDrawer => (ctx) => {
    WATER_CORNERS.forEach((corner, i) => {
      const name = waterQuadSource(prefix, quads[i]!, corner);
      const entry = TILE_NAMES[name];
      const cell = (entry && resolveEntry(entry, CODE_TILES)) ?? fallbackCell(name);
      const ox = corner.endsWith('e') ? 8 : 0;
      const oy = corner.startsWith('s') ? 8 : 0;
      ctx.drawImage(cell, ox, oy, 8, 8, ox, oy, 8, 8);
    });
  };
  return Object.fromEntries(WATER_COMPOSITES.map(({ variant, quads }) => [`${prefix}_${variant}`, drawer(quads)]));
}

// ---------------------------------------------------------------- buildings
/** door/window drawn on the bordered outer wall cells (buildCityMap picks these on the first/last column). */
export type EdgePart = 'door_l' | 'door_r' | 'window_l' | 'window_r';
export type BuildingPartFrame = BuildingPart | EdgePart;
const EDGE_PARTS: readonly EdgePart[] = ['door_l', 'door_r', 'window_l', 'window_r'];
type PartMap = Record<BuildingPartFrame, TileEntry>;
const CREAM_WALL = { l: 754, m: 755, r: 756 }; // rpg (13..15,13) cream plaster block, middle row
const WHITE_ROOF = { tl: 1224, t: 1229, tr: 1225, l: 1281, m: 1229, r: 1282 }; // rpg (27..28,21..22) + plain (32,21)
const BROWN_ROOF = { tl: 1217, t: 1221, tr: 1218, l: 1274, m: 1221, r: 1275 }; // rpg (20..21,21..22) + plain (24,21)
const TAN_ROOF = { tl: 1231, t: 1235, tr: 1232, l: 1288, m: 1235, r: 1289 };   // rpg (34..35,21..22) + plain (38,21)

function house(roof: typeof WHITE_ROOF, wall: typeof CREAM_WALL, door: CellRef, window: CellRef, wallTint?: number): PartMap {
  const w = (i: number) => rpg(i, wallTint === undefined ? {} : { recolor: wallTint });
  return {
    roof_tl: rpg(roof.tl), roof_t: rpg(roof.t), roof_tr: rpg(roof.tr), roof_l: rpg(roof.l), roof_m: rpg(roof.m), roof_r: rpg(roof.r),
    wall_l: w(wall.l), wall_m: w(wall.m), wall_r: w(wall.r),
    door: layers(w(wall.m), door), window: layers(w(wall.m), window),
    door_l: layers(w(wall.l), door), door_r: layers(w(wall.r), door),
    window_l: layers(w(wall.l), window), window_r: layers(w(wall.r), window),
  };
}

const BUILDINGS: Record<BuildingStyle, PartMap> = {
  // village: brown hipped roof, cream walls, brown plank door (28,4), dark-framed window (40,0)
  village: house(BROWN_ROOF, CREAM_WALL, rpg(256), rpg(40)),
  // parisian: light (zinc-tinted, see palette) roof, cream walls, white arched door (40,8), white lattice window (40,3)
  parisian: house(WHITE_ROOF, CREAM_WALL, rpg(496), rpg(211)),
  // hanok: the light roof set tinted dark slate (palette), white plaster walls, tall wooden door (28,3), lattice window (45,7)
  hanok: house(WHITE_ROOF, CREAM_WALL, rpg(199), rpg(444)),
  // sandstone: tan roof, tan-tinted walls, arched door (28,7) and arched window (44,4)
  sandstone: house(TAN_ROOF, CREAM_WALL, rpg(427), rpg(272), 0xd9b98a),
  // colorful: light roof + cream walls, both tinted per building from the palette (Rio)
  colorful: house(WHITE_ROOF, CREAM_WALL, rpg(256), rpg(41)),
  // skyscraper: city parapet band (1..3,10) over glass curtain walls (15..17,6); white double door (23,21), glass panel (12,11)
  skyscraper: {
    roof_tl: city(371), roof_t: city(372), roof_tr: city(373), roof_l: city(238), roof_m: city(239), roof_r: city(237),
    wall_l: city(238), wall_m: city(239), wall_r: city(237),
    door: layers(city(239), city(800)), window: layers(city(239), city(419)),
    door_l: layers(city(238), city(800)), door_r: layers(city(237), city(800)),
    window_l: layers(city(238), city(419)), window_r: layers(city(237), city(419)),
  },
  // modern: grey concrete block city (8..10,0..1); brown door with glass (28,15), four-pane window (26,16)
  modern: {
    roof_tl: city(8), roof_t: city(10), roof_tr: city(9), roof_l: city(45), roof_m: city(47), roof_r: city(46),
    wall_l: city(45), wall_m: city(47), wall_r: city(46),
    door: layers(city(47), city(583)), window: layers(city(47), city(618)),
    door_l: layers(city(45), city(583)), door_r: layers(city(46), city(583)),
    window_l: layers(city(45), city(618)), window_r: layers(city(46), city(618)),
  },
};

/** Per-building tint palettes (spec 5.3 CITY_ROOF_PALETTE). Empty = keep the sheet colours. */
export const BUILDING_PALETTES: Record<BuildingStyle, { roof: number[]; wall: number[] }> = {
  village: { roof: [0xa8623a, 0x8c4f2e, 0xb9743f], wall: [] },
  parisian: { roof: [0x8a94ad, 0x7c86a0, 0x98a2ba], wall: [] },
  hanok: { roof: [0x4d5263, 0x3f4352, 0x5a6072], wall: [] },
  sandstone: { roof: [0xd4a86a, 0xc79a5c, 0xdeb47a], wall: [] },
  colorful: { roof: [0xe0553c, 0x3c9ad6, 0x64b96b, 0xf2c94c], wall: [0xf6d7a0, 0xa9dbe8, 0xf7b3c2, 0xc9e8a4] },
  skyscraper: { roof: [], wall: [] },
  modern: { roof: [], wall: [] },
};
export const BUILDING_STYLES: readonly BuildingStyle[] = ['village', 'hanok', 'parisian', 'sandstone', 'skyscraper', 'colorful', 'modern'];

export function buildingVariantCount(style: BuildingStyle): number {
  const p = BUILDING_PALETTES[style];
  return Math.max(1, p.roof.length, p.wall.length);
}
/** Frame name of a building part; `variant` picks the palette colour (wraps). */
export function buildingFrame(style: BuildingStyle, part: BuildingPartFrame, variant: number): string {
  const n = buildingVariantCount(style);
  return `bld_${style}_${part}@${((variant % n) + n) % n}`;
}

const tintLayer = (ref: LayerRef, color: number | undefined): LayerRef => (color === undefined || 'code' in ref ? ref : { ...ref, recolor: color });
function tintEntry(entry: TileEntry, roofTint: number | undefined, wallTint: number | undefined, part: BuildingPartFrame): TileEntry {
  const isRoof = part.startsWith('roof');
  if ('layers' in entry) {
    // door/window: only the wall base layer takes the wall tint
    const [base, ...rest] = entry.layers;
    return { layers: [tintLayer(base!, isRoof ? roofTint : wallTint), ...rest] };
  }
  return tintLayer(entry, isRoof ? roofTint : wallTint) as TileEntry;
}

function buildingEntries(): Record<string, TileEntry> {
  const out: Record<string, TileEntry> = {};
  for (const style of BUILDING_STYLES) {
    const parts = BUILDINGS[style];
    const pal = BUILDING_PALETTES[style];
    for (const part of [...BUILDING_PARTS, ...EDGE_PARTS]) {
      out[`bld_${style}_${part}`] = parts[part];
      const n = buildingVariantCount(style);
      for (let i = 0; i < n; i++) {
        const roof = pal.roof.length ? pal.roof[i % pal.roof.length] : undefined;
        const wall = pal.wall.length ? pal.wall[i % pal.wall.length] : undefined;
        out[buildingFrame(style, part, i)] = tintEntry(parts[part], roof, wall, part);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- TILE_NAMES (spec 3.6)
export const TILE_NAMES: Record<string, TileEntry> = {
  // 지면
  grass: rpg(5),                                  // (5,0) plain grass
  grass_2: rpg(66),                               // (9,1) grass with light patches
  grass_flower: rpg(573),                         // (3,10) white flowers on grass (centre of the flower-bed block)
  dark_grass: rpg(5, { recolor: 0x3f8a3a }),      // grass tinted darker (monster zones)
  dirt: rpg(6),                                   // (6,0) plain dirt
  sand: rpg(8),                                   // (8,0) plain cream sand
  sand_2: rpg(65),                                // (8,1) sand with pebbles
  dark_sand: rpg(8, { recolor: 0xcbb77f }),       // sand tinted darker
  farm: rpg(1085),                                // (2,19) tilled orange soil with furrows
  plaza: city(744),                               // city (4,20) light tan pavement
  sidewalk: city(704),                            // city (1,19) grey pavement
  crosswalk_h: city(823),                         // city (9,22) zebra bands for a horizontal road
  crosswalk_v: city(826),                         // city (12,22) zebra bands for a vertical road
  // 길
  ...roadSet('road_dirt', 0),
  ...roadSet('road_cobble', 342),                 // grey cobble blob set, rpg cols 5-9 rows 13-18
  ...asphaltSet(),
  // 물
  ...waterSet('water', RIVER),
  water_2: rpg(1),                                // (1,0) water with different sparkles
  ...waterSet('sea', SEA),
  ...waterCompositeNames('water'),                // channels etc., stitched from the cells above (see WATER_COMPOSITES)
  ...waterCompositeNames('sea'),
  bridge_h: rpg(1006),                            // (37,17) horizontal planks with side rails
  bridge_v: rpg(1063),                            // (37,18) vertical planks with side rails
  // 자연
  tree_round: rpg(526),                           // (13,9) round green tree
  tree_pine: rpg(529),                            // (16,9) pine
  tree_palm: code('tree_palm'),                   // not in the packs → code
  tree_tropical: rpg(596),                        // (26,10) round tree with orange fruit
  tree_plane: rpg(583),                           // (13,10) tall light-green tree
  tree_gum: rpg(585),                             // (15,10) tall dark-green tree
  bush: rpg(538),                                 // (25,9) round bush
  flower_a: rpg(402),                             // (3,7) red flowers on grass
  flower_b: rpg(744),                             // (3,13) blue flowers on grass
  rock: rpg(1251),                                // (54,21) grey rock
  rock_2: rpg(1252),                              // (55,21) grey rock, wider
  hill: rpg(1253),                                // (56,21) grey rock cluster (inside of a rock mass)
  cactus: rpg(535),                               // (22,9) cactus
  // 건물
  ...buildingEntries(),
  // 장식·오브젝트
  bench: city(570),                               // city (15,15) wooden bench
  lamp: city(485),                                // city (4,13) curved street lamp
  fence_h: rpg(1359),                             // (48,23) post + rails running right
  fence_v: rpg(1361, { shift: [-7, 0] }),         // (50,23) post, centred
  fence_post: rpg(1361, { shift: [-7, 0] }),
  wall_stone: rpg(704),                           // (20,12) grey stone block
  hedge: rpg(589),                                // (19,10) green hedge block
  cafe_table: city(553),                          // city (35,14) striped parasol over a table
  stall_red: city(589),                           // city (34,15) market stand with orange/white awning
  stall_blue: city(589, { recolor: 0x3a7bd5 }),   // same stand tinted blue
  car_yellow: code('car', 0xf2c94c),
  car_red: code('car', 0xd94b3d),
  car_blue: code('car', 0x3d7bd6),
  sign_post: rpg(19),                             // (19,0) wooden sign on a post
  hydrant: city(533),                             // city (15,14) orange fire hydrant
  trash_can: city(497),                           // city (16,13) grey bin
  traffic_light: city(520),                       // city (2,14) traffic light
  // 보조 (코드 생성): 보이지 않는 충돌 타일(물·랜드마크 자리), 출입구 표시
  blank_solid: code('blank'),
  deco_entrance: code('entrance_mark'),
  // 아이콘 (코드 생성, uiSkin.ts)
  icon_coin: code('icon_coin'), icon_lock: code('icon_lock'), icon_pin: code('icon_pin'), icon_pin_gray: code('icon_pin_gray'),
  icon_stamp: code('icon_stamp'), icon_heart: code('icon_heart'), icon_speaker_on: code('icon_speaker_on'),
  icon_speaker_off: code('icon_speaker_off'), icon_map: code('icon_map'),
};

/** Indoor / avatar-room cells (3× atlas, spec 3.6 실내 그룹 + 5.10). */
export const ROOM_TILE_NAMES: Record<string, TileEntry> = {
  floor_wood: layers(rpg(1483), { code: 'plank_lines' }), // rpg (1,26) plain tan + code plank seams
  floor_tile: indoor(402),     // indoor (24,14) bordered tan tile
  floor_carpet: indoor(159),   // indoor (24,5) green carpet
  wall_top_a: indoor(336),     // indoor (12,12) plaster wall with wainscot, left half
  wall_top_b: indoor(337),     // indoor (13,12) right half
  wall_face: indoor(294),      // indoor (24,10) plain tan wall
  fur_chair: indoor(54),       // indoor (0,2) armchair
  fur_plant: indoor(16),       // indoor (16,0) potted plant
  fur_rug_tl: indoor(394), fur_rug_tr: indoor(396), fur_rug_bl: indoor(448), fur_rug_br: indoor(450), // teal rug corners (16..18,14..16)
  fur_desk_l: indoor(193), fur_desk_r: indoor(196),      // indoor (4,7)/(7,7) dark-topped desk ends
  fur_bookshelf_t: rpg(725), fur_bookshelf_b: rpg(782),  // rpg (41,12)/(41,13) shelves full of books
  fur_bed_l: indoor(232), fur_bed_r: indoor(233),        // indoor (16,8)/(17,8) bed with pillow
};

/** Furniture item → grid of room cell names, or a code drawing (souvenirs). */
export const FURNITURE_ART: Record<string, { grid: string[][] } | { code: string }> = {
  fur_chair: { grid: [['fur_chair']] },
  fur_plant: { grid: [['fur_plant']] },
  fur_rug: { grid: [['fur_rug_tl', 'fur_rug_tr'], ['fur_rug_bl', 'fur_rug_br']] },
  fur_desk: { grid: [['fur_desk_l', 'fur_desk_r']] },
  fur_bookshelf: { grid: [['fur_bookshelf_t'], ['fur_bookshelf_b']] },
  fur_bed: { grid: [['fur_bed_l', 'fur_bed_r']] },
  fur_souvenir_seoul: { code: 'souvenir_seoul' },
  fur_souvenir_paris: { code: 'souvenir_paris' },
  fur_souvenir_cairo: { code: 'souvenir_cairo' },
  fur_souvenir_newyork: { code: 'souvenir_newyork' },
  fur_souvenir_sydney: { code: 'souvenir_sydney' },
  fur_souvenir_rio: { code: 'souvenir_rio' },
};

// ---------------------------------------------------------------- theme lookups
export function groundNames(theme: CityTheme): { base: string; alt: string; flower: string } {
  return theme.ground === 'sand' ? { base: 'sand', alt: 'sand_2', flower: 'sand_2' } : { base: 'grass', alt: 'grass_2', flower: 'grass_flower' };
}
export const treeName = (kind: TreeKind): string => `tree_${kind}`;
export const roadName = (road: RoadStyle, v: RoadVariant): string => `road_${road}_${v}`;
export function waterNames(theme: CityTheme, v: WaterVariant): string[] {
  const prefix = theme.water === 'sea' ? 'sea' : 'water';
  const suffix = v === 'fill' ? '' : `_${v}`;
  const candidates = [`${prefix}${suffix}`];
  if (prefix === 'sea') candidates.push(`water${suffix}`);
  candidates.push(prefix, 'water');
  return candidates;
}
export const wallName = (theme: CityTheme): string => (theme.wall === 'hedge' ? 'hedge' : 'wall_stone');

// ---------------------------------------------------------------- code-drawn cells (16-grid)
const O = 0x2b1d14; // outline

function drawPalm(ctx: CanvasRenderingContext2D): void {
  const trunk = 0x9c6b3c, leaf = 0x3fa34d, dark = 0x2e7d32;
  vline(ctx, 7, 6, 15, trunk); vline(ctx, 8, 5, 15, trunk); px(ctx, 6, 15, O); px(ctx, 9, 15, O);
  px(ctx, 7, 9, 0x7a5028); px(ctx, 8, 12, 0x7a5028);
  // fronds
  hline(ctx, 1, 6, 4, leaf); hline(ctx, 9, 14, 4, leaf); hline(ctx, 0, 4, 5, dark); hline(ctx, 11, 15, 5, dark);
  hline(ctx, 2, 5, 3, leaf); hline(ctx, 10, 13, 3, leaf); hline(ctx, 5, 10, 2, leaf); hline(ctx, 6, 9, 1, dark);
  px(ctx, 1, 6, dark); px(ctx, 14, 6, dark); px(ctx, 0, 6, O); px(ctx, 15, 6, O); px(ctx, 4, 6, dark); px(ctx, 11, 6, dark);
  px(ctx, 6, 0, O); px(ctx, 9, 0, O);
  // coconuts
  px(ctx, 6, 5, 0x6b4520); px(ctx, 9, 5, 0x6b4520);
}

function drawCar(ctx: CanvasRenderingContext2D, color = 0xf2c94c): void {
  const dark = 0x1f2430, glass = 0x9fd3ff, body = color;
  rect(ctx, 2, 3, 12, 10, O);
  rect(ctx, 3, 4, 10, 8, body);
  rect(ctx, 4, 5, 8, 2, glass); rect(ctx, 4, 9, 8, 2, glass);
  rect(ctx, 1, 4, 1, 2, dark); rect(ctx, 14, 4, 1, 2, dark); rect(ctx, 1, 10, 1, 2, dark); rect(ctx, 14, 10, 1, 2, dark);
  px(ctx, 3, 12, 0xfff0a0); px(ctx, 12, 12, 0xfff0a0); px(ctx, 3, 3, 0xff6b6b); px(ctx, 12, 3, 0xff6b6b);
  hline(ctx, 5, 10, 7, body); px(ctx, 7, 8, dark); px(ctx, 8, 8, dark);
}

function drawSouvenir(kind: string): CodeDrawer {
  return (ctx) => {
    rect(ctx, 3, 13, 10, 2, 0x8d8d8d); hline(ctx, 3, 12, 15, 0x5d5d5d); // stand
    switch (kind) {
      case 'souvenir_seoul': // 남산타워
        rect(ctx, 7, 3, 2, 10, 0xbdbdbd); rect(ctx, 5, 5, 6, 2, 0x9e9e9e); px(ctx, 7, 2, 0xff5252); px(ctx, 8, 1, 0xff5252); rect(ctx, 6, 11, 4, 2, 0x7d7d7d);
        break;
      case 'souvenir_paris': // 에펠탑
        tri(ctx, [3, 13], [8, 1], [12, 13], 0x8d6e63); tri(ctx, [6, 13], [8, 6], [10, 13], 0xd8c8a8); hline(ctx, 5, 10, 8, O); hline(ctx, 4, 11, 11, O);
        break;
      case 'souvenir_cairo': // 피라미드
        tri(ctx, [2, 13], [8, 3], [14, 13], 0xe0c080); tri(ctx, [8, 3], [14, 13], [8, 13], 0xc4a464);
        break;
      case 'souvenir_newyork': // 자유의 여신상
        rect(ctx, 6, 8, 4, 5, 0x6fb7a0); rect(ctx, 7, 4, 2, 4, 0x7fc8a9); px(ctx, 6, 3, 0x7fc8a9); px(ctx, 8, 3, 0x7fc8a9); px(ctx, 10, 3, 0x7fc8a9); px(ctx, 10, 5, 0xffd166); vline(ctx, 10, 6, 8, 0x7fc8a9);
        break;
      case 'souvenir_sydney': // 오페라 하우스
        tri(ctx, [2, 13], [5, 4], [8, 13], 0xffffff); tri(ctx, [6, 13], [9, 3], [12, 13], 0xffffff); tri(ctx, [10, 13], [12, 6], [14, 13], 0xffffff); hline(ctx, 2, 13, 13, 0xd8d8d8);
        break;
      default: // 예수상
        rect(ctx, 7, 4, 2, 9, 0xf0f0f0); hline(ctx, 3, 12, 6, 0xf0f0f0); disc(ctx, 8, 3, 1.2, 0xf0f0f0); rect(ctx, 5, 11, 6, 2, 0x8d8d8d);
    }
  };
}

function drawFallback(ctx: CanvasRenderingContext2D, color = 0x888888): void {
  rect(ctx, 1, 1, 14, 14, color); rect(ctx, 0, 0, 16, 1, O); rect(ctx, 0, 15, 16, 1, O); rect(ctx, 0, 0, 1, 16, O); rect(ctx, 15, 0, 1, 16, O);
}

/**
 * Inner water corner: concentric bands around the tile corner that continue the straight shore bands of the
 * neighbouring edge tiles. Band colours are sampled from column 8 of the theme's `edge_n` cell (land, outline,
 * shore, rim, …); transparent land rows (sea block) take the ground cell's colour.
 */
function innerCorner(edgeIdx: number, groundIdx: number, corner: 'ne' | 'nw' | 'se' | 'sw'): CodeDrawer {
  return (ctx) => {
    const edge = vendorSheets.cell('rpg', edgeIdx);
    if (!edge) return;
    const ed = edge.getContext('2d')!.getImageData(0, 0, 16, 16).data;
    const ground = vendorSheets.cell('rpg', groundIdx);
    const gd = ground?.getContext('2d')!.getImageData(0, 0, 16, 16).data;
    const land = gd ? `rgb(${gd[(8 * 16 + 8) * 4]},${gd[(8 * 16 + 8) * 4 + 1]},${gd[(8 * 16 + 8) * 4 + 2]})` : null;
    const cx = corner.endsWith('e') ? 16 : 0;
    const cy = corner.startsWith('s') ? 16 : 0;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const band = Math.floor(Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
        if (band >= 8) continue; // open water → the base cell shows through
        const o = (band * 16 + 8) * 4;
        const opaque = ed[o + 3]! >= 128;
        if (!opaque && !land) continue;
        ctx.fillStyle = opaque ? `rgb(${ed[o]},${ed[o + 1]},${ed[o + 2]})` : land!;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };
}

function drawPlankLines(ctx: CanvasRenderingContext2D): void {
  hline(ctx, 0, 15, 15, 0xb08a5a); vline(ctx, 7, 0, 7, 0xb08a5a); vline(ctx, 15, 8, 14, 0xb08a5a); hline(ctx, 0, 15, 7, 0xc9a06c);
}

function drawEntranceMark(ctx: CanvasRenderingContext2D): void {
  const y = 0xffd166;
  for (let i = 0; i < 16; i += 4) { px(ctx, i, 1, y); px(ctx, i, 14, y); px(ctx, 1, i, y); px(ctx, 14, i, y); }
  tri(ctx, [5, 5], [11, 8], [5, 11], y); px(ctx, 5, 5, O); px(ctx, 5, 11, O); px(ctx, 11, 8, O);
}

/** Drawers for every {code} entry used by TILE_NAMES / ROOM_TILE_NAMES / FURNITURE_ART. */
export const CODE_TILES: Record<string, CodeDrawer> = {
  tree_palm: drawPalm,
  car: drawCar,
  fallback: drawFallback,
  blank: () => { /* fully transparent: collision-only tile */ },
  plank_lines: drawPlankLines,
  water_in_ne: innerCorner(3, 5, 'ne'), water_in_nw: innerCorner(3, 5, 'nw'), water_in_se: innerCorner(3, 5, 'se'), water_in_sw: innerCorner(3, 5, 'sw'),
  sea_in_ne: innerCorner(1265, 8, 'ne'), sea_in_nw: innerCorner(1265, 8, 'nw'), sea_in_se: innerCorner(1265, 8, 'se'), sea_in_sw: innerCorner(1265, 8, 'sw'),
  ...waterCompositeDrawers('water'),
  ...waterCompositeDrawers('sea'),
  entrance_mark: drawEntranceMark,
  souvenir_seoul: drawSouvenir('souvenir_seoul'),
  souvenir_paris: drawSouvenir('souvenir_paris'),
  souvenir_cairo: drawSouvenir('souvenir_cairo'),
  souvenir_newyork: drawSouvenir('souvenir_newyork'),
  souvenir_sydney: drawSouvenir('souvenir_sydney'),
  souvenir_rio: drawSouvenir('souvenir_rio'),
  ...ICON_DRAWERS,
};

// ---------------------------------------------------------------- atlas construction (Boot, once)

/** Atlases built by Boot; scenes read frames through these (null before Boot). */
export const atlases: { tiles: BuiltAtlas | null; room: BuiltAtlas | null } = { tiles: null, room: null };

function resolveAll(names: Record<string, TileEntry>): Map<string, HTMLCanvasElement | null> {
  const out = new Map<string, HTMLCanvasElement | null>();
  for (const [name, entry] of Object.entries(names)) {
    let cell = resolveEntry(entry, CODE_TILES);
    // sheet not installed → flat colour stand-in (the pink "missing" cell is reserved for names with no mapping)
    if (!cell && !vendorSheets.complete) cell = fallbackCell(name);
    out.set(name, cell);
  }
  return out;
}

export function buildTileAtlases(scene: Phaser.Scene): { tiles: BuiltAtlas; room: BuiltAtlas } {
  if (atlases.tiles && atlases.room && scene.textures.exists(TEX.tiles) && scene.textures.exists(TEX.room)) return { tiles: atlases.tiles, room: atlases.room };
  const tiles = buildAtlas(scene, TEX.tiles, resolveAll(TILE_NAMES), { scale: TILE_SCALE, columns: 32 });
  const room = buildAtlas(scene, TEX.room, resolveAll(ROOM_TILE_NAMES), { scale: ROOM_SCALE, columns: 16 });
  atlases.tiles = tiles;
  atlases.room = room;
  return { tiles, room };
}

/** `fur:<itemId>` textures at 3× (spec 5.10): grids of room cells or code-drawn souvenirs. */
export function registerFurnitureTextures(scene: Phaser.Scene): void {
  for (const item of ITEMS) {
    if (item.slot !== 'furniture') continue;
    const key = TEX.furniture(item.id);
    if (scene.textures.exists(key)) continue;
    const size = item.size ?? { w: 1, h: 1 };
    const art = FURNITURE_ART[item.id] ?? { code: 'fallback' };
    const { canvas, ctx } = makeCanvas(size.w * 16, size.h * 16);
    if ('grid' in art) {
      art.grid.forEach((row, gy) => row.forEach((name, gx) => {
        const entry = ROOM_TILE_NAMES[name];
        const cell = (entry && resolveEntry(entry, CODE_TILES)) ?? fallbackCell(name);
        ctx.drawImage(cell, gx * 16, gy * 16);
      }));
    } else {
      const drawer = CODE_TILES[art.code] ?? CODE_TILES.fallback!;
      const cell = makeCanvas(16, 16);
      drawer(cell.ctx, item.color);
      ctx.drawImage(cell.canvas, 0, 0, 16, 16, 0, 0, size.w * 16, size.h * 16);
    }
    registerImage(scene, key, scaleCanvas(canvas, ROOM_SCALE));
  }
}
