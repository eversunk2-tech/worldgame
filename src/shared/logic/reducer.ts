// The single entry point that mutates Progress (spec 6.11). Everything else only reads it.
import type { Progress } from '../types';
import { CARD_READ_POINTS } from '../constants';
import { getCard, getMonster, MONSTERS } from '../content';
import { getItem } from '../content/items';
import type { Action, ProgressEvent } from './events';
import { earnPoints, spendPoints } from './points';
import { acceptMission, applyMinigameResult, countDefeat, turnInMission, unlockSatisfied } from './missions';
import { canEnterCity, recheck, unlockedSnapshot } from './unlock';
import { canBuy, canEquip, canPlace } from './inventory';
import { isValidName, normalizeName } from './progress';

export type { Action, ProgressEvent } from './events';

/** Apply `action` to `progress` in place and return the resulting events. Never throws for rule violations. */
export function applyAction(progress: Progress, action: Action): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  const reject = (reason: string) => { events.push({ type: 'rejected', action: action.type, reason }); return events; };

  switch (action.type) {
    case 'profile.setName': {
      if (!isValidName(action.name)) return reject('이름은 1~12자여야 해요');
      progress.profile.name = normalizeName(action.name);
      events.push({ type: 'profile.changed', name: progress.profile.name });
      return events;
    }
    case 'city.enter': {
      if (!canEnterCity(progress, action.cityId)) return reject('아직 열리지 않은 도시예요');
      progress.lastCity = action.cityId;
      // follow-up missions added after their prerequisite was turned in (older saves) open here
      unlockSatisfied(progress, events);
      return events;
    }
    case 'mission.accept': {
      acceptMission(progress, action.missionId, events);
      return events;
    }
    case 'mission.turnIn': {
      const before = unlockedSnapshot(progress);
      if (turnInMission(progress, action.missionId, events)) recheck(progress, before, events);
      return events;
    }
    case 'mission.minigameResult': {
      const before = unlockedSnapshot(progress);
      if (applyMinigameResult(progress, action.missionId, action.result, events)) recheck(progress, before, events);
      return events;
    }
    case 'monster.defeated': {
      if (!MONSTERS[action.monsterId]) return reject('없는 몬스터');
      const def = getMonster(action.monsterId);
      progress.stats.defeated += 1;
      earnPoints(progress, def.points, `defeat:${def.id}`, events);
      countDefeat(progress, def.id, events);
      return events;
    }
    case 'card.read': {
      if (!getCard(action.cardId)) return reject('없는 학습 카드');
      const first = !progress.readCards.includes(action.cardId);
      if (first) {
        progress.readCards.push(action.cardId);
        earnPoints(progress, CARD_READ_POINTS, `card:${action.cardId}`, events);
      }
      events.push({ type: 'card.read', cardId: action.cardId, first });
      return events;
    }
    case 'shop.buy': {
      const item = getItem(action.itemId);
      if (!item) return reject('없는 아이템');
      const check = canBuy(progress, item);
      if (!check.ok) return reject(check.reason);
      if (!spendPoints(progress, item.price, `buy:${item.id}`, events)) return reject('포인트가 부족해요');
      progress.owned.push(item.id);
      events.push({ type: 'item.bought', itemId: item.id });
      return events;
    }
    case 'avatar.equip': {
      if (action.itemId === null) {
        if (action.slot !== 'hat') return reject('이 슬롯은 비울 수 없어요');
        if (progress.avatar.hat === null) return events;
        progress.avatar.hat = null;
        events.push({ type: 'avatar.changed' });
        return events;
      }
      const item = getItem(action.itemId);
      if (!item) return reject('없는 아이템');
      if (item.slot !== action.slot) return reject('슬롯이 맞지 않아요');
      const check = canEquip(progress, item);
      if (!check.ok) return reject(check.reason);
      if (progress.avatar[action.slot] === item.id) return events;
      progress.avatar[action.slot] = item.id;
      events.push({ type: 'avatar.changed' });
      return events;
    }
    case 'room.place': {
      const item = getItem(action.itemId);
      if (!item) return reject('없는 아이템');
      const check = canPlace(progress, item, action.gx, action.gy);
      if (!check.ok) return reject(check.reason);
      progress.room.push({ itemId: item.id, gx: action.gx, gy: action.gy });
      events.push({ type: 'room.changed' });
      return events;
    }
    case 'room.remove': {
      const idx = progress.room.findIndex((p) => p.itemId === action.itemId);
      if (idx < 0) return reject('배치되지 않은 가구예요');
      progress.room.splice(idx, 1);
      events.push({ type: 'room.changed' });
      return events;
    }
    case 'settings.setMuted': {
      const muted = action.muted === true;
      if (progress.settings.muted === muted) return events;
      progress.settings.muted = muted;
      events.push({ type: 'settings.changed', muted });
      return events;
    }
  }
}
