// Landmark sprites drawn on the 16 grid (spec 5.4): art size w*16 × (h+overhang)*16, registered at 2× as
// `landmark:<kind>`. Seoul/Paris six (Stage A) + Cairo/New York/Sydney/Rio eleven (Stage C). Unknown kinds fall back
// to a labelled placeholder block.
import Phaser from 'phaser';
import type { LandmarkDef, LandmarkKind } from '../../shared/types';
import { PLAYABLE_CITIES } from '../../shared/content';
import { TEX, type SheetId } from './manifest';
import { vendorSheets } from './vendorSheets';
import { disc, hline, makeCanvas, px, rect, registerImage, scaleCanvas, shade, tri, vline } from './pixelArt';

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

// ---------------------------------------------------------------- Stage C helpers

/**
 * Ground under a landmark's footprint (the bottom `rows` tiles of the art): the vendor cell the neighbouring tiles use,
 * so the landmark sits on seamless sand / pavement; a flat colour when the sheets are not installed.
 */
function groundPlate(ctx: Ctx, W: number, H: number, rows: number, sheet: SheetId, index: number, fallback: number): void {
  const cell = vendorSheets.cell(sheet, index);
  for (let y = H - rows * 16; y < H; y += 16) {
    for (let x = 0; x < W; x += 16) {
      if (cell) ctx.drawImage(cell, x, y);
      else rect(ctx, x, y, 16, 16, fallback);
    }
  }
}

/** 1px Bresenham line (outlines of slanted shapes). */
function line(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, c: number): void {
  let x = Math.round(x0), y = Math.round(y0);
  const tx = Math.round(x1), ty = Math.round(y1);
  const dx = Math.abs(tx - x), dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1, sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(ctx, x, y, c);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

/** Filled axis-aligned ellipse (centre and radii in art px). */
function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, c: number): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(ctx, x, y, c);
    }
  }
}

/** Pyramid seen at 3/4: lit left face, shaded right face, stone courses, dark outline. */
function pyramid(ctx: Ctx, left: number, right: number, base: number, apexX: number, apexY: number): void {
  const lit = 0xf0d49a, dark = 0xc4955a, course = 0xd9b77c;
  const split = apexX + Math.round((right - left) * 0.12);
  tri(ctx, [left, base], [apexX, apexY], [split, base], lit);
  tri(ctx, [apexX, apexY], [right, base], [split, base], dark);
  for (let y = apexY + 4; y < base; y += 4) {
    const t = (y - apexY) / (base - apexY);
    hline(ctx, Math.round(apexX - (apexX - left) * t) + 1, Math.round(apexX + (split - apexX) * t) - 1, y, course);
  }
  line(ctx, left, base, apexX, apexY, O); line(ctx, apexX, apexY, right, base, O); line(ctx, apexX, apexY, split, base, shade(dark, 0.8));
  hline(ctx, left, right, base, O);
}

function pyramids(ctx: Ctx, W: number, H: number): void {
  // 4×3 + 1 → 64×64: Khufu in the middle, two smaller pyramids behind-left and in front-right (spec 5.4)
  pyramid(ctx, 1, 25, H - 20, 12, H - 38);
  pyramid(ctx, 10, 58, H - 6, 32, H - 58);
  pyramid(ctx, 40, 63, H - 2, 51, H - 20);
  px(ctx, 32, H - 58, 0xfff2c8); // sunlit tip
  groundShadow(ctx, W, H);
}

