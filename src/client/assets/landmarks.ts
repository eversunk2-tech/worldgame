// Landmark sprites drawn on the 16 grid (spec 5.4): art size w*16 × (h+overhang)*16, registered at 2× as
// `landmark:<kind>`. Stage A draws the Seoul/Paris six; other kinds get a labelled placeholder until Stage C.
import Phaser from 'phaser';
import type { LandmarkKind } from '../../shared/types';
import { PLAYABLE_CITIES } from '../../shared/content';
import { TEX } from './manifest';
import { disc, hline, makeCanvas, px, rect, registerImage, scaleCanvas, tri, vline } from './pixelArt';

type Ctx = CanvasRenderingContext2D;
const O = 0x2b1d14;

function groundShadow(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(1, h - 1, w - 2, 1);
}

function gyeongbokgung(ctx: Ctx, W: number, H: number): void {
  // stone platform, red pillars, dark hip roof with upturned eaves, central gate (6×4 + 1 overhang → 96×80)
  const roof = 0x3d3f4a, roofL = 0x5a5d6b, red = 0xb23a2f, cream = 0xf0e6d2, stone = 0xb8b0a0;
  rect(ctx, 2, H - 14, W - 4, 13, stone); hline(ctx, 2, W - 3, H - 14, 0xd8d0c0); // platform
  rect(ctx, 8, H - 34, W - 16, 22, cream); // walls
  for (let x = 12; x < W - 8; x += 12) rect(ctx, x, H - 34, 3, 22, red); // pillars
  rect(ctx, W / 2 - 6, H - 26, 12, 14, 0x5a3a20); rect(ctx, W / 2 - 4, H - 24, 8, 12, 0x3a2414); // gate
  // lower eave
  rect(ctx, 4, H - 40, W - 8, 6, roof); hline(ctx, 4, W - 5, H - 40, roofL);
  tri(ctx, [0, H - 34], [4, H - 40], [4, H - 34], roof); tri(ctx, [W - 1, H - 34], [W - 5, H - 40], [W - 5, H - 34], roof);
  // upper storey
  rect(ctx, 14, H - 54, W - 28, 14, cream); for (let x = 18; x < W - 14; x += 12) rect(ctx, x, H - 54, 3, 14, red);
  rect(ctx, 10, H - 62, W - 20, 8, roof); hline(ctx, 10, W - 11, H - 62, roofL);
  tri(ctx, [4, H - 54], [10, H - 62], [10, H - 54], roof); tri(ctx, [W - 5, H - 54], [W - 11, H - 62], [W - 11, H - 54], roof);
  rect(ctx, W / 2 - 12, H - 70, 24, 8, roof); hline(ctx, W / 2 - 12, W / 2 + 11, H - 70, roofL); // ridge
  hline(ctx, 4, W - 5, H - 35, O); hline(ctx, 10, W - 11, H - 55, O);
  groundShadow(ctx, W, H);
}

function namsanTower(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 3 overhang → 32×80: hill base, grey shaft, white deck, red/white antenna
  const grey = 0x9aa0a6, dark = 0x6d737a, white = 0xf4f4f4;
  disc(ctx, W / 2, H - 6, 12, 0x5f8a4a); rect(ctx, 0, H - 6, W, 6, 0x5f8a4a); // hill
  rect(ctx, W / 2 - 3, 24, 6, H - 30, grey); vline(ctx, W / 2 - 3, 24, H - 7, dark); vline(ctx, W / 2 + 2, 24, H - 7, dark);
  rect(ctx, W / 2 - 8, 26, 16, 10, white); rect(ctx, W / 2 - 8, 30, 16, 2, 0x3d7bd6); hline(ctx, W / 2 - 8, W / 2 + 7, 36, dark); // deck
  rect(ctx, W / 2 - 6, 20, 12, 6, white); hline(ctx, W / 2 - 6, W / 2 + 5, 20, dark);
  for (let y = 2; y < 20; y += 3) { rect(ctx, W / 2 - 1, y, 2, 3, y % 2 === 0 ? 0xd62828 : white); }
  px(ctx, W / 2 - 1, 0, 0xff4d4d); px(ctx, W / 2, 0, 0xff4d4d);
  groundShadow(ctx, W, H);
}

function eiffel(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 3 overhang → 32×80: brown lattice tower
  const iron = 0x8d6e63, dark = 0x5a4034;
  tri(ctx, [2, H - 2], [W / 2 - 1, 6], [W / 2, 6], iron); tri(ctx, [W - 3, H - 2], [W / 2, 6], [W / 2 + 1, 6], iron);
  tri(ctx, [2, H - 2], [W / 2, 6], [W - 3, H - 2], iron);
  // arch opening: clear a rectangle plus a semicircle (destination-out erases; never paint "transparent" colours)
  ctx.clearRect(9, H - 14, W - 18, 13);
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(W / 2, H - 13, (W - 18) / 2, Math.PI, 0); ctx.fill(); ctx.restore();
  // platforms
  hline(ctx, 4, W - 5, H - 24, dark); hline(ctx, 8, W - 9, H - 46, dark); hline(ctx, 11, W - 12, H - 62, dark);
  for (let y = 10; y < H - 4; y += 4) { const half = Math.max(1, Math.floor(((y - 6) / (H - 8)) * (W / 2 - 3))); hline(ctx, W / 2 - half, W / 2 + half, y, dark); }
  rect(ctx, W / 2 - 1, 0, 2, 6, dark); px(ctx, W / 2, 0, 0xff4d4d);
  groundShadow(ctx, W, H);
}

