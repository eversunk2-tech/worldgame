import { describe, expect, it } from 'vitest';
import type { Progress, QuizItem } from '../types';
import { quizPool } from '../content';
import { getMinigameLogic } from '../logic/minigame/registry';
import { createProgress } from '../logic/progress';
import { applyAction, type ProgressEvent } from '../logic/reducer';
import { cityState } from '../logic/unlock';
import { getMarker } from '../content/continents';
import { fromSave, toSave, validate } from '../save/schema';

function playQuiz(p: Progress, missionId: string, kind: 'quiz' | 'ox', correctCount: number): ProgressEvent[] {
  const logic = getMinigameLogic(kind);
  const s = logic.create({ kind, cityId: 'seoul', count: 5, passCount: 4 }, quizPool('seoul'), 5);
  let n = 0;
  while (!logic.isDone(s)) {
    const item = logic.current(s) as QuizItem;
    const right = n < correctCount;
    if (item.kind === 'choice') logic.answer(s, right ? item.answer : (item.answer + 1) % 4);
    else logic.answer(s, right ? item.answer : !item.answer);
    n++;
  }
  return applyAction(p, { type: 'mission.minigameResult', missionId, result: logic.result(s) });
}

describe('reducer scenario', () => {
  it('accept → quiz success → points → paris unlocked → buy → equip → place → save round-trip', () => {
    const p = createProgress('테스터', 123);

    expect(applyAction(p, { type: 'city.enter', cityId: 'seoul' })).toEqual([]);
    expect(p.lastCity).toBe('seoul');
    expect(applyAction(p, { type: 'city.enter', cityId: 'paris' })).toEqual([{ type: 'rejected', action: 'city.enter', reason: '아직 열리지 않은 도시예요' }]);

    // guide card: +5 first time only
    expect(applyAction(p, { type: 'card.read', cardId: 'card_seoul_geo' })).toEqual([
      { type: 'points.changed', delta: 5, points: 5, reason: 'card:card_seoul_geo' },
      { type: 'card.read', cardId: 'card_seoul_geo', first: true },
    ]);
    expect(applyAction(p, { type: 'card.read', cardId: 'card_seoul_geo' })).toEqual([{ type: 'card.read', cardId: 'card_seoul_geo', first: false }]);
    expect(applyAction(p, { type: 'card.read', cardId: 'nope' })[0]?.type).toBe('rejected');

    // quiz mission: fail once, then succeed
    expect(applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_quiz' })).toEqual([{ type: 'mission.changed', missionId: 'm_seoul_quiz', status: 'active', count: 0 }]);
    const fail = playQuiz(p, 'm_seoul_quiz', 'quiz', 3);
    expect(fail).toEqual([{ type: 'mission.changed', missionId: 'm_seoul_quiz', status: 'active', count: 0 }]);
    expect(p.points).toBe(5);
    const win = playQuiz(p, 'm_seoul_quiz', 'quiz', 4);
    expect(win).toEqual([
      { type: 'mission.changed', missionId: 'm_seoul_quiz', status: 'turnedIn', count: 4 },
      { type: 'points.changed', delta: 40, points: 45, reason: 'mission:m_seoul_quiz' },
    ]);
    expect(p.missions.m_seoul_quiz!.attempts).toBe(2);

    // ox mission → paris unlocks
    applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_ox' });
    const ox = playQuiz(p, 'm_seoul_ox', 'ox', 5);
    expect(ox.map((e) => e.type)).toEqual(['mission.changed', 'points.changed', 'city.unlocked']);
    expect(ox.at(-1)).toEqual({ type: 'city.unlocked', cityId: 'paris' });
    expect(p.points).toBe(75);
    expect(cityState(p, getMarker('paris'))).toBe('open');
    expect(applyAction(p, { type: 'city.enter', cityId: 'paris' })).toEqual([]);

    // defeat mission: 3 kills (+2 each) → completed → turn in → stamp + souvenir + rank
    applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_defeat' });
    for (let i = 0; i < 3; i++) applyAction(p, { type: 'monster.defeated', monsterId: 'dust_dokkaebi', cityId: 'seoul' });
    expect(p.points).toBe(81);
    expect(p.stats.defeated).toBe(3);
    expect(p.missions.m_seoul_defeat!.status).toBe('completed');
    const turnIn = applyAction(p, { type: 'mission.turnIn', missionId: 'm_seoul_defeat' });
    expect(turnIn.map((e) => e.type)).toEqual(['mission.changed', 'points.changed', 'rank.changed', 'city.stamped', 'item.bought']);
    expect(p.points).toBe(111);
    expect(p.stamps).toEqual(['seoul']);
    expect(p.owned).toContain('fur_souvenir_seoul');
    // farming after turn-in still pays
    applyAction(p, { type: 'monster.defeated', monsterId: 'dust_dokkaebi', cityId: 'seoul' });
    expect(p.points).toBe(113);
    expect(applyAction(p, { type: 'monster.defeated', monsterId: 'ghost', cityId: 'seoul' })[0]?.type).toBe('rejected');

    // shop
    expect(applyAction(p, { type: 'shop.buy', itemId: 'hat_crown' })).toEqual([
      { type: 'points.changed', delta: -60, points: 53, reason: 'buy:hat_crown' },
      { type: 'item.bought', itemId: 'hat_crown' },
    ]);
    expect(applyAction(p, { type: 'shop.buy', itemId: 'hat_crown' })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'shop.buy', itemId: 'fur_bed' })[0]).toMatchObject({ type: 'rejected' });
    expect(p.points).toBe(53);
    applyAction(p, { type: 'shop.buy', itemId: 'fur_rug' });
    expect(p.points).toBe(23);

    // equip
    expect(applyAction(p, { type: 'avatar.equip', slot: 'hat', itemId: 'hat_crown' })).toEqual([{ type: 'avatar.changed' }]);
    expect(applyAction(p, { type: 'avatar.equip', slot: 'hat', itemId: 'hat_crown' })).toEqual([]);
    expect(applyAction(p, { type: 'avatar.equip', slot: 'hat', itemId: 'hat_gat' })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'avatar.equip', slot: 'top', itemId: 'hat_crown' })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'avatar.equip', slot: 'top', itemId: null })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'avatar.equip', slot: 'body', itemId: 'body_tan' })).toEqual([{ type: 'avatar.changed' }]);
    expect(applyAction(p, { type: 'avatar.equip', slot: 'hat', itemId: null })).toEqual([{ type: 'avatar.changed' }]);
    expect(p.avatar).toEqual({ body: 'body_tan', hair: 'hair_short_black', top: 'top_tshirt_blue', hat: null });

    // room
    expect(applyAction(p, { type: 'room.place', itemId: 'fur_rug', gx: 1, gy: 1 })).toEqual([{ type: 'room.changed' }]);
    expect(applyAction(p, { type: 'room.place', itemId: 'fur_souvenir_seoul', gx: 2, gy: 2 })[0]).toMatchObject({ type: 'rejected', reason: '다른 가구와 겹쳐요' });
    expect(applyAction(p, { type: 'room.place', itemId: 'fur_souvenir_seoul', gx: 3, gy: 1 })).toEqual([{ type: 'room.changed' }]);
    expect(applyAction(p, { type: 'room.place', itemId: 'fur_bed', gx: 0, gy: 5 })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'room.remove', itemId: 'fur_rug' })).toEqual([{ type: 'room.changed' }]);
    expect(applyAction(p, { type: 'room.remove', itemId: 'fur_rug' })[0]?.type).toBe('rejected');
    expect(p.room).toEqual([{ itemId: 'fur_souvenir_seoul', gx: 3, gy: 1 }]);

    // name
    expect(applyAction(p, { type: 'profile.setName', name: '  ' })[0]?.type).toBe('rejected');
    expect(applyAction(p, { type: 'profile.setName', name: '새이름' })).toEqual([{ type: 'profile.changed', name: '새이름' }]);

    // save round-trip
    const save = toSave(p, 999);
    const json = JSON.parse(JSON.stringify(save));
    const restored = validate(json);
    expect(restored).not.toBeNull();
    expect(fromSave(restored!)).toEqual(p);
    expect(restored!.savedAt).toBe(999);
  });

  it('never mutates on rejected actions', () => {
    const p = createProgress();
    const snapshot = JSON.stringify(p);
    applyAction(p, { type: 'mission.turnIn', missionId: 'm_seoul_quiz' });
    applyAction(p, { type: 'shop.buy', itemId: 'hat_crown' });
    applyAction(p, { type: 'room.place', itemId: 'fur_chair', gx: 0, gy: 0 });
    applyAction(p, { type: 'avatar.equip', slot: 'hair', itemId: 'hair_pony_blue' });
    applyAction(p, { type: 'city.enter', cityId: 'paris' });
    expect(JSON.stringify(p)).toBe(snapshot);
  });
});
