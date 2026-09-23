// NPC: static composite sprite + ! / ? marker (spec 6.3).
import Phaser from 'phaser';
import type { AvatarEquip, NpcDef } from '../../shared/types';
import { TILE_SIZE } from '../../shared/constants';
import { idleFrame, textureKeyFor } from '../assets/avatarCompositor';
import { textStyle, THEME } from '../ui/theme';

/** Looks per NPC id, with a role fallback. All built from the shared layer sheets. */
const NPC_LOOKS: Record<string, AvatarEquip> = {
  npc_hanbyeol: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_long_brown', hat: null },
  npc_onyu: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_short_black', hat: 'hat_cap_red' },
  npc_horang: { body: 'body_tan', top: 'top_hanbok', hair: 'hair_short_black', hat: 'hat_gat' },
  npc_marie: { body: 'body_light', top: 'top_mariniere', hair: 'hair_pony_blue', hat: 'hat_beret' },
  npc_louis: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_curly_red', hat: null },
  npc_pierre: { body: 'body_tan', top: 'top_mariniere', hair: 'hair_short_black', hat: 'hat_cap_red' },
};
const ROLE_LOOKS: Record<NpcDef['role'], AvatarEquip> = {
  guide: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_long_brown', hat: null },
  teacher: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_short_black', hat: 'hat_beret' },
  guard: { body: 'body_tan', top: 'top_hanbok', hair: 'hair_short_black', hat: 'hat_gat' },
};

export type NpcMarker = '!' | '?' | null;

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly def: NpcDef;
  private readonly marker: Phaser.GameObjects.Text;
  private markerKind: NpcMarker = null;
  private bob: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, def: NpcDef) {
    const look = NPC_LOOKS[def.id] ?? ROLE_LOOKS[def.role];
    const key = textureKeyFor(scene, look);
    const x = def.at.tx * TILE_SIZE + TILE_SIZE / 2;
    const y = def.at.ty * TILE_SIZE + TILE_SIZE / 2;
    super(scene, x, y, key, idleFrame(def.facing));
    this.def = def;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(20, 16);
    body.setOffset(6, 14);
    this.setDepth(y);
    this.marker = scene.add.text(x, y - 26, '', textStyle({ fontSize: '18px', fontStyle: 'bold', color: THEME.accentCss, stroke: '#000000', strokeThickness: 3 })).setOrigin(0.5, 1).setDepth(y + 1000);
    this.marker.setVisible(false);
  }

  setMarker(kind: NpcMarker): void {
    if (kind === this.markerKind) return;
    this.markerKind = kind;
    this.bob?.stop();
    this.bob = null;
    if (!kind) { this.marker.setVisible(false); return; }
    this.marker.setText(kind).setVisible(true).setY(this.y - 26);
    this.marker.setColor(kind === '!' ? THEME.accentCss : '#8ecbff');
    this.bob = this.scene.tweens.add({ targets: this.marker, y: this.y - 30, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  override destroy(fromScene?: boolean): void {
    this.bob?.stop();
    this.marker.destroy();
    super.destroy(fromScene);
  }
}
