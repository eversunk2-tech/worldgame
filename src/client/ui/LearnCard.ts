// Learn card overlay: 640×360 panel with 지형/기후/문화 tabs (spec 5.9). Tabs: click or keys 1/2/3 while open
// (v0.1 review low #10: no more shared LEFT/RIGHT keys with the player).
import Phaser from 'phaser';
import type { LearnCard as LearnCardData } from '../../shared/types';
import { sfx } from '../audio/sfx';
import { Panel } from './Panel';
import { Button } from './Button';
import { THEME, textStyle } from './theme';

const TOPICS = ['geo', 'climate', 'culture'] as const;
const TOPIC_NAMES: Record<(typeof TOPICS)[number], string> = { geo: '1 지형', climate: '2 기후', culture: '3 문화' };
const W = 640;
const H = 360;

export class LearnCard extends Phaser.GameObjects.Container {
  private readonly panel: Panel;
  private readonly tabs: Button[] = [];
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly closeBtn: Button;
  private cards: LearnCardData[] = [];
  private current = 0;
  /** Called whenever a card tab becomes visible (used for card.read dispatch). */
  onView: ((card: LearnCardData) => void) | null = null;
  onClose: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.panel = new Panel(scene, 0, 0, { width: W, height: H });
    this.add(this.panel);
    TOPICS.forEach((topic, i) => {
      const b = new Button(scene, 16 + i * 130, 12, TOPIC_NAMES[topic], { width: 120, height: 32, size: 'small', onClick: () => this.select(i) });
      this.tabs.push(b);
      this.add(b);
    });
    this.titleText = scene.add.text(W / 2, 58, '', textStyle({ size: 'title', color: THEME.accentCss })).setOrigin(0.5, 0);
    this.bodyText = scene.add.text(32, 100, '', textStyle({ wordWrap: { width: W - 64 }, lineSpacing: 8 }));
    this.closeBtn = new Button(scene, W / 2 - 60, H - 48, '닫기 (Esc)', { width: 120, height: 34, size: 'small', onClick: () => this.close() });
    this.add([this.titleText, this.bodyText, this.closeBtn]);
    this.add(scene.add.text(W - 16, H - 14, '1·2·3 키로 탭 전환', textStyle({ size: 'small', color: THEME.textDim })).setOrigin(1, 1));
    this.setVisible(false);
    scene.add.existing(this);
  }

  /** Show the city's cards, starting on the tab matching `topic` (falls back to the first). */
  show(cards: LearnCardData[], topic: string, onClose?: () => void): void {
    this.cards = cards;
    this.onClose = onClose ?? null;
    if (!this.visible) sfx.open();
    this.setVisible(true);
    const idx = Math.max(0, TOPICS.findIndex((t) => t === topic));
    this.select(idx);
  }

  select(i: number): void {
    if (!this.visible) return;
    const topic = TOPICS[i] ?? 'geo';
    const card = this.cards.find((c) => c.topic === topic);
    this.current = i;
    this.tabs.forEach((b, j) => b.setSelected(j === i));
    if (!card) {
      this.titleText.setText('');
      this.bodyText.setText('(카드 없음)');
      return;
    }
    this.titleText.setText(card.title);
    this.bodyText.setText(card.lines.map((l) => `• ${l}`).join('\n'));
    this.onView?.(card);
  }

  nextTab(delta: number): void {
    this.select((this.current + delta + TOPICS.length) % TOPICS.length);
  }

  close(): void {
    if (!this.visible) return;
    this.setVisible(false);
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }
}
