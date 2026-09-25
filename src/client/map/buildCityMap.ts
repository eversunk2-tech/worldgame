// CityDef.rows → 3 Tilemap layers on the tile atlas (spec 5.3): ground (floors, roads, water, bridges; under solid
// tiles the neighbours' most common floor, one floor per landmark footprint — shared/map/floor.ts),
// deco (flowers, entrance mark, crosswalks) and objects (every solid tile, with collision). Landmarks are sprites
// y-sorted with the actors; asphalt bridges get railings (a Graphics under the overlays). Built once per city entry;
// nothing here runs per frame.
import Phaser from 'phaser';
import type { CityDef, TilePos } from '../../shared/types';
import { MAP_COLS, MAP_HEIGHT, MAP_ROWS, MAP_WIDTH, TILE_SIZE } from '../../shared/constants';
import { tileForChar } from '../../shared/content/tiles';
import {
  bridgeVariant, crosswalkVariant, fenceVariant, groundVariant, hash, roadMask, roadVariant, rockVariant, waterMask, waterVariant,
} from '../../shared/map/autotile';
import { buildingParts, findBuildings } from '../../shared/map/buildings';
import { floorUnder } from '../../shared/map/floor';
import type { BuiltAtlas } from '../assets/atlasBuilder';
import { TEX } from '../assets/manifest';
import { atlases, buildingFrame, buildingVariantCount, groundNames, roadName, treeName, wallName, waterNames, type BuildingPartFrame } from '../assets/tileAtlas';

export interface CityMap {
  map: Phaser.Tilemaps.Tilemap;
  ground: Phaser.Tilemaps.TilemapLayer;
  deco: Phaser.Tilemaps.TilemapLayer;
  objects: Phaser.Tilemaps.TilemapLayer;
  /** Collision layer (objects) — kept under the v0.1 name so callers read the returned layer (review low #10). */
  layer: Phaser.Tilemaps.TilemapLayer;
  entrance: Phaser.GameObjects.Zone;
  landmarks: Phaser.GameObjects.Image[];
}

export const tileCenter = (p: TilePos): { x: number; y: number } => ({ x: p.tx * TILE_SIZE + TILE_SIZE / 2, y: p.ty * TILE_SIZE + TILE_SIZE / 2 });

const EMPTY = -1;

function grid(): number[][] {
  return Array.from({ length: MAP_ROWS }, () => Array<number>(MAP_COLS).fill(EMPTY));
}

/** First frame name that exists in the atlas, else the last candidate (pink cell = visible mapping bug). */
function pick(atlas: BuiltAtlas, ...names: string[]): number {
  for (const n of names) { const i = atlas.frameIndex(n); if (i >= 0) return i; }
  console.warn(`[map] no frame for ${names.join(' | ')}`);
  return atlas.frameIndex(atlas.names[0] ?? '');
}

