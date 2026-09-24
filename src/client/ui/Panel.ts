// 9-slice panel (spec 5.9) with an optional title. API kept from v0.1: Panel(scene, x, y, { width, height, title }).
import Phaser from 'phaser';
import { UI } from '../assets/uiSkin';
import { titleStyle } from './theme';

export interface PanelOptions {
  width: number; height: number;
  title?: string;
  /** skin texture key (UI.panel by default) */ texture?: string;
  alpha?: number;
  /** tint colour applied to the skin (e.g. success/danger borders) */ tint?: number;
}

export class Panel extends Phaser.GameObjects.Container {
  readonly bg: Phaser.GameObjects.NineSlice;
  readonly titleText: Phaser.GameObjects.Text | null = null;
  panelWidth: number;
  panelHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: PanelOptions) {
    super(scene, x, y);
    this.panelWidth = opts.width;
    this.panelHeight = opts.height;
    this.bg = scene.add.nineslice(0, 0, opts.texture ?? UI.panel, undefined, opts.width, opts.height, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0);
    if (opts.alpha !== undefined) this.bg.setAlpha(opts.alpha);
    if (opts.tint !== undefined) this.bg.setTint(opts.tint);
    this.add(this.bg);
    if (opts.title) {
      this.titleText = scene.add.text(opts.width / 2, 10, opts.title, titleStyle()).setOrigin(0.5, 0);
      this.add(this.titleText);
    }
    scene.add.existing(this);
  }

  /** Resize / retint (the v0.1 `redraw` became size+tint only, spec 5.9). */
  redraw(opts: Partial<Pick<PanelOptions, 'width' | 'height' | 'tint' | 'alpha'>> = {}): void {
    if (opts.width !== undefined) this.panelWidth = opts.width;
    if (opts.height !== undefined) this.panelHeight = opts.height;
    this.bg.setSize(this.panelWidth, this.panelHeight);
    if (opts.tint !== undefined) this.bg.setTint(opts.tint);
    if (opts.alpha !== undefined) this.bg.setAlpha(opts.alpha);
    this.titleText?.setX(this.panelWidth / 2);
  }
}
