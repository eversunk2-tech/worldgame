// 9-slice button with hover / pressed / disabled / selected skins (spec 5.9). Plays the click SFX on pointerdown.
import Phaser from 'phaser';
import { UI } from '../assets/uiSkin';
import { sfx } from '../audio/sfx';
import { textStyle, THEME, type FontKind } from './theme';

export interface ButtonOptions {
  width?: number; height?: number;
  size?: FontKind; textColor?: string;
  /** 'danger' uses the red skin */ skin?: 'default' | 'danger';
  onClick?: () => void;
  /** silence the click sound (e.g. minigame answer buttons play their own) */ silent?: boolean;
}

export class Button extends Phaser.GameObjects.Container {
  readonly bg: Phaser.GameObjects.NineSlice;
  readonly label: Phaser.GameObjects.Text;
  readonly btnW: number;
  readonly btnH: number;
  private enabled = true;
  private hovered = false;
  private pressed = false;
  private selected = false;
  private tint: number | null = null;
  private readonly skin: 'default' | 'danger';
  private readonly baseColor: string;
  private readonly silent: boolean;
  onClick: (() => void) | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, opts: ButtonOptions = {}) {
    super(scene, x, y);
    this.btnW = opts.width ?? 200;
    this.btnH = opts.height ?? 40;
    this.skin = opts.skin ?? 'default';
    this.silent = opts.silent ?? false;
    this.onClick = opts.onClick;
    this.baseColor = opts.textColor ?? THEME.text;
    this.bg = scene.add.nineslice(0, 0, UI.btn, undefined, this.btnW, this.btnH, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0);
    this.label = scene.add.text(this.btnW / 2, this.btnH / 2, text, textStyle({ size: opts.size ?? 'body', color: this.baseColor, align: 'center', wordWrap: { width: this.btnW - 12 } })).setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(this.btnW, this.btnH);
    // Container hit area is centred on the container origin; offset so it matches the drawn rect.
    this.setInteractive(new Phaser.Geom.Rectangle(this.btnW / 2, this.btnH / 2, this.btnW, this.btnH), Phaser.Geom.Rectangle.Contains);
    this.on('pointerover', () => { this.hovered = true; this.redraw(); if (this.enabled) scene.input.setDefaultCursor('pointer'); });
    this.on('pointerout', () => { this.hovered = false; this.pressed = false; this.redraw(); scene.input.setDefaultCursor('default'); });
    this.on('pointerup', () => { this.pressed = false; this.redraw(); });
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || pointer.button !== 0) return;
      this.pressed = true;
      this.redraw();
      if (!this.silent) sfx.click();
      this.onClick?.();
    });
    this.redraw();
    scene.add.existing(this);
  }

  setText(text: string): this {
    this.label.setText(text);
    return this;
  }

  setEnabled(v: boolean): this {
    this.enabled = v;
    this.redraw();
    return this;
  }

  setSelected(v: boolean): this {
    this.selected = v;
    this.redraw();
    return this;
  }

  /** Tint the skin (feedback colours in quizzes); `null` restores the default skin. */
  setTint2(color: number | null): this {
    this.tint = color;
    this.redraw();
    return this;
  }

  /** v0.1 compatibility: (fill, hover, border) → tint with `fill`. */
  setColors(fill: number, _hover?: number, _border?: number): this {
    return this.setTint2(fill);
  }

  private redraw(): void {
    let key: string = this.skin === 'danger' ? UI.btnDanger : UI.btn;
    if (!this.enabled) key = UI.btnDisabled;
    else if (this.selected) key = UI.btnSelected;
    else if (this.pressed) key = UI.btnDown;
    else if (this.hovered) key = UI.btnHover;
    if (this.bg.texture.key !== key) this.bg.setTexture(key);
    if (this.tint !== null && this.enabled) this.bg.setTint(this.tint); else this.bg.clearTint();
    this.label.setAlpha(this.enabled ? 1 : 0.5);
    this.label.setColor(this.selected ? '#1b1b2f' : this.baseColor);
    this.label.setY(this.btnH / 2 + (this.pressed ? 1 : 0));
  }
}