function sphinx(ctx: Ctx, W: number, H: number): void {
  // 2×2 → 32×32: lying lion body, paws forward (left), nemes headdress
  const sand = 0xe2c287, dark = 0xb8945c, light = 0xf2dcaa, stripe = 0xc9a468;
  rect(ctx, 1, H - 6, W - 2, 5, 0xb39b72); hline(ctx, 1, W - 2, H - 6, 0xcdb68c); // plinth
  rect(ctx, 12, 15, 16, 11, sand); disc(ctx, 25.5, 18.5, 4, sand); disc(ctx, 23, 22, 4, dark); // body + haunch
  hline(ctx, 13, 26, 15, light); vline(ctx, 29, 18, 25, O); px(ctx, 30, 24, dark); px(ctx, 30, 23, dark); // back, tail
  rect(ctx, 2, 22, 13, 4, sand); hline(ctx, 2, 14, 22, light); px(ctx, 5, 25, dark); px(ctx, 9, 25, dark); // paws
  line(ctx, 1, 22, 1, 25, O); hline(ctx, 2, 28, 26, O); line(ctx, 12, 14, 24, 14, O); line(ctx, 25, 14, 29, 18, O);
  // head with nemes (striped headcloth falling to the shoulders)
  rect(ctx, 5, 7, 7, 9, sand); tri(ctx, [3, 8], [8, 2], [13, 8], stripe); rect(ctx, 3, 8, 2, 9, stripe); rect(ctx, 12, 8, 2, 9, stripe);
  for (let y = 9; y < 17; y += 2) { px(ctx, 3, y, dark); px(ctx, 13, y, dark); }
  hline(ctx, 5, 11, 8, dark); px(ctx, 6, 10, O); px(ctx, 10, 10, O); vline(ctx, 8, 10, 12, dark); hline(ctx, 7, 9, 14, dark);
  line(ctx, 2, 8, 8, 1, O); line(ctx, 8, 1, 14, 8, O); vline(ctx, 2, 8, 17, O); vline(ctx, 14, 8, 17, O);
  groundShadow(ctx, W, H);
}

function mosque(ctx: Ctx, W: number, H: number): void {
  // 4×3 + 2 → 64×80: domed prayer hall between two slender minarets; gold crescent on the dome, gold spires on the minarets
  const wall = 0xf1e6cc, wallD = 0xd4c4a0, dome = 0xb9c6ce, domeD = 0x8e9ca6, gold = 0xffc94d, win = 0x5a6a7a;
  rect(ctx, 8, 46, 48, 32, wall); rect(ctx, 44, 46, 12, 32, wallD); hline(ctx, 8, 55, 46, 0xfff7e6);
  for (const x of [13, 21, 38, 46]) { rect(ctx, x, 54, 4, 8, win); px(ctx, x + 1, 53, win); px(ctx, x + 2, 53, win); }
  rect(ctx, 27, 58, 10, 20, 0x6b4a2a); disc(ctx, 32, 58, 5, 0x6b4a2a); rect(ctx, 29, 60, 6, 18, 0x3a2414); // arched door
  rect(ctx, 20, 38, 24, 9, wall); hline(ctx, 20, 43, 38, 0xfff7e6); // drum
  disc(ctx, 32, 38, 12, dome); rect(ctx, 19, 39, 26, 8, wall); disc(ctx, 28, 33, 3, 0xdbe4ea); // main dome
  disc(ctx, 14, 46, 6, dome); disc(ctx, 50, 46, 6, domeD); rect(ctx, 7, 46, 50, 1, wallD); // side domes
  rect(ctx, 8, 47, 48, 1, O);
  // finial (alem): a crescent moon opening to the right — rounded two-pixel back, horns pointing right — on a short
  // stem; no side arms, so it can never read as a cross (review Stage C H1). Rows 16-26, clear of the stall above.
  for (const [x, y] of [[31, 16], [32, 16], [30, 17], [31, 17], [29, 18], [30, 18], [29, 19], [30, 19], [29, 20], [30, 20], [30, 21], [31, 21], [31, 22], [32, 22]] as const) px(ctx, x, y, gold);
  vline(ctx, 31, 23, 26, gold); // stem down to the dome
  for (const mx of [1, 56]) { // minarets
    rect(ctx, mx, 12, 7, 66, wall); rect(ctx, mx + 5, 12, 2, 66, wallD);
    rect(ctx, mx - 1, 30, 9, 3, wallD); rect(ctx, mx - 1, 52, 9, 3, wallD); hline(ctx, mx - 1, mx + 7, 30, O); hline(ctx, mx - 1, mx + 7, 52, O);
    tri(ctx, [mx, 12], [mx + 3, 2], [mx + 6, 12], domeD); vline(ctx, mx + 3, 0, 2, gold);
    vline(ctx, mx - 1, 12, 77, O); vline(ctx, mx + 7, 12, 77, O); line(ctx, mx - 1, 12, mx + 3, 1, O); line(ctx, mx + 3, 1, mx + 7, 12, O);
    rect(ctx, mx + 2, 18, 2, 4, win); rect(ctx, mx + 2, 40, 2, 4, win);
  }
  line(ctx, 20, 30, 26, 26, O); line(ctx, 44, 30, 38, 26, O); hline(ctx, 27, 37, 26, O);
  vline(ctx, 8, 46, 77, O); vline(ctx, 55, 46, 77, O); hline(ctx, 8, 55, 78, O);
  groundShadow(ctx, W, H);
}

