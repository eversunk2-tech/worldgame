// 16-grid pixel-art helpers (spec 5.1, 5.5). Everything here draws on plain HTMLCanvasElements at art resolution
// (1 canvas px = 1 art px); atlasBuilder / registerSheet upscale with nearest-neighbour when registering textures.
import Phaser from 'phaser';
import { ART_PX } from './manifest';

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  // art canvases are read back often (recolor, legLift, outlines) → willReadFrequently keeps them CPU-side
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D canvas context unavailable');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

/** A blank 16×16 art cell. */
export function newCell(): { canvas: HTMLCanvasElement; ctx: Ctx } {
  return makeCanvas(ART_PX, ART_PX);
}

export const hex = (c: number): string => `#${(c >>> 0).toString(16).padStart(6, '0')}`;

export function shade(c: number, f: number): number {
  const r = Math.max(0, Math.min(255, Math.round(((c >> 16) & 0xff) * f)));
  const g = Math.max(0, Math.min(255, Math.round(((c >> 8) & 0xff) * f)));
  const b = Math.max(0, Math.min(255, Math.round((c & 0xff) * f)));
  return (r << 16) | (g << 8) | b;
}

const fill = (ctx: Ctx, c: number | string): void => { ctx.fillStyle = typeof c === 'number' ? hex(c) : c; };

/** One art pixel. */
export function px(ctx: Ctx, x: number, y: number, c: number | string): void {
  fill(ctx, c);
  ctx.fillRect(x, y, 1, 1);
}
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: number | string): void {
  if (w <= 0 || h <= 0) return;
  fill(ctx, c);
  ctx.fillRect(x, y, w, h);
}
export function hline(ctx: Ctx, x0: number, x1: number, y: number, c: number | string): void {
  rect(ctx, Math.min(x0, x1), y, Math.abs(x1 - x0) + 1, 1, c);
}
export function vline(ctx: Ctx, x: number, y0: number, y1: number, c: number | string): void {
  rect(ctx, x, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, c);
}
export function outline(ctx: Ctx, x: number, y: number, w: number, h: number, c: number | string): void {
  hline(ctx, x, x + w - 1, y, c); hline(ctx, x, x + w - 1, y + h - 1, c);
  vline(ctx, x, y, y + h - 1, c); vline(ctx, x + w - 1, y, y + h - 1, c);
}
/** Filled triangle rasterised pixel by pixel (so it stays crisp at 1 art px). */
export function tri(ctx: Ctx, a: [number, number], b: [number, number], c: [number, number], col: number | string): void {
  const minX = Math.min(a[0], b[0], c[0]), maxX = Math.max(a[0], b[0], c[0]);
  const minY = Math.min(a[1], b[1], c[1]), maxY = Math.max(a[1], b[1], c[1]);
  const edge = (p: [number, number], q: [number, number], x: number, y: number) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      const e0 = edge(a, b, cx, cy), e1 = edge(b, c, cx, cy), e2 = edge(c, a, cx, cy);
      if ((e0 >= 0 && e1 >= 0 && e2 >= 0) || (e0 <= 0 && e1 <= 0 && e2 <= 0)) px(ctx, x, y, col);
    }
  }
}
/** Filled disc (centre in px, radius in px). */
export function disc(ctx: Ctx, cx: number, cy: number, r: number, c: number | string): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) px(ctx, x, y, c);
    }
  }
}

export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

export function flipX(src: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

export function shift(src: HTMLCanvasElement, dx: number, dy: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(src.width, src.height);
  ctx.drawImage(src, dx, dy);
  return canvas;
}

/** Nearest-neighbour upscale by an integer factor. */
export function scaleCanvas(src: HTMLCanvasElement, k: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(src.width * k, src.height * k);
  ctx.drawImage(src, 0, 0, src.width * k, src.height * k);
  return canvas;
}

/** Stack cells (all the same size) in order, first at the bottom. */
export function compositeCells(cells: readonly HTMLCanvasElement[]): HTMLCanvasElement {
  const first = cells[0];
  const { canvas, ctx } = makeCanvas(first?.width ?? ART_PX, first?.height ?? ART_PX);
  for (const c of cells) ctx.drawImage(c, 0, 0);
  return canvas;
}

const lum = (r: number, g: number, b: number): number => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

/** Most frequent opaque colour, or null when the canvas is empty. */
export function dominantColor(src: HTMLCanvasElement): number | null {
  const ctx = src.getContext('2d')!;
  const d = ctx.getImageData(0, 0, src.width, src.height).data;
  const counts = new Map<number, number>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3]! < 128) continue;
    const c = (d[i]! << 16) | (d[i + 1]! << 8) | d[i + 2]!;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestN = 0;
  for (const [c, n] of counts) if (n > bestN) { best = c; bestN = n; }
  return best;
}