function arc(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 1 → 32×48: cream triumphal arch
  const cream = 0xe6dcc3, dark = 0xb8ad94, top = 0xf4ecd8;
  rect(ctx, 1, 4, W - 2, H - 5, cream); rect(ctx, 1, 4, W - 2, 4, top); hline(ctx, 1, W - 2, 8, dark);
  rect(ctx, 0, 2, W, 3, dark); hline(ctx, 0, W - 1, 2, top);
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  ctx.fillRect(W / 2 - 6, H - 22, 12, 22); ctx.beginPath(); ctx.arc(W / 2, H - 22, 6, Math.PI, 0); ctx.fill(); ctx.restore();
  vline(ctx, 4, 12, H - 3, dark); vline(ctx, W - 5, 12, H - 3, dark); rect(ctx, 3, 12, 3, 8, 0xd0c6ac); rect(ctx, W - 6, 12, 3, 8, 0xd0c6ac);
  groundShadow(ctx, W, H);
}

function louvre(ctx: Ctx, W: number, H: number): void {
  // 8×3 + 1 → 128×64: long palace with a dark mansard roof and the glass pyramid in front
  const wall = 0xe9dfc8, roof = 0x4a4f5c, roofL = 0x646a7a, win = 0x6d7a90;
  rect(ctx, 0, 16, W, H - 20, wall); rect(ctx, 0, 8, W, 10, roof); hline(ctx, 0, W - 1, 8, roofL);
  rect(ctx, 0, 4, 20, 6, roof); rect(ctx, W - 20, 4, 20, 6, roof); rect(ctx, W / 2 - 14, 2, 28, 8, roof); hline(ctx, W / 2 - 14, W / 2 + 13, 2, roofL);
  for (let x = 6; x < W - 4; x += 10) { rect(ctx, x, 22, 4, 8, win); rect(ctx, x, 36, 4, 8, win); }
  hline(ctx, 0, W - 1, 18, 0xb8ad94); hline(ctx, 0, W - 1, H - 5, 0xb8ad94);
  // pyramid
  tri(ctx, [W / 2 - 14, H - 2], [W / 2, H - 26], [W / 2 + 14, H - 2], 0x2b3f60);
  tri(ctx, [W / 2 - 12, H - 3], [W / 2, H - 24], [W / 2 + 12, H - 3], 0x9fd3ff);
  for (let y = H - 22; y < H - 3; y += 4) hline(ctx, W / 2 - Math.floor((H - 3 - y) * 12 / 21), W / 2 + Math.floor((H - 3 - y) * 12 / 21), y, 0x5f9fd0);
  vline(ctx, W / 2, H - 24, H - 3, 0x5f9fd0);
  groundShadow(ctx, W, H);
}

function notredame(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 2 → 32×64: twin towers, rose window, portal
  const stone = 0xd9cfb4, dark = 0xa89e86, glass = 0x5a7fd6;
  rect(ctx, 1, 24, W - 2, H - 26, stone); rect(ctx, 2, 2, 10, 30, stone); rect(ctx, W - 12, 2, 10, 30, stone);
  hline(ctx, 2, 11, 2, dark); hline(ctx, W - 12, W - 3, 2, dark); vline(ctx, 11, 2, 32, dark); vline(ctx, W - 12, 2, 32, dark);
  rect(ctx, 4, 6, 2, 8, glass); rect(ctx, 8, 6, 2, 8, glass); rect(ctx, W - 10, 6, 2, 8, glass); rect(ctx, W - 6, 6, 2, 8, glass);
  disc(ctx, W / 2, 34, 4.5, dark); disc(ctx, W / 2, 34, 3.5, glass); px(ctx, W / 2, 34, 0xffd166);
  rect(ctx, W / 2 - 4, H - 14, 8, 12, dark); rect(ctx, W / 2 - 3, H - 12, 6, 10, 0x3a2414);
  ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.restore();
  hline(ctx, 1, W - 2, 24, dark); hline(ctx, 1, W - 2, 44, dark);
  groundShadow(ctx, W, H);
}

function placeholder(ctx: Ctx, W: number, H: number, kind: string): void {
  rect(ctx, 1, 4, W - 2, H - 5, 0x8a8a8a); rect(ctx, 1, 4, W - 2, 1, 0xbdbdbd); rect(ctx, 0, 2, W, 3, 0x6d6d6d);
  ctx.fillStyle = '#ffffff'; ctx.font = '8px monospace'; ctx.fillText(kind.slice(0, Math.floor(W / 5)), 2, H / 2 + 3);
  groundShadow(ctx, W, H);
}

/** Art canvas for a landmark, already at 2× (spec 5.4). */
export function drawLandmark(kind: LandmarkKind, w: number, h: number, overhang = 0): HTMLCanvasElement {
  const W = w * 16, H = (h + overhang) * 16;
  const { canvas, ctx } = makeCanvas(W, H);
  switch (kind) {
    case 'gyeongbokgung': gyeongbokgung(ctx, W, H); break;
    case 'namsan_tower': namsanTower(ctx, W, H); break;
    case 'eiffel': eiffel(ctx, W, H); break;
    case 'arc': arc(ctx, W, H); break;
    case 'louvre': louvre(ctx, W, H); break;
    case 'notredame': notredame(ctx, W, H); break;
    default: placeholder(ctx, W, H, kind);
  }
  return scaleCanvas(canvas, 2);
}

/** Register `landmark:<kind>` for every landmark used by a playable city (idempotent). */
export function createLandmarkTextures(scene: Phaser.Scene): void {
  for (const city of PLAYABLE_CITIES) {
    for (const lm of city.landmarks) {
      const key = TEX.landmark(lm.kind);
      if (scene.textures.exists(key)) continue;
      registerImage(scene, key, drawLandmark(lm.kind, lm.w, lm.h, lm.overhang ?? 0));
    }
  }
}
