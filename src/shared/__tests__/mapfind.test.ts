import { describe, expect, it } from 'vitest';
import type { MapTarget, MinigameSpec } from '../types';
import { minigamePool } from '../content';
import { getMarker } from '../content/continents';
import { lonLatToXY, xyToLonLat } from '../logic/geo';
import { MAPFIND_CITY_RADIUS_PX } from '../constants';
import { answerOf, judgeMapTarget, mapfindLogic, nearestMarker, type MapFindState } from '../logic/minigame/mapfind';
import { makePool } from '../logic/minigame/types';

const seoulSpec: MinigameSpec = { kind: 'mapfind', cityId: 'seoul', count: 5, passCount: 4 };
const parisSpec: MinigameSpec = { kind: 'mapfind', cityId: 'paris', count: 5, passCount: 4 };

const target = (id: string): MapTarget => [...minigamePool('seoul').mapTargets, ...minigamePool('paris').mapTargets].find((t) => t.id === id)!;

/** A click that is right for `t`: the marker itself, or a safe point inside the region. */
function rightClick(t: MapTarget): { lon: number; lat: number } {
  const a = answerOf(t);
  if (a.type === 'city') return { lon: a.lonLat[0], lat: a.lonLat[1] };
  const inside: Record<string, [number, number]> = { asia: [95, 45], europe: [10, 50], africa: [20, 5], pacific: [-150, 0], atlantic: [-35, 15] };
  const p = inside[a.regionId]!;
  return { lon: p[0], lat: p[1] };
}
/** Antarctica is wrong for every target in the Seoul/Paris data. */
const WRONG = { lon: 0, lat: -75 };

function play(s: MapFindState, rightCount: number): void {
  let n = 0;
  while (!mapfindLogic.isDone(s)) {
    const t = mapfindLogic.current(s)!;
    mapfindLogic.act(s, n < rightCount ? rightClick(t) : WRONG);
    n++;
  }
}

