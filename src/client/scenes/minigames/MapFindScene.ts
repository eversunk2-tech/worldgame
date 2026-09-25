// Map-find scene (spec 7.2): the world-map texture at 0.8× (768×432, no labels or markers). Click the map, or steer
// the crosshair with the arrow keys (8 px, Shift 32 px) and press Enter/Space. After each answer: a green/red pin
// where you clicked plus the right answer (yellow pin + name, or the region area) for 1.5 s (click/Enter skips).
// The region area is exactly what the judge accepts: continent polygon ∩ land, or ocean polygon ∩ sea.
import Phaser from 'phaser';
import type { MinigameResult, RegionId } from '../../../shared/types';
import { CONTINENT_LABELS, OCEAN_LABELS } from '../../../shared/content/continents';
import { isContinentRegion, REGIONS } from '../../../shared/content/regions';
import { lonLatToXY, xyToLonLat } from '../../../shared/logic/geo';
import type { MapAnswer, MapFindAction, MapFindFeedback, MapFindLogic, MapFindState } from '../../../shared/logic/minigame/mapfind';
import { TEX } from '../../assets/manifest';
import { makeCanvas } from '../../assets/pixelArt';
import { getWorldLandMask } from '../../assets/worldMap';
import { GAME_WIDTH } from '../../config';
import { outlined, THEME } from '../../ui/theme';
import { FEEDBACK_MS, MinigameShellScene, type PanelRect } from './MinigameHost';

const MAP_SCALE = 0.8;
const MAP_W = 768;
const MAP_H = 432;
const STEP = 8;
const STEP_FAST = 32;

