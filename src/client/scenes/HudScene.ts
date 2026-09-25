// HUD overlay above City (spec 5.9, 6.3, 6.4): top bar (name/rank/coins/HP), city name + mission tracker + minimap,
// emote bar, speaker button, dialog / learn card, hint, log. Text objects update only on change.
import Phaser from 'phaser';
import type { CityId, EmoteId, LearnCard as LearnCardData, MinigameSpec } from '../../shared/types';
import { getCity, getMission, getMonster, getNpc } from '../../shared/content';
import { CONTINENT_NAMES, getMarker } from '../../shared/content/continents';
import { getItem } from '../../shared/content/items';
import { PLAYER_HP } from '../../shared/constants';
import type { ProgressEvent } from '../../shared/logic/reducer';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { session } from '../session';
import { storage } from '../storage';
import { TEX } from '../assets/manifest';
import { UI } from '../assets/uiSkin';
import { sfx } from '../audio/sfx';
import { vendorSheets } from '../assets/vendorSheets';
import { DialogBox } from '../ui/DialogBox';
import { EmoteBar } from '../ui/EmoteBar';
import { LearnCard } from '../ui/LearnCard';
import { Minimap } from '../ui/Minimap';
import { josa, outlined, textStyle, THEME } from '../ui/theme';

const LOG_MAX = 5;
const LOG_TTL = 5000;
const OPEN_GRACE_MS = 150;

interface LogLine { text: Phaser.GameObjects.Text; until: number }

/** Short goal for the mission tracker (spec 7, 8.3). */
export function minigameGoal(spec: MinigameSpec): string {
  switch (spec.kind) {
    case 'quiz':
    case 'ox': return `${spec.count}문제 중 ${spec.passCount}개`;
    case 'match': return `${spec.pairs}쌍 · ${spec.maxAttempts}번 안에`;
    case 'mapfind': return `${spec.count}곳 중 ${spec.passCount}곳`;
    case 'order': return spec.passCount >= spec.count ? `${spec.count}문제 모두` : `${spec.count}문제 중 ${spec.passCount}개`;
    case 'blank': return `${spec.count}문장 중 ${spec.passCount}개`;
  }
}

export class HudScene extends Phaser.Scene {
  private cityId!: CityId;
  private nameText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private missionText!: Phaser.GameObjects.Text;
  private missionBg!: Phaser.GameObjects.NineSlice;
  private savedText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private vignette!: Phaser.GameObjects.Graphics;
  private faintOverlay!: Phaser.GameObjects.Rectangle;
  private faintText!: Phaser.GameObjects.Text;
  private dialog!: DialogBox;
  private card!: LearnCard;
  private speaker!: Phaser.GameObjects.Image;
  minimap!: Minimap;
  private logs: LogLine[] = [];
  private lastHint = '';
  private lastPoints = -1;
  private lastMissionKey = ' ';
  private lastHp = -1;
  private lastFaint = '';
  /** city.unlocked names collected during one frame → one merged log line (spec 8.2) */
  private pendingUnlocks: string[] = [];
  private openedAt = 0;
  private savedUntil = 0;
  private warnedStorage = false;
  /** Monotonic ms clock driven by update(delta); unlike this.time.now it never goes stale across scene pause/resume. */
  private clock = 0;
  /**
   * Set by CityScene right after `scene.launch('Hud')`. `launch` runs init()/create() on the *next* frame, so this
   * field is deliberately NOT reset in init() (review Stage A #1) — the City that launched us owns the callback.
   */
  onEmote: ((id: EmoteId) => void) | null = null;
  private readonly onEvent = (e: ProgressEvent) => this.handleEvent(e);
  private readonly onSaved = () => { this.savedUntil = this.clock + 1000; this.savedText.setVisible(true); };
  private readonly onStorageFail = () => { if (!this.warnedStorage) { this.warnedStorage = true; this.log('저장 불가: 브라우저 저장소를 쓸 수 없어요', THEME.dangerCss); } };

  constructor() {
    super('Hud');
  }

  init(data: { cityId: CityId }): void {
    this.cityId = data.cityId;
    // The scene instance is reused across cities: reset every "last value" cache and transient state.
    this.logs = [];
    this.lastHint = '';
    this.lastPoints = -1;
    this.lastMissionKey = '\u0000';
    this.lastHp = -1;
    this.lastFaint = '';
    this.pendingUnlocks = [];
    this.openedAt = 0;
    this.savedUntil = 0;
    this.clock = 0;
  }

