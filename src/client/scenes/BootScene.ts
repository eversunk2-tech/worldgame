// Boot (spec 5.2, 11.1 A-4): loading bar → vendor sheets + manifest + fonts → atlases and code-generated textures →
// save restore → Title (or DebugAtlas with ?debug=atlas in dev).
import Phaser from 'phaser';
import { validateContent } from '../../shared/content';
import { TEX, VENDOR_MANIFEST_KEY, VENDOR_MANIFEST_URL, VENDOR_SHEETS, type SheetId } from '../assets/manifest';
import { vendorSheets, type VendorManifest } from '../assets/vendorSheets';
import { buildTileAtlases, registerFurnitureTextures } from '../assets/tileAtlas';
import { createUiTextures } from '../assets/uiSkin';
import { createEmoteTextures } from '../assets/emotes';
import { createMonsterTextures } from '../assets/monsterArt';
import { createLandmarkTextures } from '../assets/landmarks';
import { createWorldMapTexture } from '../assets/worldMap';
import { createWorldMapFallbackTexture } from '../assets/placeholders';
import { loadFonts } from '../assets/fonts';
import { session } from '../session';

const BAR_W = 360;
const BAR_H = 14;

export class BootScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  constructor() {
    super('Boot');
  }

  preload(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.graphics().fillStyle(0x2b2d4a, 1).fillRect(cx - BAR_W / 2 - 3, cy - BAR_H / 2 - 3, BAR_W + 6, BAR_H + 6).lineStyle(2, 0x8f9bff, 1).strokeRect(cx - BAR_W / 2 - 3, cy - BAR_H / 2 - 3, BAR_W + 6, BAR_H + 6);
    this.bar = this.add.graphics();
    this.label = this.add.text(cx, cy + 24, '에셋 불러오는 중…', { fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#b8bce0' }).setOrigin(0.5, 0);
    this.load.on(Phaser.Loader.Events.PROGRESS, (v: number) => this.setProgress(v * 0.6));
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => console.warn(`[boot] failed to load ${file.key} (${file.src}) — run: npm run assets`));

    this.load.json(VENDOR_MANIFEST_KEY, VENDOR_MANIFEST_URL);
    for (const id of Object.keys(VENDOR_SHEETS) as SheetId[]) this.load.image(TEX.sheet(id), VENDOR_SHEETS[id].png);
  }

  create(): void {
    void this.run();
  }

  private setProgress(v: number, text?: string): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.bar.clear().fillStyle(0xffd166, 1).fillRect(cx - BAR_W / 2, cy - BAR_H / 2, Math.round(BAR_W * Math.max(0, Math.min(1, v))), BAR_H);
    if (text) this.label.setText(text);
  }

  private async run(): Promise<void> {
    this.setProgress(0.6, '폰트 불러오는 중…');
    await loadFonts();
    if (!this.scene.isActive()) return;

    this.setProgress(0.7, '타일 아틀라스 만드는 중…');
    const manifest = (this.cache.json.get(VENDOR_MANIFEST_KEY) as VendorManifest | undefined) ?? null;
    vendorSheets.init(this, manifest);
    if (!vendorSheets.complete) console.warn('[boot] 에셋 미설치: 일부 시트가 없어 폴백 그림을 씁니다. `npm run assets`를 실행하세요.');

    // let the bar paint before the synchronous atlas work
    await new Promise((r) => window.setTimeout(r, 0));
    buildTileAtlases(this);
    createUiTextures(this);
    createEmoteTextures(this);
    createMonsterTextures(this);
    createLandmarkTextures(this);
    registerFurnitureTextures(this);
    this.setProgress(0.9, '세계지도 그리는 중…');
    try {
      createWorldMapTexture(this);
    } catch (err) {
      console.warn('[boot] world-atlas map failed, using the polygon fallback:', err);
      createWorldMapFallbackTexture(this);
    }

    const problems = validateContent();
    console.assert(problems.length === 0, '[content] validation problems:', problems);
    session.init();
    this.setProgress(1, '준비 완료');

    const debug = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug');
    this.scene.start(debug === 'atlas' ? 'DebugAtlas' : 'Title');
  }
}
