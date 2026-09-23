// Canvas-texture text sprites (name tags, HP bars). Redraw only when content changes.
import * as THREE from 'three';

export interface LabelOptions {
  font?: string;
  color?: string;
  background?: string;
  width?: number;   // canvas px
  height?: number;  // canvas px
  scale?: number;   // world units for the sprite width
}

export class LabelSprite {
  readonly sprite: THREE.Sprite;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private lastKey = '';
  private readonly opts: Required<LabelOptions>;

  constructor(opts: LabelOptions = {}) {
    this.opts = {
      font: opts.font ?? 'bold 28px sans-serif',
      color: opts.color ?? '#ffffff',
      background: opts.background ?? 'rgba(0,0,0,0.45)',
      width: opts.width ?? 256,
      height: opts.height ?? 64,
      scale: opts.scale ?? 2,
    };
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.opts.width;
    this.canvas.height = this.opts.height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: this.texture, transparent: true, depthTest: false });
    this.sprite = new THREE.Sprite(mat);
    const aspect = this.opts.width / this.opts.height;
    this.sprite.scale.set(this.opts.scale, this.opts.scale / aspect, 1);
    this.sprite.renderOrder = 10;
  }

  /** Draw centered text. Skips redraw if unchanged. */
  setText(text: string): void {
    const key = 'T:' + text;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const { ctx, canvas, opts } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = opts.background;
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 10);
    ctx.fill();
    ctx.font = opts.font;
    ctx.fillStyle = opts.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    this.texture.needsUpdate = true;
  }

  /** Draw an HP bar. `ratio` is 0..1. Skips redraw if the quantized ratio is unchanged. */
  setBar(ratio: number, label?: string): void {
    const r = Math.max(0, Math.min(1, ratio));
    const key = 'B:' + Math.round(r * 100) + ':' + (label ?? '');
    if (key === this.lastKey) return;
    this.lastKey = key;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pad = 4;
    const barH = canvas.height - pad * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, pad, pad, canvas.width - pad * 2, barH, 6);
    ctx.fill();
    ctx.fillStyle = r > 0.5 ? '#4caf50' : r > 0.25 ? '#ffb300' : '#e53935';
    const inner = (canvas.width - pad * 4) * r;
    if (inner > 0) {
      roundRect(ctx, pad * 2, pad * 2, inner, barH - pad * 2, 4);
      ctx.fill();
    }
    if (label) {
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    }
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.texture.dispose();
    (this.sprite.material as THREE.SpriteMaterial).dispose();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
