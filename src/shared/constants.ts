// Physics / gameplay constants shared by client and (future) server.

export const FIXED_DT = 1 / 60;
export const MAX_STEPS_PER_FRAME = 5;
export const MAX_FRAME_DT = 0.1;

// Player movement
export const MOVE_SPEED = 6;
export const JUMP_SPEED = 9;
export const GRAVITY = -25;          // max jump height ≈ 9²/(2·25) = 1.62m
export const PLAYER_RADIUS = 0.5;
export const PLAYER_HEIGHT = 1.8;
export const STEP_TOLERANCE = 0.35;  // ledges this low are stepped onto without jumping

// Player life / combat
export const RESPAWN_TIME = 3;
export const ATTACK_COOLDOWN = 0.5;
export const ATTACK_ANIM_TIME = 0.25;
export const ATTACK_RANGE = 2.2;
export const ATTACK_ARC = Math.PI / 2;  // 전방 90°
export const INVULN_TIME = 0.5;
export const HIT_FLASH_TIME = 0.15;

// NPC / quests
export const NPC_INTERACT_RANGE = 3;

// Map
export const MAP_SIZE = 120;
export const MAP_BOUND = 58;  // ±58 (바닥 120, 여유 2)

// Monster AI
export const MONSTER_ATTACK_LEAVE_FACTOR = 1.3;  // 3D dist > attackRange*1.3 → chase
