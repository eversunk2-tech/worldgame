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

// Minigame defaults (spec 7, 14.13: fail conditions; retries are unlimited)
export const QUIZ_COUNT = 5;
export const QUIZ_PASS = 4;
export const MATCH_PAIRS = 6;               // 12 cards (4×3)
export const MATCH_MAX_ATTEMPTS = 14;       // 6 pairs → 14 tries (8 pairs → MATCH_MAX_ATTEMPTS_8)
export const MATCH_PAIRS_8 = 8;             // 16 cards (4×4)
export const MATCH_MAX_ATTEMPTS_8 = 20;
export const MAPFIND_COUNT = 5;
export const MAPFIND_PASS = 4;
/**
 * A city click counts when it lands within this many px of the marker on the 960×540 map (≈ 8.3° of longitude)
 * AND that marker is the closest of all CITY_MARKERS (review round 2: Seoul/Beijing are 29px, Paris/London 10px apart).
 * 22px keeps Busan/Jeju (≤ 13px from Seoul) and Edinburgh (16px from London) but not Shanghai (24px) or Tokyo (34px).
 */
export const MAPFIND_CITY_RADIUS_PX = 22;
export const ORDER_COUNT = 2;
export const ORDER_PASS = 2;
export const ORDER_TRIES = 2;               // submissions per question before the answer is revealed
export const BLANK_COUNT = 4;
export const BLANK_PASS = 3;
/** Extra points on success by stars (spec 7.0): missions without stars count as 1★ → +0. */
export const STAR_BONUS: Readonly<Record<1 | 2 | 3, number>> = { 1: 0, 2: 5, 3: 10 };

// ZEP-style presence (spec 6)
export const EMOTE_SHOW_MS = 2000;   // emoji bubble lifetime
export const BUBBLE_RANGE = 96;      // px: NPC speech bubble shows within this distance
export const MINIMAP_SCALE = 4;      // px per tile on the minimap (40×30 → 160×120)
