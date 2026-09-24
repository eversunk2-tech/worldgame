// NPC dialog box: name + body text, closes on Space/E/click (handled by HudScene). 9-slice skin, Galmuri fonts.
import Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { Panel } from './Panel';
import { THEME, textStyle } from './theme';

export class DialogBox extends Phaser.GameObjects.Container {
  private readonly panel: Panel;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  onClose: (() => void) | null = null;
  /** Set by the owner (HudScene) so a click on the box closes it through the same grace logic as the keys. */
  onClick: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, width = 640, height = 116) {
    super(scene, x, y);
    this.panel = new Panel(scene, 0, 0, { width, height });
    this.nameText = scene.add.text(16, 10, '', textStyle({ size: 'bold', color: THEME.accentCss }));
    this.bodyText = scene.add.text(16, 32, '', textStyle({ wordWrap: { width: width - 32 }, lineSpacing: 4 }));
    this.hint = scene.add.text(width - 14, height - 6, '[E/Space/클릭] 닫기', textStyle({ size: 'small', color: THEME.textDim })).setOrigin(1, 1);
    this.add([this.panel, this.nameText, this.bodyText, this.hint]);
    this.setSize(width, height);
    this.setInteractive(new Phaser.Geom.Rectangle(width / 2, height / 2, width, height), Phaser.Geom.Rectangle.Contains);
    this.on('pointerdown', () => this.onClick?.());
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(name: string, text: string, onClose?: () => void): void {
    this.nameText.setText(name);
    this.bodyText.setText(text);
    this.onClose = onClose ?? null;
    if (!this.visible) sfx.open();
    this.setVisible(true);
  }

  close(): void {
    if (!this.visible) return;
    this.setVisible(false);
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }
}
