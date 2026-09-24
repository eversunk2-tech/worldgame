// Six pixel emoji reactions (spec 6.3), drawn on the 16 grid and registered at 2× as `emote:<id>`.
import Phaser from 'phaser';
import type { EmoteId } from '../../shared/types';
import { TEX } from './manifest';
import { disc, hline, newCell, px, rect, registerImage, scaleCanvas, vline } from './pixelArt';

export const EMOTE_IDS: readonly EmoteId[] = ['smile', 'heart', 'laugh', 'wow', 'thumbs', 'question'];
export const EMOTE_KEYS: Record<EmoteId, string> = { smile: '1', heart: '2', laugh: '3', wow: '4', thumbs: '5', question: '6' };

const Y = 0xffd166, YD = 0xd9a63a, O = 0x3a2a10, W = 0xffffff, R = 0xff6b6b, RD = 0xc0392b;

function face(ctx: CanvasRenderingContext2D): void {
  disc(ctx, 8, 8, 7, O);
  disc(ctx, 8, 8, 6, Y);
  px(ctx, 5, 4, 0xffe9a8); px(ctx, 6, 3, 0xffe9a8);
  px(ctx, 10, 11, YD); px(ctx, 11, 10, YD);
}

export function drawEmote(ctx: CanvasRenderingContext2D, id: EmoteId): void {
  switch (id) {
    case 'smile':
      face(ctx);
      px(ctx, 5, 6, O); px(ctx, 10, 6, O);
      hline(ctx, 5, 10, 10, O); px(ctx, 4, 9, O); px(ctx, 11, 9, O);
      break;
    case 'heart':
      disc(ctx, 5, 6, 3.2, RD); disc(ctx, 11, 6, 3.2, RD);
      for (let y = 6; y <= 13; y++) { const w = 13 - y; hline(ctx, 8 - w, 8 + w, y, RD); }
      disc(ctx, 5, 6, 2.2, R); disc(ctx, 11, 6, 2.2, R);
      for (let y = 6; y <= 11; y++) { const w = 11 - y; hline(ctx, 8 - w, 8 + w, y, R); }
      px(ctx, 4, 5, 0xffb3b3); px(ctx, 5, 4, 0xffb3b3);
      break;
    case 'laugh':
      face(ctx);
      hline(ctx, 4, 6, 6, O); hline(ctx, 9, 11, 6, O); px(ctx, 4, 5, O); px(ctx, 11, 5, O);
      rect(ctx, 5, 9, 6, 3, O); rect(ctx, 6, 10, 4, 2, W);
      px(ctx, 2, 8, 0x8ecbff); px(ctx, 2, 9, 0x8ecbff); px(ctx, 13, 8, 0x8ecbff); px(ctx, 13, 9, 0x8ecbff);
      break;
    case 'wow':
      face(ctx);
      rect(ctx, 4, 5, 2, 2, O); rect(ctx, 10, 5, 2, 2, O);
      disc(ctx, 8, 10.5, 1.8, O); px(ctx, 8, 10, 0x5a3a20);
      break;
    case 'thumbs': {
      const skin = 0xffd6a5, sd = 0xd9a066;
      rect(ctx, 5, 7, 8, 7, O); rect(ctx, 6, 8, 6, 5, skin);
      rect(ctx, 3, 8, 3, 6, O); rect(ctx, 4, 9, 1, 4, 0x3d7bd6);
      rect(ctx, 8, 1, 3, 7, O); rect(ctx, 9, 2, 1, 6, skin); px(ctx, 9, 2, sd);
      hline(ctx, 7, 11, 9, sd); hline(ctx, 7, 11, 11, sd);
      break;
    }
    case 'question':
      disc(ctx, 8, 8, 7, O); disc(ctx, 8, 8, 6, 0x8ecbff);
      rect(ctx, 6, 4, 4, 1, O); vline(ctx, 10, 4, 6, O); hline(ctx, 8, 10, 7, O); vline(ctx, 8, 7, 9, O); px(ctx, 8, 11, O);
      px(ctx, 5, 5, O); px(ctx, 5, 4, O);
      break;
  }
}

export function createEmoteTextures(scene: Phaser.Scene): void {
  for (const id of EMOTE_IDS) {
    const key = TEX.emote(id);
    if (scene.textures.exists(key)) continue;
    const { canvas, ctx } = newCell();
    drawEmote(ctx, id);
    registerImage(scene, key, scaleCanvas(canvas, 2));
  }
}
