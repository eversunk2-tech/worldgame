// Avatar room: profile, preview, shop (skin/hair/top/hat/furniture), 8×6 furniture grid (spec 5.10). v0.2: Indoors
// atlas floor/wall, 3× furniture textures, 6× preview, part icons on shop cards, room BGM, speaker button; Stage C:
// shop pages (◀ ▶) once a tab has more cards than fit, and a skin tab so the new body_dark can be worn (spec 8.4).
import Phaser from 'phaser';
import type { ItemDef, ItemSlot } from '../../shared/types';
import { ROOM_COLS, ROOM_ROWS } from '../../shared/constants';
import { getMarker } from '../../shared/content/continents';
import { getItem, itemsForSlot } from '../../shared/content/items';
import { canPlace, footprint } from '../../shared/logic/inventory';
import type { ProgressEvent } from '../../shared/logic/reducer';
import { animKey, partIconKey, textureKeyFor } from '../assets/avatarCompositor';
import { TEX } from '../assets/manifest';
import { atlases } from '../assets/tileAtlas';
import { UI } from '../assets/uiSkin';
import { bgm } from '../audio/bgm';
import { GAME_HEIGHT } from '../config';
import { session } from '../session';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { textStyle, THEME } from '../ui/theme';

const CELL = 48;
const ROOM_X = 308;
const ROOM_Y = 12;
const GRID_X = ROOM_X + 16;      // 324
const GRID_Y = ROOM_Y + 22 + CELL; // wall band (1 row) sits above the grid
const GRID_W = ROOM_COLS * CELL; // 384
const GRID_H = ROOM_ROWS * CELL; // 288
const ROOM_H = 22 + CELL + GRID_H + 12;
const SHOP_X = ROOM_X;
const SHOP_Y = ROOM_Y + ROOM_H + 6;
const CARD_W = 150;
const CARD_H = 46; // room for a two-line item name above the status line (review Stage C L8)
const CARD_GAP = 4;
const CARD_COLS = 4;
/** The shop panel below the room holds two card rows → 8 cards per page (spec 8.4 page buttons ◀ ▶). */
const CARD_ROWS = 2;
const PAGE_SIZE = CARD_COLS * CARD_ROWS;
const TAB_W = 84;
const TABS: { slot: ItemSlot; name: string }[] = [
  { slot: 'body', name: '피부' }, { slot: 'hair', name: '머리' }, { slot: 'top', name: '옷' }, { slot: 'hat', name: '모자' }, { slot: 'furniture', name: '가구' },
];

export class AvatarRoomScene extends Phaser.Scene {
  private tab: ItemSlot = 'hair';
  private page = 0;
  private tabButtons: Button[] = [];
  private prevBtn!: Button;
  private nextBtn!: Button;
  private pageText!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Container[] = [];
  private placed: Phaser.GameObjects.Image[] = [];
  private preview!: Phaser.GameObjects.Sprite;
  private previewWalking = false;
  private nameText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private stampText!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private speaker!: Phaser.GameObjects.Image;
  private messageUntil = 0;
  private placing: { item: ItemDef; ghost: Phaser.GameObjects.Image } | null = null;
  private keys!: { esc: Phaser.Input.Keyboard.Key; n: Phaser.Input.Keyboard.Key };
  private readonly onProgress = (e: ProgressEvent) => this.handleEvent(e);

  constructor() {
    super('AvatarRoom');
  }