function museum(ctx: Ctx, W: number, H: number): void {
  // 4×3 → 64×48: the Egyptian Museum — salmon-pink neoclassical front, arched central portal, cream columns
  const pink = 0xd98a74, pinkL = 0xe9a592, pinkD = 0xb86a56, cream = 0xf3e8d0, win = 0x5b3b34;
  rect(ctx, 0, 12, W, 34, pink); rect(ctx, 0, 8, W, 5, pinkD); hline(ctx, 0, W - 1, 8, pinkL); hline(ctx, 0, W - 1, 13, cream);
  for (let x = 3; x < W; x += 6) { if (x > 17 && x < 45) continue; rect(ctx, x, 17, 3, 6, win); rect(ctx, x, 29, 3, 7, win); px(ctx, x + 1, 16, win); }
  rect(ctx, 18, 6, 28, 40, pinkL); rect(ctx, 18, 6, 28, 3, pinkD); hline(ctx, 18, 45, 9, cream); // central pavilion
  tri(ctx, [18, 6], [32, 0], [46, 6], pinkD); // pediment
  for (const x of [20, 24, 38, 42]) { rect(ctx, x, 12, 2, 31, cream); px(ctx, x + 1, 12, 0xffffff); }
  rect(ctx, 27, 23, 10, 20, win); disc(ctx, 32, 23, 5, win); rect(ctx, 29, 26, 6, 17, 0x2e1c18); // arched portal
  rect(ctx, 26, 13, 12, 4, cream); hline(ctx, 28, 35, 15, pinkD); // name plaque
  rect(ctx, 0, 43, W, 2, 0xcfc6b4); rect(ctx, 14, 45, 36, 2, 0xb9b09c); // steps
  hline(ctx, 0, W - 1, 46, O); vline(ctx, 0, 8, 46, O); vline(ctx, W - 1, 8, 46, O); line(ctx, 18, 6, 32, 0, O); line(ctx, 32, 0, 45, 6, O);
  groundShadow(ctx, W, H);
}

function empire(ctx: Ctx, W: number, H: number): void {
  // 2×3 + 4 → 32×112: Art Deco setbacks, window stripes, mast and antenna
  const stone = 0xd6cdb8, shadeC = 0xaea58f, win = 0x5d6b7c, lit = 0xf2ead6;
  const block = (x: number, y: number, w: number, h: number) => {
    rect(ctx, x, y, w, h, stone); rect(ctx, x + Math.floor(w / 2), y, Math.ceil(w / 2), h, shadeC);
    for (let wx = x + 2; wx < x + w - 1; wx += 3) for (let wy = y + 3; wy < y + h - 1; wy += 3) px(ctx, wx, wy, win);
    hline(ctx, x, x + w - 1, y, lit); vline(ctx, x, y, y + h - 1, O); vline(ctx, x + w - 1, y, y + h - 1, O); hline(ctx, x, x + w - 1, y - 1, O);
  };
  groundPlate(ctx, W, H, 3, 'city', 704, 0xbdbdbd); // sidewalk (city (1,19), the '-' cell) under the 2×3 footprint
  block(1, 74, 30, 36); block(4, 50, 24, 24); block(8, 32, 16, 18); block(11, 20, 10, 12);
  rect(ctx, 13, 11, 6, 9, stone); rect(ctx, 16, 11, 3, 9, shadeC); hline(ctx, 13, 18, 11, lit); vline(ctx, 12, 11, 19, O); vline(ctx, 19, 11, 19, O);
  vline(ctx, 15, 2, 10, 0x9aa0a6); vline(ctx, 16, 2, 10, 0x6d737a); px(ctx, 15, 1, 0xff4d4d); px(ctx, 16, 1, 0xff4d4d);
  rect(ctx, 12, H - 8, 8, 7, 0x3a3f48); hline(ctx, 12, 19, H - 9, lit); // entrance
  hline(ctx, 1, 30, H - 1, O);
  groundShadow(ctx, W, H);
}

