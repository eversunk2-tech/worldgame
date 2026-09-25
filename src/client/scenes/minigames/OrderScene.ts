// Ordering scene (spec 7.3): up to 5 cards (140×90) in a row, "1번째 →" on the left, [제출] below.
// Keyboard: ←/→ move the cursor, Space picks a card up / puts it down (while held, ←/→ swap it with its neighbour),
// Enter submits. Mouse: drag a card onto another slot (move), or click one card then another (swap).
// After a submit every card turns green/red; a revealed answer slides into the right order (300 ms).
import Phaser from 'phaser';
import type { MinigameResult } from '../../../shared/types';
import { correctArrangement, type OrderAction, type OrderFeedback, type OrderLogic, type OrderQuestion, type OrderState } from '../../../shared/logic/minigame/order';
import { UI } from '../../assets/uiSkin';
import { Button } from '../../ui/Button';
import { textStyle, THEME } from '../../ui/theme';
import { MinigameShellScene } from './MinigameHost';

const CARD_W = 140;
const CARD_H = 90;
const SOLVED_MS = 2200;
const RETRY_MS = 1400;
const REVEAL_MS = 3000;
const SLIDE_MS = 300;
const LIFT = 12;
/** card-local y of the value note (two 12px lines fit between it and the card bottom) and of the label above it */
const NOTE_Y = 23;
const LABEL_Y_WITH_NOTE = -16;

interface OrderCard {
  /** index into question.item.items */
  item: number;
  box: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.NineSlice;
  label: Phaser.GameObjects.Text;
  note: Phaser.GameObjects.Text;
  frame: Phaser.GameObjects.Graphics;
}

export class OrderScene extends MinigameShellScene<OrderState, OrderAction, OrderLogic> {
  private cards: OrderCard[] = [];
  private question: OrderQuestion | null = null;
  private promptText!: Phaser.GameObjects.Text;
  private firstLabel!: Phaser.GameObjects.Text;
  private slotLabels: Phaser.GameObjects.Text[] = [];
  private submitBtn!: Button;
  private cursorFrame!: Phaser.GameObjects.Graphics;
  private rowY = 0;
  private x0 = 0;
  private gap = 16;
  private cursor = 0;
  private held = false;
  private selected: number | null = null;
  private dragging = false;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

  constructor() {
    super('Order', 'order');
  }

  protected title(): string {
    return '순서 맞추기';
  }

  protected hintText(): string {
    return '드래그 또는 두 카드 클릭으로 바꾸기 · ←/→ 이동, Space 집기/놓기, Enter 제출';
  }

  protected status(): { progress: string; score: string } {
    const s = this.state;
    const total = s.questions.length;
    const solved = s.questions.filter((q) => q.solved).length;
    const tries = this.spec.kind === 'order' ? this.spec.triesPerQuestion : 0;
    const q = this.logic.current(s);
    const left = q ? ` · 기회 ${Math.max(0, tries - q.tries)}번` : '';
    return { progress: `문제 ${Math.min(s.index + 1, Math.max(1, total))} / ${total}${left}`, score: `정답 ${solved}` };
  }

  protected failHint(result: MinigameResult): string {
    const pass = this.spec.kind === 'order' ? this.spec.passCount : 0;
    return pass >= result.total ? `${result.total}문제를 모두 맞히면 성공이에요. 카드 아래 숫자를 떠올려 봐요.` : `${pass}문제 이상 맞히면 성공이에요.`;
  }

  protected override headline(result: MinigameResult): string {
    return result.success ? `${result.total}문제 모두 정답 · 성공!` : `${result.correct} / ${result.total}문제 · 아쉬워요`;
  }

