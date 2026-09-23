// Monster: FSM idle/chase/attack/return/dead driven by the pure decideMonsterState (spec 6.5, 7.5).
import Phaser from 'phaser';
import type { Facing, MonsterDef } from '../../shared/types';
import { HIT_FLASH_TIME, KNOCKBACK, MONSTER_STUCK_TIME } from '../../shared/constants';
import { decideMonsterState, hitMonster, type MonsterAiState } from '../../shared/logic/combat';
import { animKey, ensureCharAnims } from '../assets/avatarCompositor';
import { TEX } from '../assets/manifest';
import type { Player } from './Player';

const HOME_EPS = 4;
const HP_BAR_W = 24;

export class Monster extends Phaser.Physics.Arcade.Sprite {
  readonly def: MonsterDef;
  readonly spawnX: number;
  readonly spawnY: number;
  hp: number;
  ai: MonsterAiState = 'idle';
  private attackCooldown = 0;
  private respawnLeft = 0;
  private stuckTime = 0;
  private flashLeft = 0;
  private lastX: number;
  private lastY: number;
  private idleT = 0;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private lastHpDrawn = -1;
  private facing: Facing = 'down';
  private moving = false;
  /** Called when the monster dies (scene dispatches monster.defeated). */
  onDefeated: ((m: Monster) => void) | null = null;
  /** Called when the monster lands a hit on the player. */
  onHitPlayer: ((m: Monster) => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, def: MonsterDef) {
    const key = TEX.monster(def.id);
    super(scene, x, y, key, 1);
    this.def = def;
    this.spawnX = x;
    this.spawnY = y;
    this.lastX = x;
    this.lastY = y;
    this.hp = def.hp;
    ensureCharAnims(scene, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 18);
    body.setOffset(6, 12);
    this.setCollideWorldBounds(true);
    this.hpBar = scene.add.graphics();
    this.play(animKey(key, 'idle', 'down'));
  }

  get alive(): boolean {
    return this.ai !== 'dead';
  }

  override update(dt: number, player: Player): void {
    if (this.flashLeft > 0) {
      this.flashLeft = Math.max(0, this.flashLeft - dt);
      if (this.flashLeft === 0) this.clearTint();
    }
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (this.ai === 'dead') {
      this.respawnLeft -= dt;
      if (this.respawnLeft <= 0) this.respawn();
      return;
    }

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const distToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);

    // stuck detection while chasing (blocked by tiles)
    if (this.ai === 'chase') {
      const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
      this.stuckTime = moved < 0.3 ? this.stuckTime + dt : 0;
    } else {
      this.stuckTime = 0;
    }
    this.lastX = this.x;
    this.lastY = this.y;

    const next = decideMonsterState({
      state: this.ai, distToPlayer, distToSpawn, playerAlive: player.alive,
      aggroRange: this.def.aggroRange, attackRange: this.def.attackRange, leashRange: this.def.leashRange,
      stuckTime: this.stuckTime, stuckLimit: MONSTER_STUCK_TIME, homeEpsilon: HOME_EPS,
    });
    if (next !== this.ai) this.enter(next);

    switch (this.ai) {
      case 'idle': {
        this.setVelocity(0, 0);
        this.idleT += dt;
        this.setScale(1, 1 + Math.sin(this.idleT * 4) * 0.03);
        this.moving = false;
        break;
      }
      case 'chase': {
        this.scene.physics.moveToObject(this, player, this.def.speed);
        this.moving = true;
        break;
      }
      case 'attack': {
        this.setVelocity(0, 0);
        this.moving = false;
        this.faceTowards(player.x, player.y);
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.def.attackInterval;
          if (player.takeHit(this.def.atk, this.x, this.y)) this.onHitPlayer?.(this);
        }
        break;
      }
      case 'return': {
        this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.def.speed);
        this.moving = true;
        break;
      }
      default:
        break;
    }
    this.updateAnim();
    this.setDepth(this.y);
    this.drawHpBar();
  }

  private enter(next: MonsterAiState): void {
    this.ai = next;
    if (next === 'idle') {
      this.hp = this.def.hp;
      this.setPosition(this.spawnX, this.spawnY);
      this.setScale(1, 1);
    }
    if (next === 'return') this.setScale(1, 1);
  }

  private faceTowards(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }

  private updateAnim(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.moving && (Math.abs(body.velocity.x) > 1 || Math.abs(body.velocity.y) > 1)) {
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
      this.play(animKey(this.texture.key, 'walk', this.facing), true);
    } else {
      this.play(animKey(this.texture.key, 'idle', this.facing), true);
    }
  }

  private drawHpBar(): void {
    this.hpBar.setPosition(this.x, this.y).setDepth(this.y + 1);
    if (this.hp === this.lastHpDrawn) return;
    this.lastHpDrawn = this.hp;
    const g = this.hpBar;
    g.clear();
    if (this.hp >= this.def.hp) return;
    const ratio = Math.max(0, this.hp / this.def.hp);
    g.fillStyle(0x000000, 0.6);
    g.fillRect(-HP_BAR_W / 2 - 1, -23, HP_BAR_W + 2, 5);
    g.fillStyle(ratio > 0.5 ? 0x6bd77b : ratio > 0.25 ? 0xffd166 : 0xff6b6b, 1);
    g.fillRect(-HP_BAR_W / 2, -22, HP_BAR_W * ratio, 3);
  }

  /** Damage from the player. Returns true if the monster died. */
  hit(atk: number, fromX: number, fromY: number): boolean {
    if (this.ai === 'dead') return false;
    const r = hitMonster(this.hp, atk);
    this.hp = r.hp;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => { if (this.ai !== 'dead') this.setTint(0xff6b6b); });
    this.flashLeft = HIT_FLASH_TIME;
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.x += (dx / len) * KNOCKBACK;
    this.y += (dy / len) * KNOCKBACK;
    if (this.ai === 'idle') this.enter('chase');
    if (r.dead) {
      this.die();
      return true;
    }
    this.drawHpBar();
    return false;
  }

  private die(): void {
    this.ai = 'dead';
    this.respawnLeft = this.def.respawnTime;
    this.setVelocity(0, 0);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
    this.hpBar.clear();
    this.lastHpDrawn = -1;
    // "뿅" — quick pop then hide
    this.scene.tweens.add({
      targets: this, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 180,
      onComplete: () => { this.setVisible(false); this.setActive(false); this.setScale(1, 1); this.setAlpha(1); },
    });
    this.onDefeated?.(this);
  }

  private respawn(): void {
    this.setPosition(this.spawnX, this.spawnY);
    this.lastX = this.spawnX;
    this.lastY = this.spawnY;
    this.hp = this.def.hp;
    this.ai = 'idle';
    this.attackCooldown = 0;
    this.stuckTime = 0;
    this.setVisible(true).setActive(true).setAlpha(0).setScale(1, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(this.spawnX, this.spawnY);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 200 });
  }

  /** Hold still (dialog / learn card open): no movement, no attacks, FSM not advanced this frame. */
  freeze(): void {
    if (this.ai === 'dead') return;
    this.setVelocity(0, 0);
    this.moving = false;
    this.updateAnim();
    this.hpBar.setPosition(this.x, this.y);
  }

  /** Forced retreat (player fainted). */
  forceReturn(): void {
    if (this.ai === 'chase' || this.ai === 'attack') this.enter('return');
  }

  override destroy(fromScene?: boolean): void {
    this.hpBar.destroy();
    super.destroy(fromScene);
  }
}
