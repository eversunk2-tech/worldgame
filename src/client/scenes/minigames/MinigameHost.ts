// Minigame launcher (pause City / hide Hud / launch scene / deliver result) + shared base scene for quiz-style games.
import Phaser from 'phaser';
import type { MinigameKind, MinigameResult, MinigameSpec, QuizItem } from '../../../shared/types';
import { quizPool } from '../../../shared/content';
import { getMinigameLogic } from '../../../shared/logic/minigame/registry';
import type { MinigameLogic } from '../../../shared/logic/minigame/types';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { session } from '../../session';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { textStyle, THEME, titleStyle } from '../../ui/theme';

/** kind → scene key. Register new minigame scenes here (and their logic in shared/logic/minigame/registry.ts). */
export const MINIGAME_SCENE: Record<MinigameKind, string> = { quiz: 'Quiz', ox: 'Ox' };
export const MINIGAME_DONE = 'minigame:done';

export interface MinigameLaunchData { spec: MinigameSpec; seed: number; missionId: string }

/**
 * Pause the city, hide the HUD, run the minigame scene, then resume and hand the result to `onDone`.
 * Returns a cleanup function the caller must invoke on shutdown (removes the pending listener).
 */
export function launchMinigame(city: Phaser.Scene, spec: MinigameSpec, missionId: string, onDone: (result: MinigameResult) => void): () => void {
  const hudKey = 'Hud';
  const handler = (result: MinigameResult) => {
    city.scene.resume();
    city.input.keyboard?.resetKeys();
    city.scene.setVisible(true, hudKey);
    city.scene.resume(hudKey);
    city.scene.get(hudKey).input.keyboard?.resetKeys();
    onDone(result);
  };
  city.game.events.once(MINIGAME_DONE, handler);
  city.scene.setVisible(false, hudKey);
  city.scene.pause(hudKey);
  city.scene.launch(MINIGAME_SCENE[spec.kind], { spec, seed: session.nextSeed(), missionId } satisfies MinigameLaunchData);
  city.scene.pause();
  return () => city.game.events.off(MINIGAME_DONE, handler);
}

const INPUT_GRACE_MS = 300;
const FEEDBACK_MS = 1500;
/** A click that answered must not also skip the feedback it just opened (same pointerdown reaches the scene). */
const SKIP_GRACE_MS = 200;

/** Common quiz-style flow: question → answer → feedback → next → result panel. Subclasses build the answer widgets. */
export abstract class MinigameBaseScene extends Phaser.Scene {
  protected spec!: MinigameSpec;
  protected logic!: MinigameLogic<unknown>;
  protected state: unknown;
  protected panel!: Panel;
  protected progressText!: Phaser.GameObjects.Text;
  protected scoreText!: Phaser.GameObjects.Text;
  protected questionText!: Phaser.GameObjects.Text;
  protected feedbackText!: Phaser.GameObjects.Text;
  protected answerArea!: Phaser.GameObjects.Container;
  protected answering = false;
  private readyAt = 0;
  private finished = false;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private feedbackOpenedAt = 0;
  private resultPanel: Phaser.GameObjects.Container | null = null;
  private emitted = false;

  constructor(key: string, private readonly kind: MinigameKind) {
    super(key);
  }

  init(data: MinigameLaunchData): void {
    this.spec = data.spec;
    this.logic = getMinigameLogic(this.kind);
    this.state = this.logic.create(this.spec, quizPool(this.spec.cityId), data.seed);
    this.finished = false;
    this.answering = false;
    this.resultPanel = null;
    this.feedbackTimer = null;
    this.emitted = false;
  }

