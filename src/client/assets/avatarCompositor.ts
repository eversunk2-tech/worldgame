// Composite equipped layers (body → top → hair → hat) into one sheet, cache by key, register walk/idle anims.
import Phaser from 'phaser';
import type { AvatarEquip, Facing } from '../../shared/types';
import { CHAR_FRAME, CHAR_SHEET_H, CHAR_SHEET_W, FACING_ROWS, TEX } from './manifest';
import { LAYER_CANVASES, makeCanvas, registerSheet } from './placeholders';

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

/** Texture key for the composite of `avatar`; builds it on first use. */
export function textureKeyFor(scene: Phaser.Scene, avatar: AvatarEquip): string {
  const key = TEX.avatar(avatar.body, avatar.top, avatar.hair, avatar.hat);
  if (!scene.textures.exists(key)) {
    const { canvas, ctx } = makeCanvas(CHAR_SHEET_W, CHAR_SHEET_H);
    const order = [avatar.body, avatar.top, avatar.hair, avatar.hat].filter((id): id is string => !!id);
    for (const id of order) {
      const layer = LAYER_CANVASES.get(id) ?? sourceCanvas(scene, TEX.layer(id));
      if (layer) ctx.drawImage(layer, 0, 0);
    }
    registerSheet(scene, key, canvas, CHAR_FRAME, CHAR_FRAME);
  }
  ensureCharAnims(scene, key);
  return key;
}

/** When a layer was loaded from a file (manifest source), use the texture's image as the draw source. */
function sourceCanvas(scene: Phaser.Scene, texKey: string): CanvasImageSource | null {
  if (!scene.textures.exists(texKey)) return null;
  const src = scene.textures.get(texKey).getSourceImage();
  return src as CanvasImageSource;
}

/** Idle frame index (centre column) for a facing — handy for previews/icons. */
export function idleFrame(facing: Facing): number {
  return FACING_ROWS[facing] * 3 + 1;
}
