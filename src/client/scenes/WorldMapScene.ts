// World map hub: labels, city markers, tooltips, lock states, keyboard navigation (spec 5.8). v0.2: world-atlas
// texture, pixel pins, Galmuri labels, BGM, speaker button; Stage C: six playable cities (rule A unlock hint),
// position (북위/남위·동경/서경) and Seoul distance in every tooltip, ←/→ walk the markers west → east.
import Phaser from 'phaser';
import type { CityMarker } from '../../shared/types';
import { CITY_MARKERS, CONTINENT_LABELS, CONTINENT_NAMES, OCEAN_LABELS, distanceKm, getMarker, lonLatToXY } from '../../shared/content/continents';
import { cityState, unlockHint, type CityState } from '../../shared/logic/unlock';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { session } from '../session';
import { TEX } from '../assets/manifest';
import { bgm } from '../audio/bgm';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { josa, outlined, textStyle, THEME, titleStyle } from '../ui/theme';

const STATE_TEXT: Record<CityState, string> = { comingSoon: '준비 중', locked: '잠김', open: '입장 가능', stamped: '도장 획득' };

interface MarkerView { marker: CityMarker; container: Phaser.GameObjects.Container; icon: Phaser.GameObjects.Image; ring: Phaser.GameObjects.Graphics; x: number; y: number }

/** Markers closer than this (px) get pushed apart on screen; lon/lat data stays untouched. */
const MARKER_MIN_DIST = 34;

interface MarkerLayout { x: number; y: number; pushed: boolean }

/**
 * Screen positions for the markers: projected from lon/lat, then any comingSoon marker that sits within
 * MARKER_MIN_DIST of a playable one (or an earlier marker) is pushed straight away from it.
 */
export function layoutMarkers(markers: readonly CityMarker[]): MarkerLayout[] {
  const out: MarkerLayout[] = markers.map((m) => ({ ...lonLatToXY(m.lonLat), pushed: false }));
  for (let i = 0; i < markers.length; i++) {
    for (let j = 0; j < markers.length; j++) {
      if (i === j) continue;
      const a = out[i]!;
      const b = out[j]!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d >= MARKER_MIN_DIST) continue;
      const moveJ = markers[j]!.status === 'comingSoon' && markers[i]!.status === 'playable' ? true
        : markers[i]!.status === 'comingSoon' && markers[j]!.status === 'playable' ? false : j > i;
      const mover = moveJ ? b : a;
      const anchor = moveJ ? a : b;
      const dx = mover.x - anchor.x;
      const dy = mover.y - anchor.y;
      const len = Math.hypot(dx, dy) || 1;
      mover.x = anchor.x + (dx / len) * MARKER_MIN_DIST;
      mover.y = anchor.y + (dy / len) * MARKER_MIN_DIST;
      mover.pushed = true;
    }
  }
  return out;
}

