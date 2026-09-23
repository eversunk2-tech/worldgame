// Code-generated pixel-art placeholders (spec 6.10). Every texture the game needs is drawn here on a Canvas
// and registered with Phaser; manifest.ts decides whether a real file replaces it.
import Phaser from 'phaser';
import type { Facing, ItemDef, MonsterDef } from '../../shared/types';
import { TILES } from '../../shared/content/tiles';
import { ITEMS } from '../../shared/content/items';
import { ALL_MONSTERS } from '../../shared/content/monsters';
import { CONTINENT_LABELS, lonLatToXY, WORLD_H, WORLD_W } from '../../shared/content/continents';
import { CHAR_COLS, CHAR_FRAME, CHAR_ROWS, CHAR_SHEET_H, CHAR_SHEET_W, FACING_ROWS, TEX } from './manifest';

type Ctx = CanvasRenderingContext2D;

/** Layer canvases kept so avatarCompositor can composite them without re-drawing. */
export const LAYER_CANVASES = new Map<string, HTMLCanvasElement>();

export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

export function shade(c: number, f: number): number {
  const r = Math.max(0, Math.min(255, Math.round(((c >> 16) & 0xff) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((c >> 8) & 0xff) * f)));
  const b = Math.max(0, Math.min(255, Math.round((c & 0xff) * f)));
  return (r << 16) | (g << 8) | b;
}

const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, c: number | string): void => {
  ctx.fillStyle = typeof c === 'number' ? hex(c) : c;
  ctx.fillRect(x, y, w, h);
};
const circle = (ctx: Ctx, cx: number, cy: number, r: number, c: number | string): void => {
  ctx.fillStyle = typeof c === 'number' ? hex(c) : c;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
};
const tri = (ctx: Ctx, pts: [number, number][], c: number | string): void => {
  ctx.fillStyle = typeof c === 'number' ? hex(c) : c;
  ctx.beginPath();
  ctx.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0], pts[i]![1]);
  ctx.closePath();
  ctx.fill();
};

/** Register a canvas as a texture with fixed-size frames numbered 0..n-1 (row-major). Skips if it already exists. */
export function registerSheet(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement, fw: number, fh: number): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.addCanvas(key, canvas);
  if (!tex) return;
  const cols = Math.floor(canvas.width / fw);
  const rows = Math.floor(canvas.height / fh);
  let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tex.add(i++, 0, c * fw, r * fh, fw, fh);
}

export function registerImage(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, canvas);
}

// ---------------------------------------------------------------- tiles

