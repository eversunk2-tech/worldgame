// Clickable button with hover / disabled states.
import Phaser from 'phaser';
import { THEME, textStyle } from './theme';

export interface ButtonOptions {
  width?: number; height?: number;
  fill?: number; hover?: number; border?: number; textColor?: string; fontSize?: number;
  onClick?: () => void;
}

export class Button extends Phaser.GameObjects.Container {
  readonly bg: Phaser.GameObjects.Graphics;
  readonly label: Phaser.GameObjects.Text;
  readonly btnW: number;
  readonly btnH: number;
  private fill: number;
  private hoverFill: number;
  private border: number;
  private enabled = true;
  private hovered = false;
  private selected = false;
  private readonly baseColor: string;
  onClick: (() => void) | undefined;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, opts: ButtonOptions = {}) {
    super(scene, x, y);
    this.btnW = opts.width ?? 200;
    this.btnH = opts.height ?? 40;
    this.fill = opts.fill ?? 0x3d4270;
    this.hoverFill = opts.hover ?? 0x545a9a;
    this.border = opts.border ?? THEME.border;
    this.onClick = opts.onClick;
    this.baseColor = opts.textColor ?? THEME.text;
    this.bg = scene.add.graphics();
    this.label = scene.add.text(this.btnW / 2, this.btnH / 2, text, textStyle({ color: opts.textColor ?? THEME.text, fontSize: `${opts.fontSize ?? THEME.fontSize}px` })).setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(this.btnW, this.btnH);
    // Container hit area is centred on the container origin; offset so it matches the drawn rect.
    this.setInteractive(new Phaser.Geom.Rectangle(this.btnW / 2, this.btnH / 2, this.btnW, this.btnH), Phaser.Geom.Rectangle.Contains);
    this.on('pointerover', () => { this.hovered = true; this.redraw(); if (this.enabled) scene.input.setDefaultCursor('pointer'); });
    this.on('pointerout', () => { this.hovered = false; this.redraw(); scene.input.setDefaultCursor('default'); });
    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.enabled || pointer.button !== 0) return;
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

  setColors(fill: number, hover: number, border: number = this.border): this {
    this.fill = fill; this.hoverFill = hover; this.border = border;
    this.redraw();
    return this;
  }

  private redraw(): void {
    const g = this.bg;
    g.clear();
    const fill = !this.enabled ? 0x2a2c3c : this.selected ? THEME.accent : this.hovered ? this.hoverFill : this.fill;
    g.fillStyle(fill, 1);
    g.fillRoundedRect(0, 0, this.btnW, this.btnH, 5);
    g.lineStyle(2, !this.enabled ? 0x55587a : this.selected ? THEME.accent : this.border, 1);
    g.strokeRoundedRect(0, 0, this.btnW, this.btnH, 5);
    this.label.setAlpha(this.enabled ? 1 : 0.5);
    this.label.setColor(this.selected ? '#1b1b2f' : this.baseColor);
  }
}
