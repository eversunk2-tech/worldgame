// Code-generated monster sprites on the 16 grid (spec 5.7): 3 frames × 4 facings, registered at 2× as `monster:<id>`.
// Frames 0/2 bounce or flap, left is the mirrored right frame, the back view has no eyes.
import Phaser from 'phaser';
import type { Facing, MonsterDef } from '../../shared/types';
import { ALL_MONSTERS } from '../../shared/content/monsters';
import { CHAR_FRAME, FACING_ROWS, TEX } from './manifest';
import { disc, flipX, hline, makeCanvas, newCell, px, rect, registerSheet, scaleCanvas, shade, tri } from './pixelArt';

type Ctx = CanvasRenderingContext2D;
const O = 0x1f1a17;

function eyes(ctx: Ctx, facing: Facing, y: number, xs: [number, number], color = 0xffffff): void {
  if (facing === 'up') return;
  const shift = facing === 'right' ? 1 : 0;
  for (const x of xs) { px(ctx, x + shift, y, color); px(ctx, x + shift, y + 1, O); }
}

function dustDokkaebi(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  const bob = frame === 1 ? 0 : 1;
  const light = shade(c, 1.25);
  disc(ctx, 8, 9 + bob, 5.5, O);
  disc(ctx, 8, 9 + bob, 4.5, c);
  disc(ctx, 5, 7 + bob, 1.5, light); disc(ctx, 11, 8 + bob, 1.2, light); disc(ctx, 7, 12 + bob, 1.2, light);
  // horns
  tri(ctx, [4, 5 + bob], [3, 1 + bob], [6, 4 + bob], 0xffd166); tri(ctx, [12, 5 + bob], [13, 1 + bob], [10, 4 + bob], 0xffd166);
  px(ctx, 3, 1 + bob, O); px(ctx, 13, 1 + bob, O);
  eyes(ctx, facing, 8 + bob, [6, 9]);
  if (facing !== 'up') hline(ctx, 7, 9, 11 + bob, O);
  // dust puffs at the feet
  if (frame !== 1) { px(ctx, 2, 14, light); px(ctx, 13, 13, light); }
}

function bird(ctx: Ctx, facing: Facing, frame: number, body: number, belly: number, beak: number, wing: number): void {
  const bob = frame === 1 ? 0 : 1;
  const flap = frame === 0 ? -2 : frame === 2 ? 2 : 0;
  disc(ctx, 8, 10 + bob, 4.5, O);
  disc(ctx, 8, 10 + bob, 3.5, body);
  disc(ctx, 8, 11 + bob, 2, belly);
  // wings
  rect(ctx, 1, 9 + bob + flap, 4, 2, O); rect(ctx, 11, 9 + bob + flap, 4, 2, O);
  rect(ctx, 2, 9 + bob + flap, 3, 1, wing); rect(ctx, 11, 9 + bob + flap, 3, 1, wing);
  // head
  disc(ctx, 8, 5 + bob, 3, O); disc(ctx, 8, 5 + bob, 2.2, body);
  if (facing === 'down') { px(ctx, 8, 7 + bob, beak); px(ctx, 8, 8 + bob, beak); }
  else if (facing === 'right') { px(ctx, 11, 5 + bob, beak); px(ctx, 12, 5 + bob, beak); }
  eyes(ctx, facing, 4 + bob, [6, 9], 0xffffff);
  // feet
  px(ctx, 6, 15, beak); px(ctx, 9, 15, beak);
  // tail
  rect(ctx, 7, 13 + bob, 2, 2, shade(body, 0.7));
}

function gargoyle(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  const bob = frame === 1 ? 0 : 1;
  const flap = frame === 1 ? 0 : 2;
  const light = shade(c, 1.2), dark = shade(c, 0.7);
  // wings
  tri(ctx, [4, 8 + bob], [0, 4 + bob - flap], [1, 11 + bob], O); tri(ctx, [12, 8 + bob], [15, 4 + bob - flap], [14, 11 + bob], O);
  tri(ctx, [4, 8 + bob], [1, 5 + bob - flap], [2, 10 + bob], dark); tri(ctx, [12, 8 + bob], [14, 5 + bob - flap], [13, 10 + bob], dark);
  // body
  rect(ctx, 4, 5 + bob, 8, 8, O); rect(ctx, 5, 6 + bob, 6, 6, c); rect(ctx, 6, 8 + bob, 4, 3, light);
  // horns
  tri(ctx, [5, 5 + bob], [4, 1 + bob], [7, 5 + bob], dark); tri(ctx, [11, 5 + bob], [12, 1 + bob], [9, 5 + bob], dark);
  eyes(ctx, facing, 7 + bob, [6, 9], 0xffe08a);
  if (facing !== 'up') { px(ctx, 7, 10 + bob, O); px(ctx, 9, 10 + bob, O); }
  // feet
  rect(ctx, 5, 13 + bob, 2, 2, dark); rect(ctx, 9, 13 + bob, 2, 2, dark);
}

function generic(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  const bob = frame === 1 ? 0 : 1;
  disc(ctx, 8, 9 + bob, 5, O); disc(ctx, 8, 9 + bob, 4, c);
  eyes(ctx, facing, 8 + bob, [6, 9]);
}

export function drawMonster(ctx: Ctx, def: MonsterDef, facing: Facing, frame: number): void {
  switch (def.id) {
    case 'dust_dokkaebi': dustDokkaebi(ctx, facing, frame, def.color); break;
    case 'magpie': bird(ctx, facing, frame, def.color, 0xffffff, 0xffa726, 0x5c7cff); break;
    case 'pigeon': bird(ctx, facing, frame, def.color, shade(def.color, 1.2), 0xffa726, 0x6b7a90); break;
    case 'gargoyle': gargoyle(ctx, facing, frame, def.color); break;
    default: generic(ctx, facing, frame, def.color);
  }
}

/** 3×4 sheet at 2× for every monster (idempotent). */
export function createMonsterTextures(scene: Phaser.Scene): void {
  for (const def of ALL_MONSTERS) {
    const key = TEX.monster(def.id);
    if (scene.textures.exists(key)) continue;
    const { canvas, ctx } = makeCanvas(CHAR_FRAME * 3, CHAR_FRAME * 4);
    for (const facing of ['down', 'right', 'up'] as Facing[]) {
      for (let frame = 0; frame < 3; frame++) {
        const cell = newCell();
        drawMonster(cell.ctx, def, facing, frame);
        const big = scaleCanvas(cell.canvas, 2);
        ctx.drawImage(big, frame * CHAR_FRAME, FACING_ROWS[facing] * CHAR_FRAME);
        if (facing === 'right') ctx.drawImage(scaleCanvas(flipX(cell.canvas), 2), frame * CHAR_FRAME, FACING_ROWS.left * CHAR_FRAME);
      }
    }
    registerSheet(scene, key, canvas, CHAR_FRAME, CHAR_FRAME);
  }
}
