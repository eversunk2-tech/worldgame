// Minimap (spec 6.4): 40×30 tiles × 4 px static texture per city + player dot, NPC dots, entrance, camera rect.
import Phaser from 'phaser';
import type { CityDef } from '../../shared/types';
import { MAP_COLS, MAP_ROWS, MINIMAP_SCALE, TILE_SIZE } from '../../shared/constants';
import { tileForChar } from '../../shared/content/tiles';
import { rockVariant } from '../../shared/map/autotile';
import { tileCenter } from '../map/buildCityMap';

const W = MAP_COLS * MINIMAP_SCALE; // 160
const H = MAP_ROWS * MINIMAP_SCALE; // 120

/** Colour table (spec 5.3). */
function colorFor(city: CityDef, ch: string, tx: number, ty: number): number {
  const theme = city.theme;
  switch (ch) {
    case '.': return theme.ground === 'sand' ? 0xe6d5a0 : 0x5fa84a;
    case ',': return 0x3f8a3a;
    case '=': case 'E': case 'x': return theme.road === 'asphalt' ? 0x555a66 : 0xc9b48a;
    case '-': return 0xbdbdbd;
    case '~': return theme.water === 'sea' ? 0x2a6fbf : 0x3a7bd5;
    case 'B': return 0x9c6b3c;
    case 'T': case 'p': case 'Y': return 0x2e7d32;
    case 'R': return rockVariant(city.rows, tx, ty) === 'hill' ? 0x6d6d6d : 0x7d7d7d;
    case '#': return 0xa0443c;
    case 'S': return 0xe6d5a0;
    case 's': return 0xcbb77f;
    case 'F': return 0x8a6b3c;
    case 'P': return 0xffd166;
    case 'W': case 'f': return 0x8a8a8a;
    case 'Q': return 0xdcd3c0;
    case 'd': return 0xb08a5a;
    case '*': return 0x5fa84a;
    default: return tileForChar(ch)?.solid ? 0x6d6d6d : 0x5fa84a;
  }
}

export class Minimap extends Phaser.GameObjects.Container {
  private readonly playerDot: Phaser.GameObjects.Rectangle;
  private readonly view: Phaser.GameObjects.Graphics;
  private shown = true;

  constructor(scene: Phaser.Scene, x: number, y: number, city: CityDef) {
    super(scene, x, y);
    const key = `minimap:${city.id}`;
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      city.rows.forEach((row, ty) => {
        for (let tx = 0; tx < row.length; tx++) {
          g.fillStyle(colorFor(city, row[tx]!, tx, ty), 1);
          g.fillRect(tx * MINIMAP_SCALE, ty * MINIMAP_SCALE, MINIMAP_SCALE, MINIMAP_SCALE);
        }
      });
      g.generateTexture(key, W, H);
      g.destroy();
    }
    const frame = scene.add.rectangle(-2, -2, W + 4, H + 4, 0x1b1b2f, 0.9).setOrigin(0, 0).setStrokeStyle(2, 0x8f9bff, 1);
    const img = scene.add.image(0, 0, key).setOrigin(0, 0);
    this.add([frame, img]);
    for (const npc of city.npcs) {
      const c = tileCenter(npc.at);
      this.add(scene.add.rectangle(c.x / TILE_SIZE * MINIMAP_SCALE, c.y / TILE_SIZE * MINIMAP_SCALE, 2, 2, 0x3d7bd6, 1));
    }
    const e = tileCenter(city.entrance);
    this.add(scene.add.rectangle(e.x / TILE_SIZE * MINIMAP_SCALE, e.y / TILE_SIZE * MINIMAP_SCALE, 2, 2, 0xffffff, 1));
    this.view = scene.add.graphics();
    this.playerDot = scene.add.rectangle(0, 0, 3, 3, 0xffd166, 1);
    this.add([this.view, this.playerDot]);
    scene.add.existing(this);
  }

  /** Per-frame: player position and camera viewport (world px). */
  override update(px: number, py: number, cam: Phaser.Cameras.Scene2D.Camera): void {
    if (!this.shown) return;
    const k = MINIMAP_SCALE / TILE_SIZE;
    this.playerDot.setPosition(Math.round(px * k), Math.round(py * k));
    this.view.clear();
    this.view.lineStyle(1, 0xffffff, 0.6);
    this.view.strokeRect(Math.round(cam.scrollX * k) + 0.5, Math.round(cam.scrollY * k) + 0.5, Math.round(cam.width / cam.zoom * k), Math.round(cam.height / cam.zoom * k));
  }

  toggle(): boolean {
    this.shown = !this.shown;
    this.setVisible(this.shown);
    return this.shown;
  }

  get isShown(): boolean {
    return this.shown;
  }

  static get width(): number { return W; }
  static get height(): number { return H; }
}
