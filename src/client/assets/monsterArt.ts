// Code-generated monster sprites on the 16 grid (spec 5.7, 12 kinds): 3 frames × 4 facings, registered at 2× as `monster:<id>`.
// Frames 0/2 bounce or flap, left is the mirrored right frame, the back view has no eyes.
import Phaser from 'phaser';
import type { Facing, MonsterDef } from '../../shared/types';
import { ALL_MONSTERS } from '../../shared/content/monsters';
import { CHAR_FRAME, FACING_ROWS, TEX } from './manifest';
import { disc, flipX, hline, makeCanvas, newCell, px, rect, registerSheet, scaleCanvas, shade, tri, vline } from './pixelArt';

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

// ---------------------------------------------------------------- Stage C: 8 monsters (spec 5.7)

/** Six little legs behind a round shell; walk frames lift alternate legs (beetles). */
function bugLegs(ctx: Ctx, frame: number, bob: number): void {
  const lift = (i: number) => (frame === 1 ? 0 : (i % 2 === (frame === 0 ? 0 : 1) ? -1 : 0));
  [5, 8, 11].forEach((y, i) => { hline(ctx, 1, 3, y + bob + lift(i), O); hline(ctx, 12, 14, y + bob + lift(i + 1), O); });
}

/** Beetle head: toward the viewer (down), away (up, no eyes) or to the side (right). */
function bugHead(ctx: Ctx, facing: Facing, bob: number, color: number): void {
  const hx = facing === 'right' ? 13 : 8;
  const hy = facing === 'down' ? 13 : facing === 'up' ? 2 : 8;
  disc(ctx, hx, hy + bob, 2.6, O); disc(ctx, hx, hy + bob, 1.8, color);
  if (facing === 'down') { px(ctx, 7, 13 + bob, 0xffffff); px(ctx, 9, 13 + bob, 0xffffff); px(ctx, 6, 15 + bob, O); px(ctx, 10, 15 + bob, O); }
  else if (facing === 'right') { px(ctx, 14, 7 + bob, 0xffffff); px(ctx, 15, 9 + bob, O); }
  else { px(ctx, 7, 0 + bob, O); px(ctx, 9, 0 + bob, O); } // antennae from behind
}

function scarab(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 반짝 풍뎅이: round blue-sheened beetle with a centre seam, gold edge and a twinkle that hops around
  const bob = frame === 1 ? 0 : 1;
  const light = shade(c, 1.45), dark = shade(c, 0.6), gold = 0xffd166;
  bugLegs(ctx, frame, bob);
  if (facing === 'up') bugHead(ctx, facing, bob, 0x1f2a44);
  disc(ctx, 8, 7 + bob, 5.4, O); disc(ctx, 8, 7 + bob, 4.5, c);
  disc(ctx, 6, 5 + bob, 1.6, light); vline(ctx, 8, 3 + bob, 11 + bob, dark); hline(ctx, 5, 11, 11 + bob, gold);
  const tw = frame === 0 ? [5, 4] : frame === 2 ? [10, 6] : [6, 5];
  px(ctx, tw[0]!, tw[1]! + bob, 0xffffff);
  if (facing !== 'up') bugHead(ctx, facing, bob, 0x1f2a44);
}

