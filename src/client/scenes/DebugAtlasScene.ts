// Dev-only atlas inspector (spec 3.5 #2): `?debug=atlas` shows every semantic tile, building variant, room cell,
// character part, monster, landmark, emote and icon with its name. Missing mappings are pink with a red label.
import Phaser from 'phaser';
import { ALL_MONSTERS } from '../../shared/content/monsters';
import { PLAYABLE_CITIES } from '../../shared/content';
import { CHAR_PARTS } from '../assets/charAtlas';
import { partIconKey, textureKeyFor } from '../assets/avatarCompositor';
import { EMOTE_IDS } from '../assets/emotes';
import { TEX } from '../assets/manifest';
import { atlases } from '../assets/tileAtlas';
import { UI } from '../assets/uiSkin';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { textStyle, THEME } from '../ui/theme';

interface Item { label: string; key: string; frame?: string | number; missing?: boolean; scale?: number }
interface Page { title: string; items: Item[] }

const COLS = 14;
const CELL_W = 66;
const CELL_H = 74;
const TOP = 52;

export class DebugAtlasScene extends Phaser.Scene {
  private pages: Page[] = [];
  private page = 0;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private title!: Phaser.GameObjects.Text;
  private keys!: { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; esc: Phaser.Input.Keyboard.Key };

  constructor() {
    super('DebugAtlas');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x1b1b2f);
    this.pages = this.buildPages();
    this.title = this.add.text(16, 12, '', textStyle({ fontStyle: 'bold' }));
    this.add.text(GAME_WIDTH - 16, 12, '←/→ 페이지 · Esc 타이틀', textStyle({ color: THEME.textDim })).setOrigin(1, 0);
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = { left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), esc: kb.addKey(K.ESC) };
    this.showPage(0);
  }

  override update(): void {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.keys.left)) this.showPage((this.page + this.pages.length - 1) % this.pages.length);
    if (J(this.keys.right)) this.showPage((this.page + 1) % this.pages.length);
    if (J(this.keys.esc)) this.scene.start('Title');
  }

  private buildPages(): Page[] {
    const pages: Page[] = [];
    const tiles = atlases.tiles;
    const room = atlases.room;
    const perPage = COLS * Math.floor((GAME_HEIGHT - TOP - 8) / CELL_H);
    const chunk = (title: string, items: Item[]) => {
      for (let i = 0; i < items.length; i += perPage) pages.push({ title: `${title} (${i / perPage + 1}/${Math.ceil(items.length / perPage)})`, items: items.slice(i, i + perPage) });
    };
    if (tiles) {
      const base = tiles.names.filter((n) => !n.includes('@'));
      chunk('타일', base.map((n) => ({ label: n, key: tiles.key, frame: n, missing: tiles.missing.includes(n) })));
      const variants = tiles.names.filter((n) => n.includes('@'));
      chunk('건물 변주', variants.map((n) => ({ label: n.replace('bld_', ''), key: tiles.key, frame: n, missing: tiles.missing.includes(n) })));
    }
    if (room) chunk('실내(3배)', room.names.map((n) => ({ label: n, key: room.key, frame: n, missing: room.missing.includes(n), scale: 1 })));
    chunk('캐릭터 파츠', Object.keys(CHAR_PARTS).map((id) => ({ label: id, key: partIconKey(this, id) })));
    const avatarKey = textureKeyFor(this, { body: 'body_light', hair: 'hair_short_black', top: 'top_tshirt_blue', hat: 'hat_cap_red' });
    const avatar2 = textureKeyFor(this, { body: 'body_tan', hair: 'hair_long_brown', top: 'top_hanbok', hat: 'hat_gat' });
    const frames: Item[] = [];
    for (const [key, name] of [[avatarKey, 'A'], [avatar2, 'B']] as const) for (let f = 0; f < 12; f++) frames.push({ label: `${name} f${f}`, key, frame: f });
    chunk('아바타 프레임(3열×4행)', frames);
    const monsters: Item[] = [];
    for (const m of ALL_MONSTERS) for (const f of [1, 0, 4, 7, 10]) monsters.push({ label: `${m.id} ${f}`, key: TEX.monster(m.id), frame: f });
    chunk('몬스터', monsters);
    const lms = new Map<string, Item>();
    for (const c of PLAYABLE_CITIES) for (const lm of c.landmarks) lms.set(lm.kind, { label: lm.kind, key: TEX.landmark(lm.kind), scale: 0.5 });
    chunk('랜드마크(0.5배)', [...lms.values()]);
    const misc: Item[] = [
      ...EMOTE_IDS.map((id) => ({ label: `emote ${id}`, key: TEX.emote(id) })),
      ...['coin', 'lock', 'pin', 'pinGray', 'stamp', 'heart', 'speakerOn', 'speakerOff', 'map'].map((n) => ({ label: `icon ${n}`, key: TEX.icon(n) })),
      { label: 'sign', key: TEX.sign }, { label: 'shadow', key: TEX.shadow },
      { label: 'ui panel', key: UI.panel }, { label: 'ui btn', key: UI.btn }, { label: 'ui bubble', key: UI.bubble }, { label: 'ui tag', key: UI.tag },
    ];
    chunk('이모지·아이콘·UI', misc);
    return pages;
  }

  private showPage(i: number): void {
    this.page = i;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    const page = this.pages[i];
    if (!page) return;
    this.title.setText(`DebugAtlas — ${page.title}  [${i + 1}/${this.pages.length}]`);
    page.items.forEach((item, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = 16 + col * CELL_W + CELL_W / 2;
      const y = TOP + row * CELL_H + 24;
      const bg = this.add.rectangle(x, y, 52, 52, item.missing ? 0xff00ff : 0x2b2d4a, item.missing ? 0.6 : 1).setStrokeStyle(1, 0x8f9bff, 0.5);
      this.objects.push(bg);
      if (this.textures.exists(item.key)) {
        const img = this.add.image(x, y, item.key, item.frame);
        const s = item.scale ?? Math.min(1, 48 / Math.max(img.width, img.height));
        img.setScale(s);
        this.objects.push(img);
      }
      const short = item.label.replace(/^road_/, 'r_').replace(/^water_/, 'w_').replace(/^bld_/, '').replace(/^icon /, '');
      const label = this.add.text(x, y + 28, short.length > 20 ? `${short.slice(0, 19)}…` : short, textStyle({ size: 'small', color: item.missing ? THEME.dangerCss : THEME.textDim, wordWrap: { width: CELL_W - 2, useAdvancedWrap: true }, align: 'center' })).setOrigin(0.5, 0);
      this.objects.push(label);
    });
  }
}
