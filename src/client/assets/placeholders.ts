// Fallback art (spec 4: 축소). Used only when the Kenney sheets could not be loaded (`npm run assets` not run) or the
// world-atlas map cannot be built; everything else comes from the vendor sheets and the code-generated modules.
import Phaser from 'phaser';
import type { ItemSlot } from '../../shared/types';
import { CONTINENT_LABELS, lonLatToXY, WORLD_H, WORLD_W } from '../../shared/content/continents';
import { TEX } from './manifest';
import { disc, hex, makeCanvas, newCell, rect, registerImage, shade } from './pixelArt';

export { makeCanvas, hex, shade, registerSheet, registerImage } from './pixelArt';

/** Flat-colour stand-in for a semantic tile when the vendor sheets are missing. */
export function fallbackCell(name: string): HTMLCanvasElement {
  const { canvas, ctx } = newCell();
  const pick = (): number => {
    if (name.startsWith('water') || name.startsWith('sea')) return 0x3a7bd5;
    if (name.startsWith('road') || name === 'bridge_h' || name === 'bridge_v') return name.includes('asphalt') ? 0x555a66 : 0xc9b48a;
    if (name.startsWith('tree') || name === 'bush' || name === 'hedge') return 0x2e7d32;
    if (name.startsWith('bld_')) return name.includes('roof') ? 0xa0443c : 0xd8c8a8;
    if (name.startsWith('sand')) return 0xe6d5a0;
    if (name.startsWith('rock') || name === 'hill' || name === 'wall_stone') return 0x7d7d7d;
    if (name.startsWith('flower')) return 0xff6b6b;
    if (name.startsWith('floor') || name.startsWith('fur_')) return 0xb8935f;
    if (name.startsWith('wall')) return 0x6d5a8a;
    if (name.startsWith('grass') || name === 'dark_grass' || name === 'farm') return name === 'dark_grass' ? 0x3f8a3a : 0x5fa84a;
    return 0x9a9a9a;
  };
  const c = pick();
  rect(ctx, 0, 0, 16, 16, c);
  rect(ctx, 0, 0, 16, 1, shade(c, 1.2)); rect(ctx, 0, 15, 16, 1, shade(c, 0.8));
  return canvas;
}

/** Simple 16px body/top/hair/hat shapes for avatars when the character sheet is missing. */
export function drawFallbackPart(slot: ItemSlot | 'unknown', color: number, shape = ''): HTMLCanvasElement {
  const { canvas, ctx } = newCell();
  const dark = shade(color, 0.75);
  switch (slot) {
    case 'body':
      rect(ctx, 5, 2, 6, 6, color); rect(ctx, 6, 5, 1, 1, 0x222222); rect(ctx, 9, 5, 1, 1, 0x222222);
      rect(ctx, 4, 8, 8, 5, color); rect(ctx, 5, 13, 2, 3, dark); rect(ctx, 9, 13, 2, 3, dark);
      break;
    case 'top':
      rect(ctx, 4, 8, 8, 5, color); rect(ctx, 3, 8, 1, 3, color); rect(ctx, 12, 8, 1, 3, color);
      if (shape === 'stripes') for (let y = 9; y <= 12; y += 2) rect(ctx, 4, y, 8, 1, 0xffffff);
      break;
    case 'hair':
      rect(ctx, 4, 1, 8, 3, color); rect(ctx, 4, 4, 1, 2, color); rect(ctx, 11, 4, 1, 2, color);
      if (shape === 'long' || shape === 'pony') { rect(ctx, 4, 4, 1, 5, color); rect(ctx, 11, 4, 1, 5, color); }
      break;
    case 'hat':
      rect(ctx, 4, 0, 8, 3, color); rect(ctx, 3, 3, 10, 1, dark);
      break;
    default:
      disc(ctx, 8, 8, 5, color);
  }
  return canvas;
}

// ---------------------------------------------------------------- world map (polygon fallback)

type Poly = [number, number][];
const LAND: Poly[] = [
  [[-168, 66], [-140, 70], [-95, 72], [-75, 62], [-55, 50], [-65, 44], [-80, 30], [-97, 25], [-105, 20], [-88, 14], [-83, 8], [-100, 18], [-118, 32], [-125, 40], [-130, 52], [-165, 58]],
  [[-55, 60], [-45, 60], [-20, 70], [-25, 83], [-60, 80]],
  [[-80, 10], [-62, 10], [-50, 0], [-35, -8], [-40, -22], [-50, -30], [-58, -38], [-65, -50], [-70, -55], [-72, -45], [-70, -20], [-80, -5]],
  [[-10, 36], [0, 44], [-10, 48], [-5, 58], [5, 62], [20, 71], [30, 70], [40, 66], [45, 50], [30, 46], [28, 41], [20, 38], [12, 38], [5, 43]],
  [[-5, 50], [2, 52], [-2, 58], [-6, 55]],
  [[-17, 15], [-10, 30], [0, 36], [10, 37], [30, 31], [43, 12], [51, 11], [40, -5], [40, -20], [35, -34], [18, -35], [12, -18], [10, -5], [8, 4], [-8, 5]],
  [[44, -12], [50, -15], [47, -25], [43, -22]],
  [[28, 41], [30, 46], [45, 50], [40, 66], [60, 72], [100, 78], [140, 72], [180, 68], [180, 62], [160, 60], [135, 45], [120, 28], [108, 10], [103, 2], [95, 10], [80, 8], [72, 20], [60, 25], [55, 15], [45, 30], [35, 36]],
  [[130, 31], [140, 35], [145, 44], [140, 40], [132, 33]],
  [[114, -22], [122, -14], [136, -12], [142, -11], [146, -18], [153, -25], [150, -37], [140, -38], [130, -32], [115, -34]],
  [[166, -46], [172, -44], [178, -38], [174, -36], [170, -42]],
];

export function createWorldMapFallbackTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.worldmap)) return;
  const { canvas, ctx } = makeCanvas(WORLD_W, WORLD_H);
  rect(ctx, 0, 0, WORLD_W, WORLD_H, 0x2a5d9f);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { const { x } = lonLatToXY([lon, 0]); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke(); }
  for (let lat = -90; lat <= 90; lat += 30) { const { y } = lonLatToXY([0, lat]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  { const { y } = lonLatToXY([0, 0]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
  for (const poly of LAND) {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => { const { x, y } = lonLatToXY([lon, lat]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = hex(0x7bb661); ctx.fill();
    ctx.strokeStyle = hex(0x4f8a3f); ctx.lineWidth = 2; ctx.stroke();
  }
  { const { y } = lonLatToXY([0, -70]); rect(ctx, 0, y, WORLD_W, WORLD_H - y, 0xe8f1f8); }
  for (const l of CONTINENT_LABELS) {
    const { x, y } = lonLatToXY(l.lonLat);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
  }
  registerImage(scene, TEX.worldmap, canvas);
}
