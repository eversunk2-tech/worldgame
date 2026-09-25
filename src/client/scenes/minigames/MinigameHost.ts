// Minigame launcher (pause City / hide Hud / launch scene / deliver result) + the shell every minigame scene shares
// (spec 7.0): dark backdrop, 820×460 panel, title, progress/score line, key hint, 300 ms input grace, timed feedback
// that a click/Enter/Space can skip, result panel with ★ and bonus, and a single `minigame:done` per session.
// The quiz-style base (4-choice / OX) sits on top of the shell.
import Phaser from 'phaser';
import type { MinigameKind, MinigameResult, MinigameSpec, QuizItem } from '../../../shared/types';
import { STAR_BONUS } from '../../../shared/constants';
import { minigamePool } from '../../../shared/content';
import { getMinigameLogic } from '../../../shared/logic/minigame/registry';
import type { MinigameLogic, QuizLikeLogic } from '../../../shared/logic/minigame/types';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { session } from '../../session';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { sfx } from '../../audio/sfx';
import { textStyle, THEME, titleStyle } from '../../ui/theme';

/** kind → scene key. Register new minigame scenes here (and their logic in shared/logic/minigame/registry.ts). */
export const MINIGAME_SCENE: Record<MinigameKind, string> = { quiz: 'Quiz', ox: 'Ox', match: 'Match', mapfind: 'MapFind', order: 'Order', blank: 'Blank' };
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

export const INPUT_GRACE_MS = 300;
export const FEEDBACK_MS = 1500;
/** A click that answered must not also skip the feedback it just opened (same pointerdown reaches the scene). */
const SKIP_GRACE_MS = 200;

export interface PanelRect { x: number; y: number; w: number; h: number }

type Key = Phaser.Input.Keyboard.Key;

/**
 * Shared minigame chrome. Subclasses build their widgets in `build()`, read keys in `pollKeys()` (only called while
 * input is allowed), talk to the logic only through `act` (via `this.logic`), and call `hold()` / `finish()`.
 */
export abstract class MinigameShellScene<S = unknown, A = unknown, L extends MinigameLogic<S, A> = MinigameLogic<S, A>> extends Phaser.Scene {
  protected spec!: MinigameSpec;
  protected logic!: L;
  protected state!: S;
  protected rect!: PanelRect;
  protected panel!: Panel;
  protected titleText!: Phaser.GameObjects.Text;
  protected progressText!: Phaser.GameObjects.Text;
  protected scoreText!: Phaser.GameObjects.Text;
  protected feedbackText!: Phaser.GameObjects.Text;
  protected hintLine!: Phaser.GameObjects.Text;
  protected shellKeys!: { enter: Key; space: Key };
  /** true while feedback / an animation runs: game input is ignored */
  protected busy = false;
  protected finished = false;
  private readyAt = 0;
  private emitted = false;
  private holdTimer: Phaser.Time.TimerEvent | null = null;
  private holdThen: (() => void) | null = null;
  private holdOpenedAt = 0;
  private resultPanel: Phaser.GameObjects.Container | null = null;

  constructor(key: string, protected readonly kind: MinigameKind) {
    super(key);
  }

  init(data: MinigameLaunchData): void {
    this.spec = data.spec;
    this.logic = getMinigameLogic(this.kind) as L;
    this.state = this.logic.create(this.spec, minigamePool(this.spec.cityId), data.seed) as S;
    this.busy = false;
    this.finished = false;
    this.emitted = false;
    this.holdTimer = null;
    this.holdThen = null;
    this.resultPanel = null;
  }

