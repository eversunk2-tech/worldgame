// Name tag above an actor (spec 6.1): 12px Galmuri on a translucent dark rounded background.
import Phaser from 'phaser';
import { UI } from '../assets/uiSkin';
import { textStyle } from './theme';

const PAD_X = 4;
const HEIGHT = 16;

export class NameTag extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.NineSlice;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, name: string, color = '#ffffff') {
    super(scene, 0, 0);
    this.bg = scene.add.nineslice(0, 0, UI.tag, undefined, 24, HEIGHT, 4, 4, 4, 4).setOrigin(0.5, 0.5);
    this.label = scene.add.text(0, 0, name, textStyle({ size: 'small', color })).setOrigin(0.5, 0.5);
    this.add([this.bg, this.label]);
    this.layout();
    scene.add.existing(this);
  }

  setLabel(name: string, color?: string): this {
    if (name !== this.label.text) this.label.setText(name);
    if (color) this.label.setColor(color);
    this.layout();
    return this;
  }

  private layout(): void {
    this.bg.setSize(Math.ceil(this.label.width) + PAD_X * 2, HEIGHT);
  }
}