function drawTile(ctx: Ctx, id: number, y: number): void {
  const T = 32;
  const grass = 0x5fa84a;
  const dots = (c: number, seed: number) => {
    for (let i = 0; i < 6; i++) {
      const px = (i * 7 + seed * 3) % 28 + 2;
      const py = (i * 11 + seed * 5) % 28 + 2;
      rect(ctx, px, y + py, 2, 2, c);
    }
  };
  switch (id) {
    case 0: rect(ctx, 0, y, T, T, grass); dots(0x4f9440, 1); break;
    case 1: rect(ctx, 0, y, T, T, 0x3f8a3a); dots(0x2f6f2c, 2); dots(0x4f9a44, 5); break;
    case 2: rect(ctx, 0, y, T, T, 0xc9b48a); dots(0xb9a47a, 3); break;
    case 3: {
      rect(ctx, 0, y, T, T, 0x3a7bd5);
      ctx.strokeStyle = hex(0x6aa5ec); ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const wy = y + 6 + i * 10;
        ctx.moveTo(2, wy); ctx.lineTo(8, wy - 2); ctx.lineTo(14, wy); ctx.lineTo(20, wy - 2); ctx.lineTo(26, wy); ctx.lineTo(30, wy - 2);
        ctx.stroke();
      }
      break;
    }
    case 4: {
      rect(ctx, 0, y, T, T, 0x9c6b3c);
      for (let i = 0; i < 4; i++) rect(ctx, 0, y + i * 8 + 6, T, 2, 0x7a5028);
      rect(ctx, 0, y, 3, T, 0x6b4520); rect(ctx, T - 3, y, 3, T, 0x6b4520);
      break;
    }
    case 5: {
      rect(ctx, 0, y, T, T, grass);
      rect(ctx, 14, y + 20, 4, 10, 0x6b4520);
      circle(ctx, 16, y + 14, 11, 0x2e7d32);
      circle(ctx, 13, y + 11, 6, 0x43a047);
      break;
    }
    case 6: {
      rect(ctx, 0, y, T, T, 0x7d7d7d);
      tri(ctx, [[2, y + 30], [12, y + 8], [22, y + 30]], 0x9a9a9a);
      tri(ctx, [[14, y + 30], [24, y + 12], [31, y + 30]], 0x6a6a6a);
      rect(ctx, 0, y + 28, T, 4, 0x5d5d5d);
      break;
    }
    case 7: {
      rect(ctx, 0, y, T, T, 0xd8c8a8);
      rect(ctx, 0, y, T, 12, 0xa0443c);
      rect(ctx, 0, y + 10, T, 2, 0x7a2e28);
      rect(ctx, 6, y + 16, 7, 7, 0x8ec5ff); rect(ctx, 19, y + 16, 7, 7, 0x8ec5ff);
      rect(ctx, 13, y + 24, 6, 8, 0x6b4520);
      break;
    }
    case 8: rect(ctx, 0, y, T, T, 0xe6d5a0); dots(0xd6c590, 4); break;
    case 9: rect(ctx, 0, y, T, T, 0xcbb77f); dots(0xbba76f, 6); break;
    case 10: {
      rect(ctx, 0, y, T, T, 0x8a6b3c);
      for (let i = 0; i < 4; i++) rect(ctx, 0, y + i * 8 + 2, T, 3, 0x6e5230);
      for (let i = 0; i < 4; i++) rect(ctx, i * 8 + 3, y + 5, 2, 2, 0x6fbf5a);
      break;
    }
    case 11: {
      rect(ctx, 0, y, T, T, grass);
      rect(ctx, 15, y + 16, 3, 14, 0x8d6e63);
      circle(ctx, 16, y + 11, 9, 0x66bb6a);
      circle(ctx, 19, y + 8, 4, 0x81c784);
      break;
    }
    case 12: {
      rect(ctx, 0, y, T, T, 0xe6d5a0);
      rect(ctx, 6, y + 26, 20, 4, 0x8d8d8d);
      tri(ctx, [[8, y + 26], [16, y + 2], [24, y + 26]], 0xb0a090);
      rect(ctx, 14, y + 14, 4, 12, 0x8d7d6d);
      rect(ctx, 15, y + 0, 2, 4, 0xffd166);
      break;
    }
    case 13: {
      rect(ctx, 0, y, T, T, 0x8a8a8a);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const off = r % 2 === 0 ? 0 : 4;
          rect(ctx, c * 8 + off + 1, y + r * 8 + 1, 6, 6, 0xa3a3a3);
        }
      }
      break;
    }
    case 14: {
      rect(ctx, 0, y, T, T, 0xc9b48a);
      ctx.strokeStyle = hex(0xffd166); ctx.lineWidth = 2;
      ctx.strokeRect(3, y + 3, 26, 26);
      tri(ctx, [[8, y + 10], [24, y + 16], [8, y + 22]], 0xffd166);
      break;
    }
    case 15: {
      rect(ctx, 0, y, T, T, grass);
      const cols = [0xff6b6b, 0xffd166, 0xf8a5ff, 0xffffff];
      [[7, 8], [21, 6], [12, 20], [24, 22]].forEach(([px, py], i) => {
        circle(ctx, px!, y + py!, 3, cols[i % cols.length]!);
        rect(ctx, px! - 1, y + py! - 1, 2, 2, 0xffe680);
      });
      break;
    }
    default: rect(ctx, 0, y, T, T, 0xff00ff);
  }
}

export function createTilesTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.tiles)) return;
  const { canvas, ctx } = makeCanvas(32, 32 * TILES.length);
  for (const t of TILES) drawTile(ctx, t.id, t.id * 32);
  registerSheet(scene, TEX.tiles, canvas, 32, 32);
}