  create(): void {
    // the scene clock (`this.time.now`) only catches up at this scene's first update, so it is stale here (0 on the
    // first launch, the end of the previous session afterwards); anchor the grace to the game loop's clock instead
    this.readyAt = this.game.loop.time + INPUT_GRACE_MS;
    const r = (this.rect = this.panelRect());
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.panel = new Panel(this, r.x, r.y, { width: r.w, height: r.h });
    this.titleText = this.add.text(r.x + r.w / 2, r.y + 10, this.title(), titleStyle()).setOrigin(0.5, 0);
    this.progressText = this.add.text(r.x + 20, r.y + 16, '', textStyle({ size: 'small', color: THEME.textDim }));
    this.scoreText = this.add.text(r.x + r.w - 20, r.y + 16, '', textStyle({ size: 'small', color: THEME.successCss })).setOrigin(1, 0);
    this.feedbackText = this.add.text(r.x + r.w / 2, r.y + r.h - 42, '', textStyle({ wordWrap: { width: r.w - 60 }, align: 'center' })).setOrigin(0.5).setDepth(5);
    this.hintLine = this.add.text(r.x + r.w - 20, r.y + r.h - 6, this.hintText(), textStyle({ size: 'small', color: THEME.textDim })).setOrigin(1, 1);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.shellKeys = { enter: kb.addKey(K.ENTER), space: kb.addKey(K.SPACE) };
    this.input.on('pointerdown', () => this.skipHold(false));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.setDefaultCursor('default'));
    this.build();
    this.refreshStatus();
  }

  /** Panel position/size; MapFind overrides it to fit the 768×432 map. */
  protected panelRect(): PanelRect {
    return { x: (GAME_WIDTH - 820) / 2, y: (GAME_HEIGHT - 460) / 2, w: 820, h: 460 };
  }
  protected abstract title(): string;
  protected abstract hintText(): string;
  /** Create the game widgets (called once from create()). */
  protected abstract build(): void;
  /** Keyboard input; only called while `inputReady`. */
  protected abstract pollKeys(): void;
  /** Left / right status texts (e.g. "1 / 5", "정답 2"). */
  protected abstract status(): { progress: string; score: string };
  /** Result-panel line when the game was lost. */
  protected abstract failHint(result: MinigameResult): string;
  /** Result-panel headline. */
  protected headline(result: MinigameResult): string {
    return result.success ? `${result.correct} / ${result.total} 정답 · 성공!` : `${result.correct} / ${result.total} · 아쉬워요`;
  }

  protected get inputReady(): boolean {
    return this.time.now >= this.readyAt && !this.busy && !this.finished;
  }

  override update(): void {
    if (this.finished) return;
    const J = Phaser.Input.Keyboard.JustDown;
    if (this.busy) {
      if (this.holdTimer && (J(this.shellKeys.enter) || J(this.shellKeys.space))) this.skipHold(true);
      return;
    }
    if (this.inputReady) this.pollKeys();
  }

  protected refreshStatus(): void {
    const { progress, score } = this.status();
    this.progressText.setText(progress);
    this.scoreText.setText(score);
  }

  /** Update only the right-hand score while feedback for the answered question is still on screen. */
  protected setScore(): void {
    this.scoreText.setText(this.status().score);
  }

  protected setFeedback(text: string, tone: 'good' | 'bad' | 'info' = 'info'): void {
    const color = tone === 'good' ? THEME.successCss : tone === 'bad' ? THEME.dangerCss : THEME.text;
    this.feedbackText.setText(text).setColor(color);
  }

  // ------------------------------------------------------------ SFX hooks (spec 7.0)
  protected onCorrect(): void { sfx.correct(); }
  protected onWrong(): void { sfx.wrong(); }
  protected onClick(): void { sfx.click(); }
  protected onFlip(): void { sfx.flip(); }

  /** Block input for `ms`, then run `then`. A click (after a short grace), Enter or Space skips the wait. */
  protected hold(ms: number, then: () => void): void {
    this.consumeKeyEdges(); // the key that answered must not also skip the feedback it opened
    this.busy = true;
    this.holdThen = then;
    this.holdOpenedAt = this.time.now;
    this.holdTimer = this.time.delayedCall(ms, () => this.releaseHold());
  }

  private consumeKeyEdges(): void {
    Phaser.Input.Keyboard.JustDown(this.shellKeys.enter);
    Phaser.Input.Keyboard.JustDown(this.shellKeys.space);
  }

  private releaseHold(): void {
    const then = this.holdThen;
    this.holdTimer = null;
    this.holdThen = null;
    this.busy = false;
    if (!this.finished) then?.();
  }

  private skipHold(fromKey: boolean): void {
    if (!this.busy || !this.holdTimer || this.finished) return;
    if (!fromKey && this.time.now - this.holdOpenedAt < SKIP_GRACE_MS) return;
    this.holdTimer.remove(false);
    this.releaseHold();
  }

  /** Show the result panel (once). Enter / Space / [확인] then emit `minigame:done`. */
  protected finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.busy = false;
    this.holdTimer?.remove(false);
    this.holdTimer = null;
    const result = this.logic.result(this.state);
    this.onFinish();
    this.feedbackText.setText('');
    this.refreshStatus();

    const stars = result.success ? result.stars : undefined;
    const w = 460;
    const h = stars ? 250 : 210;
    const px = (GAME_WIDTH - w) / 2;
    const py = (GAME_HEIGHT - h) / 2;
    const panel = new Panel(this, px, py, { width: w, height: h, tint: result.success ? 0xc8f5cf : 0xffc4c4 });
    panel.setDepth(50);
    const parts: Phaser.GameObjects.GameObject[] = [];
    parts.push(this.add.text(w / 2, 36, this.headline(result), titleStyle({ color: result.success ? THEME.successCss : THEME.dangerCss, align: 'center', wordWrap: { width: w - 40 } })).setOrigin(0.5));
    let y = 78;
    if (stars) {
      const row = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      parts.push(this.add.text(w / 2, y + 6, row, textStyle({ size: 'big', color: THEME.accentCss })).setOrigin(0.5));
      parts.push(this.add.text(w / 2, y + 36, `별 ${stars}개 · 보너스 +${STAR_BONUS[stars]} 포인트`, textStyle({ size: 'small', color: THEME.accentCss })).setOrigin(0.5));
      y += 58;
    }
    const sub = result.success ? '미션 완료! 보상을 받았어요.' : this.failHint(result);
    parts.push(this.add.text(w / 2, y + 12, sub, textStyle({ size: 'small', color: THEME.textDim, align: 'center', wordWrap: { width: w - 40 } })).setOrigin(0.5));
    parts.push(new Button(this, w / 2 - 70, h - 58, '확인 (Enter)', { width: 140, height: 40, onClick: () => this.emitDone(result) }));
    panel.add(parts);
    this.resultPanel = panel;
    this.consumeKeyEdges();
    // key events (not JustDown polling): the press that answered was dispatched before these listeners existed, and
    // auto-repeat from a held key is ignored, so only a fresh Enter/Space closes the panel
    const onKey = (e: KeyboardEvent) => { if (!e.repeat) this.emitDone(result); };
    this.input.keyboard?.on('keydown-ENTER', onKey);
    this.input.keyboard?.on('keydown-SPACE', onKey);
  }

  /** Hide / disable game widgets when the result panel opens. */
  protected onFinish(): void {}

  private emitDone(result: MinigameResult): void {
    if (this.emitted) return;
    this.emitted = true;
    this.resultPanel?.destroy();
    this.game.events.emit(MINIGAME_DONE, result);
    this.scene.stop();
  }
}