  create(): void {
    this.placing = null;
    this.cards = [];
    this.placed = [];
    this.tabButtons = [];

    // --- profile panel
    const prof = new Panel(this, 12, 12, { width: 280, height: GAME_HEIGHT - 24, title: '프로필' });
    this.nameText = this.add.text(140, 46, '', textStyle({ size: 'title', color: THEME.accentCss })).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this.nameText.on('pointerdown', () => this.renameProfile());
    this.rankText = this.add.text(140, 78, '', textStyle({ size: 'small', color: THEME.textDim })).setOrigin(0.5, 0);
    const coin = this.add.image(104, 110, TEX.icon('coin')).setScale(0.7);
    this.pointsText = this.add.text(122, 100, '', textStyle({ color: THEME.accentCss }));
    this.stampText = this.add.text(140, 130, '', textStyle({ size: 'small', align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5, 0);
    prof.add([this.nameText, this.rankText, coin, this.pointsText, this.stampText]);

    const pvBg = this.add.nineslice(76, 182, UI.panelLight, undefined, 128, 150, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0);
    prof.add(pvBg);
    // 16px composite frames drawn at 6× (3× the 2× sheet) — integer multiple, crisp (spec 5.10)
    this.preview = this.add.sprite(140, 258, textureKeyFor(this, session.progress.avatar), 1).setScale(3);
    prof.add(this.preview);
    const walkBtn = new Button(this, 90, 340, '걷기 애니 켜기', { width: 100, height: 30, size: 'small', onClick: () => this.togglePreview(walkBtn) });
    prof.add(walkBtn);
    prof.add(this.add.text(140, 380, '이름을 클릭하면 바꿀 수 있어요', textStyle({ size: 'small', color: THEME.textDim })).setOrigin(0.5, 0));
    prof.add(new Button(this, 40, GAME_HEIGHT - 24 - 60, '세계지도로 (Esc)', { width: 200, height: 40, onClick: () => this.leave() }));

    // --- room panel: title above the wall band (v0.1 review low #10: no overlap with the wall)
    new Panel(this, ROOM_X, ROOM_Y, { width: 640, height: ROOM_H });
    this.add.text(ROOM_X + 16, ROOM_Y + 5, '아바타 룸 — 가구를 클릭하면 회수해요', textStyle({ size: 'bold', color: THEME.textDim }));
    this.speaker = this.add.image(ROOM_X + 640 - 22, ROOM_Y + 12, TEX.icon(session.muted ? 'speakerOff' : 'speakerOn')).setScale(0.75).setInteractive({ useHandCursor: true });
    this.speaker.on('pointerdown', () => session.setMuted(!session.muted));
    this.drawRoom();
    const gridZone = this.add.zone(GRID_X, GRID_Y, GRID_W, GRID_H).setOrigin(0, 0).setInteractive();
    gridZone.on('pointermove', (p: Phaser.Input.Pointer) => this.onGridMove(p));
    gridZone.on('pointerdown', (p: Phaser.Input.Pointer) => this.onGridClick(p));

    // --- shop panel
    new Panel(this, SHOP_X, SHOP_Y, { width: 640, height: GAME_HEIGHT - SHOP_Y - 12 });
    TABS.forEach((t, i) => {
      const b = new Button(this, SHOP_X + 12 + i * (TAB_W + 6), SHOP_Y + 8, t.name, { width: TAB_W, height: 28, size: 'small', onClick: () => this.selectTab(t.slot) });
      this.tabButtons.push(b);
    });
    this.prevBtn = new Button(this, SHOP_X + 532, SHOP_Y + 8, '◀', { width: 32, height: 28, size: 'small', onClick: () => this.turnPage(-1) });
    this.nextBtn = new Button(this, SHOP_X + 596, SHOP_Y + 8, '▶', { width: 32, height: 28, size: 'small', onClick: () => this.turnPage(1) });
    this.pageText = this.add.text(SHOP_X + 580, SHOP_Y + 22, '', textStyle({ size: 'small', color: THEME.textDim })).setOrigin(0.5);
    // notices sit in the free space of the profile panel under the preview, never under the shop cards (review Stage C L7)
    this.message = this.add.text(152, 414, '', textStyle({ size: 'small', color: THEME.dangerCss, align: 'center', wordWrap: { width: 250, useAdvancedWrap: true } }))
      .setOrigin(0.5, 0).setDepth(20);

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = { esc: this.input.keyboard!.addKey(K.ESC), n: this.input.keyboard!.addKey(K.N) };
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown()) this.cancelPlacing(); });

