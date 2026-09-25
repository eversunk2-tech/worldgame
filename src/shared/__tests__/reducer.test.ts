import { describe, expect, it } from 'vitest';
import type { Progress, QuizItem } from '../types';
import { minigamePool } from '../content';
import { getMinigameLogic } from '../logic/minigame/registry';
import type { QuizLikeLogic } from '../logic/minigame/types';
import type { MatchState } from '../logic/minigame/match';
import { answerOf, type MapFindState } from '../logic/minigame/mapfind';
import type { BlankState } from '../logic/minigame/blank';
import { correctArrangement, type OrderState } from '../logic/minigame/order';
import { createProgress } from '../logic/progress';
import { applyAction, type ProgressEvent } from '../logic/reducer';
import { cityState } from '../logic/unlock';
import { getMarker } from '../content/continents';
import { fromSave, toSave, validate } from '../save/schema';

function playQuiz(p: Progress, missionId: string, kind: 'quiz' | 'ox', correctCount: number): ProgressEvent[] {
  const logic = getMinigameLogic(kind) as QuizLikeLogic<unknown>;
  const s = logic.create({ kind, cityId: 'seoul', count: 5, passCount: 4 }, minigamePool('seoul'), 5);
  let n = 0;
  while (!logic.isDone(s)) {
    const item = logic.current(s) as QuizItem;
    const right = n < correctCount;
    if (item.kind === 'choice') logic.act(s, right ? item.answer : (item.answer + 1) % 4);
    else logic.act(s, right ? item.answer : !item.answer);
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
      { type: 'mission.changed', missionId: 'm_seoul_match', status: 'available', count: 0 }, // follow-up (spec 8.3)
    ]);
    expect(p.missions.m_seoul_quiz!.attempts).toBe(2);

    // ox mission → paris + the four Stage C cities unlock together (spec 8.2 rule A)
    applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_ox' });
    const ox = playQuiz(p, 'm_seoul_ox', 'ox', 5);
    expect(ox.map((e) => e.type)).toEqual(['mission.changed', 'points.changed', 'mission.changed', ...Array<string>(5).fill('city.unlocked')]);
    expect(ox[2]).toEqual({ type: 'mission.changed', missionId: 'm_seoul_map', status: 'available', count: 0 });
    expect(ox.slice(3)).toEqual((['paris', 'cairo', 'newyork', 'sydney', 'rio'] as const).map((cityId) => ({ type: 'city.unlocked', cityId })));
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

  it('follow-up minigames through the reducer: match ★ bonus, mapfind, blank, order; stats.minigames', () => {
    const p = createProgress('테스터', 1);
    for (const id of ['m_seoul_quiz', 'm_seoul_ox', 'm_paris_quiz', 'm_paris_ox']) p.missions[id]!.status = 'turnedIn';
    // an older save kept the follow-ups locked → entering a city opens them
    expect(applyAction(p, { type: 'city.enter', cityId: 'seoul' }).map((e) => e.type === 'mission.changed' && e.missionId)).toEqual(['m_seoul_match', 'm_seoul_map', 'm_paris_blank', 'm_paris_order']);
    expect(applyAction(p, { type: 'city.enter', cityId: 'paris' })).toEqual([]);

    // match: perfect memory → 6 attempts → 3★ → 30 + 10
    applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_match' });
    const match = getMinigameLogic('match');
    const ms = match.create({ kind: 'match', cityId: 'seoul', pairs: 6, maxAttempts: 14 }, minigamePool('seoul'), 99) as MatchState;
    for (const pairId of new Set(ms.cards.map((c) => c.pairId))) {
      ms.cards.forEach((c, i) => { if (c.pairId === pairId) match.act(ms, { type: 'flip', index: i }); });
    }
    const mr = match.result(ms);
    expect(mr).toMatchObject({ success: true, stars: 3 });
    const matchEv = applyAction(p, { type: 'mission.minigameResult', missionId: 'm_seoul_match', result: mr });
    expect(matchEv.filter((e) => e.type === 'points.changed').map((e) => e.type === 'points.changed' && e.delta)).toEqual([30, 10]);
    expect(p.points).toBe(40);

    // mapfind: click every marker/region centre
    applyAction(p, { type: 'mission.accept', missionId: 'm_seoul_map' });
    const map = getMinigameLogic('mapfind');
    const fs = map.create({ kind: 'mapfind', cityId: 'seoul', count: 5, passCount: 4 }, minigamePool('seoul'), 5) as MapFindState;
    const inside: Record<string, [number, number]> = { asia: [95, 45], europe: [20, 55], pacific: [-150, 0] };
    for (const t of fs.targets) {
      const a = answerOf(t);
      const [lon, lat] = a.type === 'city' ? a.lonLat : inside[a.regionId]!;
      map.act(fs, { lon, lat });
    }
    applyAction(p, { type: 'mission.minigameResult', missionId: 'm_seoul_map', result: map.result(fs) });
    expect(p.missions.m_seoul_map!.status).toBe('turnedIn');

    // blank: 3/4 right passes
    applyAction(p, { type: 'mission.accept', missionId: 'm_paris_blank' });
    const blank = getMinigameLogic('blank');
    const bs = blank.create({ kind: 'blank', cityId: 'paris', count: 4, passCount: 3 }, minigamePool('paris'), 6) as BlankState;
    let n = 0;
    while (!blank.isDone(bs)) {
      const q = bs.questions[bs.index]!;
      q.slots.forEach((slot, i) => blank.act(bs, { type: 'choose', blank: i, option: n === 1 ? (slot.answer + 1) % 4 : slot.answer }));
      blank.act(bs, { type: 'submit' });
      n++;
    }
    applyAction(p, { type: 'mission.minigameResult', missionId: 'm_paris_blank', result: blank.result(bs) });
    expect(p.missions.m_paris_blank!.status).toBe('turnedIn');

    // order: one question revealed → 1/2 → fail, then a clean retry passes
    applyAction(p, { type: 'mission.accept', missionId: 'm_paris_order' });
    const order = getMinigameLogic('order');
    const spec = { kind: 'order', cityId: 'paris', count: 2, passCount: 2, triesPerQuestion: 2 } as const;
    const lose = order.create(spec, minigamePool('paris'), 8) as OrderState;
    order.act(lose, { type: 'submit' });
    order.act(lose, { type: 'submit' });
    const solve = (s: OrderState) => {
      while (!order.isDone(s)) {
        const q = s.questions[s.index]!;
        q.arrangement.splice(0, q.arrangement.length, ...correctArrangement(q.item));
        order.act(s, { type: 'submit' });
      }
    };
    solve(lose);
    expect(applyAction(p, { type: 'mission.minigameResult', missionId: 'm_paris_order', result: order.result(lose) })).toEqual([
      { type: 'mission.changed', missionId: 'm_paris_order', status: 'active', count: 0 },
    ]);
    const win = order.create(spec, minigamePool('paris'), 9) as OrderState;
    solve(win);
    applyAction(p, { type: 'mission.minigameResult', missionId: 'm_paris_order', result: order.result(win) });
    expect(p.missions.m_paris_order).toMatchObject({ status: 'turnedIn', attempts: 2 });

    expect(p.points).toBe(40 + 30 + 30 + 30);
    expect(p.stats).toEqual({ defeated: 0, quizAnswered: 0, quizCorrect: 0, minigames: 4 });
    expect(p.stamps).toEqual([]); // follow-ups are bonus missions, not stamp missions
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