/** Common quiz-style flow: question → answer → feedback → next → result panel. Subclasses build the answer widgets. */
export abstract class MinigameBaseScene extends MinigameShellScene<unknown, number | boolean, QuizLikeLogic<unknown>> {
  protected questionText!: Phaser.GameObjects.Text;
  protected answerArea!: Phaser.GameObjects.Container;

  protected build(): void {
    const px = this.rect.x;
    const py = this.rect.y;
    this.questionText = this.add.text(px + 30, py + 60, '', textStyle({ wordWrap: { width: 760 }, lineSpacing: 4 }));
    this.answerArea = this.add.container(px + 30, py + 140);
    this.showQuestion();
  }

  /** Build answer widgets for `item` into `this.answerArea`. */
  protected abstract buildAnswers(item: QuizItem): void;
  /** Colour the chosen / correct widgets after answering. */
  protected abstract showAnswerFeedback(choice: number | boolean, correct: boolean, item: QuizItem): void;

  protected status(): { progress: string; score: string } {
    const r = this.logic.result(this.state);
    const shown = Math.min(r.answeredIds.length + 1, Math.max(1, r.total));
    return { progress: `${shown} / ${r.total}`, score: `정답 ${r.correct}` };
  }

  protected failHint(): string {
    const pass = this.spec.kind === 'quiz' || this.spec.kind === 'ox' ? this.spec.passCount : 0;
    return `${pass}개 이상 맞히면 성공이에요. 표지판을 읽고 다시 도전해 봐요.`;
  }

  protected showQuestion(): void {
    const item = this.logic.current(this.state);
    if (!item) { this.finish(); return; }
    this.refreshStatus();
    this.questionText.setText(item.question);
    this.setFeedback('');
    this.answerArea.removeAll(true);
    this.buildAnswers(item);
  }

  protected choose(choice: number | boolean): void {
    if (!this.inputReady) return;
    const item = this.logic.current(this.state);
    if (!item) return;
    const fb = this.logic.act(this.state, choice);
    if (fb.correct) this.onCorrect(); else this.onWrong();
    this.showAnswerFeedback(choice, fb.correct, item);
    this.setScore();
    this.setFeedback(`${fb.correct ? '정답!' : '아쉬워요'} ${fb.explanation}`, fb.correct ? 'good' : 'bad');
    this.hold(FEEDBACK_MS, () => {
      if (this.logic.isDone(this.state)) this.finish();
      else this.showQuestion();
    });
  }

  protected override onFinish(): void {
    this.answerArea.removeAll(true);
  }
}
