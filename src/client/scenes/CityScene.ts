// City exploration: tilemap layers, player, NPCs, signs, monsters, landmarks, entrance (spec 5.3, 6). v0.2 adds
// speech bubbles by distance, emoji keys 1–6, Tab minimap, N mute, BGM per city, footstep ground detection.
import Phaser from 'phaser';
import type { CityDef, CityId, EmoteId, LearnCard as LearnCardData, MinigameResult, MinigameSpec, SignDef } from '../../shared/types';
import { BUBBLE_RANGE, ENTRANCE_GRACE, INTERACT_RANGE, MAP_HEIGHT, MAP_WIDTH, PLAYER_ATK, TILE_SIZE } from '../../shared/constants';
import { getCard, getCity, getMission, getMonster } from '../../shared/content';
import { decideNpcInteraction } from '../../shared/logic/missions';
import type { ProgressEvent } from '../../shared/logic/reducer';
import { textureKeyFor } from '../assets/avatarCompositor';
import { EMOTE_IDS } from '../assets/emotes';
import { TEX } from '../assets/manifest';
import { bgm } from '../audio/bgm';
import { sfx } from '../audio/sfx';
import { Monster } from '../entities/Monster';
import { Npc, type NpcMarker } from '../entities/Npc';
import { Player } from '../entities/Player';
import { spawnPositions } from '../entities/spawn';
import { buildCityMap, tileCenter } from '../map/buildCityMap';
import { session } from '../session';
import { josa } from '../ui/theme';
import type { HudScene } from './HudScene';
import { launchMinigame } from './minigames/MinigameHost';

interface Sign { def: SignDef; sprite: Phaser.GameObjects.Image }

/** Ground kind under a tile char for the footstep sound (spec 6.5). */
function groundKind(ch: string | undefined): string {
  switch (ch) {
    case '=': case 'E': case 'x': return 'road';
    case '-': return 'sidewalk';
    case 'Q': return 'plaza';
    case 'B': return 'bridge';
    case 'S': case 's': case 'd': return 'sand';
    default: return 'grass';
  }
}

export class CityScene extends Phaser.Scene {
  private cityId!: CityId;
  private city!: CityDef;
  private player!: Player;
  private npcs: Npc[] = [];
  private signs: Sign[] = [];
  private monsters: Monster[] = [];
  private hud!: HudScene;
  private keys!: {
    e: Phaser.Input.Keyboard.Key; space: Phaser.Input.Keyboard.Key; f: Phaser.Input.Keyboard.Key; m: Phaser.Input.Keyboard.Key;
    esc: Phaser.Input.Keyboard.Key; tab: Phaser.Input.Keyboard.Key; n: Phaser.Input.Keyboard.Key; nums: Phaser.Input.Keyboard.Key[];
  };
  private enteredAt = 0;
  private leaving = false;
  private inMinigame = false;
  private swingHit = new Set<Monster>();
  private slash!: Phaser.GameObjects.Graphics;
  private cleanupMinigame: (() => void) | null = null;
  private readonly onProgress = (e: ProgressEvent) => {
    if (e.type === 'avatar.changed') this.player.setAvatarTexture(textureKeyFor(this, session.progress.avatar));
    if (e.type === 'profile.changed') this.player.setDisplayName(e.name);
    if (e.type === 'mission.changed' || e.type === 'card.read') this.refreshMarkers();
  };

  constructor() {
    super('City');
  }

  init(data: { cityId: CityId }): void {
    this.cityId = data.cityId;
    this.npcs = [];
    this.signs = [];
    this.monsters = [];
    this.leaving = false;
    this.inMinigame = false;
    this.cleanupMinigame = null;
  }

