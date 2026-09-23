// Avatar room: profile, preview, shop (hair/top/hat/furniture), 8×6 furniture grid (spec 6.7).
import Phaser from 'phaser';
import type { ItemDef, ItemSlot } from '../../shared/types';
import { ROOM_COLS, ROOM_ROWS } from '../../shared/constants';
import { getMarker } from '../../shared/content/continents';
import { getItem, itemsForSlot } from '../../shared/content/items';
import { canPlace, footprint } from '../../shared/logic/inventory';
import type { ProgressEvent } from '../../shared/logic/reducer';
import { animKey, textureKeyFor } from '../assets/avatarCompositor';
import { TEX } from '../assets/manifest';
import { GAME_HEIGHT } from '../config';
import { session } from '../session';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { textStyle, THEME } from '../ui/theme';

const CELL = 48;
const GRID_X = 436;
const GRID_Y = 24;
const GRID_W = ROOM_COLS * CELL; // 384
const GRID_H = ROOM_ROWS * CELL; // 288
const SHOP_X = 308;
const SHOP_Y = 332;
const CARD_W = 150;
const CARD_H = 44;
const TABS: { slot: Exclude<ItemSlot, 'body'>; name: string }[] = [
  { slot: 'hair', name: '머리' }, { slot: 'top', name: '옷' }, { slot: 'hat', name: '모자' }, { slot: 'furniture', name: '가구' },
];

