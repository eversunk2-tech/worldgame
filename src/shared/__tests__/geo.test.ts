import { describe, expect, it } from 'vitest';
import type { RegionId } from '../types';
import { CITY_MARKERS, CONTINENT_LABELS, OCEAN_LABELS } from '../content/continents';
import { CONTINENT_REGION_IDS, REGION_IDS, REGION_NAMES, REGIONS, isRegionId } from '../content/regions';
import { distancePx, isLand, landPolygons, landRings, lonLatToXY, pointInPolygon, resolveRegion, unwrapRing, xyToLonLat } from '../logic/geo';

const expectRegion = (cases: [string, number, number, RegionId | null][]) => {
  for (const [name, lon, lat, want] of cases) expect([name, resolveRegion(lon, lat)]).toEqual([name, want]);
};

describe('resolveRegion (spec 7.2 representative points)', () => {
  const cases: [number, number, RegionId][] = [
    [127, 37.5, 'asia'],
    [2, 49, 'europe'],
    [20, 5, 'africa'],
    [-100, 45, 'north_america'],
    [-60, -15, 'south_america'],
    [135, -25, 'oceania'],
    [-150, 0, 'pacific'],
    [-140, -30, 'pacific'],
    [-35, 15, 'atlantic'],
    [78, -25, 'indian'],
    [0, 80, 'arctic'],
    [0, -70, 'southern'],
  ];
  for (const [lon, lat, want] of cases) {
    it(`(${lon}, ${lat}) → ${want}`, () => {
      expect(resolveRegion(lon, lat)).toBe(want);
    });
  }

  it('handles the date line: (179,0) and (-179,0) are both the Pacific', () => {
    expect(resolveRegion(179, 0)).toBe('pacific');
    expect(resolveRegion(-179, 0)).toBe('pacific');
    expect(resolveRegion(-170, 20)).toBe('pacific');
  });

  it('appendix B boundary checks: Gulf of Guinea is Atlantic, Suez splits Asia/Africa', () => {
    expect(resolveRegion(0, 0)).toBe('atlantic');
    expect(resolveRegion(31.24, 30.04)).toBe('africa'); // Cairo
    expect(resolveRegion(33.8, 29.5)).toBe('asia'); // Sinai
    expect(resolveRegion(45, 25)).toBe('asia'); // Arabia
    expect(resolveRegion(20, -20)).toBe('africa');
  });

  it('every city marker lies on land in its own continent', () => {
    for (const m of CITY_MARKERS) {
      expect([m.cityId, isLand(m.lonLat[0], m.lonLat[1])]).toEqual([m.cityId, true]);
      expect([m.cityId, resolveRegion(m.lonLat[0], m.lonLat[1])]).toEqual([m.cityId, m.continent]);
    }
  });

  it('map labels: continent labels sit inside their polygon, ocean labels resolve to their ocean', () => {
    const labels = [...CONTINENT_LABELS, ...OCEAN_LABELS];
    expect(labels).toHaveLength(11);
    for (const l of CONTINENT_LABELS) expect([l.id, pointInPolygon(l.lonLat[0], l.lonLat[1], REGIONS[l.id as RegionId])]).toEqual([l.id, true]);
    for (const l of OCEAN_LABELS) expect([l.id, resolveRegion(l.lonLat[0], l.lonLat[1])]).toEqual([l.id, l.id]);
  });

  it('polar rules apply to sea outside the 3 oceans; continents win on land; non-finite input → null', () => {
    expect(resolveRegion(-40, 75)).toBe('north_america'); // Greenland (land)
    expect(resolveRegion(0, 70)).toBe('arctic'); // Norwegian/Greenland Sea above 68°N
    expect(resolveRegion(-100, -60)).toBe('southern');
    expect(resolveRegion(-100, -57)).toBe('pacific'); // the oceans now reach the southern rule (no gap)
    expect(resolveRegion(20, -75)).toBeNull(); // Antarctica: land, but not one of the six continents
    expect(resolveRegion(Number.NaN, 10)).toBeNull();
  });
});

