// Player movement, jump, gravity, landing on ground/platforms, death/respawn timer.
import type { SimSystem } from '../types';
import { MAP, OBSTACLE_AABBS, PLATFORM_AABBS } from '../data/map';
import { GRAVITY, JUMP_SPEED, MOVE_SPEED, PLAYER_RADIUS } from '../constants';
import { clampToBounds, groundHeightAt, platformsAsWalls, resolveCircleVsAABBs } from './collision';
import { set } from '../vec';

export const playerSim: SimSystem = (state, cmd, dt, events) => {
  const p = state.player;

  if (!p.alive) {
    p.vel.x = 0; p.vel.z = 0;
    p.respawnTimer -= dt;
    if (p.respawnTimer <= 0) {
      p.respawnTimer = 0;
      set(p.pos, MAP.playerSpawn);
      p.vel.x = 0; p.vel.y = 0; p.vel.z = 0;
      p.hp = p.maxHp;
      p.alive = true;
      p.onGround = false;
      p.invulnTimer = 0;
      p.attackCooldown = 0; p.attackAnim = 0;
      events.push({ type: 'player:respawned' });
    }
    return;
  }

  // 1. horizontal velocity + facing
  p.vel.x = cmd.move.x * MOVE_SPEED;
  p.vel.z = cmd.move.z * MOVE_SPEED;
  if (cmd.move.x !== 0 || cmd.move.z !== 0) p.yaw = Math.atan2(cmd.move.x, cmd.move.z);

  // 2. jump
  if (cmd.jump && p.onGround) {
    p.vel.y = JUMP_SPEED;
    p.onGround = false;
  }

  // 3. XZ move
  p.pos.x += p.vel.x * dt;
  p.pos.z += p.vel.z * dt;

  // 4. XZ collision: obstacles + platforms whose top is above step tolerance
  const walls = OBSTACLE_AABBS.concat(platformsAsWalls(p.pos, PLATFORM_AABBS));
  resolveCircleVsAABBs(p.pos, PLAYER_RADIUS, walls);
  clampToBounds(p.pos, MAP.bounds);

  // 5. Y move
  p.vel.y += GRAVITY * dt;
  p.pos.y += p.vel.y * dt;

  // 6. landing
  const floorY = groundHeightAt(p.pos, PLAYER_RADIUS, PLATFORM_AABBS);
  if (p.vel.y <= 0 && p.pos.y <= floorY) {
    p.pos.y = floorY;
    p.vel.y = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  // 7. timers
  if (p.attackCooldown > 0) p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  if (p.attackAnim > 0) p.attackAnim = Math.max(0, p.attackAnim - dt);
  if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
};