export function buildCityMap(scene: Phaser.Scene, city: CityDef): CityMap {
  const atlas = atlases.tiles;
  if (!atlas) throw new Error('tile atlas not built (Boot must run first)');
  const rows = city.rows;
  const theme = city.theme;
  const g = groundNames(theme);
  const groundIdx = grid();
  const decoIdx = grid();
  const objIdx = grid();
  const f = (...names: string[]) => pick(atlas, ...names);
  const themeGround = (tx: number, ty: number): number => {
    const v = groundVariant(tx, ty);
    return f(v === 'base' ? g.base : v === 'alt' ? g.alt : g.flower);
  };
  /** Ground frame of a floor char; grass, flowers and anything else take the theme ground. */
  const floorFrame = (ch: string, tx: number, ty: number): number => {
    switch (ch) {
      case ',': return f('dark_grass');
      case 'S': return f(groundVariant(tx, ty) === 'alt' ? 'sand_2' : 'sand');
      case 's': return f('dark_sand');
      case 'F': return f('farm');
      case 'd': return f('dirt');
      case '-': return f('sidewalk');
      case 'Q': return f('plaza');
      default: return themeGround(tx, ty);
    }
  };

  // buildings: rectangles → parts, one palette variant per building
  const { rects } = findBuildings(rows);
  const style = theme.building;
  for (const b of rects) {
    const variant = hash(b.x0, b.y0) % buildingVariantCount(style);
    for (const part of buildingParts(b)) {
      // doors/windows on the outer columns are composed on the bordered wall_l / wall_r cells
      const dx = part.tx - b.x0;
      const edge = (part.part === 'door' || part.part === 'window') && b.w >= 2 ? (dx === 0 ? '_l' : dx === b.w - 1 ? '_r' : '') : '';
      objIdx[part.ty]![part.tx] = f(buildingFrame(style, `${part.part}${edge}` as BuildingPartFrame, variant));
    }
  }

  for (let ty = 0; ty < MAP_ROWS; ty++) {
    const row = rows[ty] ?? '';
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const ch = row[tx] ?? '.';
      const info = tileForChar(ch);
      if (!info) continue;
      // solid tiles (houses, lamps, benches, trees, …) show their neighbours' floor through transparent pixels instead
      // of always the theme ground (review Stage C M5); a tie takes the theme ground and a landmark footprint one floor
      // from the ring around it (re-review N2); water and parked cars keep their own ground below
      const under = info.solid && ch !== '~' && ch !== 'v' ? floorUnder(rows, tx, ty) : null;
      let ground = floorFrame(under ?? ch, tx, ty);
      let deco = EMPTY;
      let obj = objIdx[ty]![tx]!;
      switch (ch) {
        case '=':
        case 'E':
        case 'x': {
          ground = f(roadName(theme.road, roadVariant(roadMask(rows, tx, ty))));
          if (ch === 'E') deco = f('deco_entrance');
          if (ch === 'x') deco = f(crosswalkVariant(rows, tx, ty) === 'h' ? 'crosswalk_h' : 'crosswalk_v');
          break;
        }
        case '~': {
          ground = f(...waterNames(theme, waterVariant(waterMask(rows, tx, ty))));
          obj = f('blank_solid');
          break;
        }
        // bridges carry the theme's road: asphalt cities (New York, Sydney) get an asphalt deck that joins the streets —
        // the Harbour Bridge overlay adds footpaths and arches on top (review Stage C L11); other themes keep planks
        case 'B': ground = theme.road === 'asphalt' ? f(roadName(theme.road, roadVariant(roadMask(rows, tx, ty)))) : f(bridgeVariant(rows, tx, ty) === 'h' ? 'bridge_h' : 'bridge_v'); break;
        case '*': deco = f(hash(tx, ty) % 2 === 0 ? 'flower_a' : 'flower_b'); break;
        case 'T': obj = f(treeName(theme.tree)); break;
        case 'Y': obj = f(treeName(theme.streetTree)); break;
        case 'p': obj = f('tree_palm'); break;
        case 'R': obj = f(rockVariant(rows, tx, ty) === 'hill' ? 'hill' : hash(tx, ty) % 3 === 0 ? 'rock_2' : 'rock'); break;
        case 'W': obj = f(wallName(theme)); break;
        case 'f': { const v = fenceVariant(rows, tx, ty); obj = f(v === 'h' ? 'fence_h' : v === 'v' ? 'fence_v' : 'fence_post'); break; }
        case 'b': obj = f('bench'); break;
        case 'l': obj = f('lamp'); break;
        case 't': obj = f('cafe_table'); break;
        case 'm': obj = f(hash(tx, ty) % 2 === 0 ? 'stall_red' : 'stall_blue'); break;
        case 'v': { ground = f('sidewalk'); obj = f(['car_yellow', 'car_red', 'car_blue'][hash(tx, ty) % 3]!); break; }
        case 'P': obj = f('blank_solid'); break;
        case '#': break; // parts already placed
        default: break;
      }
      groundIdx[ty]![tx] = ground;
      decoIdx[ty]![tx] = deco;
      objIdx[ty]![tx] = obj;
    }
  }

  const map = scene.make.tilemap({ tileWidth: TILE_SIZE, tileHeight: TILE_SIZE, width: MAP_COLS, height: MAP_ROWS });
  const tileset = map.addTilesetImage(atlas.key, atlas.key, atlas.cellSize, atlas.cellSize, atlas.margin, atlas.spacing);
  if (!tileset) throw new Error('tileset missing');
  const mk = (name: string, data: number[][], depth: number): Phaser.Tilemaps.TilemapLayer => {
    const layer = map.createBlankLayer(name, tileset, 0, 0);
    if (!layer) throw new Error(`layer ${name} creation failed`);
    layer.putTilesAt(data, 0, 0);
    layer.setDepth(depth);
    return layer;
  };
  const ground = mk('ground', groundIdx, 0);
  const deco = mk('deco', decoIdx, 1);
  const objects = mk('objects', objIdx, 2);
  objects.setCollisionByExclusion([EMPTY]);

  scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

  const c = tileCenter(city.entrance);
  const entrance = scene.add.zone(c.x, c.y, TILE_SIZE, TILE_SIZE);
  scene.physics.add.existing(entrance, true);

  const landmarks: Phaser.GameObjects.Image[] = [];
  for (const lm of city.landmarks) {
    const key = TEX.landmark(lm.kind);
    if (!scene.textures.exists(key)) continue;
    const over = lm.overhang ?? 0;
    const img = scene.add.image(lm.at.tx * TILE_SIZE, (lm.at.ty - over) * TILE_SIZE, key).setOrigin(0, 0);
    img.setDepth(lm.solid === false ? 1.5 : (lm.at.ty + lm.h) * TILE_SIZE);
    landmarks.push(img);
  }

  if (theme.road === 'asphalt') drawBridgeRails(scene, rows);

  return { map, ground, deco, objects, layer: objects, entrance, landmarks };
}