export class AvatarRoomScene extends Phaser.Scene {
  private tab: Exclude<ItemSlot, 'body'> = 'hair';
  private tabButtons: Button[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private placed: Phaser.GameObjects.Image[] = [];
  private roomGfx!: Phaser.GameObjects.Graphics;
  private preview!: Phaser.GameObjects.Sprite;
  private previewWalking = false;
  private nameText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private stampText!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private messageUntil = 0;
  private placing: { item: ItemDef; ghost: Phaser.GameObjects.Image } | null = null;
  private escKey!: Phaser.Input.Keyboard.Key;
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
    this.nameText = this.add.text(140, 50, '', textStyle({ fontSize: '20px', fontStyle: 'bold', color: THEME.accentCss })).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    this.nameText.on('pointerdown', () => this.renameProfile());
    this.rankText = this.add.text(140, 80, '', textStyle({ color: THEME.textDim })).setOrigin(0.5, 0);
    const coin = this.add.image(110, 116, TEX.icon('coin'));
    this.pointsText = this.add.text(126, 106, '', textStyle({ fontSize: '18px', color: THEME.accentCss }));
    this.stampText = this.add.text(140, 140, '', textStyle({ fontSize: '14px', align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5, 0);
    prof.add([this.nameText, this.rankText, coin, this.pointsText, this.stampText]);

    const pvBg = this.add.graphics();
    pvBg.fillStyle(0x1b1b2f, 1).fillRoundedRect(76, 190, 128, 140, 6).lineStyle(1, THEME.border, 0.5).strokeRoundedRect(76, 190, 128, 140, 6);
    prof.add(pvBg);
    this.preview = this.add.sprite(140, 262, textureKeyFor(this, session.progress.avatar), 1).setScale(3);
    prof.add(this.preview);
    const walkBtn = new Button(this, 90, 340, '걷기 애니 켜기', { width: 100, height: 30, fontSize: 13, onClick: () => this.togglePreview(walkBtn) });
    prof.add(walkBtn);
    prof.add(this.add.text(140, 385, '이름을 클릭하면 바꿀 수 있어요', textStyle({ fontSize: '12px', color: THEME.textDim })).setOrigin(0.5, 0));
    prof.add(new Button(this, 40, GAME_HEIGHT - 24 - 60, '세계지도로 (Esc)', { width: 200, height: 40, onClick: () => this.leave() }));

    // --- room panel
    new Panel(this, SHOP_X, 12, { width: 640, height: 312 });
    this.roomGfx = this.add.graphics();
    this.drawRoom();
    this.add.text(SHOP_X + 12, 18, '아바타 룸 (가구를 클릭해 회수)', textStyle({ fontSize: '13px', color: THEME.textDim }));
    const gridZone = this.add.zone(GRID_X, GRID_Y, GRID_W, GRID_H).setOrigin(0, 0).setInteractive();
    gridZone.on('pointermove', (p: Phaser.Input.Pointer) => this.onGridMove(p));
    gridZone.on('pointerdown', (p: Phaser.Input.Pointer) => this.onGridClick(p));

    // --- shop panel
    new Panel(this, SHOP_X, SHOP_Y, { width: 640, height: GAME_HEIGHT - SHOP_Y - 12 });
    TABS.forEach((t, i) => {
      const b = new Button(this, SHOP_X + 12 + i * 110, SHOP_Y + 10, t.name, { width: 100, height: 28, fontSize: 14, onClick: () => this.selectTab(t.slot) });
      this.tabButtons.push(b);
    });
    this.message = this.add.text(SHOP_X + 628, GAME_HEIGHT - 18, '', textStyle({ fontSize: '14px', color: THEME.dangerCss })).setOrigin(1, 1);

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown()) this.cancelPlacing(); });

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
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.placing) this.cancelPlacing();
      else this.leave();
    }
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
    const g = this.roomGfx;
    g.clear();
    g.fillStyle(0x6d5a8a, 1).fillRect(GRID_X, GRID_Y - 8, GRID_W, 8); // wall top
    for (let gy = 0; gy < ROOM_ROWS; gy++) {
      for (let gx = 0; gx < ROOM_COLS; gx++) {
        g.fillStyle((gx + gy) % 2 === 0 ? 0xc9a77a : 0xb8935f, 1);
        g.fillRect(GRID_X + gx * CELL, GRID_Y + gy * CELL, CELL, CELL);
      }
    }
    g.lineStyle(1, 0x000000, 0.15);
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

  private selectTab(slot: Exclude<ItemSlot, 'body'>): void {
    this.tab = slot;
    this.tabButtons.forEach((b, i) => b.setSelected(TABS[i]!.slot === slot));
    this.cancelPlacing();
    this.refreshShop();
  }

  private refreshShop(): void {
    for (const c of this.cards) c.destroy();
    this.cards = [];
    const p = session.progress;
    const items = itemsForSlot(this.tab);
    items.forEach((item, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = SHOP_X + 12 + col * (CARD_W + 8);
      const y = SHOP_Y + 48 + row * (CARD_H + 8);
      const owned = p.owned.includes(item.id);
      const equipped = item.slot !== 'furniture' && p.avatar[item.slot] === item.id;
      const placed = item.slot === 'furniture' && p.room.some((r) => r.itemId === item.id);
      const status = equipped ? '장착 중' : placed ? '배치됨' : owned ? (item.slot === 'furniture' ? '보유 · 배치' : '보유 · 장착') : item.unlockStamp ? '도장 기념품' : `${item.price} P`;
      const affordable = owned || (!item.unlockStamp && p.points >= item.price);

      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      const draw = (hover: boolean) => {
        bg.clear();
        bg.fillStyle(equipped || placed ? 0x3f6b4a : hover ? 0x545a9a : 0x3d4270, 1).fillRoundedRect(0, 0, CARD_W, CARD_H, 4);
        bg.lineStyle(1, equipped || placed ? THEME.success : affordable ? THEME.border : 0x666a8a, 1).strokeRoundedRect(0, 0, CARD_W, CARD_H, 4);
      };
      draw(false);
      const icon = item.slot === 'furniture'
        ? this.add.image(22, CARD_H / 2, TEX.furniture(item.id)).setDisplaySize(28, 28)
        : this.add.image(22, CARD_H / 2, TEX.layer(item.id), 1).setScale(1.2);
      const name = this.add.text(44, 6, item.name, textStyle({ fontSize: '12px', wordWrap: { width: CARD_W - 48 } }));
      if (name.height > 18) name.setFontSize(10);
      const st = this.add.text(44, CARD_H - 6, status, textStyle({ fontSize: '11px', color: equipped || placed ? THEME.successCss : owned ? THEME.textDim : affordable ? THEME.accentCss : '#8a8a8a' })).setOrigin(0, 1);
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
      default:
        break;
    }
  }

  private leave(): void {
    this.cancelPlacing();
    this.scene.start('WorldMap');
  }
}
