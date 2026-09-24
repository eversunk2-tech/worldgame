// Gameplay constants shared by client and (future) server. Pixel units unless noted.

export const TILE_SIZE = 32;
export const MAP_COLS = 40;
export const MAP_ROWS = 30;
export const MAP_WIDTH = MAP_COLS * TILE_SIZE;   // 1280
export const MAP_HEIGHT = MAP_ROWS * TILE_SIZE;  // 960

// Player movement / body
export const PLAYER_SPEED = 120;                       // px/s
export const PLAYER_BODY = { w: 20, h: 16, offsetY: 14 } as const; // 발 부분만 충돌

// Combat
export const ATTACK_COOLDOWN = 0.4;   // s
export const ATTACK_ACTIVE = 0.15;    // s
export const ATTACK_REACH = 24;       // px from player centre to hitbox centre
export const ATTACK_BOX = 28;         // px, square hitbox side
export const PLAYER_HP = 100;
export const PLAYER_ATK = 10;
export const INVULN_TIME = 0.6;       // s
export const KNOCKBACK = 10;          // px
export const FAINT_TIME = 2;          // s
export const HIT_FLASH_TIME = 0.15;   // s
export const MONSTER_ATTACK_LEAVE_FACTOR = 1.3;
export const MONSTER_STUCK_TIME = 2;  // s without movement while chasing → return

// Interaction
export const INTERACT_RANGE = 40;     // px
export const ENTRANCE_GRACE = 1;      // s after spawn during which the exit zone is ignored

// Points
export const CARD_READ_POINTS = 5;

// Avatar room
export const ROOM_COLS = 8;
export const ROOM_ROWS = 6;

// Minigame defaults
export const QUIZ_COUNT = 5;
export const QUIZ_PASS = 4;

// ZEP-style presence (spec 6)
export const EMOTE_SHOW_MS = 2000;   // emoji bubble lifetime
export const BUBBLE_RANGE = 96;      // px: NPC speech bubble shows within this distance
export const MINIMAP_SCALE = 4;      // px per tile on the minimap (40×30 → 160×120)
