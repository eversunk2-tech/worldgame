// Rectangle panel drawn with Graphics (no 9-slice), optional title.
import Phaser from 'phaser';
import { THEME, titleStyle } from './theme';

export interface PanelOptions {
  width: number; height: number;
  title?: string;
  fill?: number; alpha?: number; border?: number; radius?: number;
}

export class Panel extends Phaser.GameObjects.Container {
  readonly bg: Phaser.GameObjects.Graphics;
  readonly titleText: Phaser.GameObjects.Text | null = null;
  readonly panelWidth: number;
  readonly panelHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: PanelOptions) {
    super(scene, x, y);
    this.panelWidth = opts.width;
    this.panelHeight = opts.height;
    this.bg = scene.add.graphics();
    this.redraw(opts);
    this.add(this.bg);
    if (opts.title) {
      this.titleText = scene.add.text(opts.width / 2, 12, opts.title, titleStyle({ fontSize: '20px' })).setOrigin(0.5, 0);
      this.add(this.titleText);
    }
    scene.add.existing(this);
  }

  redraw(opts: Partial<PanelOptions> = {}): void {
    const g = this.bg;
    g.clear();
    g.fillStyle(opts.fill ?? THEME.panel, opts.alpha ?? THEME.panelAlpha);
    g.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, opts.radius ?? 6);
    g.lineStyle(2, opts.border ?? THEME.border, 1);
    g.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, opts.radius ?? 6);
  }
}
