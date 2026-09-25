// City lock / unlock / stamp rules (spec 8.2: rule A — Seoul quiz + OX open the other five cities at once).
import type { CityId, CityMarker, Progress } from '../types';
import { CITY_MARKERS, PLAYABLE_CITIES, getMission } from '../content';
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
  // PLAYABLE_CITIES order (spec 8.1), so a merged HUD line reads "파리·카이로·뉴욕·시드니·리우데자네이루가 열렸어요!"
  for (const city of PLAYABLE_CITIES) {
    const m = CITY_MARKERS.find((x) => x.cityId === city.id);
    if (!m || m.status !== 'playable') continue;
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

/** 을/를 after a Korean word: 을 when the last syllable has a final consonant. Non-Hangul endings take 를. */
function objectParticle(word: string): '을' | '를' {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0 ? '을' : '를';
}

/**
 * Lock hint built from the marker's unlock data (spec 8.2): the titles of the missions it waits for, e.g.
 * "서울 지리 퀴즈·서울 OX 퀴즈를 완료하면 열려요". A sequential route only needs different missionIds.
 */
export function unlockHint(marker: CityMarker): string {
  if (marker.unlock.type === 'always') return '';
  const titles = marker.unlock.missionIds.map((id) => getMission(id)?.title ?? id);
  const last = titles[titles.length - 1] ?? '';
  return `${titles.join('·')}${objectParticle(last)} 완료하면 열려요`;
}
