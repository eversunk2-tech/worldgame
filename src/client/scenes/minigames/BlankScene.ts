// Fill-in-the-blank scene (spec 7.4): the sentence is laid out piece by piece with underlined boxes for the blanks
// (current blank highlighted). Four option buttons (keys 1–4) fill the current blank and move on; Tab (or a click on a
// box) changes the blank. One blank → submits right away; two → Enter / [제출]. Feedback colours each blank.
import Phaser from 'phaser';
import type { MinigameResult } from '../../../shared/types';
import type { BlankAction, BlankFeedback, BlankLogic, BlankQuestion, BlankState } from '../../../shared/logic/minigame/blank';
import { Button } from '../../ui/Button';
import { textStyle, THEME } from '../../ui/theme';
import { FEEDBACK_MS, MinigameShellScene } from './MinigameHost';

const LINE_H = 44;
const BOX_H = 32;
const BOX_PAD = 24;
const OPTION_W = 180;
const OPTION_GAP = 12;
const GRADED_MS = FEEDBACK_MS + 700;

interface BlankBox { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; x: number; y: number; w: number; zone: Phaser.GameObjects.Zone }

export class BlankScene extends MinigameShellScene<BlankState, BlankAction, BlankLogic> {
  private question: BlankQuestion | null = null;
  private sentence: Phaser.GameObjects.GameObject[] = [];
  private boxes: BlankBox[] = [];
  private options: Button[] = [];
  private submitBtn!: Button;
  private current = 0;
  private graded: boolean[] | null = null;
  private keys!: { nums: Phaser.Input.Keyboard.Key[]; tab: Phaser.Input.Keyboard.Key };

  constructor() {
    super('Blank', 'blank');
  }

  protected title(): string {
    return '빈칸 채우기';
  }

  protected hintText(): string {
    return '1~4 키 또는 클릭으로 고르기 · Tab 빈칸 이동 · Enter 제출';
  }

  protected status(): { progress: string; score: string } {
    const s = this.state;
    const total = s.questions.length;
    return { progress: `문장 ${Math.min(s.index + 1, Math.max(1, total))} / ${total}`, score: `정답 ${s.correct}` };
  }

  protected failHint(): string {
    const pass = this.spec.kind === 'blank' ? this.spec.passCount : 0;
    return `${pass}문장 이상 맞히면 성공이에요. 표지판의 문장을 다시 읽어 봐요.`;
  }

  protected override headline(result: MinigameResult): string {
    return result.success ? `${result.total}문장 중 ${result.correct}개 정답 · 성공!` : `${result.total}문장 중 ${result.correct}개 · 아쉬워요`;
  }

  protected build(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { nums: [K.ONE, K.TWO, K.THREE, K.FOUR].map((c) => kb.addKey(c)), tab: kb.addKey(K.TAB) };
    kb.addCapture(K.TAB); // keep focus on the canvas
    const r = this.rect;
    const rowW = 4 * OPTION_W + 3 * OPTION_GAP;
    const ox = r.x + (r.w - rowW) / 2;
    this.options = [0, 1, 2, 3].map((i) => new Button(this, ox + i * (OPTION_W + OPTION_GAP), r.y + 250, '', { width: OPTION_W, height: 52, silent: true, onClick: () => this.choose(i) }));
    this.submitBtn = new Button(this, r.x + r.w / 2 - 80, r.y + 330, '제출 (Enter)', { width: 160, height: 44, onClick: () => this.submit() });
    this.showQuestion();
  }

  // ------------------------------------------------------------ layout

  private showQuestion(): void {
    for (const o of this.sentence) o.destroy();
    this.sentence = [];
    this.boxes = [];
    this.graded = null;
    this.current = 0;
    const q = (this.question = this.logic.current(this.state));
    if (!q) { this.finish(); return; }
    this.refreshStatus();
    this.setFeedback('');
    this.layoutSentence(q);
    this.submitBtn.setVisible(q.slots.length > 1).setEnabled(true);
    this.refreshBlanks();
  }

