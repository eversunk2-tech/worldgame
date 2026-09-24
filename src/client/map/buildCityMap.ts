// CityDef.rows → 3 Tilemap layers on the tile atlas (spec 5.3): ground (theme ground, roads, water, bridges),
// deco (flowers, entrance mark, crosswalks) and objects (every solid tile, with collision). Landmarks are sprites
// y-sorted with the actors. Built once per city entry; nothing here runs per frame.
import Phaser from 'phaser';
import type { CityDef, TilePos } from '../../shared/types';
import { MAP_COLS, MAP_HEIGHT, MAP_ROWS, MAP_WIDTH, TILE_SIZE } from '../../shared/constants';
import { tileForChar } from '../../shared/content/tiles';
import {
  bridgeVariant, crosswalkVariant, fenceVariant, groundVariant, hash, roadMask, roadVariant, rockVariant, waterMask, waterVariant,
} from '../../shared/map/autotile';
import { buildingParts, findBuildings } from '../../shared/map/buildings';
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
      let ground = themeGround(tx, ty);
      let deco = EMPTY;
      let obj = objIdx[ty]![tx]!;
      switch (ch) {
        case ',': ground = f('dark_grass'); break;
        case 'S': ground = f(groundVariant(tx, ty) === 'alt' ? 'sand_2' : 'sand'); break;
        case 's': ground = f('dark_sand'); break;
        case 'F': ground = f('farm'); break;
        case 'd': ground = f('dirt'); break;
        case '-': ground = f('sidewalk'); break;
        case 'Q': ground = f('plaza'); break;
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
        case 'B': ground = f(bridgeVariant(rows, tx, ty) === 'h' ? 'bridge_h' : 'bridge_v'); break;
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

  return { map, ground, deco, objects, layer: objects, entrance, landmarks };
}
