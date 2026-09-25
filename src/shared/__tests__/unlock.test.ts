import { describe, expect, it } from 'vitest';
import type { CityId } from '../types';
import { getCity, getMission } from '../content';
import { CITY_MARKERS, getMarker } from '../content/continents';
import type { ProgressEvent } from '../logic/events';
import { createProgress } from '../logic/progress';
import { canEnterCity, cityState, recheck, unlockHint, unlockedSnapshot } from '../logic/unlock';

const OTHERS: CityId[] = ['paris', 'cairo', 'newyork', 'sydney', 'rio'];

describe('cityState', () => {
  it('fresh game: seoul open, the other five playable cities locked, beijing/london/nairobi comingSoon', () => {
    const p = createProgress();
    expect(cityState(p, getMarker('seoul'))).toBe('open');
    for (const c of OTHERS) {
      expect([c, cityState(p, getMarker(c))]).toEqual([c, 'locked']);
      expect(canEnterCity(p, c)).toBe(false);
    }
    for (const c of ['beijing', 'london', 'nairobi'] as const) expect(cityState(p, getMarker(c))).toBe('comingSoon');
    expect(canEnterCity(p, 'seoul')).toBe(true);
    expect(canEnterCity(p, 'beijing')).toBe(false);
  });

  it('rule A (spec 8.2): every locked marker waits for the Seoul quiz + OX; the hint is built from mission titles', () => {
    for (const m of CITY_MARKERS) {
      if (m.status !== 'playable' || m.cityId === 'seoul') continue;
      expect(m.unlock).toEqual({ type: 'missionsTurnedIn', missionIds: ['m_seoul_quiz', 'm_seoul_ox'] });
      expect(unlockHint(m)).toBe('서울 지리 퀴즈·서울 OX 퀴즈를 완료하면 열려요');
    }
    expect(unlockHint(getMarker('seoul'))).toBe('');
    // data-driven: a sequential route would only change missionIds (spec 8.2 확장 경로)
    const seq = { ...getMarker('cairo'), unlock: { type: 'missionsTurnedIn' as const, missionIds: ['m_paris_quiz'] } };
    expect(unlockHint(seq)).toBe(`${getMission('m_paris_quiz')!.title}를 완료하면 열려요`);
    const withBatchim = { ...getMarker('cairo'), unlock: { type: 'missionsTurnedIn' as const, missionIds: ['m_seoul_defeat'] } };
    expect(unlockHint(withBatchim)).toBe('먼지 도깨비 소탕을 완료하면 열려요');
  });

  it('the five cities open together when seoul quiz + ox are turned in (defeat not required)', () => {
    const p = createProgress();
    p.missions.m_seoul_quiz!.status = 'turnedIn';
    for (const c of OTHERS) expect(cityState(p, getMarker(c))).toBe('locked');
    p.missions.m_seoul_ox!.status = 'turnedIn';
    for (const c of OTHERS) {
      expect([c, cityState(p, getMarker(c))]).toEqual([c, 'open']);
      expect(canEnterCity(p, c)).toBe(true);
    }
    expect(cityState(p, getMarker('beijing'))).toBe('comingSoon');
  });

  it('recheck emits the five city.unlocked events once, in spec order (merged HUD line), then stamps seoul', () => {
    const p = createProgress();
    const before = unlockedSnapshot(p);
    p.missions.m_seoul_quiz!.status = 'turnedIn';
    p.missions.m_seoul_ox!.status = 'turnedIn';
    const ev: ProgressEvent[] = [];
    recheck(p, before, ev);
    expect(ev).toEqual(OTHERS.map((cityId) => ({ type: 'city.unlocked', cityId })));
    // HudScene joins the names of one frame with '·' → "파리·카이로·뉴욕·시드니·리우데자네이루가 열렸어요!"
    expect(ev.map((e) => (e.type === 'city.unlocked' ? getMarker(e.cityId).name : '')).join('·')).toBe('파리·카이로·뉴욕·시드니·리우데자네이루');

    const again: ProgressEvent[] = [];
    recheck(p, unlockedSnapshot(p), again);
    expect(again).toEqual([]);

    p.missions.m_seoul_defeat!.status = 'turnedIn';
    const stampEv: ProgressEvent[] = [];
    recheck(p, unlockedSnapshot(p), stampEv);
    expect(stampEv).toEqual([
      { type: 'city.stamped', cityId: 'seoul' },
      { type: 'item.bought', itemId: 'fur_souvenir_seoul' },
    ]);
    expect(p.stamps).toEqual(['seoul']);
    expect(p.owned).toContain('fur_souvenir_seoul');
    expect(cityState(p, getMarker('seoul'))).toBe('stamped');

    const noDup: ProgressEvent[] = [];
    recheck(p, unlockedSnapshot(p), noDup);
    expect(noDup).toEqual([]);
    expect(p.stamps).toEqual(['seoul']);
  });

  it('new cities: all five missions turned in → stamp + souvenir furniture (4 cities, spec 8.2)', () => {
    const souvenir: Record<string, string> = { cairo: 'fur_souvenir_cairo', newyork: 'fur_souvenir_newyork', sydney: 'fur_souvenir_sydney', rio: 'fur_souvenir_rio' };
    const p = createProgress();
    p.missions.m_seoul_quiz!.status = 'turnedIn';
    p.missions.m_seoul_ox!.status = 'turnedIn';
    for (const [cityId, itemId] of Object.entries(souvenir)) {
      const city = getCity(cityId as CityId);
      expect(city.stampMissionIds).toHaveLength(5);
      // four of five is not enough
      for (const mid of city.stampMissionIds.slice(0, 4)) p.missions[mid]!.status = 'turnedIn';
      const partial: ProgressEvent[] = [];
      recheck(p, unlockedSnapshot(p), partial);
      expect(partial).toEqual([]);
      p.missions[city.stampMissionIds[4]!]!.status = 'turnedIn';
      const ev: ProgressEvent[] = [];
      recheck(p, unlockedSnapshot(p), ev);
      expect(ev).toEqual([{ type: 'city.stamped', cityId }, { type: 'item.bought', itemId }]);
      expect(cityState(p, getMarker(cityId as CityId))).toBe('stamped');
    }
    expect(p.stamps).toEqual(['cairo', 'newyork', 'sydney', 'rio']);
    expect(p.owned).toEqual(expect.arrayContaining(Object.values(souvenir)));
  });
});