  /** Flow the sentence: words and blank boxes left to right, wrapping at the panel width, centred per line. */
  private layoutSentence(q: BlankQuestion): void {
    const r = this.rect;
    const maxW = r.w - 80;
    type Token = { kind: 'word'; text: string } | { kind: 'box'; index: number };
    const tokens: Token[] = [];
    q.pieces.forEach((piece, i) => {
      for (const w of piece.split(/(\s+)/)) if (w) tokens.push({ kind: 'word', text: w });
      if (i < q.slots.length) tokens.push({ kind: 'box', index: i });
    });
    // measure
    const measure = this.add.text(0, 0, '', textStyle()).setVisible(false);
    const widthOf = (t: Token): number => {
      if (t.kind === 'word') return measure.setText(t.text).width;
      const longest = Math.max(...q.slots[t.index]!.options.map((o) => measure.setText(o).width));
      return Math.max(90, Math.ceil(longest) + BOX_PAD);
    };
    const lines: { token: Token; w: number }[][] = [[]];
    let lineW = 0;
    for (const t of tokens) {
      const w = widthOf(t);
      const isSpace = t.kind === 'word' && /^\s+$/.test(t.text);
      if (lineW + w > maxW && lineW > 0 && !isSpace) { lines.push([]); lineW = 0; }
      if (isSpace && lineW === 0) continue;
      lines[lines.length - 1]!.push({ token: t, w });
      lineW += w;
    }
    measure.destroy();

    const top = r.y + 110 - ((lines.length - 1) * LINE_H) / 2;
    lines.forEach((line, li) => {
      const total = line.reduce((s, x) => s + x.w, 0);
      let x = r.x + (r.w - total) / 2;
      const y = top + li * LINE_H;
      for (const { token, w } of line) {
        if (token.kind === 'word') {
          this.sentence.push(this.add.text(x, y, token.text, textStyle()).setOrigin(0, 0.5));
        } else {
          const bg = this.add.graphics();
          const text = this.add.text(x + w / 2, y, '', textStyle({ color: THEME.accentCss })).setOrigin(0.5);
          const zone = this.add.zone(x + w / 2, y, w, BOX_H + 8).setInteractive({ useHandCursor: true });
          const idx = token.index;
          zone.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.button === 0) this.selectBlank(idx); });
          this.boxes[idx] = { bg, text, x, y, w, zone };
          this.sentence.push(bg, text, zone);
        }
        x += w;
      }
    });
  }

  /** Redraw the boxes (value, current highlight, graded colours) and the option labels for the current blank. */
  private refreshBlanks(): void {
    const q = this.question;
    if (!q) return;
    this.boxes.forEach((b, i) => {
      const chosen = this.state.chosen[i];
      const g = b.bg;
      g.clear();
      const graded = this.graded?.[i];
      const isCurrent = this.graded === null && i === this.current;
      const fill = graded === undefined ? (isCurrent ? 0x4a4d7a : 0x2b2d4a) : graded ? 0x2e7d46 : 0x8a2f3a;
      g.fillStyle(fill, 0.9).fillRect(b.x + 3, b.y - BOX_H / 2, b.w - 6, BOX_H);
      const line = graded === undefined ? (isCurrent ? THEME.accent : 0xb8bce0) : graded ? THEME.success : THEME.danger;
      g.fillStyle(line, 1).fillRect(b.x + 3, b.y + BOX_H / 2 - 3, b.w - 6, 3);
      if (isCurrent) g.lineStyle(2, THEME.accent, 1).strokeRect(b.x + 2, b.y - BOX_H / 2 - 1, b.w - 4, BOX_H + 2);
      b.text.setText(chosen === null || chosen === undefined ? '' : q.slots[i]!.options[chosen]!);
      b.text.setColor(graded === undefined ? THEME.accentCss : THEME.text);
    });
    const slot = q.slots[this.current];
    this.options.forEach((btn, i) => {
      btn.setText(slot ? `${i + 1}. ${slot.options[i]}` : '');
      btn.setSelected(!!slot && this.state.chosen[this.current] === i && this.graded === null);
      btn.setEnabled(this.graded === null);
    });
  }

  // ------------------------------------------------------------ input (keys and clicks share choose/selectBlank/submit)

  protected pollKeys(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    for (let i = 0; i < this.keys.nums.length; i++) {
      if (J(this.keys.nums[i]!)) { this.choose(i); return; }
    }
    if (J(this.keys.tab)) this.selectBlank((this.current + 1) % Math.max(1, this.boxes.length));
    else if (J(this.shellKeys.enter)) this.submit();
  }

  private selectBlank(i: number): void {
    if (!this.inputReady || !this.question || i < 0 || i >= this.question.slots.length) return;
    this.current = i;
    this.onClick();
    this.refreshBlanks();
  }

  private choose(option: number): void {
    if (!this.inputReady || !this.question) return;
    const fb = this.logic.act(this.state, { type: 'choose', blank: this.current, option }) as BlankFeedback;
    if (fb.outcome !== 'chosen') return;
    this.onClick();
    const n = this.question.slots.length;
    if (n === 1) { this.refreshBlanks(); this.submit(); return; }
    // move on to the next blank (wrapping), preferring an empty one
    const empty = this.state.chosen.findIndex((c, k) => c === null && k !== this.current);
    this.current = empty >= 0 ? empty : (this.current + 1) % n;
    this.setFeedback('');
    this.refreshBlanks();
  }

  private submit(): void {
    if (!this.inputReady || !this.question) return;
    const fb = this.logic.act(this.state, { type: 'submit' }) as BlankFeedback;
    if (fb.outcome === 'incomplete') {
      this.onWrong();
      this.setFeedback(fb.explanation, 'bad');
      const empty = this.state.chosen.findIndex((c) => c === null);
      if (empty >= 0) this.current = empty;
      this.refreshBlanks();
      return;
    }
    if (fb.outcome !== 'graded') return;
    // the logic moved to the next sentence: grade the boxes of the one just submitted
    this.graded = fb.perBlank ?? [];
    this.showGraded(fb);
    if (fb.correct) this.onCorrect(); else this.onWrong();
    this.setFeedback(`${fb.correct ? '정답!' : '아쉬워요. 정답:'} ${fb.explanation}`, fb.correct ? 'good' : 'bad');
    this.setScore();
    this.submitBtn.setEnabled(false);
    this.hold(GRADED_MS, () => {
      if (this.logic.isDone(this.state)) this.finish();
      else this.showQuestion();
    });
  }

  /** Colour the submitted boxes; wrong ones show the right answer. */
  private showGraded(fb: BlankFeedback): void {
    const q = this.question;
    if (!q) return;
    const answers = q.item.blanks.map((b) => b.answer);
    this.boxes.forEach((b, i) => {
      const ok = fb.perBlank?.[i] ?? false;
      const g = b.bg;
      g.clear();
      g.fillStyle(ok ? 0x2e7d46 : 0x8a2f3a, 0.95).fillRect(b.x + 3, b.y - BOX_H / 2, b.w - 6, BOX_H);
      g.fillStyle(ok ? THEME.success : THEME.danger, 1).fillRect(b.x + 3, b.y + BOX_H / 2 - 3, b.w - 6, 3);
      b.text.setText(answers[i] ?? '').setColor(THEME.text);
    });
    this.options.forEach((btn) => btn.setSelected(false).setEnabled(false));
  }

  protected override onFinish(): void {
    for (const o of this.sentence) o.destroy();
    this.sentence = [];
    this.boxes = [];
    for (const o of this.options) o.setVisible(false);
    this.submitBtn.setVisible(false);
    this.input.setDefaultCursor('default');
  }
}
