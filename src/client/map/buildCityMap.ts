// CityDef.rows → Phaser Tilemap with collisions + entrance zone (spec 6.1).
import Phaser from 'phaser';
import type { CityDef, TilePos } from '../../shared/types';
import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from '../../shared/constants';
import { rowsToGrid, SOLID_TILE_IDS } from '../../shared/content/tiles';
import { TEX } from '../assets/manifest';

export interface CityMap {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
  entrance: Phaser.GameObjects.Zone;
}

export const tileCenter = (p: TilePos): { x: number; y: number } => ({ x: p.tx * TILE_SIZE + TILE_SIZE / 2, y: p.ty * TILE_SIZE + TILE_SIZE / 2 });

export function buildCityMap(scene: Phaser.Scene, city: CityDef): CityMap {
  const data = rowsToGrid(city.rows);
  const map = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
  const tileset = map.addTilesetImage(TEX.tiles, TEX.tiles, TILE_SIZE, TILE_SIZE, 0, 0);
  if (!tileset) throw new Error('tileset missing');
  const layer = map.createLayer(0, tileset, 0, 0);
  if (!layer) throw new Error('layer creation failed');
  layer.setCollision([...SOLID_TILE_IDS]);
  layer.setDepth(0);

  scene.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

  const c = tileCenter(city.entrance);
  const entrance = scene.add.zone(c.x, c.y, TILE_SIZE, TILE_SIZE);
  scene.physics.add.existing(entrance, true);

  return { map, layer, entrance };
}