  create(): void {
    this.readyAt = this.time.now + INPUT_GRACE_MS;
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.panel = new Panel(this, (GAME_WIDTH - 820) / 2, (GAME_HEIGHT - 460) / 2, { width: 820, height: 460, title: this.title() });
    const px = this.panel.x;
    const py = this.panel.y;
    this.progressText = this.add.text(px + 20, py + 16, '', textStyle({ color: THEME.textDim }));
    this.scoreText = this.add.text(px + 800, py + 16, '', textStyle({ color: THEME.successCss })).setOrigin(1, 0);
    this.questionText = this.add.text(px + 30, py + 62, '', textStyle({ fontSize: '20px', wordWrap: { width: 760 } }));
    this.feedbackText = this.add.text(px + 410, py + 420, '', textStyle({ fontSize: '16px', wordWrap: { width: 760 }, align: 'center' })).setOrigin(0.5);
    this.answerArea = this.add.container(px + 30, py + 140);
    this.add.text(px + 800, py + 440, this.hintText(), textStyle({ fontSize: '12px', color: THEME.textDim })).setOrigin(1, 1);
    this.input.on('pointerdown', () => this.skipFeedback());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.setDefaultCursor('default'));
    this.showQuestion();
  }

  protected abstract title(): string;
  protected abstract hintText(): string;
  /** Build answer widgets for `item` into `this.answerArea`. */
  protected abstract buildAnswers(item: QuizItem): void;
  /** Colour the chosen / correct widgets after answering. */
  protected abstract showAnswerFeedback(choice: number | boolean, correct: boolean, item: QuizItem): void;
  /** Keyboard handling for answers; call `choose` when a key maps to an answer. */
  protected abstract pollKeys(): void;

  protected get inputReady(): boolean {
    return this.time.now >= this.readyAt && !this.answering && !this.finished;
  }

  override update(): void {
    if (this.finished) return;
    if (this.inputReady) this.pollKeys();
  }

  protected showQuestion(): void {
    const item = this.logic.current(this.state);
    if (!item) { this.finish(); return; }
    const total = this.logic.result(this.state).total;
    const idx = this.logic.result(this.state).answeredIds.length;
    this.progressText.setText(`${idx + 1} / ${total}`);
    this.scoreText.setText(`정답 ${this.logic.result(this.state).correct}`);
    this.questionText.setText(item.question);
    this.feedbackText.setText('');
    this.answerArea.removeAll(true);
    this.buildAnswers(item);
  }

  protected choose(choice: number | boolean): void {
    if (!this.inputReady) return;
    const item = this.logic.current(this.state);
    if (!item) return;
    this.answering = true;
    const fb = this.logic.answer(this.state, choice);
    this.showAnswerFeedback(choice, fb.correct, item);
    this.scoreText.setText(`정답 ${this.logic.result(this.state).correct}`);
    this.feedbackText.setText(`${fb.correct ? '정답!' : '아쉬워요'} ${fb.explanation}`).setColor(fb.correct ? THEME.successCss : THEME.dangerCss);
    this.feedbackOpenedAt = this.time.now;
    this.feedbackTimer = this.time.delayedCall(FEEDBACK_MS, () => this.next());
  }

  private skipFeedback(): void {
    if (!this.answering || this.finished) return;
    if (this.time.now - this.feedbackOpenedAt < SKIP_GRACE_MS) return;
    if (this.feedbackTimer && this.feedbackTimer.getProgress() < 1) {
      this.feedbackTimer.remove(false);
      this.next();
    }
  }

  private next(): void {
    this.feedbackTimer = null;
    this.answering = false;
    if (this.logic.isDone(this.state)) this.finish();
    else this.showQuestion();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    const result = this.logic.result(this.state);
    this.answerArea.removeAll(true);
    this.feedbackText.setText('');
    const w = 420;
    const h = 200;
    const px = (GAME_WIDTH - w) / 2;
    const py = (GAME_HEIGHT - h) / 2;
    const panel = new Panel(this, px, py, { width: w, height: h, border: result.success ? THEME.success : THEME.danger });
    panel.setDepth(10);
    const headline = this.add.text(w / 2, 40, result.success ? `${result.correct} / ${result.total} 정답 · 성공!` : `${result.correct} / ${result.total} · 아쉬워요`, titleStyle({ color: result.success ? THEME.successCss : THEME.dangerCss })).setOrigin(0.5);
    const sub = this.add.text(w / 2, 90, result.success ? '미션 완료! 보상을 받았어요.' : `${this.spec.passCount}개 이상 맞히면 성공이에요. 표지판을 읽고 다시 도전해 봐요.`, textStyle({ color: THEME.textDim, align: 'center', wordWrap: { width: w - 40 } })).setOrigin(0.5);
    const btn = new Button(this, w / 2 - 70, h - 60, '확인 (Enter)', { width: 140, height: 40, onClick: () => this.emitDone(result) });
    panel.add([headline, sub, btn]);
    this.resultPanel = panel;
    this.input.keyboard?.once('keydown-ENTER', () => this.emitDone(result));
    this.input.keyboard?.once('keydown-SPACE', () => this.emitDone(result));
  }

  private emitDone(result: MinigameResult): void {
    if (this.emitted) return;
    this.emitted = true;
    this.resultPanel?.destroy();
    this.game.events.emit(MINIGAME_DONE, result);
    this.scene.stop();
  }
}