function liberty(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 3 → 32×80: copper-green statue with raised torch on a granite pedestal (island)
  const g = 0x74c0a4, gD = 0x4f927c, gL = 0x9fdcc4, stone = 0xc2b9a6, stoneD = 0x9c937f, flame = 0xffc94d;
  groundPlate(ctx, W, H, 2, 'rpg', 8, 0xf0e2b6); // island sand (rpg (8,0), the 'S' cell) under the 2×2 footprint
  rect(ctx, 4, H - 10, 24, 9, stoneD); hline(ctx, 4, 27, H - 10, stone); // star-fort base
  rect(ctx, 8, 50, 16, 20, stone); rect(ctx, 16, 50, 8, 20, stoneD); rect(ctx, 7, 48, 18, 3, stoneD); hline(ctx, 7, 24, 48, 0xded6c4);
  rect(ctx, 10, 56, 3, 6, 0x8a8170); rect(ctx, 19, 56, 3, 6, 0x6f6758);
  vline(ctx, 7, 48, H - 2, O); vline(ctx, 24, 48, H - 2, O);
  // robe (widening towards the feet)
  tri(ctx, [11, 47], [16, 22], [21, 47], g); tri(ctx, [16, 22], [21, 47], [17, 47], gD); rect(ctx, 11, 44, 11, 4, g);
  line(ctx, 12, 30, 20, 36, gD); line(ctx, 12, 38, 20, 42, gD);
  rect(ctx, 19, 30, 4, 6, gL); vline(ctx, 23, 30, 35, O); // tablet (left arm)
  // head, crown rays, raised right arm + torch
  disc(ctx, 16, 19, 3, g); px(ctx, 15, 19, gD); px(ctx, 17, 19, gD);
  for (const [dx, dy] of [[-4, -1], [-3, -3], [-1, -4], [1, -4], [3, -3], [4, -1]] as const) px(ctx, 16 + dx, 17 + dy, gL);
  rect(ctx, 10, 9, 2, 13, g); px(ctx, 12, 20, g); rect(ctx, 9, 6, 4, 3, gD); hline(ctx, 9, 12, 6, g);
  px(ctx, 10, 4, flame); px(ctx, 11, 4, flame); px(ctx, 10, 3, 0xff9f1c); px(ctx, 11, 2, flame); px(ctx, 10, 5, 0xffe29a);
  line(ctx, 11, 47, 16, 21, O); line(ctx, 16, 21, 21, 47, O); vline(ctx, 9, 9, 21, O);
  groundShadow(ctx, W, H);
}

/**
 * One Opera House shell seen from the side (review Stage C L11): a sail leaning to the left — a straight leading edge
 * from the foot `x0` up to the tip, a convex curved back from the tip down to the heel `x1` — with rib lines that
 * follow the curve, a shaded back and a glazed mouth under the leading edge.
 */
