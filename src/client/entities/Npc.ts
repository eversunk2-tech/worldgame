// NPC: static composite sprite + name tag (role colour) + speech bubble + ! / ? marker (spec 6.1, 6.2).
import Phaser from 'phaser';
import type { AvatarEquip, NpcDef } from '../../shared/types';
import { TILE_SIZE } from '../../shared/constants';
import { idleFrame, textureKeyFor } from '../assets/avatarCompositor';
import { outlined, THEME } from '../ui/theme';
import { ActorDecor } from './ActorDecor';

/** Looks per NPC id, with a role fallback. All built from the shared part sheet (spec 5.6). */
const NPC_LOOKS: Record<string, AvatarEquip> = {
  npc_hanbyeol: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_long_brown', hat: null },
  npc_onyu: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_short_black', hat: 'hat_cap_red' },
  npc_horang: { body: 'body_tan', top: 'top_hanbok', hair: 'hair_short_black', hat: 'hat_gat' },
  npc_marie: { body: 'body_light', top: 'top_mariniere', hair: 'hair_pony_blue', hat: 'hat_beret' },
  npc_louis: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_curly_red', hat: null },
  npc_pierre: { body: 'body_tan', top: 'top_mariniere', hair: 'hair_short_black', hat: 'hat_cap_red' },
  // Stage C (spec 5.6 NPC 외형 table)
  npc_amir: { body: 'body_tan', top: 'robe_white', hair: 'hair_short_black', hat: null },
  npc_nadia: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_long_brown', hat: null },
  npc_karim: { body: 'body_dark', top: 'top_hoodie_green', hair: 'hair_short_black', hat: 'hat_cap_red' },
  npc_emily: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_long_brown', hat: null },
  npc_noah: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_curly_red', hat: 'hat_cap_red' },
  npc_jackson: { body: 'body_dark', top: 'top_tshirt_blue', hair: 'hair_short_black', hat: 'hat_cap_red' },
  npc_olivia: { body: 'body_light', top: 'top_tshirt_blue', hair: 'hair_pony_blue', hat: null },
  npc_jack: { body: 'body_tan', top: 'top_hoodie_green', hair: 'hair_short_black', hat: 'hat_cork' },
  npc_ruby: { body: 'body_dark', top: 'top_hoodie_green', hair: 'hair_curly_red', hat: null },
  npc_lucas: { body: 'body_tan', top: 'top_brazil', hair: 'hair_short_black', hat: null },
  npc_isabela: { body: 'body_dark', top: 'dress_plain', hair: 'hair_long_brown', hat: null },
  npc_pedro: { body: 'body_light', top: 'top_tshirt_blue', hair: 'hair_curly_red', hat: 'hat_cap_red' },
};
const ROLE_LOOKS: Record<NpcDef['role'], AvatarEquip> = {
  guide: { body: 'body_light', top: 'top_hoodie_green', hair: 'hair_long_brown', hat: null },
  teacher: { body: 'body_tan', top: 'top_tshirt_blue', hair: 'hair_short_black', hat: 'hat_beret' },
  guard: { body: 'body_tan', top: 'top_hanbok', hair: 'hair_short_black', hat: 'hat_gat' },
};
export const ROLE_COLORS: Record<NpcDef['role'], string> = { guide: '#ffd166', teacher: '#8ecbff', guard: '#a5ff9b' };

export type NpcMarker = '!' | '?' | null;

const MARKER_Y = -62; // above the name tag (-26) and the speech bubble (-38, spec 6.1: 이름표 위)

export class Npc extends Phaser.Physics.Arcade.Sprite {
  readonly def: NpcDef;
  readonly decor: ActorDecor;
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
    this.decor = ActorDecor.attach(scene, this, { name: def.name, nameColor: ROLE_COLORS[def.role], bubble: def.bubble });
    this.marker = scene.add.text(x, y + MARKER_Y, '', outlined({ size: 'title', color: THEME.accentCss })).setOrigin(0.5, 1).setDepth(y + 1003);
    this.marker.setVisible(false);
  }

  setMarker(kind: NpcMarker): void {
    if (kind === this.markerKind) return;
    this.markerKind = kind;
    this.bob?.stop();
    this.bob = null;
    if (!kind) { this.marker.setVisible(false); return; }
    this.marker.setText(kind).setVisible(true).setY(this.y + MARKER_Y);
    this.marker.setColor(kind === '!' ? THEME.accentCss : THEME.info);
    this.bob = this.scene.tweens.add({ targets: this.marker, y: this.y + MARKER_Y - 4, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Speech bubble on/off (CityScene decides by distance and modal state). */
  setBubbleVisible(v: boolean): void {
    this.decor.setBubbleVisible(v);
  }

  override destroy(fromScene?: boolean): void {
    this.bob?.stop();
    this.marker.destroy();
    this.decor.destroy();
    super.destroy(fromScene);
  }
}
