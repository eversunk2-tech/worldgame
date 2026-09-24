// NPC speech bubble (spec 6.2): white 9-slice with a tail, created once per NPC, faded in/out (no per-frame rebuild).
import Phaser from 'phaser';
import { UI } from '../assets/uiSkin';
import { textStyle } from './theme';

const PAD = 6;
const FADE_MS = 500;

export class SpeechBubble extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.NineSlice;
  private readonly tail: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private shown = false;
  private tween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, text: string) {
    super(scene, 0, 0);
    this.label = scene.add.text(0, 0, text, textStyle({ size: 'small', color: '#22223a' })).setOrigin(0.5, 0.5);
    const w = Math.ceil(this.label.width) + PAD * 2;
    const h = Math.ceil(this.label.height) + PAD * 2;
    this.bg = scene.add.nineslice(0, 0, UI.bubble, undefined, w, h, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0.5, 1);
    this.tail = scene.add.image(0, 0, UI.bubbleTail).setOrigin(0.5, 0);
    this.label.setY(-h / 2);
    this.add([this.bg, this.tail, this.label]);
    this.setAlpha(0).setVisible(false);
    scene.add.existing(this);
  }

  /** Fade in (true) / out (false). Idempotent. */
  show(visible: boolean): void {
    if (visible === this.shown) return;
    this.shown = visible;
    this.tween?.stop();
    if (visible) this.setVisible(true);
    this.tween = this.scene.tweens.add({
      targets: this, alpha: visible ? 1 : 0, duration: FADE_MS,
      onComplete: () => { if (!this.shown) this.setVisible(false); },
    });
  }

  get isShown(): boolean {
    return this.shown;
  }

  override destroy(fromScene?: boolean): void {
    this.tween?.stop();
    super.destroy(fromScene);
  }
}
