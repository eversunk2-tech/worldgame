// Shadow, name tag, speech bubble and emoji for any sprite (spec 5.5 #5, 10.9). Depends only on a Phaser sprite so
// remote-player sprites can use it unchanged.
import Phaser from 'phaser';
import type { EmoteId } from '../../shared/types';
import { TEX } from '../assets/manifest';
import { EmoteBubble } from '../ui/EmoteBubble';
import { NameTag } from '../ui/NameTag';
import { SpeechBubble } from '../ui/SpeechBubble';

export interface DecorOptions { name?: string; nameColor?: string; bubble?: string }

const TAG_Y = -26;
const BUBBLE_Y = -38;
const EMOTE_Y = -48;
const SHADOW_Y = 15;
const DECOR_DEPTH = 1000;

export class ActorDecor {
  readonly shadow: Phaser.GameObjects.Image;
  readonly tag: NameTag | null;
  readonly bubble: SpeechBubble | null;
  private emote: EmoteBubble | null = null;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, opts: DecorOptions = {}) {
    this.scene = scene;
    this.sprite = sprite;
    this.shadow = scene.add.image(sprite.x, sprite.y + SHADOW_Y, TEX.shadow).setAlpha(0.35);
    this.tag = opts.name ? new NameTag(scene, opts.name, opts.nameColor) : null;
    this.bubble = opts.bubble ? new SpeechBubble(scene, opts.bubble) : null;
    this.update();
  }

  static attach(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, opts: DecorOptions = {}): ActorDecor {
    return new ActorDecor(scene, sprite, opts);
  }

  /** Follow the sprite (call every frame after the sprite moved / changed depth). */
  update(): void {
    const s = this.sprite;
    const x = Math.round(s.x);
    const y = Math.round(s.y);
    this.shadow.setPosition(x, y + SHADOW_Y).setDepth(s.depth - 1).setVisible(s.visible);
    const top = s.depth + DECOR_DEPTH;
    this.tag?.setPosition(x, y + TAG_Y).setDepth(top).setVisible(s.visible);
    this.bubble?.setPosition(x, y + BUBBLE_Y).setDepth(top + 1);
    this.emote?.setPosition(x, y + EMOTE_Y).setDepth(top + 2);
  }

  setName(name: string, color?: string): void {
    this.tag?.setLabel(name, color);
  }

  setBubbleVisible(visible: boolean): void {
    this.bubble?.show(visible);
  }

  showEmote(id: EmoteId): void {
    if (!this.emote) this.emote = new EmoteBubble(this.scene);
    this.emote.show(id);
    this.update();
  }

  setVisible(v: boolean): void {
    this.shadow.setVisible(v);
    this.tag?.setVisible(v);
    if (!v) { this.bubble?.show(false); this.emote?.setVisible(false); }
  }

  destroy(): void {
    this.shadow.destroy();
    this.tag?.destroy();
    this.bubble?.destroy();
    this.emote?.destroy();
  }
}
