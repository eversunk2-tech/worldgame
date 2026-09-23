// Single replacement point for art (spec 6.10). `source: null` → placeholder drawn by placeholders.ts;
// set a path under public/assets/ to load a real file instead.

export const ASSETS = {
  tiles: { key: 'tiles', frame: 32, source: null as string | null /* e.g. 'assets/tiles.png' */, columns: 1 },
  charLayers: { frame: 32, cols: 3, rows: 4, sources: {} as Partial<Record<string, string>> /* itemId → png path */ },
  monsters: { frame: 32, sources: {} as Partial<Record<string, string>> },
  worldmap: { key: 'worldmap', source: null as string | null },
  icons: { frame: 24, sources: {} as Partial<Record<string, string>> },
} as const;

export const CHAR_FRAME = ASSETS.charLayers.frame;
export const CHAR_COLS = ASSETS.charLayers.cols;
export const CHAR_ROWS = ASSETS.charLayers.rows;
export const CHAR_SHEET_W = CHAR_FRAME * CHAR_COLS; // 96
export const CHAR_SHEET_H = CHAR_FRAME * CHAR_ROWS; // 128

/** Texture key helpers so every scene names things the same way. */
export const TEX = {
  tiles: ASSETS.tiles.key,
  worldmap: ASSETS.worldmap.key,
  layer: (itemId: string) => `layer:${itemId}`,
  monster: (id: string) => `monster:${id}`,
  furniture: (itemId: string) => `fur:${itemId}`,
  icon: (name: string) => `icon:${name}`,
  sign: 'sign',
  avatar: (body: string, top: string, hair: string, hat: string | null) => `avatar:${body}:${top}:${hair}:${hat ?? 'none'}`,
} as const;

/** Row order of the character sheet. */
export const FACING_ROWS = { down: 0, left: 1, right: 2, up: 3 } as const;