/** Railing colours: light top rail and posts, dark shadow line on the deck side. */
const RAIL = 0xd2d7dd;
const RAIL_SHADE = 0x4b5058;

/**
 * Asphalt bridges read as bridges, not as a road on the water (re-review N5): every 'B' edge that faces water gets a
 * grey railing — a 1-art-pixel light rail on the edge, a 1-pixel shadow on the deck side and a post every 8 art pixels.
 * New York's east entrance gets rails on its north and south edges, the Harbour Bridge deck on its west and east edges
 * (its overlay at depth 1.5 draws over them). Depth 1.2: above the deco layer, under overlays, objects and actors.
 */
function drawBridgeRails(scene: Phaser.Scene, rows: readonly string[]): void {
  const g = scene.add.graphics().setDepth(1.2);
  const T = TILE_SIZE;
  const U = TILE_SIZE / 16; // one art pixel
  const water = (tx: number, ty: number) => rows[ty]?.[tx] === '~';
  for (let ty = 0; ty < rows.length; ty++) {
    for (let tx = 0; tx < rows[ty]!.length; tx++) {
      if (rows[ty]![tx] !== 'B') continue;
      const x = tx * T;
      const y = ty * T;
      // horizontal rails (water to the north / south)
      for (const [dy, edge, inner] of [[-1, y, y + U], [1, y + T - U, y + T - 2 * U]] as const) {
        if (!water(tx, ty + dy)) continue;
        g.fillStyle(RAIL_SHADE).fillRect(x, inner, T, U);
        g.fillStyle(RAIL).fillRect(x, edge, T, U);
        for (const px of [3, 11]) g.fillRect(x + px * U, Math.min(edge, inner), U * 2, U * 2);
      }
      // vertical rails (water to the west / east)
      for (const [dx, edge, inner] of [[-1, x, x + U], [1, x + T - U, x + T - 2 * U]] as const) {
        if (!water(tx + dx, ty)) continue;
        g.fillStyle(RAIL_SHADE).fillRect(inner, y, U, T);
        g.fillStyle(RAIL).fillRect(edge, y, U, T);
        for (const py of [3, 11]) g.fillRect(Math.min(edge, inner), y + py * U, U * 2, U * 2);
      }
    }
  }
}
