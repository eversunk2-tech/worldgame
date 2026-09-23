// City lock / unlock / stamp rules (spec 6.2).
import type { CityId, CityMarker, Progress } from '../types';
import { CITY_MARKERS, PLAYABLE_CITIES } from '../content';
import { ITEMS } from '../content/items';
import type { ProgressEvent } from './events';
import { missionsTurnedIn } from './missions';

export type CityState = 'comingSoon' | 'locked' | 'open' | 'stamped';

export function isUnlocked(progress: Progress, marker: CityMarker): boolean {
  if (marker.unlock.type === 'always') return true;
  return missionsTurnedIn(progress, marker.unlock.missionIds);
}

export function cityState(progress: Progress, marker: CityMarker): CityState {
  if (marker.status === 'comingSoon') return 'comingSoon';
  if (!isUnlocked(progress, marker)) return 'locked';
  return progress.stamps.includes(marker.cityId) ? 'stamped' : 'open';
}

export function canEnterCity(progress: Progress, cityId: CityId): boolean {
  const marker = CITY_MARKERS.find((m) => m.cityId === cityId);
  if (!marker) return false;
  const s = cityState(progress, marker);
  return s === 'open' || s === 'stamped';
}

/** Snapshot of which playable cities are unlocked; compare before/after an action for city.unlocked events. */
export function unlockedSnapshot(progress: Progress): Record<string, boolean> {
  const snap: Record<string, boolean> = {};
  for (const m of CITY_MARKERS) if (m.status === 'playable') snap[m.cityId] = isUnlocked(progress, m);
  return snap;
}

/**
 * After missions change: emit city.unlocked for cities that became unlocked since `before`,
 * and award stamps (+ souvenir furniture) for cities whose stampMissionIds are all turned in.
 */
export function recheck(progress: Progress, before: Record<string, boolean>, events: ProgressEvent[]): void {
  for (const m of CITY_MARKERS) {
    if (m.status !== 'playable') continue;
    if (!before[m.cityId] && isUnlocked(progress, m)) events.push({ type: 'city.unlocked', cityId: m.cityId });
  }
  for (const city of PLAYABLE_CITIES) {
    if (progress.stamps.includes(city.id)) continue;
    if (city.stampMissionIds.length === 0) continue;
    if (!missionsTurnedIn(progress, city.stampMissionIds)) continue;
    progress.stamps.push(city.id);
    events.push({ type: 'city.stamped', cityId: city.id });
    for (const item of ITEMS) {
      if (item.unlockStamp === city.id && !progress.owned.includes(item.id)) {
        progress.owned.push(item.id);
        events.push({ type: 'item.bought', itemId: item.id });
      }
    }
  }
}

export function unlockHint(marker: CityMarker): string {
  if (marker.unlock.type === 'always') return '';
  return '서울 퀴즈·OX 미션을 완료하면 열려요';
}