function sail(ctx: Ctx, x0: number, x1: number, base: number, tipX: number, tipY: number): void {
  const white = 0xf8f8f6, shadeC = 0xdce1e7, rib = 0xe6e9ed, glass = 0x7f9fb6;
  const n = base - tipY;
  const frontX = (y: number) => tipX + (x0 - tipX) * ((y - tipY) / n);
  const backX = (y: number) => tipX + (x1 - tipX) * Math.sin(((y - tipY) / n) * (Math.PI / 2));
  for (let y = tipY; y <= base; y++) {
    const xl = Math.round(frontX(y)), xr = Math.round(backX(y));
    hline(ctx, xl, xr, y, white);
    const xs = Math.round(xl + (xr - xl) * 0.72);
    if (xs < xr) hline(ctx, xs, xr, y, shadeC);
  }
  for (const k of [0.3, 0.55]) for (let y = tipY + 3; y < base - 1; y++) px(ctx, Math.round(frontX(y) + (backX(y) - frontX(y)) * k), y, rib);
  for (let y = base - 6; y <= base; y++) { const xl = Math.round(frontX(y)); hline(ctx, xl + 1, xl + 1 + Math.round((y - base + 6) * 0.9), y, glass); }
  let px0 = tipX, py0 = tipY;
  for (let y = tipY + 1; y <= base; y++) { const bx = Math.round(backX(y)); line(ctx, px0, py0, bx, y, O); px0 = bx; py0 = y; }
  line(ctx, tipX, tipY, x0, base, O);
}

function opera(ctx: Ctx, W: number, H: number): void {
  // 4×2 + 2 → 64×64: overlapping white sails leaning towards the harbour, on a granite podium that fills the 4×2
  // footprint on Bennelong Point; the back sails are drawn first so the lower front ones overlap them
  rect(ctx, 0, H - 32, W, 31, 0xd8bea0); hline(ctx, 0, W - 1, H - 32, 0xe8d4bc); // podium deck
  rect(ctx, 0, H - 16, W, 15, 0xc9a98a); hline(ctx, 0, W - 1, H - 16, 0xe2c8ac);
  for (let y = H - 12; y < H - 2; y += 3) hline(ctx, 2, W - 3, y, 0xb8977a); // steps
  hline(ctx, 0, W - 1, H - 2, O); vline(ctx, 0, H - 32, H - 2, O); vline(ctx, W - 1, H - 32, H - 2, O);
  const base = H - 18;
  sail(ctx, 34, 62, base, 31, 3);   // tallest, at the back
  sail(ctx, 21, 48, base, 18, 12);
  sail(ctx, 9, 33, base, 6, 22);
  sail(ctx, 2, 18, base, 1, 32);    // small front sail
  groundShadow(ctx, W, H);
}

function harbourBridge(ctx: Ctx, W: number, H: number): void {
  // 2×(8+1) + 1 → 32×160 overlay (solid:false, drawn under the actors; review Stage C L11): the 8-row footprint plus the
  // bridge's last row (drawnRows, re-review N4) and the north-shore overhang row. The asphalt road deck and its railings
  // are the 'B' tiles underneath (buildCityMap); the overlay adds footpaths, a dashed centre line, bold steel arch ribs
  // bowing out on both sides (widest at the crown) with hangers down to the deck, flags on the crown and granite pylons
  // at both ends — the north pair on the shore, the south pair on the bridge's last row
  const steel = 0x7f8a95, steelD = 0x4f5a66, steelL = 0xb8c2cb, walk = 0xb3b9bf, granite = 0xd8cba8, graniteD = 0xa99b78;
  const top = 22, bottom = H - 23, mid = Math.round((top + bottom) / 2), half = (bottom - top) / 2;
  // footpaths and the dashed centre line only over the 'B' deck (y ≥ 16); the overhang row is the north shore's grass
  rect(ctx, 7, 16, 2, H - 16, walk); rect(ctx, W - 9, 16, 2, H - 16, walk);
  for (let y = 18; y < H - 2; y += 6) rect(ctx, W / 2 - 1, y, 2, 3, 0xf2f2f2);
  for (let y = top; y <= bottom; y++) {
    const t = Math.sqrt(Math.max(0, 1 - ((y - mid) / half) ** 2)); // 0 at the pylons, 1 at the crown
    const out = Math.round(5 * t);                                // how far the rib bows out from the deck edge
    const xl = 5 - out, xr = W - 6 + out;
    rect(ctx, xl, y, 2, 1, steel); px(ctx, xl, y, steelD); px(ctx, xl + 1, y, steelL);
    rect(ctx, xr - 1, y, 2, 1, steel); px(ctx, xr, y, steelD); px(ctx, xr - 1, y, steelL);
    if ((y - top) % 5 === 0) { hline(ctx, xl + 2, 6, y, steelD); hline(ctx, W - 7, xr - 2, y, steelD); } // hangers
  }
  for (const x of [0, W - 3]) { rect(ctx, x, mid - 5, 3, 2, 0x2f5fb0); px(ctx, x + (x === 0 ? 0 : 2), mid - 3, O); } // flags on the crown
  for (const y0 of [0, H - 22]) { // pylons
    for (const x0 of [0, W - 8]) {
      rect(ctx, x0, y0, 8, 22, granite); rect(ctx, x0 + 5, y0, 3, 22, graniteD); hline(ctx, x0, x0 + 7, y0, 0xefe4c8);
      rect(ctx, x0 + 2, y0 + 4, 3, 5, 0x6d6450); hline(ctx, x0, x0 + 7, y0 + 12, graniteD);
      vline(ctx, x0, y0, y0 + 21, O); vline(ctx, x0 + 7, y0, y0 + 21, O); hline(ctx, x0, x0 + 7, y0 + 21, O);
    }
  }
}

