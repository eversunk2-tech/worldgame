// Emoji reaction above an actor (spec 6.3): pops in (scale 0.6→1, 150 ms), stays EMOTE_SHOW_MS, replaced on repeat.
import Phaser from 'phaser';
import type { EmoteId } from '../../shared/types';
import { EMOTE_SHOW_MS } from '../../shared/constants';
import { TEX } from '../assets/manifest';

export class EmoteBubble extends Phaser.GameObjects.Image {
  private timer: Phaser.Time.TimerEvent | null = null;
  private pop: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.emote('smile'));
    this.setOrigin(0.5, 1).setVisible(false);
    scene.add.existing(this);
  }

  show(id: EmoteId): void {
    this.timer?.remove(false);
    this.pop?.stop();
    this.setTexture(TEX.emote(id)).setVisible(true).setScale(0.6).setAlpha(1);
    this.pop = this.scene.tweens.add({ targets: this, scale: 1, duration: 150, ease: 'Back.easeOut' });
    this.timer = this.scene.time.delayedCall(EMOTE_SHOW_MS, () => { this.setVisible(false); this.timer = null; });
  }

  override destroy(fromScene?: boolean): void {
    this.timer?.remove(false);
    this.pop?.stop();
    super.destroy(fromScene);
  }
}