  create(): void {
    const city = getCity(this.cityId);

    // top-left bar: name · rank · coins · HP in one translucent panel
    this.add.nineslice(8, 8, UI.panel, undefined, 300, 52, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0).setAlpha(0.85);
    this.nameText = this.add.text(18, 14, '', textStyle({ size: 'bold' }));
    this.add.image(28, 44, TEX.icon('coin')).setScale(0.6);
    this.pointsText = this.add.text(40, 36, '', textStyle({ size: 'small', color: THEME.accentCss }));
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(176, 36, '', textStyle({ size: 'small' }));

    // top-right: city name, minimap, mission tracker, speaker
    this.add.text(GAME_WIDTH - 60, 14, `${city.name} · ${CONTINENT_NAMES[getMarker(this.cityId).continent]}`, outlined({ size: 'bold' })).setOrigin(1, 0);
    this.speaker = this.add.image(GAME_WIDTH - 28, 22, TEX.icon(session.muted ? 'speakerOff' : 'speakerOn')).setInteractive({ useHandCursor: true });
    this.speaker.on('pointerdown', () => session.setMuted(!session.muted));
    this.minimap = new Minimap(this, GAME_WIDTH - Minimap.width - 14, 40, city);
    this.missionBg = this.add.nineslice(GAME_WIDTH - 8, 40 + Minimap.height + 6, UI.tag, undefined, 40, 20, 4, 4, 4, 4).setOrigin(1, 0).setAlpha(0.85);
    this.missionText = this.add.text(GAME_WIDTH - 14, 40 + Minimap.height + 10, '', outlined({ size: 'small', align: 'right', color: '#ffe9a8' })).setOrigin(1, 0);
    this.savedText = this.add.text(GAME_WIDTH - 14, GAME_HEIGHT - 30, '저장됨', outlined({ size: 'small', color: THEME.successCss })).setOrigin(1, 0).setVisible(false);

    // bottom
    this.hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 132, '', outlined({ color: THEME.accentCss })).setOrigin(0.5);
    this.add.text(GAME_WIDTH - 14, GAME_HEIGHT - 12, '방향키 이동 · E 대화 · F 공격 · 1~6 이모지 · Tab 미니맵 · N 소리 · M 세계지도', outlined({ size: 'small', color: THEME.textDim })).setOrigin(1, 1);
    new EmoteBar(this, 10, GAME_HEIGHT - 48, (id) => this.onEmote?.(id));

    // overlays
    this.vignette = this.add.graphics().setDepth(90).setAlpha(0);
    this.vignette.lineStyle(24, 0xff0000, 0.6);
    this.vignette.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.faintOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setDepth(95).setVisible(false);
    this.faintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', outlined({ size: 'title' })).setOrigin(0.5).setDepth(96).setVisible(false);

    this.dialog = new DialogBox(this, (GAME_WIDTH - 640) / 2, GAME_HEIGHT - 126);
    this.dialog.setDepth(100);
    this.dialog.onClick = () => this.closeTopModal();
    this.card = new LearnCard(this, (GAME_WIDTH - 640) / 2, (GAME_HEIGHT - 360) / 2);
    this.card.setDepth(100);

