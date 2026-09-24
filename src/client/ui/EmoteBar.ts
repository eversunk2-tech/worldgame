// Six emoji buttons (spec 6.3) for the HUD; keys 1–6 do the same through CityScene.
import Phaser from 'phaser';
import type { EmoteId } from '../../shared/types';
import { EMOTE_IDS, EMOTE_KEYS } from '../assets/emotes';
import { TEX } from '../assets/manifest';
import { UI } from '../assets/uiSkin';
import { textStyle, THEME } from '../ui/theme';

const SIZE = 36;
const GAP = 4;

export class EmoteBar extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, onPick: (id: EmoteId) => void) {
    super(scene, x, y);
    EMOTE_IDS.forEach((id, i) => {
      const bx = i * (SIZE + GAP);
      const bg = scene.add.nineslice(bx, 0, UI.btn, undefined, SIZE, SIZE, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0).setAlpha(0.9);
      const icon = scene.add.image(bx + SIZE / 2, SIZE / 2 - 2, TEX.emote(id)).setScale(0.75);
      const key = scene.add.text(bx + SIZE - 4, SIZE - 2, EMOTE_KEYS[id], textStyle({ size: 'small', color: THEME.textDim })).setOrigin(1, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setTexture(UI.btnHover));
      bg.on('pointerout', () => bg.setTexture(UI.btn));
      bg.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.button === 0) onPick(id); });
      this.add([bg, icon, key]);
    });
    scene.add.existing(this);
  }

  static get width(): number { return EMOTE_IDS.length * (SIZE + GAP) - GAP; }
}
