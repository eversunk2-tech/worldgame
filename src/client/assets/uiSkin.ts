// Code-drawn UI skin (spec 5.9): 9-slice panel/button/bubble textures, 16px pixel icons (2×), sign, shadow.
import Phaser from 'phaser';
import type { CodeDrawer } from './atlasBuilder';
import { TEX } from './manifest';
import { disc, hline, makeCanvas, newCell, px, rect, registerImage, scaleCanvas, tri, vline } from './pixelArt';

export const UI = {
  panel: TEX.ui('panel'),
  panelLight: TEX.ui('panel_light'),
  btn: TEX.ui('btn'),
  btnHover: TEX.ui('btn_hover'),
  btnDown: TEX.ui('btn_down'),
  btnDisabled: TEX.ui('btn_disabled'),
  btnSelected: TEX.ui('btn_selected'),
  btnDanger: TEX.ui('btn_danger'),
  bubble: TEX.ui('bubble'),
  bubbleTail: TEX.ui('bubble_tail'),
  tag: TEX.ui('tag'),
  /** 9-slice corner size in px for every skin texture (3×3 cells of 8px = 24px) */
  slice: 8,
} as const;

interface SkinColors { fill: number; border: number; highlight: number; shadow: number }

/** 24×24 nine-slice source: 2px border, cut corner pixels, 1px inner highlight (top/left) and shadow (bottom/right). */
function drawSkin(c: SkinColors): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(24, 24);
  rect(ctx, 0, 0, 24, 24, c.border);
  rect(ctx, 2, 2, 20, 20, c.fill);
  hline(ctx, 2, 21, 2, c.highlight); vline(ctx, 2, 2, 21, c.highlight);
  hline(ctx, 3, 21, 21, c.shadow); vline(ctx, 21, 3, 21, c.shadow);
  // corner cuts
  ctx.clearRect(0, 0, 1, 1); ctx.clearRect(23, 0, 1, 1); ctx.clearRect(0, 23, 1, 1); ctx.clearRect(23, 23, 1, 1);
  px(ctx, 1, 1, c.border); px(ctx, 22, 1, c.border); px(ctx, 1, 22, c.border); px(ctx, 22, 22, c.border);
  return canvas;
}

function drawBubble(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(24, 24);
  rect(ctx, 0, 0, 24, 24, 0x22223a);
  rect(ctx, 1, 1, 22, 22, 0xffffff);
  ctx.clearRect(0, 0, 1, 1); ctx.clearRect(23, 0, 1, 1); ctx.clearRect(0, 23, 1, 1); ctx.clearRect(23, 23, 1, 1);
  hline(ctx, 2, 21, 22, 0xdddde8); vline(ctx, 22, 2, 21, 0xdddde8);
  return canvas;
}

function drawBubbleTail(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(10, 6);
  tri(ctx, [0, 0], [9, 0], [4, 5], 0x22223a);
  tri(ctx, [1, 0], [7, 0], [4, 3], 0xffffff);
  return canvas;
}

function drawTag(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(24, 24);
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(1, 0, 22, 24); ctx.fillRect(0, 1, 24, 22);
  return canvas;
}

