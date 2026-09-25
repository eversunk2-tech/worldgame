// Memory match scene (spec 7.1): 12 cards (4×3) or 16 (4×4). Click a card, or move the yellow cursor with the arrow
// keys and flip with Enter/Space. A match stays green; a miss blinks red and turns back after 700 ms.
import Phaser from 'phaser';
import type { MinigameResult } from '../../../shared/types';
import type { MatchAction, MatchFeedback, MatchLogic, MatchState } from '../../../shared/logic/minigame/match';
import { UI } from '../../assets/uiSkin';
import { textStyle, THEME } from '../../ui/theme';
import { MinigameShellScene } from './MinigameHost';

export const MATCH_HIDE_MS = 700;
const MATCH_SHOW_MS = 450;
const COLS = 4;
const GAP_X = 16;
const GAP_Y = 12;
const FLIP_MS = 70;

interface CardView {
  box: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Container;
  frontBg: Phaser.GameObjects.NineSlice;
  frame: Phaser.GameObjects.Graphics;
  faceUp: boolean;
}

export class MatchScene extends MinigameShellScene<MatchState, MatchAction, MatchLogic> {
  private views: CardView[] = [];
  private cursor = 0;
  private cursorFrame!: Phaser.GameObjects.Graphics;
  private cardW = 150;
  private cardH = 90;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key };

  constructor() {
    super('Match', 'match');
  }

  protected title(): string {
    return '짝맞추기';
  }

  protected hintText(): string {
    return '카드 클릭 또는 방향키 + Enter/Space 로 뒤집기';
  }

  protected status(): { progress: string; score: string } {
    const s = this.state;
    const max = this.spec.kind === 'match' ? this.spec.maxAttempts : 0;
    return { progress: `시도 ${s.attempts} / ${max}`, score: `남은 짝 ${s.pairs.length - s.matchedIds.length}` };
  }

  protected failHint(): string {
    const max = this.spec.kind === 'match' ? this.spec.maxAttempts : 0;
    return `${max}번 안에 모든 짝을 찾으면 성공이에요. 카드 위치를 잘 기억해 봐요.`;
  }

  protected override headline(result: MinigameResult): string {
    return result.success ? `${result.total}쌍을 모두 찾았어요! (시도 ${this.state.attempts}번)` : `${result.correct} / ${result.total}쌍 · 아쉬워요`;
  }

  protected build(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), up: kb.addKey(K.UP), down: kb.addKey(K.DOWN) };
    this.views = [];
    this.cursor = 0;

    const n = this.state.cards.length;
    const rows = Math.max(1, Math.ceil(n / COLS));
    this.cardW = 150;
    this.cardH = rows > 3 ? 66 : 90;
    const gridW = COLS * this.cardW + (COLS - 1) * GAP_X;
    const gridH = rows * this.cardH + (rows - 1) * GAP_Y;
    const x0 = this.rect.x + (this.rect.w - gridW) / 2;
    const y0 = this.rect.y + 52 + Math.max(0, (this.rect.h - 52 - 70 - gridH) / 2);

    this.state.cards.forEach((card, i) => {
      const cx = x0 + (i % COLS) * (this.cardW + GAP_X) + this.cardW / 2;
      const cy = y0 + Math.floor(i / COLS) * (this.cardH + GAP_Y) + this.cardH / 2;
      const w = this.cardW;
      const h = this.cardH;
      const backBg = this.add.nineslice(0, 0, UI.btn, undefined, w, h, UI.slice, UI.slice, UI.slice, UI.slice);
      const q = this.add.text(0, 0, '?', textStyle({ size: 'big', color: THEME.accentCss })).setOrigin(0.5);
      const back = this.add.container(0, 0, [backBg, q]);
      const frontBg = this.add.nineslice(0, 0, UI.panelLight, undefined, w, h, UI.slice, UI.slice, UI.slice, UI.slice);
      const label = this.add.text(0, 0, card.text, textStyle({ align: 'center', wordWrap: { width: w - 16 }, lineSpacing: 2 })).setOrigin(0.5);
      const front = this.add.container(0, 0, [frontBg, label]).setVisible(false);
      const frame = this.add.graphics();
      const box = this.add.container(cx, cy, [back, front, frame]);
      box.setSize(w, h);
      // children are centred on (0,0); Phaser adds displayOrigin (w/2, h/2) before the hit test
      box.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      box.on('pointerover', () => { this.setCursor(i); this.input.setDefaultCursor('pointer'); });
      box.on('pointerout', () => this.input.setDefaultCursor('default'));
      box.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.button === 0) this.flip(i); });
      this.views.push({ box, back, front, frontBg, frame, faceUp: false });
    });
    this.cursorFrame = this.add.graphics().setDepth(4);
    this.drawCursor();
  }

  protected pollKeys(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    const n = this.views.length;
    if (!n) return;
    const col = this.cursor % COLS;
    if (J(this.keys.left)) this.setCursor(col === 0 ? Math.min(n - 1, this.cursor + COLS - 1) : this.cursor - 1);
    else if (J(this.keys.right)) this.setCursor(col === COLS - 1 || this.cursor === n - 1 ? this.cursor - col : this.cursor + 1);
    else if (J(this.keys.up)) this.setCursor(this.cursor - COLS >= 0 ? this.cursor - COLS : this.cursor + COLS * Math.floor((n - 1 - this.cursor) / COLS));
    else if (J(this.keys.down)) this.setCursor(this.cursor + COLS < n ? this.cursor + COLS : this.cursor % COLS);
    else if (J(this.shellKeys.enter) || J(this.shellKeys.space)) this.flip(this.cursor);
  }

  private setCursor(i: number): void {
    if (i < 0 || i >= this.views.length || i === this.cursor) return;
    this.cursor = i;
    this.drawCursor();
  }

  private drawCursor(): void {
    const v = this.views[this.cursor];
    const g = this.cursorFrame;
    g.clear();
    if (!v || this.finished) return;
    g.lineStyle(3, THEME.accent, 1);
    g.strokeRect(v.box.x - this.cardW / 2 - 4, v.box.y - this.cardH / 2 - 4, this.cardW + 8, this.cardH + 8);
  }

  private flip(i: number): void {
    if (!this.inputReady) return;
    const fb = this.logic.act(this.state, { type: 'flip', index: i }) as MatchFeedback;
    if (fb.outcome === 'ignored') return;
    this.onFlip();
    this.turn(i, true);
    this.refreshStatus();
    if (fb.outcome === 'flipped') return;

    // two cards are open: the logic already judged them
    const pair = this.lastPair(i);
    if (fb.outcome === 'match') {
      this.onCorrect();
      for (const k of pair) this.paint(k, THEME.success);
      this.setFeedback(`정답! ${fb.explanation}`, 'good');
      this.hold(MATCH_SHOW_MS, () => this.afterTurn());
      return;
    }
    this.onWrong();
    for (const k of pair) this.blink(k);
    this.setFeedback(fb.explanation, 'bad');
    this.hold(MATCH_HIDE_MS, () => {
      this.logic.act(this.state, { type: 'hide' });
      for (const k of pair) this.turn(k, false);
      this.afterTurn();
    });
  }

  /** The two cards just judged: `i` plus the other face-up/newly matched card. */
  private lastPair(i: number): number[] {
    const s = this.state;
    if (s.faceUp.length === 2) return [...s.faceUp];
    const pairId = s.cards[i]!.pairId;
    return s.cards.map((c, k) => (c.pairId === pairId ? k : -1)).filter((k) => k >= 0);
  }

  private afterTurn(): void {
    this.refreshStatus();
    if (this.logic.isDone(this.state)) this.finish();
    else this.setFeedback('');
  }

  private turn(i: number, up: boolean): void {
    const v = this.views[i];
    if (!v || v.faceUp === up) return;
    v.faceUp = up;
    this.tweens.add({
      targets: v.box, scaleX: 0, duration: FLIP_MS, yoyo: true,
      onYoyo: () => { v.back.setVisible(!up); v.front.setVisible(up); if (!up) this.paint(i, null); },
    });
  }

  private paint(i: number, color: number | null): void {
    const v = this.views[i];
    if (!v) return;
    v.frame.clear();
    if (color === null) { v.frontBg.clearTint(); return; }
    v.frame.lineStyle(3, color, 1);
    v.frame.strokeRect(-this.cardW / 2 + 1, -this.cardH / 2 + 1, this.cardW - 2, this.cardH - 2);
    if (color === THEME.success) v.frontBg.setTint(0xb8f0c0);
  }

  private blink(i: number): void {
    const v = this.views[i];
    if (!v) return;
    this.paint(i, THEME.danger);
    this.tweens.add({ targets: v.frame, alpha: 0.2, duration: 120, yoyo: true, repeat: 2, onComplete: () => v.frame.setAlpha(1) });
  }

  protected override onFinish(): void {
    this.cursorFrame.clear();
    for (const v of this.views) v.box.disableInteractive();
    this.input.setDefaultCursor('default');
  }
}