function maracana(ctx: Ctx, W: number, H: number): void {
  // 4×3 → 64×48: oval stadium — white roof ring, blue/yellow stands, green pitch with white lines
  const cx = W / 2, cy = H / 2;
  ellipse(ctx, cx, cy, 31.5, 23.5, O);
  ellipse(ctx, cx, cy, 30.5, 22.5, 0xf2f2f2);
  ellipse(ctx, cx, cy, 26, 18.5, 0x9aa4ae);
  ellipse(ctx, cx, cy, 25, 17.5, 0x3a6fd6);
  ellipse(ctx, cx, cy - 1, 25, 15, 0xf2c94c); ellipse(ctx, cx, cy, 22, 14.5, 0x3a6fd6); // ring of yellow seats
  ellipse(ctx, cx, cy, 18, 11, 0x4caf50);
  for (let x = 16; x < 48; x += 4) vline(ctx, x, cy - 9, cy + 9, 0x5cbf60); // mowing stripes
  vline(ctx, cx, cy - 9, cy + 9, 0xffffff); disc(ctx, cx, cy, 3, 0xffffff); disc(ctx, cx, cy, 2, 0x4caf50);
  rect(ctx, 15, cy - 4, 3, 8, 0xffffff); rect(ctx, 16, cy - 3, 2, 6, 0x4caf50); rect(ctx, 46, cy - 4, 3, 8, 0xffffff); rect(ctx, 46, cy - 3, 2, 6, 0x4caf50);
  hline(ctx, 10, 53, 3, 0xffffff); // roof highlight
  groundShadow(ctx, W, H);
}

function christ(ctx: Ctx, W: number, H: number): void {
  // 2×2 + 3 → 32×80: Christ the Redeemer, arms outstretched, on the rocky summit of Corcovado
  const rock = 0x8a8374, rockD = 0x6a6356, green = 0x4f8a3f, stone = 0xf1eee6, stoneD = 0xcfc9bb;
  tri(ctx, [0, H - 1], [15, H - 30], [31, H - 1], rock); tri(ctx, [15, H - 30], [31, H - 1], [20, H - 1], rockD);
  for (const [x, y] of [[3, H - 4], [6, H - 8], [26, H - 5], [23, H - 10], [9, H - 3], [28, H - 2]] as const) { px(ctx, x, y, green); px(ctx, x + 1, y, green); }
  line(ctx, 0, H - 1, 15, H - 30, O); line(ctx, 15, H - 30, 31, H - 1, O);
  rect(ctx, 12, H - 36, 8, 8, stoneD); hline(ctx, 12, 19, H - 36, stone); vline(ctx, 11, H - 36, H - 29, O); vline(ctx, 20, H - 36, H - 29, O); // pedestal
  rect(ctx, 14, 16, 4, 29, stone); rect(ctx, 16, 16, 2, 29, stoneD); rect(ctx, 13, 38, 6, 7, stone); px(ctx, 18, 44, stoneD); // robe
  rect(ctx, 2, 18, 28, 3, stone); hline(ctx, 2, 29, 20, stoneD); px(ctx, 1, 19, stone); px(ctx, 30, 19, stone); // arms
  disc(ctx, 16, 13, 2.6, stone); px(ctx, 17, 14, stoneD);
  hline(ctx, 1, 30, 17, O); hline(ctx, 1, 13, 21, O); hline(ctx, 18, 30, 21, O); vline(ctx, 13, 21, 45, O); vline(ctx, 18, 21, 45, O);
  groundShadow(ctx, W, H);
}

