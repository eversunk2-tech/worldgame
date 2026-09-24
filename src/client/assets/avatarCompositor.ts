// Kenney character parts → composed avatar sheets with code-generated 4-way walking (spec 5.5).
// Output keeps the v0.1 format: 32px frames, 3 columns (walk1, idle, walk2) × 4 rows (down, left, right, up).
import Phaser from 'phaser';
import type { AvatarEquip, Facing } from '../../shared/types';
import { getItem } from '../../shared/content/items';
import { CHAR_PARTS, type CharPart, type CodePartKind, type OverlayKind } from './charAtlas';
import { CHAR_FRAME, CHAR_SHEET_H, CHAR_SHEET_W, FACING_ROWS, TEX } from './manifest';
import { compositeCells, eraseFace, flipX, hline, lean, legLift, makeCanvas, newCell, px, recolor, rect, registerImage, registerSheet, scaleCanvas } from './pixelArt';
import { drawFallbackPart } from './placeholders';
import { vendorSheets } from './vendorSheets';

const FACINGS: Facing[] = ['down', 'left', 'right', 'up'];

export const animKey = (texKey: string, kind: 'walk' | 'idle', facing: Facing): string => `${texKey}:${kind}_${facing}`;

/** Register walk and idle animations (per facing) for any 3×4 character sheet (player, NPC, monster). Idempotent. */
export function ensureCharAnims(scene: Phaser.Scene, texKey: string): void {
  for (const facing of FACINGS) {
    const row = FACING_ROWS[facing];
    const base = row * 3;
    const walk = animKey(texKey, 'walk', facing);
    if (!scene.anims.exists(walk)) {
      scene.anims.create({
        key: walk,
        frames: [base, base + 1, base + 2, base + 1].map((frame) => ({ key: texKey, frame })),
        frameRate: 8,
        repeat: -1,
      });
    }
    const idle = animKey(texKey, 'idle', facing);
    if (!scene.anims.exists(idle)) {
      scene.anims.create({ key: idle, frames: [{ key: texKey, frame: base + 1 }], frameRate: 1, repeat: 0 });
    }
  }
}

/** Idle frame index (centre column) for a facing — handy for previews/icons. */
export function idleFrame(facing: Facing): number {
  return FACING_ROWS[facing] * 3 + 1;
}

// ---------------------------------------------------------------- parts (16px)

const partCache = new Map<string, HTMLCanvasElement>();

function drawOverlay(canvas: HTMLCanvasElement, kind: OverlayKind, color: number): void {
  const ctx = canvas.getContext('2d')!;
  switch (kind) {
    case 'stripes': // navy stripes across the torso (rows 8..12 of the shirt)
      for (let y = 8; y <= 12; y += 2) hline(ctx, 3, 12, y, color);
      break;
    case 'hanbok_ribbon': // white 옷고름 on the chest
      rect(ctx, 6, 8, 4, 1, 0xffffff); rect(ctx, 6, 9, 2, 3, 0xffffff); px(ctx, 9, 9, 0xffffff);
      break;
    case 'crown_gem':
      px(ctx, 7, 3, 0xff4d6d); px(ctx, 8, 3, 0xff4d6d);
      break;
    case 'pony_tail': // tail hanging at the back-right
      rect(ctx, 11, 5, 2, 6, color); px(ctx, 12, 11, color); px(ctx, 13, 7, color);
      break;
    case 'cork_dots': // cork strings under the brim
      px(ctx, 3, 6, 0xd8b98a); px(ctx, 7, 6, 0xd8b98a); px(ctx, 12, 6, 0xd8b98a); px(ctx, 3, 7, 0x8b5a2b); px(ctx, 7, 7, 0x8b5a2b); px(ctx, 12, 7, 0x8b5a2b);
      break;
    case 'brazil_collar': // green collar
      hline(ctx, 5, 10, 6, 0x1f8a4c); px(ctx, 4, 7, 0x1f8a4c); px(ctx, 11, 7, 0x1f8a4c);
      break;
    default:
      break;
  }
}

const shadeDark = (c: number): number => (((c >> 16) & 0xff) * 0.7 << 16) | (((c >> 8) & 0xff) * 0.7 << 8) | ((c & 0xff) * 0.7);