export class WorldMapScene extends Phaser.Scene {
  private views: MarkerView[] = [];
  private selected = 0;
  private tooltip!: Panel;
  private tooltipText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private speaker!: Phaser.GameObjects.Image;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; enter: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key; n: Phaser.Input.Keyboard.Key };

  constructor() {
    super('WorldMap');
  }

  create(): void {
    this.add.image(0, 0, TEX.worldmap).setOrigin(0, 0);

    for (const l of OCEAN_LABELS) {
      const { x, y } = lonLatToXY(l.lonLat);
      this.add.text(x, y, l.name, textStyle({ size: 'small', color: '#bfe3ff' })).setOrigin(0.5).setAlpha(0.9);
    }
    for (const l of CONTINENT_LABELS) {
      const { x, y } = lonLatToXY(l.lonLat);
      this.add.text(x, y, l.name, outlined({ fontStyle: 'bold', strokeThickness: 4 })).setOrigin(0.5);
    }

    const layout = layoutMarkers(CITY_MARKERS);
    // ←/→ step through the markers in screen order (west → east) so the arrows follow the map
    this.views = CITY_MARKERS.map((marker, i) => this.createMarker(marker, layout[i]!)).sort((a, b) => a.x - b.x);
    const last = session.lastCity;
    this.selected = Math.max(0, this.views.findIndex((v) => v.marker.cityId === (last ?? 'seoul')));

    // tooltip
    this.tooltip = new Panel(this, 0, 0, { width: 300, height: 96 });
    this.tooltipText = this.add.text(10, 8, '', textStyle({ size: 'small', wordWrap: { width: 280 } }));
    this.tooltip.add(this.tooltipText);
    this.tooltip.setDepth(50).setVisible(false);

    // top-right profile + speaker
    const p = session.progress;
    this.add.text(GAME_WIDTH - 56, 12, `${p.profile.name} · ${session.rank}`, outlined({ size: 'bold' })).setOrigin(1, 0);
    this.add.image(GAME_WIDTH - 108, 44, TEX.icon('coin')).setScale(0.6);
    this.pointsText = this.add.text(GAME_WIDTH - 56, 36, `${p.points}`, outlined({ color: THEME.accentCss })).setOrigin(1, 0);
    this.speaker = this.add.image(GAME_WIDTH - 28, 22, TEX.icon(session.muted ? 'speakerOff' : 'speakerOn')).setInteractive({ useHandCursor: true });
    this.speaker.on('pointerdown', () => session.setMuted(!session.muted));
    this.add.text(16, 12, '세계지도', titleStyle({ stroke: '#000000', strokeThickness: 4 }));

    new Button(this, GAME_WIDTH - 176, GAME_HEIGHT - 56, '아바타 룸 (R)', { width: 160, height: 40, onClick: () => this.goRoom() });
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 18, `도시를 클릭하거나 ←/→ 로 고르고 Enter 로 입장 · ${this.guideText()}`, outlined({ size: 'small', color: THEME.textDim })).setOrigin(0.5);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), enter: kb.addKey(K.ENTER), r: kb.addKey(K.R), n: kb.addKey(K.N) };
    this.updateSelection();
    bgm.play('world');

    const onPoints = () => this.pointsText.setText(`${session.progress.points}`);
    const onSettings = (e: { muted: boolean }) => this.speaker.setTexture(TEX.icon(e.muted ? 'speakerOff' : 'speakerOn'));
    session.events.on('points.changed', onPoints);
    session.events.on('settings.changed', onSettings);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      session.events.off('points.changed', onPoints);
      session.events.off('settings.changed', onSettings);
      this.input.setDefaultCursor('default');
    });
  }

  override update(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.keys.left)) { this.selected = (this.selected + this.views.length - 1) % this.views.length; this.updateSelection(true); }
    if (J(this.keys.right)) { this.selected = (this.selected + 1) % this.views.length; this.updateSelection(true); }
    if (J(this.keys.enter)) this.tryEnter(this.views[this.selected]!);
    if (J(this.keys.r)) this.goRoom();
    if (J(this.keys.n)) session.setMuted(!session.muted);
  }

  private createMarker(marker: CityMarker, pos: MarkerLayout): MarkerView {
    const { x, y } = pos;
    const state = cityState(session.progress, marker);
    // playable markers sit above comingSoon ones so they win hover/click when close together
    const container = this.add.container(x, y).setDepth(marker.status === 'playable' ? 11 : 10);
    const ring = this.add.graphics();
    const icon = this.add.image(0, -2, this.iconFor(state)).setOrigin(0.5, 1);
    // pushed (crowded) markers carry their label above the pin so it does not cover the neighbour
    const labelY = pos.pushed ? -36 : 2;
    const label = this.add.text(0, labelY, marker.name, outlined({ size: 'bold', color: state === 'comingSoon' ? '#bbbbbb' : THEME.text })).setOrigin(0.5, pos.pushed ? 1 : 0);
    container.add([ring, icon, label]);
    // Hit area in container-local space is [-20,20]×[-36,20] (pin + label below) or [-20,20]×[-52,0] when the
    // label is above. Phaser adds displayOrigin (w/2, h/2) before testing, so the rectangle is offset by it.
    const w = 40;
    const h = 56;
    const top = pos.pushed ? -52 : -36;
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-20 + w / 2, top + h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    const view: MarkerView = { marker, container, icon, ring, x, y };
    container.on('pointerover', () => { this.showTooltip(view); this.input.setDefaultCursor('pointer'); });
    container.on('pointerout', () => { this.tooltip.setVisible(false); this.input.setDefaultCursor('default'); });
    container.on('pointerdown', () => {
      this.selected = this.views.indexOf(view);
      this.updateSelection();
      this.tryEnter(view);
    });
    return view;
  }

  private iconFor(state: CityState): string {
    switch (state) {
      case 'open': return TEX.icon('pin');
      case 'stamped': return TEX.icon('stamp');
      case 'locked': return TEX.icon('lock');
      default: return TEX.icon('pinGray');
    }
  }

  private updateSelection(showTip = false): void {
    this.views.forEach((v, i) => {
      v.ring.clear();
      if (i === this.selected) {
        v.ring.lineStyle(2, THEME.accent, 1);
        v.ring.strokeCircle(0, -18, 20);
      }
    });
    const v = this.views[this.selected];
    if (v && showTip) this.showTooltip(v);
  }

  /** Bottom guide line (spec 8.2): the unlock rule while cities are still locked, free travel afterwards. */
  private guideText(): string {
    const locked = CITY_MARKERS.some((m) => cityState(session.progress, m) === 'locked');
    return locked ? '서울 퀴즈 2개를 풀면 5개 도시가 모두 열려요' : '6대륙 6개 도시를 자유롭게 여행해요 (베이징·런던·나이로비는 준비 중)';
  }

  private tooltipLines(view: MarkerView): string {
    const m = view.marker;
    const state = cityState(session.progress, m);
    const lines = [`${m.name} (${m.country}) · ${CONTINENT_NAMES[m.continent]}`, `상태: ${STATE_TEXT[state]}`];
    // position as elementary social studies writes it — 북위/남위, 동경/서경, no negative numbers (review Stage C L6)
    const [lon, lat] = m.lonLat;
    lines.push(`${lat >= 0 ? '북위' : '남위'} ${Math.abs(lat).toFixed(1)}° · ${lon >= 0 ? '동경' : '서경'} ${Math.abs(lon).toFixed(1)}°`);
    if (m.cityId !== 'seoul') {
      // great-circle distance from Seoul, rounded to 10 km (spec 12.2-C: 카이로 약 8,490km …)
      const km = Math.round(distanceKm(getMarker('seoul').lonLat, m.lonLat) / 10) * 10;
      lines.push(`서울에서 약 ${km.toLocaleString()}km`);
    }
    if (state === 'locked') {
      lines.push(unlockHint(m));
    } else if (state === 'comingSoon') {
      lines.push('다음 업데이트에서 열려요');
    } else if (state === 'stamped') {
      lines.push('모든 미션 완료! 다시 들어가 몬스터를 잡거나 복습할 수 있어요');
    } else {
      lines.push('클릭 또는 Enter 로 입장');
    }
    return lines.join('\n');
  }

  private showTooltip(view: MarkerView): void {
    this.tooltipText.setText(this.tooltipLines(view));
    const h = this.tooltipText.height + 16;
    this.tooltip.redraw({ height: h });
    let tx = view.x + 16;
    let ty = view.y - h - 36;
    if (tx + 300 > GAME_WIDTH - 8) tx = view.x - 316;
    if (ty < 8) ty = view.y + 24;
    this.tooltip.setPosition(tx, ty).setVisible(true);
  }

  private tryEnter(view: MarkerView): void {
    const state = cityState(session.progress, view.marker);
    if (state === 'open' || state === 'stamped') {
      const events = session.dispatch({ type: 'city.enter', cityId: view.marker.cityId });
      // follow-up missions this entry opened (older saves) are announced by the City's HUD (Stage B review round 2)
      const newMissionIds = events.flatMap((e) => (e.type === 'mission.changed' && e.status === 'available' ? [e.missionId] : []));
      this.input.setDefaultCursor('default');
      this.scene.start('City', { cityId: view.marker.cityId, newMissionIds });
      return;
    }
    this.showTooltip(view);
    this.tweens.add({ targets: view.container, x: view.x + 4, duration: 50, yoyo: true, repeat: 3, onComplete: () => view.container.setX(view.x) });
    const msg = state === 'locked' ? `${view.marker.name}${josa(view.marker.name, '은', '는')} 아직 잠겨 있어요` : `${view.marker.name}${josa(view.marker.name, '은', '는')} 준비 중이에요`;
    const t = this.add.text(GAME_WIDTH / 2, 60, msg, outlined({ color: THEME.dangerCss, strokeThickness: 4 })).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, alpha: 0, delay: 1200, duration: 400, onComplete: () => t.destroy() });
  }

  private goRoom(): void {
    this.input.setDefaultCursor('default');
    this.scene.start('AvatarRoom');
  }
}
