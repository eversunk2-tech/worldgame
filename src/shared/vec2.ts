// Pure 2D vector helpers. Never mutate inputs.
import type { Vec2 } from './types';

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const normalize = (a: Vec2): Vec2 => {
  const l = length(a);
  return l > 1e-8 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
};
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