// ---------------------------------------------------------------- characters

const FACINGS: Facing[] = ['down', 'left', 'right', 'up'];

function eyes(ctx: Ctx, ox: number, oy: number, facing: Facing, color = 0x222222): void {
  if (facing === 'up') return;
  const y = oy + 11;
  const xs = facing === 'down' ? [13, 18] : facing === 'left' ? [11, 15] : [16, 20];
  for (const x of xs) rect(ctx, ox + x, y, 2, 2, color);
}

function drawBody(ctx: Ctx, ox: number, oy: number, facing: Facing, frame: number, skin: number): void {
  const dark = shade(skin, 0.8);
  const swing = frame === 1 ? 0 : frame === 0 ? 1 : -1;
  // legs (pants) — walk cycle alternates
  rect(ctx, ox + 12, oy + 24 + (swing > 0 ? 0 : 1), 3, 7 - (swing > 0 ? 0 : 1), 0x2c3e6b);
  rect(ctx, ox + 17, oy + 24 + (swing < 0 ? 0 : 1), 3, 7 - (swing < 0 ? 0 : 1), 0x2c3e6b);
  rect(ctx, ox + 12, oy + 30, 3, 2, 0x3b2b1b);
  rect(ctx, ox + 17, oy + 30, 3, 2, 0x3b2b1b);
  // arms
  rect(ctx, ox + 9, oy + 17 + swing, 2, 7, skin);
  rect(ctx, ox + 21, oy + 17 - swing, 2, 7, skin);
  // torso
  rect(ctx, ox + 11, oy + 16, 10, 9, skin);
  // neck + head
  rect(ctx, ox + 14, oy + 15, 4, 2, dark);
  circle(ctx, ox + 16, oy + 10, 6.5, skin);
  eyes(ctx, ox, oy, facing);
  if (facing === 'down') rect(ctx, ox + 15, oy + 14, 2, 1, dark);
}

function drawTop(ctx: Ctx, ox: number, oy: number, facing: Facing, frame: number, item: ItemDef): void {
  const c = item.color;
  const swing = frame === 1 ? 0 : frame === 0 ? 1 : -1;
  const light = shade(c, 1.25);
  const dark = shade(c, 0.75);
  switch (item.shape) {
    case 'hoodie':
      rect(ctx, ox + 9, oy + 14, 14, 3, dark); // hood behind neck
      rect(ctx, ox + 10, oy + 17, 12, 8, c);
      rect(ctx, ox + 8, oy + 17 + swing, 3, 5, c);
      rect(ctx, ox + 21, oy + 17 - swing, 3, 5, c);
      rect(ctx, ox + 12, oy + 22, 8, 2, dark); // pocket
      break;
    case 'hanbok':
      rect(ctx, ox + 10, oy + 17, 12, 5, c);
      rect(ctx, ox + 8, oy + 17 + swing, 3, 5, c);
      rect(ctx, ox + 21, oy + 17 - swing, 3, 5, c);
      rect(ctx, ox + 9, oy + 22, 14, 7, light); // skirt
      if (facing === 'down') { rect(ctx, ox + 14, oy + 18, 4, 2, 0xffffff); rect(ctx, ox + 13, oy + 20, 2, 3, 0xffffff); }
      break;
    case 'stripes':
      rect(ctx, ox + 10, oy + 17, 12, 8, 0xffffff);
      rect(ctx, ox + 8, oy + 17 + swing, 3, 5, 0xffffff);
      rect(ctx, ox + 21, oy + 17 - swing, 3, 5, 0xffffff);
      for (let i = 0; i < 4; i++) rect(ctx, ox + 8, oy + 18 + i * 2, 16, 1, c);
      break;
    default: // tshirt
      rect(ctx, ox + 10, oy + 17, 12, 8, c);
      rect(ctx, ox + 8, oy + 17 + swing, 3, 4, c);
      rect(ctx, ox + 21, oy + 17 - swing, 3, 4, c);
      if (facing === 'down') rect(ctx, ox + 14, oy + 17, 4, 1, light);
  }
}