describe('mapfind logic', () => {
  it('picks the same targets for the same seed, all from the spec city', () => {
    const pool = minigamePool('seoul');
    const a = mapfindLogic.create(seoulSpec, pool, 11);
    expect(a.targets.map((t) => t.id)).toEqual(mapfindLogic.create(seoulSpec, pool, 11).targets.map((t) => t.id));
    expect(a.targets).toHaveLength(5);
    expect(new Set(a.targets.map((t) => t.id)).size).toBe(5);
    expect(a.targets.every((t) => t.cityId === 'seoul')).toBe(true);
    const orders = new Set([1, 2, 3, 4, 5, 6].map((seed) => mapfindLogic.create(seoulSpec, pool, seed).targets.map((t) => t.id).join()));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('city targets: within the 22px radius counts, 30px away does not', () => {
    expect(MAPFIND_CITY_RADIUS_PX).toBe(22);
    const seoul = target('seoul_t01');
    const m = lonLatToXY(getMarker('seoul').lonLat);
    const [nearLon, nearLat] = xyToLonLat(m.x + 12, m.y - 12);
    const [farLon, farLat] = xyToLonLat(m.x + 30, m.y);
    expect(judgeMapTarget(seoul, 127.5, 37)).toBe(true);
    expect(judgeMapTarget(seoul, nearLon, nearLat)).toBe(true);
    expect(judgeMapTarget(seoul, farLon, farLat)).toBe(false);
    expect(judgeMapTarget(seoul, 20, 5)).toBe(false); // middle of Africa
    expect(judgeMapTarget(target('paris_t05'), -0.13, 51.51)).toBe(true); // London
  });

  it('the nearest marker wins: a neighbouring capital inside the radius is still wrong (review round 2)', () => {
    const beijing = target('seoul_t04');
    const london = target('paris_t05');
    const seoul = target('seoul_t01');
    expect(judgeMapTarget(beijing, 126.98, 37.57)).toBe(false); // Seoul, 29px from Beijing
    expect(judgeMapTarget(london, 2.35, 48.86)).toBe(false); // Paris, 10px from London
    expect(judgeMapTarget(london, -2, 54)).toBe(true); // northern England
    expect(judgeMapTarget(london, -3.19, 55.95)).toBe(true); // Edinburgh
    expect(judgeMapTarget(seoul, 129.08, 35.18)).toBe(true); // Busan
    expect(judgeMapTarget(seoul, 126.53, 33.36)).toBe(true); // Jeju
    expect(judgeMapTarget(seoul, 139.69, 35.69)).toBe(false); // Tokyo
    expect(judgeMapTarget(seoul, 121.47, 31.23)).toBe(false); // Shanghai
    expect(nearestMarker(126.98, 37.57)).toMatchObject({ cityId: 'seoul', distPx: 0 });
  });

  it('a wrong click near a city names it before the hint', () => {
    const s = mapfindLogic.create(seoulSpec, makePool({ mapTargets: [target('seoul_t04')] }), 1);
    const fb = mapfindLogic.act(s, { lon: 126.98, lat: 37.57 });
    expect(fb).toMatchObject({ correct: false, near: '서울', explanation: `거기는 서울 근처예요. 힌트: ${target('seoul_t04').hint}` });
    const s2 = mapfindLogic.create(seoulSpec, makePool({ mapTargets: [target('seoul_t04')] }), 1);
    const far = mapfindLogic.act(s2, WRONG);
    expect(far.near).toBeUndefined();
    expect(far.explanation).toBe(`힌트: ${target('seoul_t04').hint}`);
  });

  it('region targets use land mask + polygons: Paris is Europe, the Mediterranean is not Africa or Europe', () => {
    expect(judgeMapTarget(target('paris_t02'), 2.35, 48.86)).toBe(true);
    expect(judgeMapTarget(target('seoul_t05'), 15, 35)).toBe(false);
    expect(judgeMapTarget(target('paris_t04'), 15, 35)).toBe(false);
    expect(judgeMapTarget(target('paris_t04'), 20, 5)).toBe(true);
    expect(judgeMapTarget(target('seoul_t03'), 179, 0)).toBe(true);
    expect(judgeMapTarget(target('seoul_t03'), -179, 0)).toBe(true);
    expect(judgeMapTarget(target('paris_t03'), -35, 15)).toBe(true);
  });

  it('one answer per target: right → "찾았어요", wrong → "힌트: …"; both reveal the answer location', () => {
    const s = mapfindLogic.create(seoulSpec, minigamePool('seoul'), 3);
    const first = mapfindLogic.current(s)!;
    const fb = mapfindLogic.act(s, WRONG);
    expect(fb).toMatchObject({ correct: false, explanation: `힌트: ${first.hint}`, outcome: 'answered' });
    expect(fb.answer).toEqual(answerOf(first));
    expect(s.index).toBe(1);
    const second = mapfindLogic.current(s)!;
    const ok = mapfindLogic.act(s, rightClick(second));
    expect(ok.correct).toBe(true);
    expect(ok.explanation).toMatch(/(을|를) 찾았어요$/);
    expect(s.answers.map((a) => a.correct)).toEqual([false, true]);
  });

  it('answer locations: cities carry the marker lon/lat and name, regions their Korean name', () => {
    expect(answerOf(target('seoul_t04'))).toEqual({ type: 'city', cityId: 'beijing', name: '베이징', lonLat: [116.4, 39.9] });
    expect(answerOf(target('seoul_t03'))).toEqual({ type: 'region', regionId: 'pacific', name: '태평양' });
  });

  it('passes at 4/5 and fails at 3/5', () => {
    const pass = mapfindLogic.create(parisSpec, minigamePool('paris'), 5);
    play(pass, 4);
    expect(mapfindLogic.result(pass)).toMatchObject({ kind: 'mapfind', success: true, correct: 4, total: 5 });
    expect(mapfindLogic.result(pass).answeredIds).toHaveLength(5);
    expect(mapfindLogic.result(pass).stars).toBeUndefined();

    const fail = mapfindLogic.create(parisSpec, minigamePool('paris'), 5);
    play(fail, 3);
    expect(mapfindLogic.result(fail)).toMatchObject({ success: false, correct: 3, total: 5 });
  });

  it('every Seoul and Paris target is answerable by its own right click', () => {
    for (const spec of [seoulSpec, parisSpec]) {
      const s = mapfindLogic.create(spec, minigamePool(spec.cityId), 1);
      play(s, 5);
      expect(mapfindLogic.result(s).correct).toBe(5);
    }
  });

  it('ignores non-finite clicks and anything after the last target; short pools lower passCount', () => {
    const s = mapfindLogic.create(seoulSpec, minigamePool('seoul'), 2);
    expect(mapfindLogic.act(s, { lon: Number.NaN, lat: 0 }).outcome).toBe('ignored');
    expect(s.index).toBe(0);
    play(s, 5);
    expect(mapfindLogic.act(s, { lon: 0, lat: 0 }).outcome).toBe('ignored');

    const short = mapfindLogic.create(seoulSpec, makePool({ mapTargets: minigamePool('seoul').mapTargets.slice(0, 2) }), 1);
    expect(short.targets).toHaveLength(2);
    expect(short.passCount).toBe(2);
    expect(() => mapfindLogic.create({ kind: 'quiz', cityId: 'seoul', count: 5, passCount: 4 }, minigamePool('seoul'), 1)).toThrow();
  });
});
