// OX quiz scene: two big buttons, keys O/X or ←/→ (spec 6.9).
import Phaser from 'phaser';
import type { QuizItem } from '../../../shared/types';
import { Button } from '../../ui/Button';
import { THEME } from '../../ui/theme';
import { MinigameBaseScene } from './MinigameHost';

export class OxScene extends MinigameBaseScene {
  private oBtn: Button | null = null;
  private xBtn: Button | null = null;
  private keys!: { o: Phaser.Input.Keyboard.Key; x: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };

  constructor() {
    super('Ox', 'ox');
  }

  override create(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { o: kb.addKey(K.O), x: kb.addKey(K.X), left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT) };
    super.create();
  }

  protected title(): string {
    return 'OX 퀴즈';
  }

  protected hintText(): string {
    return 'O/X 키, ←/→ 또는 클릭으로 답하기';
  }

  protected buildAnswers(_item: QuizItem): void {
    this.oBtn = new Button(this, 60, 20, 'O', { width: 280, height: 200, fontSize: 96, fill: 0x2e6b46, hover: 0x3a8a58, border: THEME.success, onClick: () => this.choose(true) });
    this.xBtn = new Button(this, 420, 20, 'X', { width: 280, height: 200, fontSize: 96, fill: 0x7a2f3a, hover: 0x9a3d4a, border: THEME.danger, onClick: () => this.choose(false) });
    this.answerArea.add([this.oBtn, this.xBtn]);
  }

  protected showAnswerFeedback(choice: number | boolean, correct: boolean, item: QuizItem): void {
    if (item.kind !== 'ox') return;
    const chosen = choice === true ? this.oBtn : this.xBtn;
    const other = choice === true ? this.xBtn : this.oBtn;
    if (!chosen || !other) return;
    if (correct) chosen.setColors(0x2e7d46, 0x2e7d46, THEME.accent);
    else { chosen.setColors(0x55202a, 0x55202a, THEME.danger); other.setColors(0x2e7d46, 0x2e7d46, THEME.accent); }
  }

  protected pollKeys(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.keys.o) || J(this.keys.left)) this.choose(true);
    else if (J(this.keys.x) || J(this.keys.right)) this.choose(false);
  }
}