function drawHair(ctx: Ctx, ox: number, oy: number, facing: Facing, item: ItemDef): void {
  const c = item.color;
  const light = shade(c, 1.3);
  const back = facing === 'up';
  switch (item.shape) {
    case 'long':
      rect(ctx, ox + 10, oy + 4, 12, 6, c);
      rect(ctx, ox + 9, oy + 6, 2, 12, c);
      rect(ctx, ox + 21, oy + 6, 2, 12, c);
      if (back) rect(ctx, ox + 10, oy + 8, 12, 10, c);
      if (facing === 'left') rect(ctx, ox + 19, oy + 8, 4, 10, c);
      if (facing === 'right') rect(ctx, ox + 9, oy + 8, 4, 10, c);
      rect(ctx, ox + 12, oy + 5, 3, 1, light);
      break;
    case 'curly':
      [[11, 6], [15, 4], [19, 5], [22, 8], [10, 9], [16, 7]].forEach(([x, y]) => circle(ctx, ox + x!, oy + y!, 3, c));
      if (back) rect(ctx, ox + 10, oy + 8, 12, 6, c);
      circle(ctx, ox + 14, oy + 5, 1.5, light);
      break;
    case 'pony':
      rect(ctx, ox + 10, oy + 4, 12, 6, c);
      if (back) { rect(ctx, ox + 10, oy + 8, 12, 5, c); rect(ctx, ox + 14, oy + 11, 4, 9, c); }
      if (facing === 'left') rect(ctx, ox + 20, oy + 7, 3, 10, c);
      if (facing === 'right') rect(ctx, ox + 9, oy + 7, 3, 10, c);
      rect(ctx, ox + 12, oy + 5, 3, 1, light);
      break;
    default: // short
      rect(ctx, ox + 10, oy + 4, 12, 6, c);
      rect(ctx, ox + 9, oy + 6, 2, 4, c);
      rect(ctx, ox + 21, oy + 6, 2, 4, c);
      if (back) rect(ctx, ox + 10, oy + 8, 12, 5, c);
      rect(ctx, ox + 12, oy + 5, 3, 1, light);
  }
}

function drawHat(ctx: Ctx, ox: number, oy: number, facing: Facing, item: ItemDef): void {
  const c = item.color;
  const dark = shade(c, 0.7);
  switch (item.shape) {
    case 'gat':
      rect(ctx, ox + 5, oy + 6, 22, 2, c);
      rect(ctx, ox + 12, oy + 0, 8, 7, c);
      rect(ctx, ox + 13, oy + 1, 2, 5, 0x444444);
      break;
    case 'beret':
      ctx.fillStyle = hex(c);
      ctx.beginPath(); ctx.ellipse(ox + 16, oy + 5, 8, 4, -0.2, 0, Math.PI * 2); ctx.fill();
      rect(ctx, ox + 16, oy + 1, 2, 2, dark);
      break;
    case 'crown':
      rect(ctx, ox + 10, oy + 4, 12, 4, c);
      tri(ctx, [[ox + 10, oy + 4], [ox + 12, oy + 0], [ox + 14, oy + 4]], c);
      tri(ctx, [[ox + 14, oy + 4], [ox + 16, oy + 0], [ox + 18, oy + 4]], c);
      tri(ctx, [[ox + 18, oy + 4], [ox + 20, oy + 0], [ox + 22, oy + 4]], c);
      rect(ctx, ox + 15, oy + 5, 2, 2, 0xff4d6d);
      break;
    default: // cap
      rect(ctx, ox + 10, oy + 3, 12, 5, c);
      rect(ctx, ox + 11, oy + 1, 10, 2, c);
      if (facing === 'down') rect(ctx, ox + 9, oy + 7, 14, 2, dark);
      else if (facing === 'left') rect(ctx, ox + 5, oy + 7, 9, 2, dark);
      else if (facing === 'right') rect(ctx, ox + 18, oy + 7, 9, 2, dark);
      else rect(ctx, ox + 10, oy + 7, 12, 1, dark);
  }
}

