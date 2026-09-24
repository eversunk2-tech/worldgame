// Asset keys and vendor sheet locations (spec 3.3, 5.2). Every scene names textures through TEX so the art pipeline
// (Kenney sheets → atlases, code-generated sprites, fallbacks) can change without touching scenes.

export type SheetId = 'rpg' | 'city' | 'char' | 'indoor';

/** Vendor sheets downloaded by scripts/fetch-assets.mjs; `id` is the manifest.json key. */
export const VENDOR_SHEETS: Record<SheetId, { id: string; png: string }> = {
  rpg: { id: 'kenney-roguelike-rpg', png: 'assets/vendor/kenney-roguelike-rpg/sheet.png' },
  city: { id: 'kenney-roguelike-city', png: 'assets/vendor/kenney-roguelike-city/sheet.png' },
  char: { id: 'kenney-roguelike-characters', png: 'assets/vendor/kenney-roguelike-characters/sheet.png' },
  indoor: { id: 'kenney-roguelike-indoors', png: 'assets/vendor/kenney-roguelike-indoors/sheet.png' },
};
export const VENDOR_MANIFEST_URL = 'assets/vendor/manifest.json';
export const VENDOR_MANIFEST_KEY = 'vendor-manifest';

/** Source art is 16px; the world shows it at 2× (32px tiles), the avatar room at 3× (48px cells). */
export const ART_PX = 16;
export const TILE_SCALE = 2;
export const ROOM_SCALE = 3;

export const CHAR_FRAME = 32;
export const CHAR_COLS = 3;
export const CHAR_ROWS = 4;
export const CHAR_SHEET_W = CHAR_FRAME * CHAR_COLS; // 96
export const CHAR_SHEET_H = CHAR_FRAME * CHAR_ROWS; // 128

/** Texture key helpers so every scene names things the same way. */
export const TEX = {
  tiles: 'atlas:tiles',
  room: 'atlas:room',
  worldmap: 'worldmap',
  sign: 'sign',
  shadow: 'shadow',
  sheet: (id: SheetId) => `sheet:${id}`,
  monster: (id: string) => `monster:${id}`,
  furniture: (itemId: string) => `fur:${itemId}`,
  icon: (name: string) => `icon:${name}`,
  landmark: (kind: string) => `landmark:${kind}`,
  emote: (id: string) => `emote:${id}`,
  ui: (name: string) => `ui:${name}`,
  part: (itemId: string) => `part:${itemId}`,
  avatar: (body: string, top: string, hair: string, hat: string | null) => `avatar:${body}:${top}:${hair}:${hat ?? 'none'}`,
} as const;

/** Row order of the character sheet. */
export const FACING_ROWS = { down: 0, left: 1, right: 2, up: 3 } as const;
