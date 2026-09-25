// Map find (spec 7.2): seeded targets; each click (lon/lat) is judged once, then the game moves on. A city counts when
// the click is within MAPFIND_CITY_RADIUS_PX of its marker on the 960×540 map and no other marker is closer; a region
// counts when geo.resolveRegion (land mask + continent/ocean polygons) names it. A wrong click near a city says so.
import type { CityId, MapTarget, MinigameResult, RegionId } from '../../types';
import { MAPFIND_CITY_RADIUS_PX } from '../../constants';
import { CITY_MARKERS } from '../../content/continents';
import { REGION_NAMES } from '../../content/regions';
import { mulberry32 } from '../../rng';
import { distancePx, lonLatToXY, resolveRegion } from '../geo';
import { wrongSpec, type ActFeedback, type MapFindSpec, type MinigameLogic } from './types';

export type MapAnswer =
  | { type: 'city'; cityId: CityId; name: string; lonLat: [number, number] }
  | { type: 'region'; regionId: RegionId; name: string };

export interface MapFindAnswer { targetId: string; lon: number; lat: number; correct: boolean }

export interface MapFindState {
  spec: MapFindSpec;
  targets: MapTarget[];
  index: number;
  correct: number;
  answers: MapFindAnswer[];
  passCount: number;
}

export type MapFindAction = { lon: number; lat: number };
export interface MapFindFeedback extends ActFeedback {
  outcome: 'ignored' | 'answered';
  /** where the right answer is (shown after every answer) */
  answer?: MapAnswer;
  /** wrong answers: the city marker the click landed near, if any */
  near?: string;
}

export interface MapFindLogic extends MinigameLogic<MapFindState, MapFindAction> {
  act(s: MapFindState, a: MapFindAction): MapFindFeedback;
  current(s: MapFindState): MapTarget | null;
}

/** Name + location of a target's answer. Unknown city ids (bad content) fall back to (0,0). */
export function answerOf(target: MapTarget): MapAnswer {
  if (target.target.type === 'region') return { type: 'region', regionId: target.target.id, name: REGION_NAMES[target.target.id] };
  const cityId = target.target.id;
  const marker = CITY_MARKERS.find((m) => m.cityId === cityId);
  return { type: 'city', cityId, name: marker?.name ?? cityId, lonLat: marker ? [marker.lonLat[0], marker.lonLat[1]] : [0, 0] };
}

/** The city marker closest to a click (960×540 map px, wrapping east–west). */
export function nearestMarker(lon: number, lat: number): { cityId: CityId; name: string; distPx: number } | null {
  const p = lonLatToXY([lon, lat]);
  let best: { cityId: CityId; name: string; distPx: number } | null = null;
  for (const m of CITY_MARKERS) {
    const d = distancePx(p, lonLatToXY(m.lonLat));
    if (!best || d < best.distPx) best = { cityId: m.cityId, name: m.name, distPx: d };
  }
  return best;
}

/** Is a click at (lon, lat) a right answer for `target`? Cities: within the radius and the nearest marker. */
export function judgeMapTarget(target: MapTarget, lon: number, lat: number): boolean {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  const answer = answerOf(target);
  if (answer.type === 'city') {
    const nearest = nearestMarker(lon, lat);
    return !!nearest && nearest.cityId === answer.cityId && nearest.distPx <= MAPFIND_CITY_RADIUS_PX;
  }
  return resolveRegion(lon, lat) === answer.regionId;
}

/** Korean object particle 을/를 by the last syllable's final consonant (pure string math). */
function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '를';
  return (code - 0xac00) % 28 === 0 ? '를' : '을';
}

export const mapfindLogic: MapFindLogic = {
  kind: 'mapfind',
  create(spec, pool, seed) {
    if (spec.kind !== 'mapfind') throw wrongSpec('mapfind', spec);
    const rng = mulberry32(seed);
    const targets = rng.shuffle(pool.mapTargets.filter((t) => t.cityId === spec.cityId)).slice(0, spec.count);
    return { spec, targets, index: 0, correct: 0, answers: [], passCount: Math.min(spec.passCount, targets.length) };
  },
  current(s) {
    return s.targets[s.index] ?? null;
  },
  act(s, a): MapFindFeedback {
    const target = s.targets[s.index];
    if (!target || !a || !Number.isFinite(a.lon) || !Number.isFinite(a.lat)) return { correct: false, explanation: '', outcome: 'ignored' };
    const correct = judgeMapTarget(target, a.lon, a.lat);
    if (correct) s.correct += 1;
    s.answers.push({ targetId: target.id, lon: a.lon, lat: a.lat, correct });
    s.index += 1;
    const answer = answerOf(target);
    if (correct) return { correct, explanation: `${answer.name}${objectParticle(answer.name)} 찾았어요`, outcome: 'answered', answer };
    // a wrong click close to some city: name it ("거기는 서울 근처예요") before the hint
    const nearest = nearestMarker(a.lon, a.lat);
    const near = nearest && nearest.distPx <= MAPFIND_CITY_RADIUS_PX ? nearest.name : undefined;
    const explanation = `${near ? `거기는 ${near} 근처예요. ` : ''}힌트: ${target.hint}`;
    return near ? { correct, explanation, outcome: 'answered', answer, near } : { correct, explanation, outcome: 'answered', answer };
  },
  isDone(s) {
    return s.index >= s.targets.length;
  },
  result(s): MinigameResult {
    return {
      kind: 'mapfind', success: s.targets.length > 0 && s.correct >= s.passCount, correct: s.correct, total: s.targets.length,
      answeredIds: s.answers.map((x) => x.targetId),
    };
  },
};