/** Draw one 96×128 layer sheet (3 walk frames × 4 facings). */
function drawLayerSheet(draw: (ctx: Ctx, ox: number, oy: number, facing: Facing, frame: number) => void): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(CHAR_SHEET_W, CHAR_SHEET_H);
  for (const facing of FACINGS) {
    const row = FACING_ROWS[facing];
    for (let frame = 0; frame < CHAR_COLS; frame++) {
      draw(ctx, frame * CHAR_FRAME, row * CHAR_FRAME, facing, frame);
    }
  }
  return canvas;
}

export function createLayerTextures(scene: Phaser.Scene): void {
  for (const item of ITEMS) {
    if (item.slot === 'furniture') continue;
    const key = TEX.layer(item.id);
    if (!LAYER_CANVASES.has(item.id)) {
      const canvas = drawLayerSheet((ctx, ox, oy, facing, frame) => {
        switch (item.slot) {
          case 'body': drawBody(ctx, ox, oy, facing, frame, item.color); break;
          case 'top': drawTop(ctx, ox, oy, facing, frame, item); break;
          case 'hair': drawHair(ctx, ox, oy, facing, item); break;
          case 'hat': drawHat(ctx, ox, oy, facing, item); break;
        }
      });
      LAYER_CANVASES.set(item.id, canvas);
    }
    registerSheet(scene, key, LAYER_CANVASES.get(item.id)!, CHAR_FRAME, CHAR_FRAME);
  }
}

// ---------------------------------------------------------------- monsters