function mummyCat(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 붕대 고양이: white cat wrapped in bandages, pointy ears, one golden eye peeking out, swinging tail
  const bob = frame === 1 ? 0 : 1;
  const band = shade(c, 0.78), eye = 0xffc94d;
  const tx = frame === 0 ? 13 : frame === 2 ? 14 : 13;
  vline(ctx, tx + 1, 6 + bob, 12 + bob, O); vline(ctx, tx, 6 + bob, 12 + bob, c); px(ctx, tx, 8 + bob, band); px(ctx, tx, 10 + bob, band);
  disc(ctx, 8, 11 + bob, 4.6, O); disc(ctx, 8, 11 + bob, 3.8, c);
  hline(ctx, 5, 11, 10 + bob, band); hline(ctx, 4, 12, 12 + bob, band); px(ctx, 6, 9 + bob, band); px(ctx, 10, 13 + bob, band);
  rect(ctx, 5, 14, 2, 2, c); rect(ctx, 9, 14, 2, 2, c); px(ctx, 5, 15, band); px(ctx, 10, 15, band);
  disc(ctx, 8, 6 + bob, 4.2, O); disc(ctx, 8, 6 + bob, 3.4, c);
  tri(ctx, [3, 5 + bob], [4, 0 + bob], [7, 3 + bob], O); tri(ctx, [13, 5 + bob], [12, 0 + bob], [9, 3 + bob], O);
  px(ctx, 4, 2 + bob, c); px(ctx, 5, 3 + bob, c); px(ctx, 12, 2 + bob, c); px(ctx, 11, 3 + bob, c);
  hline(ctx, 5, 11, 4 + bob, band); hline(ctx, 5, 11, 8 + bob, band);
  if (facing === 'down') { px(ctx, 6, 6 + bob, eye); px(ctx, 6, 7 + bob, O); hline(ctx, 9, 11, 6 + bob, band); px(ctx, 8, 7 + bob, 0xf2a0a8); }
  else if (facing === 'right') { px(ctx, 10, 6 + bob, eye); px(ctx, 10, 7 + bob, O); px(ctx, 12, 7 + bob, 0xf2a0a8); }
}

function pizzaRat(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 피자 생쥐: grey mouse, round ears, pink nose and tail, a pepperoni pizza slice in its paws
  const bob = frame === 1 ? 0 : 1;
  const light = shade(c, 1.25), pink = 0xf2a0a8, cheese = 0xf6c945, crust = 0xc98a3c, pep = 0xd9432b;
  const w = frame === 0 ? -1 : frame === 2 ? 1 : 0;
  px(ctx, 3, 13 + bob, pink); px(ctx, 2, 12 + bob, pink); px(ctx, 1, 11 + bob + w, pink); px(ctx, 1, 10 + bob + w, pink); px(ctx, 2, 9 + bob + w, pink);
  disc(ctx, 8, 11 + bob, 4.2, O); disc(ctx, 8, 11 + bob, 3.4, c); disc(ctx, 8, 12 + bob, 1.8, light);
  px(ctx, 6, 15, pink); px(ctx, 10, 15, pink);
  for (const ex of [4, 12]) { disc(ctx, ex, 3 + bob, 2.3, O); disc(ctx, ex, 3 + bob, 1.5, c); px(ctx, ex, 3 + bob, pink); }
  disc(ctx, 8, 6 + bob, 3.6, O); disc(ctx, 8, 6 + bob, 2.8, c);
  eyes(ctx, facing, 5 + bob, [7, 9]);
  if (facing === 'down') { px(ctx, 8, 8 + bob, pink); px(ctx, 5, 8 + bob, light); px(ctx, 11, 8 + bob, light); }
  else if (facing === 'right') { px(ctx, 11, 7 + bob, pink); px(ctx, 12, 8 + bob, light); }
  if (facing !== 'up') { // pizza slice held in front
    const x = facing === 'right' ? 11 : 9;
    tri(ctx, [x, 9 + bob], [x + 5, 9 + bob], [x + 2, 14 + bob], cheese); hline(ctx, x, x + 5, 9 + bob, crust);
    px(ctx, x + 2, 11 + bob, pep); px(ctx, x + 3, 10 + bob, pep);
  }
}

function taxiBug(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 노란 택시 벌레: yellow ladybug with a black-and-white taxi checker band, black spots and a roof light
  const bob = frame === 1 ? 0 : 1;
  const dark = shade(c, 0.72), check = 0x1f1a17;
  bugLegs(ctx, frame, bob);
  if (facing === 'up') bugHead(ctx, facing, bob, check);
  disc(ctx, 8, 7 + bob, 5.4, O); disc(ctx, 8, 7 + bob, 4.5, c);
  for (let x = 4; x <= 12; x++) { px(ctx, x, 7 + bob, x % 2 === 0 ? check : 0xffffff); px(ctx, x, 8 + bob, x % 2 === 1 ? check : 0xffffff); }
  vline(ctx, 8, 3 + bob, 6 + bob, dark); vline(ctx, 8, 9 + bob, 11 + bob, dark);
  px(ctx, 5, 5 + bob, check); px(ctx, 11, 5 + bob, check); px(ctx, 5, 10 + bob, check); px(ctx, 11, 10 + bob, check);
  rect(ctx, 6, 3 + bob, 4, 2, 0xff9f1c); px(ctx, 7, 3 + bob, 0xffe29a); hline(ctx, 6, 9, 2 + bob, O); // roof light
  if (facing !== 'up') bugHead(ctx, facing, bob, check);
}

