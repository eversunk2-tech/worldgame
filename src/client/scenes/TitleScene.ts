// Title: 새로 시작 / 이어하기 / 진행 초기화 (spec 5).
import Phaser from 'phaser';
import { DEFAULT_NAME } from '../../shared/logic/progress';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { session } from '../session';
import { Button } from '../ui/Button';
import { textStyle, THEME, titleStyle } from '../ui/theme';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.add.image(cx, GAME_HEIGHT / 2, 'worldmap').setAlpha(0.25);
    this.add.text(cx, 110, '세계 도시 여행', titleStyle({ fontSize: '48px', color: THEME.accentCss, stroke: '#000', strokeThickness: 6 })).setOrigin(0.5);
    this.add.text(cx, 165, '2D 학습형 RPG v0.1 — 6대륙의 도시를 탐험하며 지형·기후·문화를 배워요', textStyle({ color: THEME.textDim })).setOrigin(0.5);

    const hasSave = session.hasSave();
    let y = 250;
    const gap = 56;
    if (hasSave) {
      new Button(this, cx - 120, y, `이어하기 (${session.progress.profile.name})`, { width: 240, height: 44, onClick: () => this.continueGame() });
      y += gap;
    }
    new Button(this, cx - 120, y, '새로 시작', { width: 240, height: 44, onClick: () => this.newGame() });
    y += gap;
    if (hasSave) {
      new Button(this, cx - 120, y, '진행 초기화', { width: 240, height: 44, fill: 0x6b2b3a, hover: 0x8a3a4d, border: THEME.danger, onClick: () => this.resetGame() });
      y += gap;
    }
    this.add.text(cx, GAME_HEIGHT - 40, '방향키/WASD 이동 · E 대화/읽기 · F 공격 · M 세계지도 · Esc 닫기', textStyle({ fontSize: '14px', color: THEME.textDim })).setOrigin(0.5);
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
