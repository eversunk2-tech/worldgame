// Pure {x,y,z} vector utilities. Never mutate inputs unless the name says so.
import type { Vec3 } from './types';

export const vec = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const clone = (v: Vec3): Vec3 => ({ x: v.x, y: v.y, z: v.z });
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });
export const length = (a: Vec3): number => Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a);
  return l > 1e-8 ? scale(a, 1 / l) : vec();
};
export const dist = (a: Vec3, b: Vec3): number => length(sub(a, b));
export const distXZ = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
};
/** Copy b into a (in place). */
export const set = (a: Vec3, b: Vec3): Vec3 => {
  a.x = b.x; a.y = b.y; a.z = b.z;
  return a;
};
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
/** Wrap an angle to (-PI, PI]. */
export const wrapAngle = (a: number): number => {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r <= -Math.PI) r += Math.PI * 2;
  return r;
};