function kangaroo(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 통통 캥거루: pear-shaped brown kangaroo, tall pointed ears, pale belly with a joey peeking from the pouch, big
  // feet and a thick tail; walk frames are hops (everything 1px up, like the other monsters' bounce)
  const h = frame === 1 ? 0 : -1;
  const light = shade(c, 1.35), dark = shade(c, 0.68);
  const hx = facing === 'right' ? 9 : 8; // head leans towards the walking direction
  // tail behind the body: to the right in the front view, trailing left when facing right, straight down from behind
  const tail: [number, number][] = facing === 'down' ? [[11, 13], [12, 13], [12, 14], [13, 14], [13, 15], [14, 15]]
    : facing === 'right' ? [[5, 13], [4, 13], [4, 14], [3, 14], [3, 15], [2, 15]]
    : [[7, 13], [8, 13], [7, 14], [8, 14], [7, 15], [8, 15]];
  for (const [x, y] of tail) { px(ctx, x, y + h, dark); px(ctx, x, y + h - 1, O); }
  // body: small upper disc + wide lower disc (pear), outlined
  disc(ctx, 8, 9.5 + h, 3.6, O); disc(ctx, 8, 12 + h, 4.4, O);
  disc(ctx, 8, 9.5 + h, 2.8, c); disc(ctx, 8, 12 + h, 3.6, c);
  if (facing !== 'up') {
    disc(ctx, 8, 12 + h, 2.3, light); hline(ctx, 6, 10, 13 + h, dark); // belly + pouch rim
    px(ctx, 7, 12 + h, O); px(ctx, 9, 12 + h, O); // joey's eyes above the rim
    px(ctx, 5, 10 + h, dark); px(ctx, 11, 10 + h, dark); // little forearms
  }
  rect(ctx, 3, 15 + h, 4, 1, O); rect(ctx, 9, 15 + h, 4, 1, O); px(ctx, 4, 14 + h, dark); px(ctx, 11, 14 + h, dark); // big feet
  // head, snout and tall ears
  disc(ctx, hx, 5 + h, 3, O); disc(ctx, hx, 5 + h, 2.2, c);
  for (const [ex, ox] of [[hx - 2, hx - 3], [hx + 2, hx + 3]] as const) { px(ctx, ex, 1 + h, O); vline(ctx, ex, 2 + h, 3 + h, light); vline(ctx, ox, 2 + h, 3 + h, O); }
  if (facing === 'down') { rect(ctx, 7, 6 + h, 3, 2, light); px(ctx, 8, 7 + h, O); }
  else if (facing === 'right') { rect(ctx, 10, 6 + h, 3, 1, light); px(ctx, 12, 6 + h, O); }
  eyes(ctx, facing, 4 + h, [7, 9]);
}

function seagull(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 심술 갈매기: white gull, grey wings, yellow beak, frowning brows, a stolen French fry
  const bob = frame === 1 ? 0 : 1;
  bird(ctx, facing, frame, c, 0xffffff, 0xf4c430, 0x9aa4ae);
  if (facing === 'down') {
    px(ctx, 5, 3 + bob, O); px(ctx, 6, 4 + bob - 1, O); px(ctx, 10, 3 + bob, O); px(ctx, 9, 4 + bob - 1, O); // angry brows
    px(ctx, 9, 8 + bob, 0xf7d44c); px(ctx, 10, 9 + bob, 0xf7d44c); px(ctx, 11, 10 + bob, 0xe0b040); // fry
  } else if (facing === 'right') {
    px(ctx, 9, 3 + bob, O); px(ctx, 10, 3 + bob, O);
    hline(ctx, 13, 15, 6 + bob, 0xf7d44c);
  }
}