function drawMonster(ctx: Ctx, ox: number, oy: number, facing: Facing, frame: number, def: MonsterDef): void {
  const c = def.color;
  const light = shade(c, 1.3);
  const dark = shade(c, 0.7);
  const bob = frame === 1 ? 0 : 1;
  const eyeY = oy + 15 + bob;
  const eyeXs = facing === 'up' ? null : facing === 'down' ? [12, 18] : facing === 'left' ? [10, 15] : [17, 22];
  switch (def.id) {
    case 'dust_dokkaebi': {
      circle(ctx, ox + 16, oy + 19 + bob, 9, c);
      [[8, 14], [24, 15], [11, 25], [22, 26], [16, 9]].forEach(([x, y]) => circle(ctx, ox + x!, oy + y! + bob, 3, light));
      tri(ctx, [[ox + 10, oy + 12 + bob], [ox + 9, oy + 5 + bob], [ox + 14, oy + 11 + bob]], 0xffd166);
      tri(ctx, [[ox + 22, oy + 12 + bob], [ox + 23, oy + 5 + bob], [ox + 18, oy + 11 + bob]], 0xffd166);
      break;
    }
    case 'magpie': {
      const wing = frame === 1 ? 0 : frame === 0 ? -3 : 3;
      ctx.fillStyle = hex(c);
      ctx.beginPath(); ctx.ellipse(ox + 16, oy + 19 + bob, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(ox + 16, oy + 21 + bob, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
      rect(ctx, ox + 5, oy + 16 + bob + wing, 7, 3, dark);
      rect(ctx, ox + 20, oy + 16 + bob - wing, 7, 3, dark);
      circle(ctx, ox + 16, oy + 11 + bob, 5, c);
      tri(ctx, facing === 'left' ? [[ox + 11, oy + 11 + bob], [ox + 6, oy + 12 + bob], [ox + 11, oy + 13 + bob]]
        : facing === 'right' ? [[ox + 21, oy + 11 + bob], [ox + 26, oy + 12 + bob], [ox + 21, oy + 13 + bob]]
          : [[ox + 14, oy + 13 + bob], [ox + 16, oy + 17 + bob], [ox + 18, oy + 13 + bob]], 0xffa726);
      rect(ctx, ox + 22, oy + 22 + bob, 6, 2, 0x1c2a33); // tail
      break;
    }
    case 'pigeon': {
      ctx.fillStyle = hex(c);
      ctx.beginPath(); ctx.ellipse(ox + 16, oy + 20 + bob, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hex(light);
      ctx.beginPath(); ctx.ellipse(ox + 16, oy + 23 + bob, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, ox + 16, oy + 11 + bob, 5, c);
      rect(ctx, ox + 14, oy + 13 + bob, 4, 2, 0x5c8a3a); // neck shine
      tri(ctx, facing === 'left' ? [[ox + 11, oy + 11 + bob], [ox + 7, oy + 12 + bob], [ox + 11, oy + 13 + bob]]
        : facing === 'right' ? [[ox + 21, oy + 11 + bob], [ox + 25, oy + 12 + bob], [ox + 21, oy + 13 + bob]]
          : [[ox + 14, oy + 13 + bob], [ox + 16, oy + 16 + bob], [ox + 18, oy + 13 + bob]], 0xffa726);
      rect(ctx, ox + 12, oy + 28, 2, 3, 0xff8a65); rect(ctx, ox + 18, oy + 28, 2, 3, 0xff8a65);
      break;
    }
    default: { // gargoyle
      rect(ctx, ox + 9, oy + 12 + bob, 14, 14, c);
      rect(ctx, ox + 11, oy + 14 + bob, 10, 10, light);
      tri(ctx, [[ox + 9, oy + 12 + bob], [ox + 10, oy + 5 + bob], [ox + 14, oy + 12 + bob]], dark);
      tri(ctx, [[ox + 23, oy + 12 + bob], [ox + 22, oy + 5 + bob], [ox + 18, oy + 12 + bob]], dark);
      const flap = frame === 1 ? 0 : 2;
      tri(ctx, [[ox + 9, oy + 16 + bob], [ox + 2, oy + 10 + bob - flap], [ox + 5, oy + 22 + bob]], dark);
      tri(ctx, [[ox + 23, oy + 16 + bob], [ox + 30, oy + 10 + bob - flap], [ox + 27, oy + 22 + bob]], dark);
      rect(ctx, ox + 10, oy + 26 + bob, 4, 4, dark); rect(ctx, ox + 18, oy + 26 + bob, 4, 4, dark);
    }
  }
  if (eyeXs) {
    for (const x of eyeXs) {
      rect(ctx, ox + x, eyeY, 3, 3, 0xffffff);
      rect(ctx, ox + x + 1, eyeY + 1, 2, 2, 0x111111);
    }
  }
}

export function createMonsterTextures(scene: Phaser.Scene): void {
  for (const def of ALL_MONSTERS) {
    const key = TEX.monster(def.id);
    if (scene.textures.exists(key)) continue;
    const canvas = drawLayerSheet((ctx, ox, oy, facing, frame) => drawMonster(ctx, ox, oy, facing, frame, def));
    registerSheet(scene, key, canvas, CHAR_FRAME, CHAR_FRAME);
  }
}

// ---------------------------------------------------------------- furniture / icons / sign

function drawFurniture(ctx: Ctx, item: ItemDef, w: number, h: number): void {
  const c = item.color;
  const light = shade(c, 1.25);
  const dark = shade(c, 0.7);
  switch (item.shape) {
    case 'chair':
      rect(ctx, 6, 4, 20, 12, dark);
      rect(ctx, 4, 16, 24, 8, c);
      rect(ctx, 5, 24, 3, 7, dark); rect(ctx, 24, 24, 3, 7, dark);
      break;
    case 'plant':
      rect(ctx, 9, 20, 14, 10, 0xa0522d);
      rect(ctx, 8, 18, 16, 3, 0xc46a3a);
      circle(ctx, 16, 12, 8, c);
      circle(ctx, 10, 9, 5, light); circle(ctx, 22, 8, 5, light);
      break;
    case 'rug':
      rect(ctx, 2, 2, w - 4, h - 4, c);
      ctx.strokeStyle = hex(light); ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      circle(ctx, w / 2, h / 2, 8, light);
      break;
    case 'desk':
      rect(ctx, 2, 6, w - 4, 12, c);
      rect(ctx, 2, 6, w - 4, 3, light);
      rect(ctx, 4, 18, 4, 12, dark); rect(ctx, w - 8, 18, 4, 12, dark);
      rect(ctx, 40, 2, 14, 6, 0xe0e0e0); // paper
      break;
    case 'bookshelf':
      rect(ctx, 2, 2, w - 4, h - 4, c);
      for (let r = 0; r < 3; r++) {
        rect(ctx, 4, 6 + r * 19, w - 8, 15, dark);
        const cols = [0xff6b6b, 0x6bd77b, 0x8f9bff, 0xffd166];
        for (let i = 0; i < 5; i++) rect(ctx, 5 + i * 5, 7 + r * 19, 4, 13, cols[(i + r) % cols.length]!);
      }
      break;
    case 'bed':
      rect(ctx, 2, 4, w - 4, h - 8, 0x8d6e63);
      rect(ctx, 4, 6, w - 8, h - 12, c);
      rect(ctx, 6, 8, 14, 12, 0xffffff); // pillow
      rect(ctx, 22, 8, w - 28, h - 16, light);
      break;
    case 'tower': // Namsan tower model
      rect(ctx, 10, 26, 12, 4, 0x777777);
      rect(ctx, 14, 12, 4, 14, 0xbdbdbd);
      rect(ctx, 9, 8, 14, 6, 0x9e9e9e);
      rect(ctx, 15, 2, 2, 6, 0xff5252);
      break;
    case 'eiffel':
      tri(ctx, [[6, 30], [16, 2], [26, 30]], c);
      tri(ctx, [[10, 30], [16, 12], [22, 30]], 0xe6d5a0);
      rect(ctx, 8, 18, 16, 2, dark);
      rect(ctx, 11, 24, 10, 2, dark);
      break;
    default:
      rect(ctx, 2, 2, w - 4, h - 4, c);
  }
}

export function createFurnitureTextures(scene: Phaser.Scene): void {
  for (const item of ITEMS) {
    if (item.slot !== 'furniture') continue;
    const key = TEX.furniture(item.id);
    if (scene.textures.exists(key)) continue;
    const size = item.size ?? { w: 1, h: 1 };
    const { canvas, ctx } = makeCanvas(size.w * 32, size.h * 32);
    drawFurniture(ctx, item, size.w * 32, size.h * 32);
    registerImage(scene, key, canvas);
  }
}

export function createIconTextures(scene: Phaser.Scene): void {
  const make = (name: string, draw: (ctx: Ctx) => void) => {
    const key = TEX.icon(name);
    if (scene.textures.exists(key)) return;
    const { canvas, ctx } = makeCanvas(24, 24);
    draw(ctx);
    registerImage(scene, key, canvas);
  };
  make('coin', (ctx) => {
    circle(ctx, 12, 12, 10, 0xffd166);
    circle(ctx, 12, 12, 7, 0xffb703);
    ctx.fillStyle = '#7a4a00'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P', 12, 13);
  });
  make('lock', (ctx) => {
    rect(ctx, 5, 11, 14, 10, 0xbdbdbd);
    ctx.strokeStyle = hex(0xbdbdbd); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(12, 10, 5, Math.PI, 0); ctx.stroke();
    rect(ctx, 11, 14, 2, 4, 0x424242);
  });
  make('stamp', (ctx) => {
    circle(ctx, 12, 12, 11, 0xd62828);
    circle(ctx, 12, 12, 8, 0xffffff);
    tri(ctx, [[12, 5], [14, 10], [19, 10], [15, 13], [17, 18], [12, 15], [7, 18], [9, 13], [5, 10], [10, 10]], 0xd62828);
  });
  make('pin', (ctx) => {
    circle(ctx, 12, 9, 8, 0xffd166);
    tri(ctx, [[5, 12], [12, 23], [19, 12]], 0xffd166);
    circle(ctx, 12, 9, 3, 0x7a4a00);
  });
  make('pinGray', (ctx) => {
    circle(ctx, 12, 9, 8, 0x8a8a8a);
    tri(ctx, [[5, 12], [12, 23], [19, 12]], 0x8a8a8a);
    circle(ctx, 12, 9, 3, 0x444444);
  });
  make('heart', (ctx) => {
    circle(ctx, 8, 9, 5, 0xff6b6b); circle(ctx, 16, 9, 5, 0xff6b6b);
    tri(ctx, [[3, 11], [12, 21], [21, 11]], 0xff6b6b);
  });
}

export function createSignTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.sign)) return;
  const { canvas, ctx } = makeCanvas(32, 32);
  rect(ctx, 14, 16, 4, 14, 0x6b4520);
  rect(ctx, 4, 4, 24, 14, 0xb08050);
  rect(ctx, 6, 6, 20, 10, 0xd9a870);
  rect(ctx, 9, 9, 14, 1, 0x6b4520); rect(ctx, 9, 12, 10, 1, 0x6b4520);
  registerImage(scene, TEX.sign, canvas);
}

