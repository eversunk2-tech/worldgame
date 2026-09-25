// World map labels and city markers (spec 5.8, 8.1, 8.2). Positions derive from lon/lat (equirectangular 960×540).
import type { CityId, CityMarker, ContinentId, UnlockRule } from '../types';

export const WORLD_W = 960;
export const WORLD_H = 540;

export interface MapLabel { id: string; name: string; lonLat: [number, number]; kind: 'continent' | 'ocean' }

export const CONTINENT_NAMES: Record<ContinentId, string> = {
  asia: '아시아', europe: '유럽', africa: '아프리카',
  north_america: '북아메리카', south_america: '남아메리카', oceania: '오세아니아',
};

export const CONTINENT_LABELS: readonly MapLabel[] = [
  { id: 'asia', name: '아시아', lonLat: [95, 45], kind: 'continent' },
  { id: 'europe', name: '유럽', lonLat: [20, 55], kind: 'continent' },
  { id: 'africa', name: '아프리카', lonLat: [20, 5], kind: 'continent' },
  { id: 'north_america', name: '북아메리카', lonLat: [-100, 45], kind: 'continent' },
  { id: 'south_america', name: '남아메리카', lonLat: [-63, -8], kind: 'continent' }, // clear of the Rio marker (review Stage C L9)
  { id: 'oceania', name: '오세아니아', lonLat: [128, -20], kind: 'continent' }, // clear of the Sydney marker (review Stage C L9)
];

export const OCEAN_LABELS: readonly MapLabel[] = [
  { id: 'pacific', name: '태평양', lonLat: [-150, 0], kind: 'ocean' },
  { id: 'atlantic', name: '대서양', lonLat: [-35, 15], kind: 'ocean' },
  { id: 'indian', name: '인도양', lonLat: [78, -25], kind: 'ocean' },
  { id: 'arctic', name: '북극해', lonLat: [0, 80], kind: 'ocean' },
  { id: 'southern', name: '남극해', lonLat: [0, -70], kind: 'ocean' },
];

/**
 * Unlock rule A (spec 8.2, 14.2 — free travel): turning in Seoul's quiz + OX opens the other five cities at once.
 * A sequential route later only needs different `missionIds` per marker (e.g. cairo ← ['m_paris_quiz']).
 */
export const FREE_TRAVEL_UNLOCK: UnlockRule = { type: 'missionsTurnedIn', missionIds: ['m_seoul_quiz', 'm_seoul_ox'] };

export const CITY_MARKERS: readonly CityMarker[] = [
  { cityId: 'seoul', name: '서울', continent: 'asia', country: '대한민국', lonLat: [126.98, 37.57], status: 'playable', unlock: { type: 'always' } },
  { cityId: 'paris', name: '파리', continent: 'europe', country: '프랑스', lonLat: [2.35, 48.86], status: 'playable', unlock: FREE_TRAVEL_UNLOCK },
  { cityId: 'beijing', name: '베이징', continent: 'asia', country: '중국', lonLat: [116.4, 39.9], status: 'comingSoon', unlock: { type: 'always' } },
  { cityId: 'london', name: '런던', continent: 'europe', country: '영국', lonLat: [-0.13, 51.51], status: 'comingSoon', unlock: { type: 'always' } },
  { cityId: 'cairo', name: '카이로', continent: 'africa', country: '이집트', lonLat: [31.24, 30.04], status: 'playable', unlock: FREE_TRAVEL_UNLOCK },
  { cityId: 'newyork', name: '뉴욕', continent: 'north_america', country: '미국', lonLat: [-74.01, 40.71], status: 'playable', unlock: FREE_TRAVEL_UNLOCK },
  { cityId: 'rio', name: '리우데자네이루', continent: 'south_america', country: '브라질', lonLat: [-43.17, -22.91], status: 'playable', unlock: FREE_TRAVEL_UNLOCK },
  { cityId: 'sydney', name: '시드니', continent: 'oceania', country: '오스트레일리아', lonLat: [151.21, -33.87], status: 'playable', unlock: FREE_TRAVEL_UNLOCK },
  { cityId: 'nairobi', name: '나이로비', continent: 'africa', country: '케냐', lonLat: [36.82, -1.29], status: 'comingSoon', unlock: { type: 'always' } },
];

export function getMarker(cityId: CityId): CityMarker {
  const m = CITY_MARKERS.find((c) => c.cityId === cityId);
  if (!m) throw new Error(`Unknown city marker: ${cityId}`);
  return m;
}

/** Equirectangular projection onto the 960×540 map. */
export function lonLatToXY(lonLat: [number, number], w = WORLD_W, h = WORLD_H): { x: number; y: number } {
  const [lon, lat] = lonLat;
  return { x: ((lon + 180) / 360) * w, y: ((90 - lat) / 180) * h };
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