  create(): void {
    this.city = getCity(this.cityId);
    const { entrance, layer } = buildCityMap(this, this.city);

    // player
    const sp = tileCenter(this.city.spawn);
    this.player = new Player(this, sp.x, sp.y, textureKeyFor(this, session.progress.avatar), this.city.spawnFacing, session.progress.profile.name);
    this.physics.add.collider(this.player, layer);
    this.player.onHpChanged = (hp, max) => this.hud.setHp(hp, max);
    this.player.onFaint = () => { this.monsters.forEach((m) => m.forceReturn()); this.hud.closeModals(); };
    this.player.onRevive = () => { const s = tileCenter(this.city.spawn); this.player.revive(s.x, s.y, this.city.spawnFacing); this.hud.hideFaint(); this.enteredAt = this.time.now; };

    // npcs + signs
    for (const def of this.city.npcs) {
      const npc = new Npc(this, def);
      this.physics.add.collider(this.player, npc);
      this.npcs.push(npc);
    }
    for (const def of this.city.signs) {
      const c = tileCenter(def.at);
      const sprite = this.physics.add.staticImage(c.x, c.y, TEX.sign).setDepth(c.y);
      (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(20, 12).setOffset(6, 18);
      this.physics.add.collider(this.player, sprite);
      this.signs.push({ def, sprite });
    }

    // monsters
    for (const zone of this.city.monsterZones) {
      const def = getMonster(zone.monsterId);
      for (const pos of spawnPositions(this.city, zone)) {
        const c = tileCenter(pos);
        const m = new Monster(this, c.x, c.y, def);
        m.onDefeated = (mon) => session.dispatch({ type: 'monster.defeated', monsterId: mon.def.id, cityId: this.cityId });
        m.onHitPlayer = () => this.hud.flashDamage();
        this.physics.add.collider(m, layer);
        this.monsters.push(m);
      }
    }

    // entrance / exit
    this.physics.add.overlap(this.player, entrance, () => this.tryLeave());
    this.enteredAt = this.time.now;

    // camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setZoom(1);
    cam.setRoundPixels(true);

    this.slash = this.add.graphics().setDepth(5000);

    // keys (Tab is captured so the browser does not move focus)
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    kb.addCapture(K.TAB);
    this.keys = {
      e: kb.addKey(K.E), space: kb.addKey(K.SPACE), f: kb.addKey(K.F), m: kb.addKey(K.M), esc: kb.addKey(K.ESC),
      tab: kb.addKey(K.TAB), n: kb.addKey(K.N),
      nums: [K.ONE, K.TWO, K.THREE, K.FOUR, K.FIVE, K.SIX].map((c) => kb.addKey(c)),
    };

    // hud
    this.scene.launch('Hud', { cityId: this.cityId });
    this.hud = this.scene.get('Hud') as HudScene;
    // HudScene.init() (next frame) keeps this field, so assigning now is safe; re-assign after create() as well
    // in case the HUD instance is ever rebuilt (review Stage A #1).
    this.hud.onEmote = (id) => this.emote(id);
    this.hud.events.once(Phaser.Scenes.Events.CREATE, () => { this.hud.onEmote = (id) => this.emote(id); });

    bgm.play(this.city.theme.bgm);

    session.events.on('any', this.onProgress);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onShutdown());
    this.refreshMarkers();
  }

  private onShutdown(): void {
    session.events.off('any', this.onProgress);
    this.cleanupMinigame?.();
    this.cleanupMinigame = null;
    this.scene.stop('Hud');
    session.flush();
    this.input.setDefaultCursor('default');
  }

  override update(time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.1);
    if (this.leaving) return;
    const hudReady = this.hud.scene.isActive();
    const modal = hudReady && this.hud.isModalOpen();
    this.player.inputEnabled = !modal && !this.inMinigame;

    // ground kind under the feet (for footsteps)
    const ftx = Math.floor(this.player.x / TILE_SIZE);
    const fty = Math.floor((this.player.y + 12) / TILE_SIZE);
    this.player.ground = groundKind(this.city.rows[fty]?.[ftx]);