function rgbToHsl(c: number): [number, number, number] {
  const r = ((c >> 16) & 0xff) / 255, g = ((c >> 8) & 0xff) / 255, b = (c & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb(h: number, s: number, l: number): number {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

/**
 * Luminance-preserving tint (spec 5.2): every opaque pixel takes the target hue/saturation; its lightness is the
 * target lightness scaled by the pixel's luminance relative to the cell's dominant colour, so the dominant colour
 * becomes exactly `color`, highlights stay lighter and outlines stay darker. Alpha is untouched.
 */
export function recolor(src: HTMLCanvasElement, color: number): HTMLCanvasElement {
  const out = cloneCanvas(src);
  const ctx = out.getContext('2d')!;
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  const dom = dominantColor(src);
  const ref = dom === null ? 0.7 : Math.max(0.15, lum((dom >> 16) & 0xff, (dom >> 8) & 0xff, dom & 0xff));
  const [h, s, l] = rgbToHsl(color);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3]! === 0) continue;
    const L = lum(d[i]!, d[i + 1]!, d[i + 2]!) / ref;
    const c = hslToRgb(h, s, Math.max(0.03, Math.min(0.97, l * L)));
    d[i] = (c >> 16) & 0xff; d[i + 1] = (c >> 8) & 0xff; d[i + 2] = c & 0xff;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/** Bounds of the opaque pixels: [top, bottom] rows and [left, right] cols, or null when empty. */
export function opaqueBounds(src: HTMLCanvasElement): { top: number; bottom: number; left: number; right: number } | null {
  const d = src.getContext('2d')!.getImageData(0, 0, src.width, src.height).data;
  let top = -1, bottom = -1, left = src.width, right = -1;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      if (d[(y * src.width + x) * 4 + 3]! < 128) continue;
      if (top < 0) top = y;
      bottom = y;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  return top < 0 ? null : { top, bottom, left, right };
}

/**
 * Back view of a body part (spec 5.5): inside the head area (top 8 rows of the opaque region) every pixel that is
 * clearly darker than the skin — eyes, mouth — is painted with the dominant (skin) colour. Only interior pixels
 * (all four neighbours opaque) are touched, so the silhouette outline survives. (The Kenney bodies draw eyes as a
 * darker skin shade rather than black, so the spec's absolute < 90 threshold is applied relative to the skin.)
 */
export function eraseFace(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = cloneCanvas(src);
  const ctx = out.getContext('2d')!;
  const img = ctx.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  const skin = dominantColor(src);
  const b = opaqueBounds(src);
  if (skin === null || !b) return out;
  const sr = (skin >> 16) & 0xff, sg = (skin >> 8) & 0xff, sb = skin & 0xff;
  const skinL = lum(sr, sg, sb) * 255;
  const w = out.width;
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < out.height && d[(y * w + x) * 4 + 3]! >= 128;
  const src2 = src.getContext('2d')!.getImageData(0, 0, src.width, src.height).data; // untouched copy for neighbour tests
  const opaque0 = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < out.height && src2[(y * w + x) * 4 + 3]! >= 128;
  for (let y = b.top; y < Math.min(out.height, b.top + 8); y++) {
    for (let x = b.left; x <= b.right; x++) {
      const i = (y * w + x) * 4;
      if (!opaque(x, y)) continue;
      const interior = opaque0(x - 1, y) && opaque0(x + 1, y) && opaque0(x, y - 1) && opaque0(x, y + 1);
      if (!interior) continue;
      const L = lum(d[i]!, d[i + 1]!, d[i + 2]!) * 255;
      if (L < Math.max(90, skinL - 20)) { d[i] = sr; d[i + 1] = sg; d[i + 2] = sb; }
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/**
 * Walking frame (spec 5.5): the lowest opaque row is `feet`; pixels in rows feet-2..feet left/right of the centre
 * (x < 8 / x >= 8) are the legs. The chosen leg is lifted 1px (its bottom row emptied) and the body above bounces 1px.
 * The standing leg stays put, so the row the torso vacated above it is refilled with that leg's top row — otherwise
 * a 1px transparent seam opens between torso and leg (review Stage A #2). When the art already touches row 0
 * (caps, crowns) there is no headroom for the bounce: the body stays and only the lifted leg moves up, its top row
 * overwriting the torso's bottom row on that side — no pixel is ever clipped away.
 */
export function legLift(src: HTMLCanvasElement, side: 'left' | 'right'): HTMLCanvasElement {
  const b = opaqueBounds(src);
  if (!b) return cloneCanvas(src);
  const feet = b.bottom;
  const w = src.width, h = src.height;
  const sctx = src.getContext('2d')!;
  const sd = sctx.getImageData(0, 0, w, h).data;
  const { canvas, ctx } = makeCanvas(w, h);
  const out = ctx.createImageData(w, h);
  const od = out.data;
  const copy = (sx: number, sy: number, dx: number, dy: number) => {
    if (dx < 0 || dy < 0 || dx >= w || dy >= h) return;
    const si = (sy * w + sx) * 4, di = (dy * w + dx) * 4;
    if (sd[si + 3]! === 0) return;
    od[di] = sd[si]!; od[di + 1] = sd[si + 1]!; od[di + 2] = sd[si + 2]!; od[di + 3] = sd[si + 3]!;
  };
  const legTop = feet - 2;
  const lifted = (x: number) => (side === 'left' ? x < w / 2 : x >= w / 2);
  const bounce = b.top >= 1 ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y < legTop) copy(x, y, x, y - bounce); // body bounce (only with headroom)
      else copy(x, y, x, lifted(x) ? y - 1 : y);
    }
  }
  // standing side (bounced case): the torso moved up but the leg did not → refill row legTop-1 from the leg's top row
  if (bounce && legTop >= 1) {
    for (let x = 0; x < w; x++) {
      if (lifted(x)) continue;
      const wasBody = sd[((legTop - 1) * w + x) * 4 + 3]! !== 0;
      const nowEmpty = od[((legTop - 1) * w + x) * 4 + 3]! === 0;
      if (wasBody && nowEmpty) copy(x, legTop, x, legTop - 1);
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Side-facing hint (spec 5.5): the head (first 5 opaque rows) slides `dx` px sideways. */
export function lean(src: HTMLCanvasElement, dx: number): HTMLCanvasElement {
  const b = opaqueBounds(src);
  if (!b) return cloneCanvas(src);
  const { canvas, ctx } = makeCanvas(src.width, src.height);
  const headH = 5;
  ctx.drawImage(src, 0, b.top, src.width, headH, dx, b.top, src.width, headH);
  ctx.drawImage(src, 0, b.top + headH, src.width, src.height - b.top - headH, 0, b.top + headH, src.width, src.height - b.top - headH);
  return canvas;
}

/** Register a canvas as a texture with fixed-size frames numbered 0..n-1 (row-major). Skips if it already exists. */
export function registerSheet(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement, fw: number, fh: number): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.addCanvas(key, canvas);
  if (!tex) return;
  const cols = Math.floor(canvas.width / fw);
  const rows = Math.floor(canvas.height / fh);
  let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tex.add(i++, 0, c * fw, r * fh, fw, fh);
}

export function registerImage(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, canvas);
}

/** Pink 16×16 cell that marks a missing mapping (spec 3.6). */
export function missingCell(): HTMLCanvasElement {
  const { canvas, ctx } = newCell();
  rect(ctx, 0, 0, 16, 16, 0xff00ff);
  rect(ctx, 0, 0, 8, 8, 0xff66ff);
  rect(ctx, 8, 8, 8, 8, 0xff66ff);
  return canvas;
}