describe('land mask decides the coastline (review round 2)', () => {
  it('Korea, Japan, Taiwan, the Philippines, Borneo and Java are Asia', () => {
    expectRegion([
      ['부산', 129.08, 35.18, 'asia'], ['도쿄', 139.69, 35.69, 'asia'], ['타이베이', 121.56, 25.03, 'asia'],
      ['마닐라', 120.98, 14.6, 'asia'], ['보르네오', 114, 1, 'asia'], ['자카르타', 106.85, -6.2, 'asia'],
      ['홋카이도', 142.5, 43.3, 'asia'], ['티모르', 125.7, -8.8, 'asia'], ['세람', 129.5, -3.2, 'asia'],
    ]);
    // Jeju is below the 110m resolution: it reads as sea, so it is not judged as a continent
    expect(isLand(126.53, 33.36)).toBe(false);
  });

  it('New Guinea and Australia are Oceania; Iceland and European Russia are Europe; Panama is North America', () => {
    expectRegion([
      ['뉴기니', 143, -6, 'oceania'], ['뉴기니 새머리반도', 132.5, -1.2, 'oceania'], ['시드니', 151.21, -33.87, 'oceania'],
      ['아이슬란드', -19, 64.9, 'europe'], ['하르키우', 36.23, 49.99, 'europe'], ['볼고그라드', 44.5, 48.7, 'europe'],
      ['카잔', 49.1, 55.8, 'europe'], ['파리', 2.35, 48.86, 'europe'], ['노바야제믈랴', 56, 74, 'europe'],
      ['예카테린부르크', 60.6, 56.8, 'asia'], ['조지아', 44.8, 41.7, 'asia'], ['아나톨리아', 32, 39, 'asia'], ['키프로스', 33.2, 35.1, 'asia'],
      ['파나마', -79.5, 9.0, 'north_america'], ['코스타리카', -84, 10, 'north_america'], ['콜롬비아', -74, 4.6, 'south_america'],
      ['추코트카', -172, 66.5, 'asia'], ['알래스카', -160, 65, 'north_america'], ['세인트로렌스섬', -170, 63.4, 'north_america'],
    ]);
  });

  it('marginal seas belong to their ocean; closed seas belong to none', () => {
    expectRegion([
      ['황해', 123.5, 35.5, 'pacific'], ['동해', 134, 40, 'pacific'], ['남중국해', 114, 14, 'pacific'],
      ['벵골만', 88, 15, 'indian'], ['아라비아해', 65, 15, 'indian'], ['북해', 3, 56, 'atlantic'],
      ['지중해', 18, 35, null], ['흑해', 34, 43.2, null], ['카스피해', 50.5, 42, null], ['발트해', 19, 57, null],
      ['지중해 가운데', 15, 35, null], ['카테가트', 11.5, 57, null], ['스카게라크', 9.5, 58, 'atlantic'],
    ]);
  });

  it('ocean borders: Malacca/Java/Timor/Tasmania (Indian–Pacific), Cape Horn, 20°E', () => {
    expectRegion([
      ['말라카 해협', 100, 4, 'indian'], ['타이만', 101, 10, 'pacific'], ['자와해', 110, -5, 'pacific'],
      ['티모르해', 125, -11.5, 'indian'], ['아라푸라해', 135, -9.5, 'pacific'], ['그레이트오스트레일리아만', 130, -35, 'indian'],
      ['태즈먼해', 160, -38, 'pacific'], ['드레이크 서쪽', -70, -57, 'pacific'], ['드레이크 동쪽', -64, -57, 'atlantic'],
      ['멕시코만', -90, 25, 'atlantic'], ['캘리포니아만', -111, 27, 'pacific'], ['아굴라스 서쪽', 15, -40, 'atlantic'],
      ['아굴라스 동쪽', 25, -40, 'indian'], ['홍해', 38, 21, 'indian'], ['페르시아만', 51, 27, 'indian'],
    ]);
  });
});