function drawCodePart(kind: CodePartKind, color: number): HTMLCanvasElement {
  const { canvas, ctx } = newCell();
  const O = 0x2b1d14;
  switch (kind) {
    case 'cap': // baseball cap: dome rows 0-3, visor on row 4 only — row 5 (the eyes) stays clear
      hline(ctx, 6, 9, 0, color); hline(ctx, 5, 10, 1, color); hline(ctx, 4, 11, 2, color); hline(ctx, 4, 11, 3, color);
      px(ctx, 5, 0, O); px(ctx, 10, 0, O); px(ctx, 4, 1, O); px(ctx, 11, 1, O); px(ctx, 3, 2, O); px(ctx, 12, 2, O); px(ctx, 3, 3, O); px(ctx, 12, 3, O);
      hline(ctx, 4, 14, 4, color); px(ctx, 3, 4, O); px(ctx, 15, 4, O); hline(ctx, 9, 14, 4, shadeDark(color));
      hline(ctx, 6, 8, 1, 0xffffff);
      break;
    case 'pharaoh': { // nemes headdress: blue/gold stripes falling to the shoulders
      const gold = 0xffc300;
      rect(ctx, 3, 0, 10, 4, color); rect(ctx, 2, 4, 12, 4, color); rect(ctx, 2, 8, 3, 3, color); rect(ctx, 11, 8, 3, 3, color);
      hline(ctx, 3, 12, 1, gold); hline(ctx, 2, 13, 5, gold); px(ctx, 3, 9, gold); px(ctx, 12, 9, gold); hline(ctx, 6, 9, 0, gold);
      ctx.clearRect(5, 4, 6, 4); // face window (rows 4-7, eyes on row 5 stay visible)
      px(ctx, 7, 0, 0xffd700); px(ctx, 8, 0, 0xffd700);
      break;
    }
    case 'liberty': // seven-ray crown on rows 0-4 (eyes on row 5 stay clear)
      rect(ctx, 3, 3, 10, 1, color); hline(ctx, 3, 12, 4, 0x4f9d84);
      for (let i = 0; i < 7; i++) { const x = 2 + i * 2; px(ctx, x, 2, color); px(ctx, x, 1, color); if (i % 2 === 0) px(ctx, x, 0, color); }
      break;
    default: // wide hat: crown rows 0-3, brim row 4
      rect(ctx, 5, 0, 6, 4, color); hline(ctx, 2, 13, 4, color); px(ctx, 1, 4, O); px(ctx, 14, 4, O);
  }
  return canvas;
}

/** 16×16 canvas of one part (cached). Never null: unknown ids and missing sheets fall back to a code drawing. */
export function partCanvas(itemId: string): HTMLCanvasElement {
  const cached = partCache.get(itemId);
  if (cached) return cached;
  const item = getItem(itemId);
  const entry: CharPart | undefined = CHAR_PARTS[itemId];
  const color = item?.color ?? entry?.color ?? 0xffffff;
  let out: HTMLCanvasElement | null = null;
  if (entry && 'code' in entry) out = drawCodePart(entry.code, color);
  else if (entry) {
    const cell = vendorSheets.cell('char', entry.index);
    if (cell) {
      let base = entry.recolor === 'mono' ? recolor(cell, color) : cell;
      if (entry.extra?.length) base = compositeCells([base, ...entry.extra.map((i) => vendorSheets.cell('char', i)).filter((c): c is HTMLCanvasElement => !!c)]);
      out = base === cell ? compositeCells([cell]) : base;
    }
  }
  if (!out) out = drawFallbackPart(item?.slot ?? (itemId.startsWith('hair') ? 'hair' : itemId.startsWith('hat') ? 'hat' : itemId.startsWith('body') ? 'body' : 'top'), color, item?.shape ?? itemId);
  if (entry?.overlay && entry.overlay !== 'none') drawOverlay(out, entry.overlay, color);
  partCache.set(itemId, out);
  return out;
}

/** Front composite: body → top → hair → hat (v0.1 order). */
export function composeFront(equip: AvatarEquip): HTMLCanvasElement {
  const order = [equip.body, equip.top, equip.hair, equip.hat].filter((id): id is string => !!id);
  return compositeCells(order.map(partCanvas));
}

/** Back composite: the body's face is erased, then the same layers (hair/hats hide the face anyway). */
export function composeBack(equip: AvatarEquip): HTMLCanvasElement {
  const body = eraseFace(partCanvas(equip.body));
  const rest = [equip.top, equip.hair, equip.hat].filter((id): id is string => !!id).map(partCanvas);
  return compositeCells([body, ...rest]);
}

/** 12 frames (16px) → 96×128 sheet (2×). Rows: down, left, right, up; columns: walk1, idle, walk2. */
export function buildAvatarSheet(equip: AvatarEquip): HTMLCanvasElement {
  const front = composeFront(equip);
  const back = composeBack(equip);
  const down = [legLift(front, 'left'), front, legLift(front, 'right')];
  const right = down.map((f) => lean(f, 1));
  const left = right.map(flipX);
  const up = [legLift(back, 'left'), back, legLift(back, 'right')];
  const rows: Record<Facing, HTMLCanvasElement[]> = { down, left, right, up };
  const { canvas, ctx } = makeCanvas(CHAR_SHEET_W, CHAR_SHEET_H);
  for (const facing of FACINGS) {
    const row = FACING_ROWS[facing];
    rows[facing].forEach((frame, col) => {
      ctx.drawImage(scaleCanvas(frame, 2), col * CHAR_FRAME, row * CHAR_FRAME);
    });
  }
  return canvas;
}

/** Texture key for the composite of `avatar`; builds it on first use (cached by combination key). */
export function textureKeyFor(scene: Phaser.Scene, avatar: AvatarEquip): string {
  const key = TEX.avatar(avatar.body, avatar.top, avatar.hair, avatar.hat);
  if (!scene.textures.exists(key)) registerSheet(scene, key, buildAvatarSheet(avatar), CHAR_FRAME, CHAR_FRAME);
  ensureCharAnims(scene, key);
  return key;
}

/** 32×32 icon texture of a single part (shop cards, spec 5.6). */
export function partIconKey(scene: Phaser.Scene, itemId: string): string {
  const key = TEX.part(itemId);
  if (!scene.textures.exists(key)) registerImage(scene, key, scaleCanvas(partCanvas(itemId), 2));
  return key;
}

/** Drop cached part canvases (tests / hot reload). */
export function clearPartCache(): void {
  partCache.clear();
}

