// Player: Arcade sprite with 4-way movement, walk anims, melee hitbox, HP/invuln/faint (spec 5.5, 6.1).
// v0.2: shadow + name tag + emoji via ActorDecor, footstep SFX on walk frames.
import Phaser from 'phaser';
import type { EmoteId, Facing } from '../../shared/types';
import {
  ATTACK_ACTIVE, ATTACK_BOX, ATTACK_COOLDOWN, ATTACK_REACH, FAINT_TIME, KNOCKBACK, PLAYER_BODY, PLAYER_HP, PLAYER_SPEED,
} from '../../shared/constants';
import { damagePlayer } from '../../shared/logic/combat';
import { animKey } from '../assets/avatarCompositor';
import { sfx } from '../audio/sfx';
import { ActorDecor } from './ActorDecor';

const KNOCK_TIME = 0.1;

interface MoveKeys {
  up: Phaser.Input.Keyboard.Key[]; down: Phaser.Input.Keyboard.Key[];
  left: Phaser.Input.Keyboard.Key[]; right: Phaser.Input.Keyboard.Key[];
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing;
  hp = PLAYER_HP;
  readonly maxHp = PLAYER_HP;
  invulnLeft = 0;
  attackCooldown = 0;
  /** > 0 while the melee hitbox is live. */
  attackActiveLeft = 0;
  fainted = false;
  faintLeft = 0;
  /** false while a dialog/card/minigame is open. */
  inputEnabled = true;
  texKey: string;
  readonly decor: ActorDecor;
  /** Ground kind under the feet, set by the scene each frame (drives the footstep sound). */
  ground = 'grass';
  onHpChanged: ((hp: number, max: number) => void) | null = null;
  onFaint: (() => void) | null = null;
  onRevive: (() => void) | null = null;

  private readonly keys: MoveKeys;
  private lastAxis: 'h' | 'v' = 'h';
  private knockLeft = 0;
  private knockVx = 0;
  private knockVy = 0;
  private blinkAcc = 0;
  private lunge: Phaser.Tweens.Tween | null = null;
  private lastWalkFrame = -1;

