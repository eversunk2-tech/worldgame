// 4-choice quiz scene: vertical buttons, keys 1–4 (spec 6.9).
import Phaser from 'phaser';
import type { QuizItem } from '../../../shared/types';
import { Button } from '../../ui/Button';
import { THEME } from '../../ui/theme';
import { MinigameBaseScene } from './MinigameHost';

export class QuizScene extends MinigameBaseScene {
  private buttons: Button[] = [];
  private numKeys: Phaser.Input.Keyboard.Key[] = [];

  constructor() {
    super('Quiz', 'quiz');
  }

  override create(): void {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.numKeys = [K.ONE, K.TWO, K.THREE, K.FOUR].map((c) => kb.addKey(c));
    super.create();
  }

  protected title(): string {
    return '4지선다 퀴즈';
  }

  protected hintText(): string {
    return '1~4 키 또는 클릭으로 답하기';
  }

  protected buildAnswers(item: QuizItem): void {
    this.buttons = [];
    if (item.kind !== 'choice') return;
    item.choices.forEach((text, i) => {
      const b = new Button(this, 0, i * 60, `${i + 1}. ${text}`, { width: 760, height: 50, onClick: () => this.choose(i) });
      this.buttons.push(b);
      this.answerArea.add(b);
    });
  }

  protected showAnswerFeedback(choice: number | boolean, _correct: boolean, item: QuizItem): void {
    if (item.kind !== 'choice') return;
    this.buttons.forEach((b, i) => {
      if (i === item.answer) b.setColors(0x2e7d46, 0x2e7d46, THEME.success);
      else if (i === choice) b.setColors(0x8a2f3a, 0x8a2f3a, THEME.danger);
      else b.setEnabled(false);
    });
  }

  protected pollKeys(): void {
    for (let i = 0; i < this.numKeys.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(this.numKeys[i]!)) { this.choose(i); return; }
    }
  }
}