function monkey(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 장난꾸러기 원숭이: small brown marmoset, white ear tufts, tan face, long curling tail, a banana
  const bob = frame === 1 ? 0 : 1;
  const face = 0xe0b48a, tuft = 0xf4f4f4, banana = 0xf7d44c, dark = shade(c, 0.7);
  const sw = frame === 0 ? -1 : frame === 2 ? 1 : 0;
  vline(ctx, 13, 9 + bob, 13 + bob, dark); px(ctx, 14, 8 + bob + sw, dark); px(ctx, 14, 7 + bob + sw, dark); px(ctx, 13, 6 + bob + sw, dark); // tail
  disc(ctx, 8, 11 + bob, 3.8, O); disc(ctx, 8, 11 + bob, 3, c); disc(ctx, 8, 12 + bob, 1.5, face);
  rect(ctx, 5, 14, 2, 2, dark); rect(ctx, 9, 14, 2, 2, dark);
  disc(ctx, 8, 6 + bob, 3.8, O); disc(ctx, 8, 6 + bob, 3, c);
  for (const [x, y] of [[3, 4], [4, 3], [3, 5], [13, 4], [12, 3], [13, 5]] as const) px(ctx, x, y + bob, tuft);
  if (facing !== 'up') {
    disc(ctx, facing === 'right' ? 9 : 8, 7 + bob, 2, face);
    eyes(ctx, facing, 6 + bob, [7, 9]);
    const bx = facing === 'right' ? 12 : 3;
    px(ctx, bx, 8 + bob, 0x6b4520); px(ctx, bx, 9 + bob, banana); px(ctx, bx, 10 + bob, banana); px(ctx, bx + 1, 11 + bob, banana); px(ctx, bx + 2, 11 + bob, banana);
  }
}

function toucan(ctx: Ctx, facing: Facing, frame: number, c: number): void {
  // 큰부리새: black toucan, cream throat, huge orange beak with a red tip, blue eye ring, flapping wings
  const bob = frame === 1 ? 0 : 1;
  const flap = frame === 0 ? -2 : frame === 2 ? 2 : 0;
  const beak = 0xff9f1c, tip = 0xd9432b, throat = 0xfff1c4, ring = 0x5fb8e8, wing = 0x44444e;
  disc(ctx, 8, 10 + bob, 4.5, O); disc(ctx, 8, 10 + bob, 3.6, c);
  rect(ctx, 1, 9 + bob + flap, 4, 2, O); rect(ctx, 11, 9 + bob + flap, 4, 2, O);
  rect(ctx, 2, 9 + bob + flap, 3, 1, wing); rect(ctx, 11, 9 + bob + flap, 3, 1, wing);
  rect(ctx, 7, 13 + bob, 2, 2, shade(c, 1.4)); px(ctx, 6, 15, beak); px(ctx, 9, 15, beak);
  disc(ctx, 8, 5 + bob, 3, O); disc(ctx, 8, 5 + bob, 2.2, c);
  if (facing === 'down') {
    disc(ctx, 8, 8 + bob, 1.8, throat);
    rect(ctx, 7, 6 + bob, 3, 4, beak); px(ctx, 8, 10 + bob, tip); px(ctx, 7, 9 + bob, tip); hline(ctx, 7, 9, 6 + bob, shade(beak, 0.8));
    px(ctx, 5, 4 + bob, ring); px(ctx, 11, 4 + bob, ring); px(ctx, 5, 5 + bob, O); px(ctx, 11, 5 + bob, O);
  } else if (facing === 'right') {
    px(ctx, 7, 7 + bob, throat); px(ctx, 8, 8 + bob, throat);
    rect(ctx, 10, 4 + bob, 5, 2, beak); px(ctx, 15, 5 + bob, tip); hline(ctx, 10, 14, 4 + bob, shade(beak, 1.15));
    px(ctx, 8, 4 + bob, ring); px(ctx, 8, 5 + bob, O);
  }
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
    case 'scarab': scarab(ctx, facing, frame, def.color); break;
    case 'mummy_cat': mummyCat(ctx, facing, frame, def.color); break;
    case 'pizza_rat': pizzaRat(ctx, facing, frame, def.color); break;
    case 'taxi_bug': taxiBug(ctx, facing, frame, def.color); break;
    case 'kangaroo': kangaroo(ctx, facing, frame, def.color); break;
    case 'seagull': seagull(ctx, facing, frame, def.color); break;
    case 'monkey': monkey(ctx, facing, frame, def.color); break;
    case 'toucan': toucan(ctx, facing, frame, def.color); break;
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