    bgm.play('room');
    session.events.on('any', this.onProgress);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      session.events.off('any', this.onProgress);
      this.input.setDefaultCursor('default');
      session.flush();
    });

    this.refreshProfile();
    this.refreshRoom();
    this.selectTab('hair');
  }

  override update(time: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
      if (this.placing) this.cancelPlacing();
      else this.leave();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.n)) session.setMuted(!session.muted);
    if (this.messageUntil && time > this.messageUntil) { this.messageUntil = 0; this.message.setText(''); }
  }

  // ------------------------------------------------------------ profile

  private refreshProfile(): void {
    const p = session.progress;
    this.nameText.setText(`${p.profile.name} ✎`);
    this.rankText.setText(session.rank);
    this.pointsText.setText(`${p.points}`);
    const stamps = p.stamps.length ? p.stamps.map((c) => `${getMarker(c).name} 도장`).join(' · ') : '아직 도장이 없어요';
    this.stampText.setText(`도장: ${stamps}`);
  }

  private renameProfile(): void {
    const raw = window.prompt('새 이름 (1~12자)', session.progress.profile.name);
    if (raw === null) return;
    const ev = session.dispatch({ type: 'profile.setName', name: raw });
    const rej = ev.find((e) => e.type === 'rejected');
    if (rej && rej.type === 'rejected') this.showMessage(rej.reason);
  }

  private togglePreview(btn: Button): void {
    this.previewWalking = !this.previewWalking;
    btn.setText(this.previewWalking ? '걷기 애니 끄기' : '걷기 애니 켜기');
    this.playPreview();
  }

  private playPreview(): void {
    const key = textureKeyFor(this, session.progress.avatar);
    if (this.preview.texture.key !== key) this.preview.setTexture(key, 1);
    this.preview.play(animKey(key, this.previewWalking ? 'walk' : 'idle', 'down'), true);
  }

  // ------------------------------------------------------------ room

  private drawRoom(): void {
    const room = atlases.room;
    const frame = (name: string) => (room && room.has(name) ? name : undefined);
    // wall band (one row above the floor), alternating wainscot halves
    for (let gx = 0; gx < ROOM_COLS; gx++) {
      const f = frame(gx % 2 === 0 ? 'wall_top_a' : 'wall_top_b');
      if (room && f) this.add.image(GRID_X + gx * CELL, GRID_Y - CELL, room.key, f).setOrigin(0, 0);
      else this.add.rectangle(GRID_X + gx * CELL, GRID_Y - CELL, CELL, CELL, 0x6d5a8a, 1).setOrigin(0, 0);
    }
    for (let gy = 0; gy < ROOM_ROWS; gy++) {
      for (let gx = 0; gx < ROOM_COLS; gx++) {
        const f = frame('floor_wood');
        if (room && f) this.add.image(GRID_X + gx * CELL, GRID_Y + gy * CELL, room.key, f).setOrigin(0, 0);
        else this.add.rectangle(GRID_X + gx * CELL, GRID_Y + gy * CELL, CELL, CELL, (gx + gy) % 2 === 0 ? 0xc9a77a : 0xb8935f, 1).setOrigin(0, 0);
      }
    }
    const g = this.add.graphics();
    g.lineStyle(1, 0x000000, 0.12);
    for (let i = 0; i <= ROOM_COLS; i++) g.lineBetween(GRID_X + i * CELL, GRID_Y, GRID_X + i * CELL, GRID_Y + GRID_H);
    for (let i = 0; i <= ROOM_ROWS; i++) g.lineBetween(GRID_X, GRID_Y + i * CELL, GRID_X + GRID_W, GRID_Y + i * CELL);
  }

  private refreshRoom(): void {
    for (const img of this.placed) img.destroy();
    this.placed = [];
    for (const p of session.progress.room) {
      const item = getItem(p.itemId);
      if (!item) continue;
      const size = footprint(item);
      const img = this.add.image(GRID_X + p.gx * CELL, GRID_Y + p.gy * CELL, TEX.furniture(item.id)).setOrigin(0, 0).setDisplaySize(size.w * CELL, size.h * CELL).setDepth(2);
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonDown()) return;
        if (this.placing) { this.onGridClick(ptr); return; } // clicks over furniture still count as grid clicks while placing
        session.dispatch({ type: 'room.remove', itemId: item.id });
        this.showMessage(`${item.name} 회수`, THEME.textDim);
      });
      this.placed.push(img);
    }
  }

  private gridCell(p: Phaser.Input.Pointer): { gx: number; gy: number } {
    return { gx: Math.floor((p.x - GRID_X) / CELL), gy: Math.floor((p.y - GRID_Y) / CELL) };
  }

  private startPlacing(item: ItemDef): void {
    this.cancelPlacing();
    const size = footprint(item);
    const ghost = this.add.image(GRID_X, GRID_Y, TEX.furniture(item.id)).setOrigin(0, 0).setDisplaySize(size.w * CELL, size.h * CELL).setAlpha(0.6).setDepth(3);
    this.placing = { item, ghost };
    this.showMessage(`${item.name}: 격자를 클릭해 배치 · 우클릭/Esc 취소`, THEME.accentCss, 4000);
  }

  private cancelPlacing(): void {
    if (!this.placing) return;
    this.placing.ghost.destroy();
    this.placing = null;
  }

  private onGridMove(p: Phaser.Input.Pointer): void {
    if (!this.placing) return;
    const { gx, gy } = this.gridCell(p);
    const size = footprint(this.placing.item);
    const cx = Math.max(0, Math.min(ROOM_COLS - size.w, gx));
    const cy = Math.max(0, Math.min(ROOM_ROWS - size.h, gy));
    this.placing.ghost.setPosition(GRID_X + cx * CELL, GRID_Y + cy * CELL);
    const ok = canPlace(session.progress, this.placing.item, cx, cy).ok;
    this.placing.ghost.setTint(ok ? 0x9bffb0 : 0xff8080);
  }

  private onGridClick(p: Phaser.Input.Pointer): void {
    if (!this.placing || p.rightButtonDown()) return;
    const { gx, gy } = this.gridCell(p);
    const size = footprint(this.placing.item);
    const cx = Math.max(0, Math.min(ROOM_COLS - size.w, gx));
    const cy = Math.max(0, Math.min(ROOM_ROWS - size.h, gy));
    const item = this.placing.item;
    const ev = session.dispatch({ type: 'room.place', itemId: item.id, gx: cx, gy: cy });
    const rej = ev.find((e) => e.type === 'rejected');
    if (rej && rej.type === 'rejected') { this.showMessage(rej.reason); return; }
    this.cancelPlacing();
  }

  // ------------------------------------------------------------ shop

  private selectTab(slot: ItemSlot): void {
    this.tab = slot;
    this.page = 0;
    this.tabButtons.forEach((b, i) => b.setSelected(TABS[i]!.slot === slot));
    this.cancelPlacing();
    this.refreshShop();
  }

  private pageCount(): number {
    return Math.max(1, Math.ceil(itemsForSlot(this.tab).length / PAGE_SIZE));
  }

  private turnPage(delta: number): void {
    const n = this.pageCount();
    const next = Math.max(0, Math.min(n - 1, this.page + delta));
    if (next === this.page) return;
    this.page = next;
    this.cancelPlacing();
    this.refreshShop();
  }

  private refreshShop(): void {
    for (const c of this.cards) c.destroy();
    this.cards = [];
    const p = session.progress;
    const pages = this.pageCount();
    this.page = Math.min(this.page, pages - 1);
    // page controls only when the tab overflows one page (furniture: 6 + 6 souvenirs = 12 cards)
    this.prevBtn.setVisible(pages > 1).setEnabled(this.page > 0);
    this.nextBtn.setVisible(pages > 1).setEnabled(this.page < pages - 1);
    this.pageText.setText(pages > 1 ? `${this.page + 1}/${pages}` : '');
    const items = itemsForSlot(this.tab).slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE);
    items.forEach((item, i) => {
      const col = i % CARD_COLS;
      const row = Math.floor(i / CARD_COLS);
      const x = SHOP_X + 12 + col * (CARD_W + 8);
      const y = SHOP_Y + 40 + row * (CARD_H + CARD_GAP);
      const owned = p.owned.includes(item.id);
      const equipped = item.slot !== 'furniture' && p.avatar[item.slot] === item.id;
      const placed = item.slot === 'furniture' && p.room.some((r) => r.itemId === item.id);
      const status = equipped ? '장착 중' : placed ? '배치됨' : owned ? (item.slot === 'furniture' ? '보유 · 배치' : '보유 · 장착') : item.unlockStamp ? '도장 기념품' : `${item.price} P`;
      const affordable = owned || (!item.unlockStamp && p.points >= item.price);

      const c = this.add.container(x, y);
      const bg = this.add.nineslice(0, 0, UI.btn, undefined, CARD_W, CARD_H, UI.slice, UI.slice, UI.slice, UI.slice).setOrigin(0, 0);
      const draw = (hover: boolean) => {
        bg.setTexture(equipped || placed ? UI.btnSelected : hover ? UI.btnHover : UI.btn);
        bg.clearTint();
        if (equipped || placed) bg.setTint(0x6bd77b);
        else if (!affordable) bg.setAlpha(0.7); else bg.setAlpha(1);
      };
      draw(false);
      const icon = item.slot === 'furniture'
        ? this.add.image(22, CARD_H / 2, TEX.furniture(item.id)).setDisplaySize(28, 28)
        : this.add.image(22, CARD_H / 2, partIconKey(this, item.id));
      // full name on up to two lines (review Stage C L8: '자유의 여신상 왕관', '브라질 축구 유니폼' …). 12px text boxes are
      // 16px tall, so the name lines are pulled 3px closer and the status sits on the card's bottom edge: 3 lines fit
      // in the 46px card without the second name line touching the price
      const name = this.add.text(42, 2, item.name, textStyle({ size: 'small', wordWrap: { width: CARD_W - 46, useAdvancedWrap: true }, maxLines: 2 })).setLineSpacing(-3);
      const st = this.add.text(42, CARD_H - 1, status, textStyle({ size: 'small', color: equipped || placed ? THEME.successCss : owned ? THEME.textDim : affordable ? THEME.accentCss : '#8a8a8a' })).setOrigin(0, 1);
      c.add([bg, icon, name, st]);
      c.setSize(CARD_W, CARD_H);
      c.setInteractive(new Phaser.Geom.Rectangle(CARD_W / 2, CARD_H / 2, CARD_W, CARD_H), Phaser.Geom.Rectangle.Contains);
      c.on('pointerover', () => { draw(true); this.input.setDefaultCursor('pointer'); });
      c.on('pointerout', () => { draw(false); this.input.setDefaultCursor('default'); });
      c.on('pointerdown', (ptr: Phaser.Input.Pointer) => { if (!ptr.rightButtonDown()) this.onItemClick(item, c); });
      this.cards.push(c);
    });
  }

  private onItemClick(item: ItemDef, card: Phaser.GameObjects.Container): void {
    const p = session.progress;
    if (!p.owned.includes(item.id)) {
      const ev = session.dispatch({ type: 'shop.buy', itemId: item.id });
      const rej = ev.find((e) => e.type === 'rejected');
      if (rej && rej.type === 'rejected') {
        this.showMessage(rej.reason);
        this.tweens.add({ targets: card, x: card.x + 4, duration: 40, yoyo: true, repeat: 3 });
        return;
      }
      this.showMessage(`${item.name} 구매!`, THEME.successCss);
      return;
    }
    if (item.slot === 'furniture') {
      if (p.room.some((r) => r.itemId === item.id)) { this.showMessage('이미 방에 놓여 있어요. 클릭해서 회수할 수 있어요.'); return; }
      this.startPlacing(item);
      return;
    }
    const slot = item.slot;
    if (p.avatar[slot] === item.id) {
      if (slot === 'hat') session.dispatch({ type: 'avatar.equip', slot: 'hat', itemId: null });
      else this.showMessage('이미 장착 중이에요', THEME.textDim);
      return;
    }
    const ev = session.dispatch({ type: 'avatar.equip', slot, itemId: item.id });
    const rej = ev.find((e) => e.type === 'rejected');
    if (rej && rej.type === 'rejected') this.showMessage(rej.reason);
  }

  private showMessage(text: string, color: string = THEME.dangerCss, ms = 2500): void {
    this.message.setText(text).setColor(color);
    this.messageUntil = this.time.now + ms;
  }

  private handleEvent(e: ProgressEvent): void {
    switch (e.type) {
      case 'points.changed': case 'rank.changed': case 'profile.changed': case 'city.stamped':
        this.refreshProfile();
        if (e.type === 'points.changed') this.refreshShop();
        break;
      case 'item.bought':
        this.refreshShop();
        break;
      case 'avatar.changed':
        this.playPreview();
        this.refreshShop();
        break;
      case 'room.changed':
        this.refreshRoom();
        this.refreshShop();
        break;
      case 'settings.changed':
        this.speaker.setTexture(TEX.icon(e.muted ? 'speakerOff' : 'speakerOn'));
        break;
      default:
        break;
    }
  }

  private leave(): void {
    this.cancelPlacing();
    this.scene.start('WorldMap');
  }
}
