// Tile legend: ASCII char → tile id, name, collision flag (spec 5.3, v0.2: 27 kinds; ids 0-15 unchanged from v0.1).
// Rendering (ground / decoration / object frames) is decided by the client from the theme; collision is `solid` only.

export interface TileInfo { id: number; char: string; name: string; solid: boolean }

export const TILES: readonly TileInfo[] = [
  { id: 0, char: '.', name: 'grass', solid: false },
  { id: 1, char: ',', name: 'darkGrass', solid: false },
  { id: 2, char: '=', name: 'road', solid: false },
  { id: 3, char: '~', name: 'water', solid: true },
  { id: 4, char: 'B', name: 'bridge', solid: false },
  { id: 5, char: 'T', name: 'tree', solid: true },
  { id: 6, char: 'R', name: 'rock', solid: true },
  { id: 7, char: '#', name: 'building', solid: true },
  { id: 8, char: 'S', name: 'sand', solid: false },
  { id: 9, char: 's', name: 'darkSand', solid: false },
  { id: 10, char: 'F', name: 'farm', solid: false },
  { id: 11, char: 'Y', name: 'streetTree', solid: true },
  { id: 12, char: 'P', name: 'landmark', solid: true },
  { id: 13, char: 'W', name: 'wall', solid: true },
  { id: 14, char: 'E', name: 'entrance', solid: false },
  { id: 15, char: '*', name: 'flower', solid: false },
  { id: 16, char: '-', name: 'sidewalk', solid: false },
  { id: 17, char: 'x', name: 'crosswalk', solid: false },
  { id: 18, char: 'p', name: 'palm', solid: true },
  { id: 19, char: 'd', name: 'dirt', solid: false },
  { id: 20, char: 'f', name: 'fence', solid: true },
  { id: 21, char: 'b', name: 'bench', solid: true },
  { id: 22, char: 'l', name: 'lamp', solid: true },
  { id: 23, char: 't', name: 'cafeTable', solid: true },
  { id: 24, char: 'm', name: 'stall', solid: true },
  { id: 25, char: 'v', name: 'car', solid: true },
  { id: 26, char: 'Q', name: 'plaza', solid: false },
];

export const TILE_COUNT = TILES.length;
export const ENTRANCE_TILE_ID = 14;

const BY_CHAR: Record<string, TileInfo> = Object.fromEntries(TILES.map((t) => [t.char, t]));

export function tileForChar(ch: string): TileInfo | undefined {
  return BY_CHAR[ch];
}

export function tileIdForChar(ch: string): number {
  return BY_CHAR[ch]?.id ?? 0;
}

export function isSolidId(id: number): boolean {
  return TILES[id]?.solid ?? true;
}

export const SOLID_TILE_IDS: readonly number[] = TILES.filter((t) => t.solid).map((t) => t.id);

/** Convert ASCII rows to a 2D id grid. Unknown chars become grass (0). */
export function rowsToGrid(rows: readonly string[]): number[][] {
  return rows.map((row) => Array.from(row, (ch) => tileIdForChar(ch)));
}

export function isWalkable(rows: readonly string[], tx: number, ty: number): boolean {
  const row = rows[ty];
  if (!row || tx < 0 || tx >= row.length) return false;
  const t = tileForChar(row[tx]!);
  return t !== undefined && !t.solid;
}