    session.events.on('any', this.onEvent);
    session.events.on('storage.saved', this.onSaved);
    session.events.on('storage.unavailable', this.onStorageFail);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      session.events.off('any', this.onEvent);
      session.events.off('storage.saved', this.onSaved);
      session.events.off('storage.unavailable', this.onStorageFail);
      this.input.setDefaultCursor('default');
    });

    if (!storage.available) this.onStorageFail();
    if (!vendorSheets.complete) this.log('에셋 미설치: `npm run assets` 실행', THEME.dangerCss);
    this.refreshProfile();
    this.refreshPoints();
    this.refreshMissions();
    this.setHp(PLAYER_HP, PLAYER_HP);
  }

  override update(_time: number, delta: number): void {
    this.clock += Math.min(delta, 100);
    const time = this.clock;
    if (this.pendingUnlocks.length) this.flushUnlocks();
    if (this.savedUntil && time > this.savedUntil) { this.savedUntil = 0; this.savedText.setVisible(false); }
    for (let i = this.logs.length - 1; i >= 0; i--) {
      const l = this.logs[i]!;
      if (time > l.until) { l.text.destroy(); this.logs.splice(i, 1); }
      else if (l.until - time < 800) l.text.setAlpha((l.until - time) / 800);
    }
    if (this.logs.length) this.layoutLogs();
  }

  // ------------------------------------------------------------ public API for CityScene

  isModalOpen(): boolean {
    return this.dialog.visible || this.card.visible;
  }

  isCardOpen(): boolean {
    return this.card.visible;
  }

  /** True once the brief grace after opening has passed (so the key that opened a modal cannot close it). */
  modalGraceOver(): boolean {
    return this.clock - this.openedAt > OPEN_GRACE_MS;
  }

  /** Close the card if open, else the dialog. Respects the grace window. Returns true if something closed. */
  closeTopModal(): boolean {
    if (!this.modalGraceOver()) return false;
    if (this.card.visible) { this.card.close(); return true; }
    if (this.dialog.visible) { this.dialog.close(); return true; }
    return false;
  }

  cardTab(delta: number): void {
    if (this.card.visible) this.card.nextTab(delta);
  }

  /** Learn-card tab by index (keys 1/2/3 while the card is open). */
  selectCardTab(i: number): void {
    if (this.card.visible) this.card.select(i);
  }

  toggleMinimap(): boolean {
    return this.minimap.toggle();
  }

  setHint(text: string): void {
    if (text === this.lastHint) return;
    this.lastHint = text;
    this.hintText.setText(text);
  }

  setHp(hp: number, max: number): void {
    if (hp === this.lastHp) return;
    this.lastHp = hp;
    const ratio = Math.max(0, Math.min(1, hp / max));
    const g = this.hpBar;
    g.clear();
    g.fillStyle(0x000000, 0.6).fillRect(112, 38, 60, 12);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(new Phaser.Display.Color(255, 107, 107), new Phaser.Display.Color(107, 215, 123), 100, Math.round(ratio * 100));
    g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1).fillRect(114, 40, 56 * ratio, 8);
    this.hpText.setText(`HP ${Math.ceil(hp)}/${max}`);
  }

  showDialog(name: string, text: string, onClose?: () => void): void {
    this.openedAt = this.clock;
    this.dialog.show(name, text, onClose);
  }

  /** Show the learn card overlay; `onView` fires for each tab shown (dispatch card.read there). */
  showCard(cards: LearnCardData[], topic: string, onView: (card: LearnCardData) => void, onClose?: () => void): void {
    this.openedAt = this.clock;
    this.card.onView = onView;
    this.card.show(cards, topic, onClose);
  }

  closeModals(): void {
    this.dialog.close();
    this.card.close();
  }

  flashDamage(): void {
    this.vignette.setAlpha(1);
    this.tweens.add({ targets: this.vignette, alpha: 0, duration: 200 });
  }

  showFaint(seconds: number): void {
    const text = `어지러워… ${Math.ceil(Math.max(0, seconds))}초 후 입구에서 다시 시작`;
    if (text !== this.lastFaint) { this.lastFaint = text; this.faintText.setText(text); }
    if (!this.faintOverlay.visible) { this.faintOverlay.setVisible(true); this.faintText.setVisible(true); }
  }

  hideFaint(): void {
    this.lastFaint = '';
    this.faintOverlay.setVisible(false);
    this.faintText.setVisible(false);
  }

  log(text: string, color: string = THEME.text): void {
    const t = this.add.text(14, 0, text, outlined({ size: 'small', color })).setDepth(80);
    this.logs.push({ text: t, until: this.clock + LOG_TTL });
    while (this.logs.length > LOG_MAX) this.logs.shift()!.text.destroy();
    this.layoutLogs();
  }

  /** One line for every city opened in the same frame: "파리·카이로·뉴욕·시드니·리우데자네이루가 열렸어요!" */
  private flushUnlocks(): void {
    const names = this.pendingUnlocks;
    this.pendingUnlocks = [];
    const last = names[names.length - 1]!;
    this.log(`${names.join('·')}${josa(last, '이', '가')} 열렸어요!`, THEME.accentCss);
    sfx.unlock();
  }

  private layoutLogs(): void {
    // logs sit above the dialog box and the emote bar so mission/point messages stay readable while an NPC talks
    const baseY = GAME_HEIGHT - 160;
    this.logs.forEach((l, i) => l.text.setY(baseY - (this.logs.length - 1 - i) * 18));
  }

  // ------------------------------------------------------------ progress → HUD

  refreshProfile(): void {
    const p = session.progress;
    this.nameText.setText(`${p.profile.name} · ${session.rank}`);
  }

  refreshPoints(): void {
    const pts = session.progress.points;
    if (pts === this.lastPoints) return;
    this.lastPoints = pts;
    this.pointsText.setText(`${pts} P`);
  }

  refreshMissions(): void {
    const city = getCity(this.cityId);
    const p = session.progress;
    let key = '';
    const lines: string[] = [];
    for (const m of city.missions) {
      const prog = p.missions[m.id];
      if (!prog || (prog.status !== 'active' && prog.status !== 'completed')) continue;
      key += `${m.id}:${prog.status}:${prog.count}:${prog.attempts};`;
      const giver = getNpc(this.cityId, m.giverNpcId)?.name ?? '';
      if (prog.status === 'completed') lines.push(`${m.title}: 완료 — ${giver}에게 보고`);
      else if (m.objective.type === 'defeat') lines.push(`${getMonster(m.objective.monsterId).name} 처치 ${prog.count}/${m.objective.count}`);
      else lines.push(`${m.title}: ${giver}에게 ${prog.attempts > 0 ? '다시 ' : ''}도전 (${minigameGoal(m.objective.spec)})`);
    }
    if (key === this.lastMissionKey) return;
    this.lastMissionKey = key;
    this.missionText.setText(lines.length ? ['미션', ...lines].join('\n') : '진행 중인 미션 없음');
    this.missionBg.setSize(Math.ceil(this.missionText.width) + 12, Math.ceil(this.missionText.height) + 8);
  }

  private handleEvent(e: ProgressEvent): void {
    switch (e.type) {
      case 'points.changed': {
        this.refreshPoints();
        if (e.delta > 0) sfx.coin();
        if (e.delta > 0 && e.reason.startsWith('defeat:')) this.log(`+${e.delta} 포인트 (${getMonster(e.reason.slice(7)).name})`, THEME.accentCss);
        else if (e.delta > 0 && e.reason.startsWith('card:')) this.log(`+${e.delta} 포인트 (학습 카드)`, THEME.accentCss);
        else if (e.delta > 0 && e.reason.startsWith('stars:')) {
          const stars = Math.max(1, Math.min(3, Number(e.reason.split(':')[2]) || 1));
          this.log(`${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} 별점 보너스 +${e.delta} 포인트`, THEME.accentCss);
        }
        else if (e.delta < 0) this.log(`${e.delta} 포인트`, THEME.textDim);
        break;
      }
      case 'mission.changed': {
        const m = getMission(e.missionId);
        if (!m) break;
        if (e.status === 'turnedIn') this.log(`미션 완료: ${m.title} +${m.rewardPoints} 포인트`, THEME.successCss);
        else if (e.status === 'completed') this.log(`목표 달성: ${m.title} — 보고하러 가요`, THEME.successCss);
        else if (e.status === 'active' && e.count === 0 && session.progress.missions[m.id]?.attempts === 0) this.log(`미션 수락: ${m.title}`);
        else if (e.status === 'available') this.log(`새 미션: ${m.title}`);
        this.refreshMissions();
        break;
      }
      case 'city.unlocked': this.pendingUnlocks.push(getMarker(e.cityId).name); break;
      case 'city.stamped': this.log(`${getMarker(e.cityId).name} 도장 획득!`, THEME.accentCss); sfx.stamp(); break;
      case 'item.bought': { const it = getItem(e.itemId); if (it?.unlockStamp) this.log(`기념품 획득: ${it.name}`, THEME.accentCss); break; }
      case 'rank.changed': this.log(`등급 상승: ${e.rank}`, THEME.accentCss); this.refreshProfile(); break;
      case 'profile.changed': this.refreshProfile(); break;
      case 'settings.changed': this.speaker.setTexture(TEX.icon(e.muted ? 'speakerOff' : 'speakerOn')); break;
      case 'rejected': this.log(e.reason, THEME.dangerCss); break;
      default: break;
    }
  }
}