export class MapFindScene extends MinigameShellScene<MapFindState, MapFindAction, MapFindLogic> {
  private mapX = 0;
  private mapY = 0;
  private cross = { x: MAP_W / 2, y: MAP_H / 2 };
  private crossGfx!: Phaser.GameObjects.Graphics;
  private marks: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('MapFind', 'mapfind');
  }

  /** Taller panel: title/prompt row, the 768×432 map, feedback and hint rows. */
  protected override panelRect(): PanelRect {
    return { x: (GAME_WIDTH - 808) / 2, y: 2, w: 808, h: 536 };
  }

  protected title(): string {
    return '지도 위치 찾기';
  }

  protected hintText(): string {
    return '지도 클릭 · 또는 방향키(Shift 빠르게)로 십자선을 옮기고 Enter';
  }

  protected status(): { progress: string; score: string } {
    const s = this.state;
    const total = s.targets.length;
    return { progress: `${Math.min(s.index + 1, Math.max(1, total))} / ${total}`, score: `정답 ${s.correct}` };
  }

  protected failHint(): string {
    const pass = this.spec.kind === 'mapfind' ? this.spec.passCount : 0;
    return `${pass}곳 이상 찾으면 성공이에요. 세계지도에서 대륙과 바다 모양을 다시 살펴봐요.`;
  }

  protected override headline(result: MinigameResult): string {
    return result.success ? `${result.total}곳 중 ${result.correct}곳 찾기 · 성공!` : `${result.total}곳 중 ${result.correct}곳 · 아쉬워요`;
  }

  protected build(): void {
    const r = this.rect;
    this.mapX = r.x + (r.w - MAP_W) / 2;
    this.mapY = r.y + 44;
    this.marks = [];
    this.cross = { x: MAP_W / 2, y: MAP_H / 2 };
    // the feedback row sits between the map and the key hint
    this.feedbackText.setY(this.mapY + MAP_H + 26);

    const map = this.add.image(this.mapX, this.mapY, TEX.worldmap).setOrigin(0, 0).setScale(MAP_SCALE);
    map.setInteractive({ useHandCursor: true });
    map.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.inputReady) this.moveCrossTo(p.x - this.mapX, p.y - this.mapY); });
    map.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.button === 0) this.answerAt(p.x - this.mapX, p.y - this.mapY); });

    this.crossGfx = this.add.graphics().setDepth(3);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    for (const code of [K.LEFT, K.RIGHT, K.UP, K.DOWN]) kb.addKey(code); // capture arrows (no page scroll)
    // key events (not JustDown) so a held arrow key repeats smoothly
    const move = (dx: number, dy: number) => (e: KeyboardEvent) => {
      if (!this.inputReady) return;
      const k = e.shiftKey ? STEP_FAST : STEP;
      this.moveCrossTo(this.cross.x + dx * k, this.cross.y + dy * k);
    };
    kb.on('keydown-LEFT', move(-1, 0));
    kb.on('keydown-RIGHT', move(1, 0));
    kb.on('keydown-UP', move(0, -1));
    kb.on('keydown-DOWN', move(0, 1));
    this.showTarget();
  }

  protected pollKeys(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.shellKeys.enter) || J(this.shellKeys.space)) this.answerAt(this.cross.x, this.cross.y);
  }

  private showTarget(): void {
    const t = this.logic.current(this.state);
    if (!t) { this.finish(); return; }
    this.titleText.setText(t.prompt);
    this.setFeedback('');
    this.refreshStatus();
    this.drawCross();
  }

  private moveCrossTo(x: number, y: number): void {
    this.cross.x = Phaser.Math.Clamp(Math.round(x), 0, MAP_W - 1);
    this.cross.y = Phaser.Math.Clamp(Math.round(y), 0, MAP_H - 1);
    this.drawCross();
  }

  private drawCross(): void {
    const g = this.crossGfx;
    g.clear();
    if (this.busy || this.finished) return;
    const x = this.mapX + this.cross.x;
    const y = this.mapY + this.cross.y;
    for (const [w, c] of [[4, 0x000000], [2, 0xffffff]] as const) {
      g.lineStyle(w, c, 0.9);
      g.lineBetween(x - 14, y, x - 5, y); g.lineBetween(x + 5, y, x + 14, y);
      g.lineBetween(x, y - 14, x, y - 5); g.lineBetween(x, y + 5, x, y + 14);
      g.strokeCircle(x, y, 5);
    }
  }

  /** Mouse and keyboard both end here with a map-local point. */
  private answerAt(mx: number, my: number): void {
    if (!this.inputReady) return;
    if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return;
    const [lon, lat] = xyToLonLat(mx, my, MAP_W, MAP_H);
    const fb = this.logic.act(this.state, { lon, lat }) as MapFindFeedback;
    if (fb.outcome !== 'answered') return;
    if (fb.correct) this.onCorrect(); else this.onWrong();
    this.crossGfx.clear();
    if (fb.answer) this.showAnswer(fb.answer);
    this.addPin(this.mapX + mx, this.mapY + my, fb.correct ? THEME.success : THEME.danger);
    // wrong: "아쉬워요. [거기는 서울 근처예요. ]힌트: …" (the logic adds the near-city part)
    this.setFeedback(`${fb.correct ? '정답!' : '아쉬워요.'} ${fb.explanation}`, fb.correct ? 'good' : 'bad');
    this.setScore();
    this.hold(FEEDBACK_MS, () => {
      this.clearMarks();
      if (this.logic.isDone(this.state)) this.finish();
      else this.showTarget();
    });
  }

  private project(lon: number, lat: number): { x: number; y: number } {
    const p = lonLatToXY([lon, lat], MAP_W, MAP_H);
    return { x: this.mapX + p.x, y: this.mapY + p.y };
  }

  private showAnswer(answer: MapAnswer): void {
    if (answer.type === 'city') {
      const p = this.project(answer.lonLat[0], answer.lonLat[1]);
      this.marks.push(this.add.image(p.x, p.y, TEX.icon('pin')).setOrigin(0.5, 1).setDepth(4));
      this.marks.push(this.add.text(p.x, p.y - 34, answer.name, outlined({ size: 'bold', color: THEME.accentCss })).setOrigin(0.5, 1).setDepth(6));
      return;
    }
    // always yellow: a green area would vanish on green land (the click pin already shows right/wrong)
    const key = this.regionTexture(answer.regionId, THEME.accent);
    this.marks.push(this.add.image(this.mapX, this.mapY, key).setOrigin(0, 0).setDepth(2));
    const label = [...CONTINENT_LABELS, ...OCEAN_LABELS].find((l) => l.id === answer.regionId);
    if (label) {
      const p = this.project(label.lonLat[0], label.lonLat[1]);
      // above the click pin so the name stays readable when the click lands on the label spot
      this.marks.push(this.add.text(p.x, p.y, answer.name, outlined({ color: THEME.accentCss, strokeThickness: 4 })).setOrigin(0.5).setDepth(6));
    }
  }

  /**
   * 768×432 texture of the area the judge accepts for `regionId`: the polygon (drawn at 0 and ±360° so outlines
   * written past the date line show on both edges) kept only on land (continents) or only at sea (oceans) with the
   * world map's land mask, then a translucent fill and a 2px outline. Cached per region and colour.
   */
  private regionTexture(regionId: RegionId, color: number): string {
    const key = `mapfind:region:${regionId}:${color.toString(16)}`;
    if (this.textures.exists(key)) return key;
    const { canvas, ctx } = makeCanvas(MAP_W, MAP_H);
    const path = new Path2D();
    for (const dx of [-MAP_W, 0, MAP_W]) {
      REGIONS[regionId].forEach(([lon, lat], i) => {
        const p = lonLatToXY([lon, lat], MAP_W, MAP_H);
        if (i === 0) path.moveTo(p.x + dx, p.y); else path.lineTo(p.x + dx, p.y);
      });
      path.closePath();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fill(path);
    const land = getWorldLandMask();
    if (land) {
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = isContinentRegion(regionId) ? 'destination-in' : 'destination-out';
      ctx.drawImage(land, 0, 0, MAP_W, MAP_H);
      ctx.globalCompositeOperation = 'source-over';
    }
    const img = ctx.getImageData(0, 0, MAP_W, MAP_H);
    const d = img.data;
    const on = new Uint8Array(MAP_W * MAP_H);
    for (let i = 0; i < on.length; i++) on[i] = d[i * 4 + 3]! > 127 ? 1 : 0;
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    const off = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && on[y * MAP_W + x] === 0;
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const i = y * MAP_W + x;
        const o = i * 4;
        if (!on[i]) { d[o + 3] = 0; continue; }
        const edge = off(x - 1, y) || off(x + 1, y) || off(x, y - 1) || off(x, y + 1) || off(x - 2, y) || off(x + 2, y) || off(x, y - 2) || off(x, y + 2);
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = edge ? 255 : 96;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.textures.addCanvas(key, canvas);
    return key;
  }

  private addPin(x: number, y: number, color: number): void {
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x000000, 0.9).fillCircle(x, y, 8);
    g.fillStyle(color, 1).fillCircle(x, y, 6);
    g.fillStyle(0xffffff, 0.9).fillCircle(x - 2, y - 2, 1.5);
    this.marks.push(g);
  }

  private clearMarks(): void {
    for (const m of this.marks) m.destroy();
    this.marks = [];
  }

  protected override onFinish(): void {
    this.clearMarks();
    this.crossGfx.clear();
    this.titleText.setText(this.title());
    this.input.setDefaultCursor('default');
  }
}
