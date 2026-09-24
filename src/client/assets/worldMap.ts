// World map texture from world-atlas land outlines (spec 5.8): 480×270 render → 2× nearest → 960×540 with a 1px
// land outline, 30° graticule and the equator. Markers use the same lonLatToXY projection, so positions match v0.1.
import Phaser from 'phaser';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection, GeometryObject } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import land110 from 'world-atlas/land-110m.json';
import { lonLatToXY, WORLD_H, WORLD_W } from '../../shared/content/continents';
import { TEX } from './manifest';
import { hex, makeCanvas, registerImage } from './pixelArt';

const OCEAN = 0x2f5f9e;
const LAND = 0x86c46a;
const OUTLINE = 0x4f8a3f;
const ICE = 0xe8f1f8;

function ringsOf(geometry: Polygon | MultiPolygon): Position[][] {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  return geometry.coordinates.flat();
}

function landRings(): Position[][] {
  const topo = land110 as unknown as Topology;
  const obj = (topo.objects as Record<string, GeometryObject | GeometryCollection>).land;
  if (!obj) throw new Error('world-atlas: objects.land missing');
  const out = feature(topo, obj) as Feature | FeatureCollection;
  const features = out.type === 'FeatureCollection' ? out.features : [out];
  const rings: Position[][] = [];
  for (const f of features) {
    const g = f.geometry;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') rings.push(...ringsOf(g));
  }
  return rings;
}

/** Build and register TEX.worldmap. Throws when the data cannot be decoded (Boot falls back to the polygon map). */
export function createWorldMapTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.worldmap)) return;
  const w = WORLD_W / 2, h = WORLD_H / 2;
  const small = makeCanvas(w, h);
  const sctx = small.ctx;
  sctx.fillStyle = hex(OCEAN);
  sctx.fillRect(0, 0, w, h);
  const path = new Path2D();
  for (const ring of landRings()) {
    ring.forEach(([lon, lat], i) => {
      const { x, y } = lonLatToXY([lon!, lat!], w, h);
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    });
    path.closePath();
  }
  sctx.fillStyle = hex(LAND);
  sctx.fill(path, 'evenodd');
  // Antarctica: ice below 60°S
  const iceY = lonLatToXY([0, -60], w, h).y;
  sctx.fillStyle = hex(ICE);
  sctx.fillRect(0, iceY, w, h - iceY);

  // 2× nearest, then outline land pixels that touch the ocean
  const big = makeCanvas(WORLD_W, WORLD_H);
  big.ctx.imageSmoothingEnabled = false;
  big.ctx.drawImage(small.canvas, 0, 0, WORLD_W, WORLD_H);
  const img = big.ctx.getImageData(0, 0, WORLD_W, WORLD_H);
  const d = img.data;
  const or = (OCEAN >> 16) & 0xff, og = (OCEAN >> 8) & 0xff, ob = OCEAN & 0xff;
  const lr = (LAND >> 16) & 0xff, lg = (LAND >> 8) & 0xff, lb = LAND & 0xff;
  const isOcean = (i: number) => d[i] === or && d[i + 1] === og && d[i + 2] === ob;
  const isLand = (i: number) => d[i] === lr && d[i + 1] === lg && d[i + 2] === lb;
  const edge: number[] = [];
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const i = (y * WORLD_W + x) * 4;
      if (!isLand(i)) continue;
      const n = y > 0 && isOcean(i - WORLD_W * 4), s = y < WORLD_H - 1 && isOcean(i + WORLD_W * 4);
      const wl = x > 0 && isOcean(i - 4), e = x < WORLD_W - 1 && isOcean(i + 4);
      if (n || s || wl || e) edge.push(i);
    }
  }
  for (const i of edge) { d[i] = (OUTLINE >> 16) & 0xff; d[i + 1] = (OUTLINE >> 8) & 0xff; d[i + 2] = OUTLINE & 0xff; }
  big.ctx.putImageData(img, 0, 0);

  const ctx = big.ctx;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let lon = -150; lon <= 150; lon += 30) { const { x } = lonLatToXY([lon, 0]); ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, WORLD_H); ctx.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { if (lat === 0) continue; const { y } = lonLatToXY([0, lat]); ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(WORLD_W, y + 0.5); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  { const { y } = lonLatToXY([0, 0]); ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(WORLD_W, y + 0.5); ctx.stroke(); }
  registerImage(scene, TEX.worldmap, big.canvas);
}
