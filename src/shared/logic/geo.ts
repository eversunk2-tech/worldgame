// Pure geography helpers for the map-find minigame (spec 7.2): equirectangular projection (same as the world map),
// point-in-polygon with date-line handling, a land mask decoded from world-atlas land-110m (the same data the world
// map texture draws), region lookup and distances. No DOM / canvas: usable by a server as well.
import { feature } from 'topojson-client';
import type { GeometryCollection, GeometryObject, Topology } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import land110 from 'world-atlas/land-110m.json';
import type { RegionId } from '../types';
import { distanceKm, lonLatToXY, WORLD_H, WORLD_W } from '../content/continents';
import { ARCTIC_MIN_LAT, CONTINENT_REGION_IDS, OCEAN_REGION_IDS, REGIONS, SOUTHERN_MAX_LAT, type RegionPolygon } from '../content/regions';

export { distanceKm, lonLatToXY, WORLD_H, WORLD_W };

export interface Point { x: number; y: number }

/** Inverse of lonLatToXY on a `w`×`h` map. */
export function xyToLonLat(x: number, y: number, w = WORLD_W, h = WORLD_H): [number, number] {
  return [(x / w) * 360 - 180, 90 - (y / h) * 180];
}

/** Even-odd ray casting in raw lon/lat (no wrapping). */
function rayCast(lon: number, lat: number, poly: RegionPolygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Is (lon, lat) inside `poly`? Polygons may use longitudes beyond ±180 (the Pacific, Bering Strait), so the point
 * is also tried at lon + 360 and lon − 360 (date line).
 */
export function pointInPolygon(lon: number, lat: number, poly: RegionPolygon): boolean {
  return rayCast(lon, lat, poly) || rayCast(lon + 360, lat, poly) || rayCast(lon - 360, lat, poly);
}

// ---------------------------------------------------------------- land mask (world-atlas land-110m)

/** A land ring with continuous longitudes (no ±360 jumps) — see unwrapRing. */
export interface LandRing {
  points: [number, number][];
  /** the ring circles a pole (Antarctica): its unwrapped longitudes span 360° */
  polar: boolean;
}

interface PreparedRing { poly: [number, number][]; minLon: number; maxLon: number; minLat: number; maxLat: number }

/**
 * Make a ring's longitudes continuous: whenever the next point jumps by more than 180°, add ∓360 from then on.
 * Rings that cross the date line then read e.g. 170 … 190 instead of 170 … −170 (the source of the full-width
 * bands a naive drawing produces). A ring whose offset does not return to 0 goes round a pole.
 */
export function unwrapRing(ring: readonly Position[]): LandRing {
  const points: [number, number][] = [];
  let offset = 0;
  for (let k = 0; k < ring.length; k++) {
    const lon = ring[k]![0]!;
    const lat = ring[k]![1]!;
    if (k > 0) {
      const d = lon - ring[k - 1]![0]!;
      if (d > 180) offset -= 360;
      else if (d < -180) offset += 360;
    }
    points.push([lon + offset, lat]);
  }
  return { points, polar: offset !== 0 };
}

let landCache: { rings: LandRing[]; prepared: PreparedRing[] } | null = null;

function loadLand(): { rings: LandRing[]; prepared: PreparedRing[] } {
  if (landCache) return landCache;
  const topo = land110 as unknown as Topology;
  const obj = (topo.objects as Record<string, GeometryObject | GeometryCollection>).land;
  const rings: LandRing[] = [];
  if (obj) {
    const out = feature(topo, obj) as Feature | FeatureCollection;
    for (const f of out.type === 'FeatureCollection' ? out.features : [out]) {
      const g = f.geometry as Polygon | MultiPolygon | null;
      if (!g) continue;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      for (const p of polys) for (const r of p) rings.push(unwrapRing(r));
    }
  }
  const prepared = rings.map((r): PreparedRing => {
    let poly = r.points;
    if (r.polar) {
      // close a pole-circling ring through the pole so it becomes an ordinary polygon in unwrapped space
      const pole = r.points.reduce((s, p) => s + p[1], 0) < 0 ? -90 : 90;
      const first = r.points[0]!;
      const last = r.points[r.points.length - 1]!;
      poly = [...r.points, [last[0], pole], [first[0], pole]];
    }
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lon, lat] of poly) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return { poly, minLon, maxLon, minLat, maxLat };
  });
  landCache = { rings, prepared };
  return landCache;
}

/** Land outlines with continuous longitudes (for drawing: draw each at x offsets −w/0/+w; skip `polar` rings). */
export function landRings(): readonly LandRing[] {
  return loadLand().rings;
}

/** Land outlines closed as polygons (polar rings run through the pole) — the exact shapes isLand tests. */
export function landPolygons(): readonly (readonly [number, number][])[] {
  return loadLand().prepared.map((p) => p.poly);
}

/** Is (lon, lat) on land in world-atlas land-110m? Even-odd over all rings, so the Caspian hole is water. */
export function isLand(lon: number, lat: number): boolean {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  let inside = false;
  for (const r of loadLand().prepared) {
    if (lat < r.minLat || lat > r.maxLat) continue;
    for (const l of [lon, lon + 360, lon - 360, lon + 720, lon - 720]) {
      if (l < r.minLon || l > r.maxLon) continue;
      if (rayCast(l, lat, r.poly)) { inside = !inside; break; }
    }
  }
  return inside;
}

/**
 * Land → the continent polygon it falls in (null for Antarctica and remote islands such as Kerguelen).
 * Sea → Pacific / Atlantic / Indian polygon, else arctic (lat ≥ 68) or southern (lat ≤ −58), else null
 * (closed seas: Mediterranean, Black, Caspian, Baltic; also Hudson Bay, the White Sea, the Chukchi Sea below 68°N).
 */
export function resolveRegion(lon: number, lat: number): RegionId | null {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (isLand(lon, lat)) {
    for (const id of CONTINENT_REGION_IDS) if (pointInPolygon(lon, lat, REGIONS[id])) return id;
    return null;
  }
  for (const id of OCEAN_REGION_IDS) if (pointInPolygon(lon, lat, REGIONS[id])) return id;
  if (lat >= ARCTIC_MIN_LAT) return 'arctic';
  if (lat <= SOUTHERN_MAX_LAT) return 'southern';
  return null;
}

/**
 * Screen distance between two projected points on the `wrapWidth`-wide map. The map wraps east–west, so the
 * horizontal gap is the shorter way around.
 */
export function distancePx(a: Point, b: Point, wrapWidth = WORLD_W): number {
  const dx0 = Math.abs(a.x - b.x) % wrapWidth;
  const dx = Math.min(dx0, wrapWidth - dx0);
  return Math.hypot(dx, a.y - b.y);
}