  constructor(scene: Phaser.Scene, x: number, y: number, texKey: string, facing: Facing, name: string) {
    super(scene, x, y, texKey, 1);
    this.texKey = texKey;
    this.facing = facing;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_BODY.w, PLAYER_BODY.h);
    body.setOffset((32 - PLAYER_BODY.w) / 2, PLAYER_BODY.offsetY);
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: [kb.addKey(K.UP), kb.addKey(K.W)],
      down: [kb.addKey(K.DOWN), kb.addKey(K.S)],
      left: [kb.addKey(K.LEFT), kb.addKey(K.A)],
      right: [kb.addKey(K.RIGHT), kb.addKey(K.D)],
    };
    this.decor = ActorDecor.attach(scene, this, { name });
    this.playIdle();
  }

  setAvatarTexture(texKey: string): void {
    if (texKey === this.texKey) return;
    this.texKey = texKey;
    this.setTexture(texKey, 1);
    this.playIdle();
  }

  setDisplayName(name: string): void {
    this.decor.setName(name);
  }

  showEmote(id: EmoteId): void {
    this.decor.showEmote(id);
  }

  /** Stop moving and show idle (used when a modal opens). */
  halt(): void {
    this.setVelocity(0, 0);
    this.playIdle();
  }

  get alive(): boolean {
    return !this.fainted;
  }

  override update(dt: number): void {
    if (this.invulnLeft > 0) {
      this.invulnLeft = Math.max(0, this.invulnLeft - dt);
      this.blinkAcc += dt;
      this.setAlpha(Math.floor(this.blinkAcc / 0.1) % 2 === 0 ? 1 : 0.35);
      if (this.invulnLeft === 0) { this.setAlpha(1); this.blinkAcc = 0; }
    }
    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.attackActiveLeft > 0) this.attackActiveLeft = Math.max(0, this.attackActiveLeft - dt);

    if (this.fainted) {
      this.setVelocity(0, 0);
      this.faintLeft -= dt;
      this.decor.update();
      if (this.faintLeft <= 0) this.onRevive?.();
      return;
    }

    if (this.knockLeft > 0) {
      this.knockLeft -= dt;
      this.setVelocity(this.knockVx, this.knockVy);
      this.decor.update();
      return;
    }

    if (!this.inputEnabled) { this.halt(); this.decor.update(); return; }

    const down = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => k.isDown);
    const just = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => Phaser.Input.Keyboard.JustDown(k));
    if (just(this.keys.left) || just(this.keys.right)) this.lastAxis = 'h';
    if (just(this.keys.up) || just(this.keys.down)) this.lastAxis = 'v';

    let vx = 0;
    let vy = 0;
    if (down(this.keys.left)) vx -= 1;
    if (down(this.keys.right)) vx += 1;
    if (down(this.keys.up)) vy -= 1;
    if (down(this.keys.down)) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      this.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
      if (vx !== 0 && vy !== 0) {
        this.facing = this.lastAxis === 'h' ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
      } else if (vx !== 0) {
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
      }
      this.play(animKey(this.texKey, 'walk', this.facing), true);
      // footsteps: whenever the animation lands on a walk frame (columns 0 / 2)
      const col = (this.anims.currentFrame?.index ?? 1) - 1; // frame index within the anim (walk1, idle, walk2, idle)
      if (col !== this.lastWalkFrame) {
        this.lastWalkFrame = col;
        if (col === 0 || col === 2) sfx.step(this.ground);
      }
    } else {
      this.setVelocity(0, 0);
      this.playIdle();
      this.lastWalkFrame = -1;
    }
    this.decor.update();
  }

  /** Call after the depth changed so the decorations follow (scene sets depth = y). */
  syncDecor(): void {
    this.decor.update();
  }

  private playIdle(): void {
    this.play(animKey(this.texKey, 'idle', this.facing), true);
  }

  /** Attempt a melee attack; returns the live hitbox when it starts, else null. */
  tryAttack(): Phaser.Geom.Rectangle | null {
    if (this.fainted || !this.inputEnabled || this.attackCooldown > 0) return null;
    this.attackCooldown = ATTACK_COOLDOWN;
    this.attackActiveLeft = ATTACK_ACTIVE;
    const dir = this.facingVector();
    this.lunge?.stop();
    this.lunge = this.scene.tweens.add({ targets: this, x: this.x + dir.x * 4, y: this.y + dir.y * 4, duration: 60, yoyo: true });
    return this.attackHitbox();
  }

  facingVector(): { x: number; y: number } {
    switch (this.facing) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
    }
  }

  attackHitbox(): Phaser.Geom.Rectangle {
    const dir = this.facingVector();
    const cx = this.x + dir.x * ATTACK_REACH;
    const cy = this.y + 4 + dir.y * ATTACK_REACH;
    return new Phaser.Geom.Rectangle(cx - ATTACK_BOX / 2, cy - ATTACK_BOX / 2, ATTACK_BOX, ATTACK_BOX);
  }

  /** Apply damage from a source at (fromX, fromY). Returns true when applied (not invulnerable). */
  takeHit(amount: number, fromX: number, fromY: number): boolean {
    if (this.fainted) return false;
    const r = damagePlayer(this.hp, this.invulnLeft, amount);
    if (!r.applied) return false;
    this.hp = r.hp;
    this.invulnLeft = r.invulnLeft;
    this.blinkAcc = 0;
    this.onHpChanged?.(this.hp, this.maxHp);
    sfx.hurt();
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.knockVx = (dx / len) * (KNOCKBACK / KNOCK_TIME);
    this.knockVy = (dy / len) * (KNOCKBACK / KNOCK_TIME);
    this.knockLeft = KNOCK_TIME;
    if (this.hp <= 0) this.faint();
    return true;
  }

  private faint(): void {
    this.fainted = true;
    this.faintLeft = FAINT_TIME;
    this.knockLeft = 0;
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.invulnLeft = 0;
    this.setAngle(90);
    this.onFaint?.();
  }

  revive(x: number, y: number, facing: Facing): void {
    this.fainted = false;
    this.faintLeft = 0;
    this.hp = this.maxHp;
    this.invulnLeft = 0;
    this.setAngle(0);
    this.setAlpha(1);
    this.setPosition(x, y);
    this.facing = facing;
    this.setVelocity(0, 0);
    this.playIdle();
    this.onHpChanged?.(this.hp, this.maxHp);
  }

  override destroy(fromScene?: boolean): void {
    this.decor.destroy();
    super.destroy(fromScene);
  }
}
