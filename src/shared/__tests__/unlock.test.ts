import { describe, expect, it } from 'vitest';
import { getMarker } from '../content/continents';
import type { ProgressEvent } from '../logic/events';
import { createProgress } from '../logic/progress';
import { canEnterCity, cityState, recheck, unlockHint, unlockedSnapshot } from '../logic/unlock';

describe('cityState', () => {
  it('seoul is open, paris locked, others comingSoon on a fresh game', () => {
    const p = createProgress();
    expect(cityState(p, getMarker('seoul'))).toBe('open');
    expect(cityState(p, getMarker('paris'))).toBe('locked');
    expect(cityState(p, getMarker('cairo'))).toBe('comingSoon');
    expect(cityState(p, getMarker('beijing'))).toBe('comingSoon');
    expect(canEnterCity(p, 'seoul')).toBe(true);
    expect(canEnterCity(p, 'paris')).toBe(false);
    expect(canEnterCity(p, 'cairo')).toBe(false);
    expect(unlockHint(getMarker('paris'))).toContain('서울');
  });

  it('paris opens when seoul quiz + ox are turned in (defeat not required)', () => {
    const p = createProgress();
    p.missions.m_seoul_quiz!.status = 'turnedIn';
    expect(cityState(p, getMarker('paris'))).toBe('locked');
    p.missions.m_seoul_ox!.status = 'turnedIn';
    expect(cityState(p, getMarker('paris'))).toBe('open');
  });

  it('recheck emits city.unlocked once and awards the stamp + souvenir', () => {
    const p = createProgress();
    const before = unlockedSnapshot(p);
    p.missions.m_seoul_quiz!.status = 'turnedIn';
    p.missions.m_seoul_ox!.status = 'turnedIn';
    const ev: ProgressEvent[] = [];
    recheck(p, before, ev);
    expect(ev).toEqual([{ type: 'city.unlocked', cityId: 'paris' }]);

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
});