// ---------------------------------------------------------------- world map

type Poly = [number, number][];
const LAND: Poly[] = [
  // North America
  [[-168, 66], [-140, 70], [-95, 72], [-75, 62], [-55, 50], [-65, 44], [-80, 30], [-97, 25], [-105, 20], [-88, 14], [-83, 8], [-100, 18], [-118, 32], [-125, 40], [-130, 52], [-165, 58]],
  // Greenland
  [[-55, 60], [-45, 60], [-20, 70], [-25, 83], [-60, 80]],
  // South America
  [[-80, 10], [-62, 10], [-50, 0], [-35, -8], [-40, -22], [-50, -30], [-58, -38], [-65, -50], [-70, -55], [-72, -45], [-70, -20], [-80, -5]],
  // Europe
  [[-10, 36], [0, 44], [-10, 48], [-5, 58], [5, 62], [20, 71], [30, 70], [40, 66], [45, 50], [30, 46], [28, 41], [20, 38], [12, 38], [5, 43]],
  // UK
  [[-5, 50], [2, 52], [-2, 58], [-6, 55]],
  // Africa
  [[-17, 15], [-10, 30], [0, 36], [10, 37], [30, 31], [43, 12], [51, 11], [40, -5], [40, -20], [35, -34], [18, -35], [12, -18], [10, -5], [8, 4], [-8, 5]],
  // Madagascar
  [[44, -12], [50, -15], [47, -25], [43, -22]],
  // Asia
  [[28, 41], [30, 46], [45, 50], [40, 66], [60, 72], [100, 78], [140, 72], [180, 68], [180, 62], [160, 60], [135, 45], [120, 28], [108, 10], [103, 2], [95, 10], [80, 8], [72, 20], [60, 25], [55, 15], [45, 30], [35, 36]],
  // Japan
  [[130, 31], [140, 35], [145, 44], [140, 40], [132, 33]],
  // Australia
  [[114, -22], [122, -14], [136, -12], [142, -11], [146, -18], [153, -25], [150, -37], [140, -38], [130, -32], [115, -34]],
  // New Zealand
  [[166, -46], [172, -44], [178, -38], [174, -36], [170, -42]],
];