    this.player.update(dt);
    this.player.setDepth(this.player.y);
    this.player.syncDecor();
    // While a dialog / card is open the player cannot act, so monsters hold still too (no chasing or attacking).
    for (const m of this.monsters) { if (modal) m.freeze(); else m.update(dt, this.player); }
    this.updateBubbles(modal);
    if (hudReady) this.hud.minimap.update(this.player.x, this.player.y, this.cameras.main);

    if (this.player.fainted) {
      if (hudReady) this.hud.showFaint(this.player.faintLeft);
      if (hudReady) this.hud.setHint('');
      this.input.keyboard?.resetKeys();
      return;
    }

    // Consume every key edge each frame (single owner of keyboard edges while in the city).
    const J = Phaser.Input.Keyboard.JustDown;
    const fJust = J(this.keys.f);
    const eJust = J(this.keys.e) || J(this.keys.space);
    const mJust = J(this.keys.m);
    const escJust = J(this.keys.esc);
    const tabJust = J(this.keys.tab);
    const nJust = J(this.keys.n);
    const numJust = this.keys.nums.map((k) => J(k));

    if (tabJust && hudReady) this.hud.toggleMinimap();
    if (nJust) session.setMuted(!session.muted);

    // modal (dialog / learn card) input: E/Space/Esc close, 1/2/3 pick a card tab
    if (modal) {
      if (eJust || escJust) this.hud.closeTopModal();
      else if (this.hud.isCardOpen()) {
        const tab = numJust.slice(0, 3).findIndex((v) => v);
        if (tab >= 0) this.hud.selectCardTab(tab);
      }
      this.hud.setHint('');
      return;
    }

    // emoji 1–6 (only when no modal / minigame)
    if (!this.inMinigame) {
      const idx = numJust.findIndex((v) => v);
      if (idx >= 0) this.emote(EMOTE_IDS[idx]!);
    }

    // attack
    if (fJust) {
      const box = this.player.tryAttack();
      if (box) { this.swingHit.clear(); this.drawSlash(box); }
    }
    if (this.player.attackActiveLeft > 0) this.resolveAttack(this.player.attackHitbox());