  protected build(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT) };
    this.input.dragDistanceThreshold = 6;
    const r = this.rect;
    this.promptText = this.add.text(r.x + r.w / 2, r.y + 64, '', textStyle({ align: 'center', wordWrap: { width: r.w - 60 } })).setOrigin(0.5, 0);
    this.rowY = r.y + 190;
    this.firstLabel = this.add.text(0, this.rowY, '1번째 →', textStyle({ size: 'bold', color: THEME.accentCss })).setOrigin(1, 0.5);
    this.cursorFrame = this.add.graphics().setDepth(6);
    this.submitBtn = new Button(this, r.x + r.w / 2 - 80, r.y + 300, '제출 (Enter)', { width: 160, height: 44, onClick: () => this.submit() });
    // reveal texts ("n개가 제자리… + 설명") can run to 3 lines: centre them between [제출] and the key hint
    this.feedbackText.setY(r.y + r.h - 64);

    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container, dragX: number) => this.onDrag(obj, dragX));
    this.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => this.onDragStart(obj));
    this.input.on('dragend', (p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Container) => this.onDragEnd(obj, p.x));
    this.showQuestion();
  }

  // ------------------------------------------------------------ layout

  private slotX(pos: number): number {
    return this.x0 + pos * (CARD_W + this.gap) + CARD_W / 2;
  }

  private showQuestion(): void {
    for (const c of this.cards) c.box.destroy();
    for (const t of this.slotLabels) t.destroy();
    this.cards = [];
    this.slotLabels = [];
    this.held = false;
    this.selected = null;
    this.cursor = 0;
    const q = (this.question = this.logic.current(this.state));
    if (!q) { this.finish(); return; }
    this.refreshStatus();
    this.setFeedback('');
    this.promptText.setText(`${q.item.prompt}\n왼쪽(1번째)부터 차례로 놓아요`);

    const n = q.item.items.length;
    this.gap = n >= 5 ? 12 : 16;
    const rowW = n * CARD_W + (n - 1) * this.gap;
    this.x0 = this.rect.x + (this.rect.w - rowW) / 2;
    // "1번째 →" left of the first card, or above it when a 5-card row leaves no room
    if (this.x0 - this.rect.x >= 84) this.firstLabel.setPosition(this.x0 - 10, this.rowY).setOrigin(1, 0.5);
    else this.firstLabel.setPosition(this.x0, this.rowY - CARD_H / 2 - 26).setOrigin(0, 0.5);

    for (let pos = 0; pos < n; pos++) {
      this.slotLabels.push(this.add.text(this.slotX(pos), this.rowY - CARD_H / 2 - 10, `${pos + 1}`, textStyle({ size: 'small', color: THEME.textDim })).setOrigin(0.5, 1));
    }
    q.arrangement.forEach((itemIdx, pos) => this.cards.push(this.makeCard(q, itemIdx, pos)));
    this.submitBtn.setEnabled(true);
    this.drawCursor();
  }

  private makeCard(q: OrderQuestion, itemIdx: number, pos: number): OrderCard {
    const it = q.item.items[itemIdx]!;
    const bg = this.add.nineslice(0, 0, UI.panelLight, undefined, CARD_W, CARD_H, UI.slice, UI.slice, UI.slice, UI.slice);
    const label = this.add.text(0, -4, it.label, textStyle({ align: 'center', wordWrap: { width: CARD_W - 14 } })).setOrigin(0.5);
    // notes such as "1시간 빠름(호주 여름 2시간)" wrap to two 12px lines in the lower half of the card
    const note = this.add.text(0, NOTE_Y, it.note ?? String(it.value), textStyle({ size: 'small', color: THEME.accentCss, align: 'center', wordWrap: { width: CARD_W - 12 } }))
      .setOrigin(0.5).setVisible(false);
    const frame = this.add.graphics();
    const box = this.add.container(this.slotX(pos), this.rowY, [bg, label, note, frame]).setDepth(2);
    box.setSize(CARD_W, CARD_H);
    // children are centred on (0,0); Phaser adds displayOrigin (w/2, h/2) before the hit test
    box.setInteractive(new Phaser.Geom.Rectangle(0, 0, CARD_W, CARD_H), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(box);
    const card: OrderCard = { item: itemIdx, box, bg, label, note, frame };
    box.on('pointerover', () => this.input.setDefaultCursor('pointer'));
    box.on('pointerout', () => this.input.setDefaultCursor('default'));
    box.on('pointerup', (p: Phaser.Input.Pointer) => { if (p.button === 0 && !this.dragging) this.clickCard(card); });
    return card;
  }

  /** Current position of a card in the arrangement. */
  private posOf(card: OrderCard): number {
    return this.question ? this.question.arrangement.indexOf(card.item) : -1;
  }

  /** Slide every card to its arrangement slot. */
  private layout(animate: boolean): void {
    const q = this.question;
    if (!q) return;
    for (const c of this.cards) {
      const pos = q.arrangement.indexOf(c.item);
      const lifted = this.isLifted(pos);
      const x = this.slotX(pos);
      const y = this.rowY - (lifted ? LIFT : 0);
      if (animate) this.tweens.add({ targets: c.box, x, y, duration: SLIDE_MS, ease: 'Quad.easeOut' });
      else c.box.setPosition(x, y);
    }
    this.drawCursor();
  }

  /** A card picked up with Space, or the first card of a click-click swap, sits raised. */
  private isLifted(pos: number): boolean {
    return (this.held && pos === this.cursor) || pos === this.selected;
  }

  private drawCursor(): void {
    const g = this.cursorFrame;
    g.clear();
    if (this.finished || this.busy || !this.question) return;
    const mark = (pos: number, color: number, pad: number) => {
      const y = this.rowY - (this.isLifted(pos) ? LIFT : 0);
      g.lineStyle(3, color, 1);
      g.strokeRect(this.slotX(pos) - CARD_W / 2 - pad, y - CARD_H / 2 - pad, CARD_W + pad * 2, CARD_H + pad * 2);
    };
    mark(this.cursor, THEME.accent, 4);
    // the clicked card keeps a green frame outside the cursor frame until the second click
    if (this.selected !== null) mark(this.selected, THEME.success, 9);
  }

  // ------------------------------------------------------------ input (keyboard and mouse both end in act())

  protected pollKeys(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    const n = this.question?.arrangement.length ?? 0;
    if (!n) return;
    if (J(this.keys.left)) this.step(-1, n);
    else if (J(this.keys.right)) this.step(1, n);
    else if (J(this.shellKeys.space)) { this.held = !this.held; this.selected = null; this.onClick(); this.layout(true); }
    else if (J(this.shellKeys.enter)) this.submit();
  }

  private step(dir: number, n: number): void {
    const to = this.cursor + dir;
    if (to < 0 || to >= n) return;
    if (this.held) this.rearrange({ type: 'swap', a: this.cursor, b: to });
    this.cursor = to;
    this.layout(true);
  }

  private clickCard(card: OrderCard): void {
    if (!this.inputReady) return;
    const pos = this.posOf(card);
    if (pos < 0) return;
    this.held = false;
    this.cursor = pos;
    if (this.selected === null) { this.selected = pos; this.onClick(); }
    else if (this.selected === pos) this.selected = null;
    else { this.rearrange({ type: 'swap', a: this.selected, b: pos }); this.selected = null; }
    this.layout(true);
  }

  private onDragStart(obj: Phaser.GameObjects.Container): void {
    if (!this.inputReady) return;
    this.dragging = true;
    this.selected = null;
    this.held = false;
    obj.setDepth(5);
    this.cursorFrame.clear();
  }

  private onDrag(obj: Phaser.GameObjects.Container, dragX: number): void {
    if (!this.dragging) return;
    const n = this.question?.arrangement.length ?? 1;
    obj.x = Phaser.Math.Clamp(dragX, this.slotX(0) - CARD_W / 2, this.slotX(n - 1) + CARD_W / 2);
    obj.y = this.rowY - LIFT;
  }

  /** Drop onto the slot under the pointer (the card itself may lag a fast drag by a frame). */
  private onDragEnd(obj: Phaser.GameObjects.Container, pointerX: number): void {
    if (!this.dragging) return;
    // pointerup fires after dragend: keep `dragging` set until then so the drop is not also a click
    this.time.delayedCall(0, () => { this.dragging = false; });
    obj.setDepth(2);
    const card = this.cards.find((c) => c.box === obj);
    const n = this.question?.arrangement.length ?? 0;
    if (!card || !n || !this.inputReady) { this.layout(true); return; }
    const from = this.posOf(card);
    const to = Phaser.Math.Clamp(Math.round((pointerX - this.slotX(0)) / (CARD_W + this.gap)), 0, n - 1);
    this.cursor = to;
    if (from !== to) this.rearrange({ type: 'move', from, to });
    this.layout(true);
  }

  private rearrange(action: OrderAction): void {
    const fb = this.logic.act(this.state, action) as OrderFeedback;
    if (fb.outcome === 'moved') this.onFlip();
  }

  private submit(): void {
    if (!this.inputReady || !this.question) return;
    const q = this.question;
    this.held = false;
    this.selected = null;
    // positions as submitted (a reveal replaces the arrangement inside act)
    const submittedPos = this.cards.map((c) => this.posOf(c));
    const fb = this.logic.act(this.state, { type: 'submit' }) as OrderFeedback;
    if (fb.outcome === 'ignored') return;
    const placed = fb.placed ?? [];
    this.cards.forEach((c, i) => {
      this.paint(c, placed[submittedPos[i]!] ? THEME.success : THEME.danger);
      c.box.setPosition(this.slotX(submittedPos[i]!), this.rowY); // settle a lifted card where it was submitted
    });
    this.submitBtn.setEnabled(false);
    // a retry stays on this question (chances left changes); solved/revealed already point at the next one
    if (fb.outcome === 'retry') this.refreshStatus(); else this.setScore();
    this.cursorFrame.clear();

    if (fb.outcome === 'solved') {
      this.onCorrect();
      this.showNotes();
      this.setFeedback(`정답! ${fb.explanation}`, 'good');
      this.hold(SOLVED_MS, () => this.nextQuestion());
      return;
    }
    this.onWrong();
    if (fb.outcome === 'retry') {
      this.setFeedback(`${fb.explanation}. 한 번 더!`, 'bad');
      this.hold(RETRY_MS, () => {
        for (const c of this.cards) this.paint(c, null);
        this.submitBtn.setEnabled(true);
        this.layout(false);
      });
      return;
    }
    // revealed: the logic already put the answer order in place → slide the cards there
    this.setFeedback(fb.explanation, 'bad');
    this.time.delayedCall(450, () => {
      if (this.question !== q || this.finished) return; // skipped already
      const answer = correctArrangement(q.item);
      for (const c of this.cards) {
        this.paint(c, THEME.accent);
        this.tweens.add({ targets: c.box, x: this.slotX(answer.indexOf(c.item)), y: this.rowY, duration: SLIDE_MS, ease: 'Quad.easeInOut' });
      }
      this.showNotes();
    });
    this.hold(REVEAL_MS, () => this.nextQuestion());
  }

  /** Reveal the value under each card (the label moves up to make room). */
  private showNotes(): void {
    for (const c of this.cards) {
      c.note.setVisible(true);
      c.label.setY(LABEL_Y_WITH_NOTE);
    }
  }

  private paint(c: OrderCard, color: number | null): void {
    c.frame.clear();
    if (color === null) { c.bg.clearTint(); return; }
    c.frame.lineStyle(3, color, 1);
    c.frame.strokeRect(-CARD_W / 2 + 1, -CARD_H / 2 + 1, CARD_W - 2, CARD_H - 2);
    if (color === THEME.success) c.bg.setTint(0xb8f0c0);
    else if (color === THEME.danger) c.bg.setTint(0xffc4c4);
    else c.bg.setTint(0xffe9a8);
  }

  private nextQuestion(): void {
    if (this.logic.isDone(this.state)) this.finish();
    else this.showQuestion();
  }

  protected override onFinish(): void {
    for (const c of this.cards) c.box.disableInteractive();
    this.submitBtn.setEnabled(false);
    this.cursorFrame.clear();
    this.input.setDefaultCursor('default');
  }
}