// ---------------------------------------------------------------- icons (16-grid)
const O = 0x2b1d14;
export const ICON_DRAWERS: Record<string, CodeDrawer> = {
  icon_coin: (ctx) => {
    disc(ctx, 8, 8, 7, 0x8a5a00); disc(ctx, 8, 8, 6, 0xffd166); disc(ctx, 8, 8, 4, 0xffb703);
    rect(ctx, 6, 5, 2, 6, 0x8a5a00); rect(ctx, 8, 5, 2, 1, 0x8a5a00); rect(ctx, 8, 7, 2, 1, 0x8a5a00); px(ctx, 9, 6, 0x8a5a00);
    px(ctx, 4, 4, 0xfff0b0); px(ctx, 5, 3, 0xfff0b0);
  },
  icon_lock: (ctx) => {
    rect(ctx, 3, 7, 10, 8, O); rect(ctx, 4, 8, 8, 6, 0xbdbdbd); rect(ctx, 7, 10, 2, 3, 0x424242);
    for (let y = 3; y < 7; y++) { px(ctx, 4, y, 0xdddddd); px(ctx, 11, y, 0xdddddd); px(ctx, 3, y, O); px(ctx, 12, y, O); }
    hline(ctx, 5, 10, 2, 0xdddddd); hline(ctx, 4, 11, 1, O); px(ctx, 5, 3, O); px(ctx, 10, 3, O);
  },
  icon_pin: (ctx, color = 0xffd166) => {
    disc(ctx, 8, 6, 5.5, O); disc(ctx, 8, 6, 4.5, color); tri(ctx, [3, 8], [13, 8], [8, 15], O); tri(ctx, [4, 8], [12, 8], [8, 13], color);
    disc(ctx, 8, 6, 2, O); px(ctx, 5, 3, 0xfff0b0);
  },
  icon_pin_gray: (ctx) => ICON_DRAWERS.icon_pin!(ctx, 0x9a9a9a),
  icon_stamp: (ctx) => {
    disc(ctx, 8, 8, 7, 0x8a1c1c); disc(ctx, 8, 8, 6, 0xd62828); disc(ctx, 8, 8, 4, 0xffffff);
    px(ctx, 8, 5, 0xd62828); px(ctx, 7, 6, 0xd62828); px(ctx, 8, 6, 0xd62828); px(ctx, 9, 6, 0xd62828);
    hline(ctx, 6, 10, 7, 0xd62828); hline(ctx, 7, 9, 8, 0xd62828); px(ctx, 6, 9, 0xd62828); px(ctx, 10, 9, 0xd62828);
    px(ctx, 6, 10, 0xd62828); px(ctx, 10, 10, 0xd62828);
  },
  icon_heart: (ctx) => {
    disc(ctx, 5, 6, 3.2, 0xb02a2a); disc(ctx, 11, 6, 3.2, 0xb02a2a);
    for (let y = 6; y <= 13; y++) { const w = 13 - y; hline(ctx, 8 - w, 8 + w, y, 0xb02a2a); }
    disc(ctx, 5, 6, 2.2, 0xff6b6b); disc(ctx, 11, 6, 2.2, 0xff6b6b);
    for (let y = 6; y <= 11; y++) { const w = 11 - y; hline(ctx, 8 - w, 8 + w, y, 0xff6b6b); }
  },
  icon_speaker_on: (ctx) => {
    rect(ctx, 2, 6, 3, 4, O); tri(ctx, [4, 8], [8, 3], [8, 13], O); rect(ctx, 3, 7, 2, 2, 0xdddddd); tri(ctx, [5, 8], [7, 5], [7, 11], 0xdddddd);
    px(ctx, 10, 6, 0x6bd77b); px(ctx, 10, 9, 0x6bd77b); px(ctx, 11, 7, 0x6bd77b); px(ctx, 11, 8, 0x6bd77b);
    px(ctx, 12, 4, 0x6bd77b); px(ctx, 13, 5, 0x6bd77b); px(ctx, 14, 6, 0x6bd77b); px(ctx, 14, 9, 0x6bd77b); px(ctx, 13, 10, 0x6bd77b); px(ctx, 12, 11, 0x6bd77b); px(ctx, 14, 7, 0x6bd77b); px(ctx, 14, 8, 0x6bd77b);
  },
  icon_speaker_off: (ctx) => {
    rect(ctx, 2, 6, 3, 4, O); tri(ctx, [4, 8], [8, 3], [8, 13], O); rect(ctx, 3, 7, 2, 2, 0x9a9a9a); tri(ctx, [5, 8], [7, 5], [7, 11], 0x9a9a9a);
    for (let i = 0; i < 5; i++) { px(ctx, 10 + i, 5 + i, 0xff6b6b); px(ctx, 14 - i, 5 + i, 0xff6b6b); }
  },
  icon_map: (ctx) => {
    rect(ctx, 1, 2, 14, 12, O); rect(ctx, 2, 3, 12, 10, 0xe6d5a0);
    rect(ctx, 4, 5, 3, 3, 0x7bb661); rect(ctx, 9, 4, 4, 2, 0x7bb661); rect(ctx, 8, 9, 3, 3, 0x7bb661);
    vline(ctx, 6, 3, 12, 0xcdbf8a); px(ctx, 11, 8, 0xd62828);
  },
};