function sugarloaf(ctx: Ctx, W: number, H: number): void {
  // 3×3 + 2 → 48×80: Sugarloaf dome of bare granite rising from the sea, green skirt, cable car from Urca
  const rock = 0x9a917f, rockL = 0xb9b09c, rockD = 0x756d5d, green = 0x3f7f3a, greenL = 0x5fa84a;
  ellipse(ctx, 10, H - 14, 10, 15, O); ellipse(ctx, 10, H - 14, 9, 14, green); ellipse(ctx, 8, H - 18, 5, 7, greenL); // Morro da Urca
  ellipse(ctx, 30, H - 30, 18, 31, O); ellipse(ctx, 30, H - 30, 17, 30, rock);
  ellipse(ctx, 25, H - 38, 7, 18, rockL); ellipse(ctx, 38, H - 24, 6, 18, rockD);
  rect(ctx, 12, H - 12, W - 12, 12, green); ellipse(ctx, 30, H - 10, 18, 7, green); ellipse(ctx, 22, H - 12, 7, 4, greenL);
  hline(ctx, 12, W - 1, H - 1, O);
  line(ctx, 29, 20, 10, H - 28, 0x3a3a3a); // cable from the summit down to Urca
  vline(ctx, 20, 35, 36, 0x3a3a3a); rect(ctx, 18, 37, 4, 3, 0xd94b3d); px(ctx, 19, 38, 0x9fd3ff); px(ctx, 20, 38, 0x9fd3ff); // cabin
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
    case 'pyramids': pyramids(ctx, W, H); break;
    case 'sphinx': sphinx(ctx, W, H); break;
    case 'mosque': mosque(ctx, W, H); break;
    case 'museum': museum(ctx, W, H); break;
    case 'empire': empire(ctx, W, H); break;
    case 'liberty': liberty(ctx, W, H); break;
    case 'opera': opera(ctx, W, H); break;
    case 'harbour_bridge': harbourBridge(ctx, W, H); break;
    case 'maracana': maracana(ctx, W, H); break;
    case 'christ': christ(ctx, W, H); break;
    case 'sugarloaf': sugarloaf(ctx, W, H); break;
    default: placeholder(ctx, W, H, kind);
  }
  return scaleCanvas(canvas, 2);
}

/**
 * Rows a landmark is drawn over: its footprint height, and for an overlay (solid:false) standing on a bridge also
 * every further bridge row ('B') below the footprint, so the art covers the whole bridge — the Harbour Bridge's 8-row
 * footprint sits on a 9-row bridge (re-review N4). The image is placed from its top-left corner (buildCityMap), so
 * the extra rows extend it southwards; depth and collision still come from the footprint.
 */
export function drawnRows(rows: readonly string[], lm: LandmarkDef): number {
  let h = lm.h;
  if (lm.solid === false) while (rows[lm.at.ty + h]?.[lm.at.tx] === 'B') h++;
  return h;
}

/** Register `landmark:<kind>` for every landmark used by a playable city (idempotent). */
export function createLandmarkTextures(scene: Phaser.Scene): void {
  for (const city of PLAYABLE_CITIES) {
    for (const lm of city.landmarks) {
      const key = TEX.landmark(lm.kind);
      if (scene.textures.exists(key)) continue;
      registerImage(scene, key, drawLandmark(lm.kind, lm.w, drawnRows(city.rows, lm), lm.overhang ?? 0));
    }
  }
}