    // interaction target + hint
    const target = this.findInteractTarget();
    if (hudReady) {
      if (target?.kind === 'npc') this.hud.setHint(`[E] ${target.npc.def.name}${josa(target.npc.def.name, '과', '와')} 대화`);
      else if (target?.kind === 'sign') this.hud.setHint('[E] 표지판 읽기');
      else this.hud.setHint('');
    }
    if (eJust && target) this.onInteract(target);
    if (mJust) this.leave();
    void time;
  }

  // ------------------------------------------------------------ presence

  private emote(id: EmoteId): void {
    if (this.inMinigame || this.player.fainted) return;
    this.player.showEmote(id);
    sfx.emote();
    session.events.emit('presence.emote', { id });
  }

  private updateBubbles(modal: boolean): void {
    for (const npc of this.npcs) {
      const near = !modal && Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) <= BUBBLE_RANGE;
      npc.setBubbleVisible(near);
    }
  }

  // ------------------------------------------------------------ combat

  private resolveAttack(box: Phaser.Geom.Rectangle): void {
    for (const m of this.monsters) {
      if (!m.alive || this.swingHit.has(m)) continue;
      const body = m.body as Phaser.Physics.Arcade.Body;
      const rect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(box, rect)) continue;
      this.swingHit.add(m);
      m.hit(PLAYER_ATK, this.player.x, this.player.y);
    }
  }

  private drawSlash(box: Phaser.Geom.Rectangle): void {
    const g = this.slash;
    g.clear();
    g.setAlpha(1);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeCircle(box.centerX, box.centerY, box.width / 2);
    g.fillStyle(0xffffff, 0.25);
    g.fillCircle(box.centerX, box.centerY, box.width / 2);
    this.tweens.add({ targets: g, alpha: 0, duration: 150 });
  }

  // ------------------------------------------------------------ interaction

  private findInteractTarget(): { kind: 'npc'; npc: Npc } | { kind: 'sign'; sign: Sign } | null {
    let best: { kind: 'npc'; npc: Npc } | { kind: 'sign'; sign: Sign } | null = null;
    let bestD = INTERACT_RANGE;
    const px = this.player.x;
    const py = this.player.y + 4;
    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(px, py, npc.x, npc.y);
      if (d <= bestD) { bestD = d; best = { kind: 'npc', npc }; }
    }
    for (const sign of this.signs) {
      const d = Phaser.Math.Distance.Between(px, py, sign.sprite.x, sign.sprite.y);
      if (d <= bestD) { bestD = d; best = { kind: 'sign', sign }; }
    }
    return best;
  }

  private onInteract(target: { kind: 'npc'; npc: Npc } | { kind: 'sign'; sign: Sign }): void {
    this.player.halt();
    if (target.kind === 'sign') {
      const card = getCard(target.sign.def.cardId);
      this.openCard(card?.topic ?? 'geo');
      return;
    }
    const npc = target.npc.def;
    const action = decideNpcInteraction(session.progress, npc, this.cityId);
    switch (action.kind) {
      case 'showCard': {
        const card = getCard(action.cardId);
        this.openCard(card?.topic ?? 'geo');
        break;
      }
      case 'accept': {
        const m = getMission(action.missionId);
        session.dispatch({ type: 'mission.accept', missionId: action.missionId });
        this.hud.showDialog(npc.name, m?.acceptText ?? '');
        break;
      }
      case 'turnIn': {
        const m = getMission(action.missionId);
        session.dispatch({ type: 'mission.turnIn', missionId: action.missionId });
        this.hud.showDialog(npc.name, m?.completeText ?? '');
        break;
      }
      case 'progress': {
        this.hud.showDialog(npc.name, action.text);
        break;
      }
      case 'startMinigame': {
        this.startMinigame(action.missionId, action.spec, npc.name);
        break;
      }
      default:
        this.hud.showDialog(npc.name, action.text);
    }
  }

  private openCard(topic: string, onClose?: () => void): void {
    this.hud.showCard(this.city.cards, topic, (card: LearnCardData) => session.dispatch({ type: 'card.read', cardId: card.id }), onClose);
  }

  private startMinigame(missionId: string, spec: MinigameSpec, npcName: string): void {
    if (this.inMinigame) return;
    this.inMinigame = true;
    this.hud.closeModals();
    this.hud.setHint('');
    for (const npc of this.npcs) npc.setBubbleVisible(false);
    bgm.duck(0.4);
    this.cleanupMinigame = launchMinigame(this, spec, missionId, (result: MinigameResult) => {
      this.cleanupMinigame = null;
      this.inMinigame = false;
      bgm.duck(1);
      const m = getMission(missionId);
      session.dispatch({ type: 'mission.minigameResult', missionId, result });
      const text = result.success ? (m?.completeText ?? '성공!') : (m?.failText ?? '아깝다! 다시 도전해 봐.');
      this.hud.showDialog(npcName, text);
    });
  }

  private refreshMarkers(): void {
    for (const npc of this.npcs) {
      const action = decideNpcInteraction(session.progress, npc.def, this.cityId);
      let marker: NpcMarker = null;
      if (action.kind === 'accept' || action.kind === 'showCard') marker = '!';
      else if (action.kind === 'turnIn' || action.kind === 'startMinigame') marker = '?';
      npc.setMarker(marker);
    }
  }

  // ------------------------------------------------------------ leaving

  private tryLeave(): void {
    if (this.leaving || this.inMinigame) return;
    if (this.time.now - this.enteredAt < ENTRANCE_GRACE * 1000) return;
    if (this.hud.scene.isActive() && this.hud.isModalOpen()) return;
    this.leave();
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.player.halt();
    this.scene.start('WorldMap');
  }
}