function drawSign(): HTMLCanvasElement {
  const { canvas, ctx } = newCell();
  rect(ctx, 7, 8, 2, 7, 0x6b4520); px(ctx, 6, 15, O); px(ctx, 9, 15, O);
  rect(ctx, 1, 1, 14, 8, O); rect(ctx, 2, 2, 12, 6, 0xd9a870); hline(ctx, 2, 13, 2, 0xe8be88);
  hline(ctx, 4, 11, 4, 0x6b4520); hline(ctx, 4, 9, 6, 0x6b4520);
  return canvas;
}

function drawShadow(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(16, 6);
  ctx.fillStyle = 'rgba(0,0,0,1)';
  for (let y = 0; y < 6; y++) {
    const dy = (y + 0.5 - 3) / 3;
    const w = Math.floor(Math.sqrt(Math.max(0, 1 - dy * dy)) * 8);
    if (w > 0) ctx.fillRect(8 - w, y, w * 2, 1);
  }
  return canvas;
}

/** Register every UI texture once (Boot). Idempotent. */
export function createUiTextures(scene: Phaser.Scene): void {
  const put = (key: string, canvas: HTMLCanvasElement) => registerImage(scene, key, canvas);
  put(UI.panel, drawSkin({ fill: 0x2b2d4a, border: 0x8f9bff, highlight: 0x4a4d7a, shadow: 0x20223a }));
  put(UI.panelLight, drawSkin({ fill: 0x3a3d63, border: 0x8f9bff, highlight: 0x585c8f, shadow: 0x2b2d4a }));
  put(UI.btn, drawSkin({ fill: 0x3d4270, border: 0x8f9bff, highlight: 0x5a609c, shadow: 0x2b2d4a }));
  put(UI.btnHover, drawSkin({ fill: 0x545a9a, border: 0xb3bcff, highlight: 0x7278bd, shadow: 0x3d4270 }));
  put(UI.btnDown, drawSkin({ fill: 0x2b2d4a, border: 0x8f9bff, highlight: 0x2b2d4a, shadow: 0x1b1b2f }));
  put(UI.btnDisabled, drawSkin({ fill: 0x2a2c3c, border: 0x55587a, highlight: 0x33364a, shadow: 0x22232f }));
  put(UI.btnSelected, drawSkin({ fill: 0xffd166, border: 0xffe9a8, highlight: 0xffe9a8, shadow: 0xd9a63a }));
  put(UI.btnDanger, drawSkin({ fill: 0x6b2b3a, border: 0xff6b6b, highlight: 0x8a3a4d, shadow: 0x4a1c28 }));
  put(UI.bubble, drawBubble());
  put(UI.bubbleTail, drawBubbleTail());
  put(UI.tag, drawTag());
  put(TEX.sign, scaleCanvas(drawSign(), 2));
  put(TEX.shadow, scaleCanvas(drawShadow(), 2));
  const icons: [string, string][] = [
    ['coin', 'icon_coin'], ['lock', 'icon_lock'], ['pin', 'icon_pin'], ['pinGray', 'icon_pin_gray'], ['stamp', 'icon_stamp'],
    ['heart', 'icon_heart'], ['speakerOn', 'icon_speaker_on'], ['speakerOff', 'icon_speaker_off'], ['map', 'icon_map'],
  ];
  for (const [name, drawer] of icons) {
    const { canvas, ctx } = newCell();
    ICON_DRAWERS[drawer]!(ctx);
    put(TEX.icon(name), scaleCanvas(canvas, 2));
  }
}
