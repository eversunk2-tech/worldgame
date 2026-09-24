// Name → 16px cell → packed, upscaled Phaser texture (spec 5.2 step 3). Frames are addressable by name (sprites) and
// by index (Tilemap tilesets, which are told the same margin/spacing so index i lands on cell i).
import Phaser from 'phaser';
import { ART_PX, type SheetId } from './manifest';
import { flipX, makeCanvas, missingCell, recolor, scaleCanvas, shift } from './pixelArt';
import { vendorSheets } from './vendorSheets';

export interface CellRef { sheet: SheetId; index: number; recolor?: number; shift?: [number, number]; flipX?: boolean }
export interface CodeRef { code: string; color?: number }
export type LayerRef = CellRef | CodeRef;
export type TileEntry = LayerRef | { layers: LayerRef[] };
export type CodeDrawer = (ctx: CanvasRenderingContext2D, color?: number) => void;

export const isCode = (e: LayerRef): e is CodeRef => 'code' in e;

/** Draw a {code} entry into a fresh 16×16 cell. */
export function drawCode(drawers: Record<string, CodeDrawer>, ref: CodeRef): HTMLCanvasElement | null {
  const fn = drawers[ref.code];
  if (!fn) return null;
  const { canvas, ctx } = makeCanvas(ART_PX, ART_PX);
  fn(ctx, ref.color);
  return canvas;
}

function resolveLayer(ref: LayerRef, drawers: Record<string, CodeDrawer>): HTMLCanvasElement | null {
  if (isCode(ref)) return drawCode(drawers, ref);
  let cell = vendorSheets.cell(ref.sheet, ref.index);
  if (!cell) return null;
  if (ref.recolor !== undefined) cell = recolor(cell, ref.recolor);
  if (ref.flipX) cell = flipX(cell);
  if (ref.shift) cell = shift(cell, ref.shift[0], ref.shift[1]);
  return cell;
}

/** Resolve an entry to a 16×16 canvas; null when a sheet cell is unavailable and nothing can stand in. */
export function resolveEntry(entry: TileEntry, drawers: Record<string, CodeDrawer>): HTMLCanvasElement | null {
  if ('layers' in entry) {
    const { canvas, ctx } = makeCanvas(ART_PX, ART_PX);
    let any = false;
    for (const layer of entry.layers) {
      const c = resolveLayer(layer, drawers);
      if (!c) continue;
      any = true;
      ctx.drawImage(c, 0, 0);
    }
    return any ? canvas : null;
  }
  return resolveLayer(entry, drawers);
}

export interface BuiltAtlas {
  key: string;
  scale: number;
  cellSize: number;
  margin: number;
  spacing: number;
  columns: number;
  canvas: HTMLCanvasElement;
  names: string[];
  missing: string[];
  has(name: string): boolean;
  /** Tilemap tile index (== frame position) for a name; -1 when unknown. */
  frameIndex(name: string): number;
  /** Frame name usable with `scene.add.image(x, y, atlas.key, frameName)`. */
  frameName(name: string): string;
}

export interface BuildOptions { scale: number; columns?: number; extrude?: boolean }

/**
 * Pack `cells` (name → 16×16 canvas, insertion order = tile index) into one texture. Each frame is scaled with
 * nearest-neighbour, separated by `spacing` px and (optionally) extruded 1px into the gap so texture bleeding
 * never shows a neighbour's colour at tile edges.
 */
export function buildAtlas(scene: Phaser.Scene, key: string, cells: Map<string, HTMLCanvasElement | null>, opts: BuildOptions): BuiltAtlas {
  const scale = opts.scale;
  const cs = ART_PX * scale;
  const extrude = opts.extrude !== false;
  const spacing = extrude ? 2 : 0;
  const margin = extrude ? 2 : 0;
  const names = [...cells.keys()];
  const columns = Math.max(1, Math.min(opts.columns ?? 32, names.length));
  const rows = Math.max(1, Math.ceil(names.length / columns));
  const width = margin * 2 + columns * (cs + spacing) - spacing;
  const height = margin * 2 + rows * (cs + spacing) - spacing;
  const { canvas, ctx } = makeCanvas(width, height);
  const missing: string[] = [];
  const pos = (i: number) => ({ x: margin + (i % columns) * (cs + spacing), y: margin + Math.floor(i / columns) * (cs + spacing) });

  names.forEach((name, i) => {
    let cell = cells.get(name) ?? null;
    if (!cell) { missing.push(name); cell = missingCell(); }
    const big = scaleCanvas(cell, scale);
    const { x, y } = pos(i);
    ctx.drawImage(big, x, y);
    if (extrude) {
      ctx.drawImage(big, 0, 0, cs, 1, x, y - 1, cs, 1);
      ctx.drawImage(big, 0, cs - 1, cs, 1, x, y + cs, cs, 1);
      ctx.drawImage(big, 0, 0, 1, cs, x - 1, y, 1, cs);
      ctx.drawImage(big, cs - 1, 0, 1, cs, x + cs, y, 1, cs);
      ctx.drawImage(big, 0, 0, 1, 1, x - 1, y - 1, 1, 1);
      ctx.drawImage(big, cs - 1, 0, 1, 1, x + cs, y - 1, 1, 1);
      ctx.drawImage(big, 0, cs - 1, 1, 1, x - 1, y + cs, 1, 1);
      ctx.drawImage(big, cs - 1, cs - 1, 1, 1, x + cs, y + cs, 1, 1);
    }
  });
  if (missing.length) console.warn(`[atlas ${key}] ${missing.length} missing mapping(s) drawn pink: ${missing.join(', ')}`);

  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, canvas);
  if (tex) names.forEach((name, i) => { const { x, y } = pos(i); tex.add(name, 0, x, y, cs, cs); });

  const index = new Map(names.map((n, i) => [n, i] as const));
  return {
    key, scale, cellSize: cs, margin, spacing, columns, canvas, names, missing,
    has: (name) => index.has(name),
    frameIndex: (name) => index.get(name) ?? -1,
    frameName: (name) => (index.has(name) ? name : names[0] ?? ''),
  };
}
