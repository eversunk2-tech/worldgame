// Kenney vendor sheets → 16×16 cells (spec 5.2 step 2). The sheets use 16px cells with 1px spacing, so cell
// (col,row) sits at (col*17, row*17); copying the 16×16 block skips the spacing, no Phaser `spacing` needed.
import Phaser from 'phaser';
import { ART_PX, TEX, VENDOR_SHEETS, type SheetId } from './manifest';
import { makeCanvas } from './pixelArt';

const PITCH = ART_PX + 1;

export interface SheetManifestEntry { cols: number; rows: number; width: number; height: number }
export type VendorManifest = Record<string, SheetManifestEntry>;

interface LoadedSheet { cols: number; rows: number; image: CanvasImageSource }

class VendorSheets {
  private sheets = new Map<SheetId, LoadedSheet>();
  private cache = new Map<string, HTMLCanvasElement>();
  private warned = new Set<string>();

  /** Pick up the sheets Boot managed to load. Missing sheets simply stay unavailable (fallback art is used). */
  init(scene: Phaser.Scene, manifest: VendorManifest | null): void {
    this.sheets.clear();
    this.cache.clear();
    for (const id of Object.keys(VENDOR_SHEETS) as SheetId[]) {
      const key = TEX.sheet(id);
      if (!scene.textures.exists(key)) continue;
      const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const w = src.width;
      const h = src.height;
      const entry = manifest?.[VENDOR_SHEETS[id].id];
      // trust the manifest, but fall back to the image grid so a stale manifest cannot break cell lookup
      const cols = entry?.cols ?? Math.floor((w + 1) / PITCH);
      const rows = entry?.rows ?? Math.floor((h + 1) / PITCH);
      if (entry && (entry.width !== w || entry.height !== h)) console.warn(`[vendor] ${id}: manifest ${entry.width}x${entry.height} but image is ${w}x${h}`);
      this.sheets.set(id, { cols, rows, image: src });
    }
  }

  has(id: SheetId): boolean {
    return this.sheets.has(id);
  }

  /** All sheets present? (drives the "에셋 미설치" warning) */
  get complete(): boolean {
    return (Object.keys(VENDOR_SHEETS) as SheetId[]).every((id) => this.sheets.has(id));
  }

  cols(id: SheetId): number {
    return this.sheets.get(id)?.cols ?? 0;
  }

  /** 16×16 canvas copy of a cell, cached. Returns null when the sheet is missing or the index is out of range. */
  cell(id: SheetId, index: number): HTMLCanvasElement | null {
    const key = `${id}:${index}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const sheet = this.sheets.get(id);
    if (!sheet) return null;
    if (index < 0 || index >= sheet.cols * sheet.rows) {
      if (!this.warned.has(key)) { this.warned.add(key); console.warn(`[vendor] ${id} index ${index} out of range (${sheet.cols}x${sheet.rows})`); }
      return null;
    }
    const col = index % sheet.cols;
    const row = Math.floor(index / sheet.cols);
    const { canvas, ctx } = makeCanvas(ART_PX, ART_PX);
    ctx.drawImage(sheet.image, col * PITCH, row * PITCH, ART_PX, ART_PX, 0, 0, ART_PX, ART_PX);
    this.cache.set(key, canvas);
    return canvas;
  }
}

export const vendorSheets = new VendorSheets();