describe('world-atlas land rings', () => {
  it('unwraps longitudes that jump across the date line and flags pole-circling rings', () => {
    const fiji = unwrapRing([[178, -16], [-179, -16], [-179, -17], [178, -17], [178, -16]]);
    expect(fiji.points.map((p) => p[0])).toEqual([178, 181, 181, 178, 178]);
    expect(fiji.polar).toBe(false);
    const cap = unwrapRing([[-180, -70], [-90, -72], [0, -71], [90, -69], [179, -70], [-180, -70]]);
    expect(cap.polar).toBe(true);
    expect(cap.points.at(-1)![0]).toBe(180);
  });

  it('decodes the 110m rings: exactly one pole-circling ring (Antarctica) and the Caspian as a hole', () => {
    const rings = landRings();
    expect(rings.length).toBeGreaterThan(100);
    expect(rings.filter((r) => r.polar)).toHaveLength(1);
    expect(landPolygons()).toHaveLength(rings.length);
    for (const r of rings.filter((x) => !x.polar)) {
      const lons = r.points.map((p) => p[0]);
      expect(Math.max(...lons) - Math.min(...lons)).toBeLessThan(360); // no ring wraps unless it circles a pole
    }
    expect(isLand(50.5, 42)).toBe(false); // Caspian
    expect(isLand(0, -80)).toBe(true); // Antarctica closed through the pole
    expect(isLand(-179.5, 71.2)).toBe(true); // Wrangel Island across the date line
    expect(isLand(178.5, -17.5)).toBe(true); // Fiji
  });

  it('no bands at the date-line rings: land per latitude row changes smoothly around 71°N, 65°N and 16°S', () => {
    const landCount = (lat: number) => {
      let n = 0;
      for (let lon = -179.5; lon < 180; lon += 1) if (isLand(lon, lat)) n++;
      return n;
    };
    for (const lat of [71.2, 65.3, -16.3]) {
      const here = landCount(lat);
      for (const d of [-0.6, 0.6]) expect([lat, d, Math.abs(here - landCount(lat + d)) < 30]).toEqual([lat, d, true]);
      expect(here).toBeLessThan(300); // never a full-width row (360)
    }
    expect(isLand(25, 67)).toBe(true); // Lapland
    expect(isLand(-45, 67)).toBe(true); // Greenland
    expect(isLand(100, 66)).toBe(true); // Siberia
    expect(isLand(0, 67)).toBe(false); // Norwegian Sea
    expect(isLand(-60, 67)).toBe(false); // Davis Strait / Baffin Bay
  });
});

describe('pointInPolygon', () => {
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  it('ray casting inside / outside', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(15, 5, square)).toBe(false);
    expect(pointInPolygon(5, -1, square)).toBe(false);
  });
  it('tries lon ± 360 so outlines written past 180° still match', () => {
    const pastDateLine: [number, number][] = [[170, -10], [200, -10], [200, 10], [170, 10]];
    expect(pointInPolygon(-170, 0, pastDateLine)).toBe(true); // -170 + 360 = 190
    expect(pointInPolygon(175, 0, pastDateLine)).toBe(true);
    expect(pointInPolygon(-150, 0, pastDateLine)).toBe(false); // 210
    expect(pointInPolygon(-170, 0, REGIONS.pacific)).toBe(true);
  });
});

describe('projection and distances', () => {
  it('xyToLonLat inverts lonLatToXY on the full and the 0.8× map', () => {
    for (const [w, h] of [[960, 540], [768, 432]] as const) {
      for (const ll of [[126.98, 37.57], [-74.01, 40.71], [0, 0], [151.21, -33.87]] as [number, number][]) {
        const { x, y } = lonLatToXY(ll, w, h);
        const back = xyToLonLat(x, y, w, h);
        expect(back[0]).toBeCloseTo(ll[0], 9);
        expect(back[1]).toBeCloseTo(ll[1], 9);
      }
    }
    expect(xyToLonLat(480, 270)).toEqual([0, 0]);
    expect(xyToLonLat(0, 0)).toEqual([-180, 90]);
  });

  it('distancePx is Euclidean and wraps east–west', () => {
    expect(distancePx({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distancePx({ x: 2, y: 100 }, { x: 958, y: 100 })).toBe(4); // across the map edge
    expect(distancePx({ x: 10, y: 0 }, { x: 60, y: 0 }, 768)).toBe(50);
  });
});

describe('region data', () => {
  it('names every region, recognises ids and keeps continents apart on land', () => {
    expect(REGION_IDS).toHaveLength(11);
    for (const id of REGION_IDS) {
      expect(REGION_NAMES[id]).toBeTruthy();
      expect(REGIONS[id].length).toBeGreaterThanOrEqual(3);
      expect(isRegionId(id)).toBe(true);
    }
    expect(isRegionId('mars')).toBe(false);
    expect(isRegionId(3)).toBe(false);
    // every vertex of every non-Antarctic land ring falls in at most one continent polygon
    for (const poly of landPolygons()) {
      for (const [lon, lat] of poly) {
        if (lat < -60) continue;
        const hits = CONTINENT_REGION_IDS.filter((id) => pointInPolygon(lon, lat, REGIONS[id]));
        expect(hits.length).toBeLessThanOrEqual(1);
      }
    }
  });
});
