// Title: 새로 시작 / 이어하기 / 진행 초기화 (spec 5). v0.2: Galmuri fonts, 9-slice buttons, BGM after first input.
import Phaser from 'phaser';
import { DEFAULT_NAME } from '../../shared/logic/progress';
import { TEX } from '../assets/manifest';
import { vendorSheets } from '../assets/vendorSheets';
import { bgm } from '../audio/bgm';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { session } from '../session';
import { Button } from '../ui/Button';
import { outlined, THEME } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.image(cx, GAME_HEIGHT / 2, TEX.worldmap).setAlpha(0.25);
    this.add.text(cx, 96, '세계 도시 여행', outlined({ size: 'big', color: THEME.accentCss, strokeThickness: 6 })).setOrigin(0.5);
    this.add.text(cx, 150, '2D 학습형 RPG v0.2 — 6대륙 6개 도시를 탐험하며 지형·기후·문화를 배워요', outlined({ size: 'small', color: THEME.textDim })).setOrigin(0.5);

    const hasSave = session.hasSave();
    let y = 220;
    const gap = 56;
    if (hasSave) {
      new Button(this, cx - 130, y, `이어하기 (${session.progress.profile.name})`, { width: 260, height: 44, onClick: () => this.continueGame() });
      y += gap;
    }
    new Button(this, cx - 130, y, '새로 시작', { width: 260, height: 44, onClick: () => this.newGame() });
    y += gap;
    if (hasSave) {
      new Button(this, cx - 130, y, '진행 초기화', { width: 260, height: 44, skin: 'danger', onClick: () => this.resetGame() });
      y += gap;
    }
    this.add.text(cx, GAME_HEIGHT - 58, '클릭하거나 키를 누르면 소리가 켜져요 · N 키로 음소거', outlined({ size: 'small', color: THEME.textDim })).setOrigin(0.5);
    this.add.text(cx, GAME_HEIGHT - 34, '방향키/WASD 이동 · E 대화/읽기 · F 공격 · 1~6 이모지 · Tab 미니맵 · M 세계지도 · Esc 닫기', outlined({ size: 'small', color: THEME.textDim })).setOrigin(0.5);
    if (!vendorSheets.complete) this.add.text(cx, 184, '에셋 미설치: 터미널에서 `npm run assets`를 실행하세요 (폴백 그림 사용 중)', outlined({ size: 'small', color: THEME.dangerCss })).setOrigin(0.5);

    bgm.play('world');
    const n = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    n.on('down', () => session.setMuted(!session.muted));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { n.destroy(); this.input.setDefaultCursor('default'); });
  }

  private newGame(): void {
    if (session.hasSave() && !window.confirm('저장된 진행이 있어요. 새로 시작하면 지워져요. 계속할까요?')) return;
    const raw = window.prompt('여행자 이름', DEFAULT_NAME);
    const name = raw === null || raw.trim() === '' ? DEFAULT_NAME : raw.trim();
    session.newGame(name);
    this.scene.start('WorldMap');
  }

  private continueGame(): void {
    this.scene.start('WorldMap');
  }

  private resetGame(): void {
    if (!window.confirm('정말 진행을 초기화할까요? 포인트·미션·아바타가 모두 지워져요.')) return;
    session.reset();
    this.scene.restart();
  }

}