export function createWorldMapTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.worldmap)) return;
  const { canvas, ctx } = makeCanvas(WORLD_W, WORLD_H);
  rect(ctx, 0, 0, WORLD_W, WORLD_H, 0x2a5d9f);
  // graticule
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { const { x } = lonLatToXY([lon, 0]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke(); }
  for (let lat = -90; lat <= 90; lat += 30) { const { y } = lonLatToXY([0, lat]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
  // equator
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  { const { y } = lonLatToXY([0, 0]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
  // land
  for (const poly of LAND) {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const { x, y } = lonLatToXY([lon, lat]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = hex(0x7bb661);
    ctx.fill();
    ctx.strokeStyle = hex(0x4f8a3f); ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Antarctica
  { const { y } = lonLatToXY([0, -70]); rect(ctx, 0, y, WORLD_W, WORLD_H - y, 0xe8f1f8); }
  // subtle continent tint under labels
  for (const l of CONTINENT_LABELS) {
    const { x, y } = lonLatToXY(l.lonLat);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
  }
  registerImage(scene, TEX.worldmap, canvas);
}

/** Create every placeholder texture that manifest.ts does not replace with a file. */
export function createAllPlaceholders(scene: Phaser.Scene): void {
  createTilesTexture(scene);
  createLayerTextures(scene);
  createMonsterTextures(scene);
  createFurnitureTextures(scene);
  createIconTextures(scene);
  createSignTexture(scene);
  createWorldMapTexture(scene);
}

export const CHAR_SHEET = { cols: CHAR_COLS, rows: CHAR_ROWS, frame: CHAR_FRAME } as const;
