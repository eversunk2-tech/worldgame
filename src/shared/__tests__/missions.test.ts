import { describe, expect, it } from 'vitest';
import type { CityId, MinigameResult } from '../types';
import { getCity, getMission, getNpc } from '../content';
import type { ProgressEvent } from '../logic/events';
import { acceptMission, applyMinigameResult, countDefeat, decideNpcInteraction, resultStars, starBonus, turnInMission, unlockDependents, unlockSatisfied } from '../logic/missions';
import { createProgress } from '../logic/progress';

const hanbyeol = getNpc('seoul', 'npc_hanbyeol')!;
const horang = getNpc('seoul', 'npc_horang')!;
const onyu = getNpc('seoul', 'npc_onyu')!;
const marie = getNpc('paris', 'npc_marie')!;

describe('decideNpcInteraction', () => {
  it('guide shows the card first, then offers the mission', () => {
    const p = createProgress();
    expect(decideNpcInteraction(p, hanbyeol, 'seoul')).toEqual({ kind: 'showCard', cardId: 'card_seoul_geo' });
    p.readCards.push('card_seoul_geo');
    expect(decideNpcInteraction(p, hanbyeol, 'seoul')).toEqual({ kind: 'accept', missionId: 'm_seoul_quiz' });
  });

  it('active minigame mission → startMinigame with spec', () => {
    const p = createProgress();
    p.readCards.push('card_seoul_geo');
    const ev: ProgressEvent[] = [];
    expect(acceptMission(p, 'm_seoul_quiz', ev)).toBe(true);
    expect(ev).toEqual([{ type: 'mission.changed', missionId: 'm_seoul_quiz', status: 'active', count: 0 }]);
    const a = decideNpcInteraction(p, hanbyeol, 'seoul');
    expect(a.kind).toBe('startMinigame');
    if (a.kind === 'startMinigame') expect(a.spec).toMatchObject({ kind: 'quiz', cityId: 'seoul', count: 5, passCount: 4 });
  });

  it('active defeat mission → progress text with count; completed → turnIn; turnedIn → idle talk', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    acceptMission(p, 'm_seoul_defeat', ev);
    let a = decideNpcInteraction(p, horang, 'seoul');
    expect(a.kind).toBe('progress');
    if (a.kind === 'progress') expect(a.text).toContain('(0/3)');

    countDefeat(p, 'dust_dokkaebi', ev);
    countDefeat(p, 'magpie', ev); // wrong monster: ignored
    countDefeat(p, 'dust_dokkaebi', ev);
    expect(p.missions.m_seoul_defeat!.count).toBe(2);
    expect(p.missions.m_seoul_defeat!.status).toBe('active');
    countDefeat(p, 'dust_dokkaebi', ev);
    expect(p.missions.m_seoul_defeat!.status).toBe('completed');
    countDefeat(p, 'dust_dokkaebi', ev); // over-count ignored
    expect(p.missions.m_seoul_defeat!.count).toBe(3);

    a = decideNpcInteraction(p, horang, 'seoul');
    expect(a).toEqual({ kind: 'turnIn', missionId: 'm_seoul_defeat' });

    const before = ev.length;
    expect(turnInMission(p, 'm_seoul_defeat', ev)).toBe(true);
    expect(p.missions.m_seoul_defeat!.status).toBe('turnedIn');
    expect(p.points).toBe(30);
    expect(ev.slice(before).map((e) => e.type)).toEqual(['mission.changed', 'points.changed']);

    a = decideNpcInteraction(p, horang, 'seoul');
    expect(a).toEqual({ kind: 'talk', text: horang.idleText });
  });

  it('rejects invalid transitions', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    expect(turnInMission(p, 'm_seoul_ox', ev)).toBe(false);
    expect(acceptMission(p, 'nope', ev)).toBe(false);
    acceptMission(p, 'm_seoul_ox', ev);
    expect(acceptMission(p, 'm_seoul_ox', ev)).toBe(false);
    expect(ev.filter((e) => e.type === 'rejected')).toHaveLength(3);
    expect(p.points).toBe(0);
  });

  it('minigame result: success → turnedIn + reward; failure → attempts++ and stays active', () => {
    const p = createProgress();
    const ev: ProgressEvent[] = [];
    acceptMission(p, 'm_seoul_ox', ev);
    expect(applyMinigameResult(p, 'm_seoul_ox', { kind: 'ox', success: false, correct: 3, total: 5, answeredIds: [] }, ev)).toBe(true);
    expect(p.missions.m_seoul_ox!).toMatchObject({ status: 'active', attempts: 1 });
    expect(p.points).toBe(0);
    expect(p.stats).toEqual({ defeated: 0, quizAnswered: 5, quizCorrect: 3, minigames: 0 });
    expect(applyMinigameResult(p, 'm_seoul_ox', { kind: 'ox', success: true, correct: 4, total: 5, answeredIds: [] }, ev)).toBe(true);
    expect(p.missions.m_seoul_ox!).toMatchObject({ status: 'turnedIn', attempts: 2 });
    expect(p.points).toBe(30);
    // kind mismatch / not active → rejected
    expect(applyMinigameResult(p, 'm_seoul_ox', { kind: 'ox', success: true, correct: 5, total: 5, answeredIds: [] }, ev)).toBe(false);
    acceptMission(p, 'm_seoul_quiz', ev);
    expect(applyMinigameResult(p, 'm_seoul_quiz', { kind: 'ox', success: true, correct: 5, total: 5, answeredIds: [] }, ev)).toBe(false);
    // the OX turn-in opened 온유's follow-up (spec 8.3)
    expect(decideNpcInteraction(p, onyu, 'seoul')).toEqual({ kind: 'accept', missionId: 'm_seoul_map' });
  });

  it('unlockDependents opens only the locked missions that depend on the turned-in one', () => {
    const p = createProgress();
    expect(p.missions.m_seoul_match!.status).toBe('locked');
    expect(p.missions.m_seoul_map!.status).toBe('locked');
    const ev: ProgressEvent[] = [];
    unlockDependents(p, 'm_seoul_defeat', ev); // nothing depends on it
    expect(ev).toEqual([]);
    unlockDependents(p, 'm_seoul_quiz', ev);
    expect(ev).toEqual([{ type: 'mission.changed', missionId: 'm_seoul_match', status: 'available', count: 0 }]);
    expect(p.missions.m_seoul_map!.status).toBe('locked');
    expect(getCity('paris').missions.filter((m) => m.prerequisiteMissionId).map((m) => m.id)).toEqual(['m_paris_blank', 'm_paris_order']);
  });

  it('unlockSatisfied opens follow-ups whose prerequisite was turned in before they existed (old saves)', () => {
    const p = createProgress();
    p.missions.m_seoul_quiz!.status = 'turnedIn'; // e.g. a v0.1 save: the follow-up stayed at its default 'locked'
    p.missions.m_paris_ox!.status = 'turnedIn';
    const ev: ProgressEvent[] = [];
    unlockSatisfied(p, ev);
    expect(ev).toEqual([
      { type: 'mission.changed', missionId: 'm_seoul_match', status: 'available', count: 0 },
      { type: 'mission.changed', missionId: 'm_paris_order', status: 'available', count: 0 },
    ]);
    expect(p.missions.m_seoul_map!.status).toBe('locked');
    const again: ProgressEvent[] = [];
    unlockSatisfied(p, again);
    expect(again).toEqual([]);
  });

  it('follow-up chain: quiz turn-in → match offered → accepted → startMinigame with the match spec', () => {
    const p = createProgress();
    p.readCards.push('card_seoul_geo');
    const ev: ProgressEvent[] = [];
    acceptMission(p, 'm_seoul_quiz', ev);
    applyMinigameResult(p, 'm_seoul_quiz', { kind: 'quiz', success: true, correct: 5, total: 5, answeredIds: [] }, ev);
    expect(ev.at(-1)).toEqual({ type: 'mission.changed', missionId: 'm_seoul_match', status: 'available', count: 0 });
    expect(decideNpcInteraction(p, hanbyeol, 'seoul')).toEqual({ kind: 'accept', missionId: 'm_seoul_match' });
    acceptMission(p, 'm_seoul_match', ev);
    expect(decideNpcInteraction(p, hanbyeol, 'seoul')).toEqual({ kind: 'startMinigame', missionId: 'm_seoul_match', spec: { kind: 'match', cityId: 'seoul', pairs: 6, maxAttempts: 14 } });
    // 마리 (Paris guide) only offers the blank mission after her quiz
    p.readCards.push('card_paris_geo');
    expect(decideNpcInteraction(p, marie, 'paris')).toEqual({ kind: 'accept', missionId: 'm_paris_quiz' });
  });

  it('new cities (spec 7.5, A.3–A.6): each NPC offers its first mission, then the follow-up after the turn-in', () => {
    // [npc, city, first mission, first kind, follow-up, follow-up kind]
    const chains: [string, CityId, string, string, string, string][] = [
      ['npc_amir', 'cairo', 'm_cairo_quiz', 'quiz', 'm_cairo_map', 'mapfind'],
      ['npc_nadia', 'cairo', 'm_cairo_match', 'match', 'm_cairo_ox', 'ox'],
      ['npc_emily', 'newyork', 'm_newyork_quiz', 'quiz', 'm_newyork_blank', 'blank'],
      ['npc_noah', 'newyork', 'm_newyork_order', 'order', 'm_newyork_ox', 'ox'],
      ['npc_olivia', 'sydney', 'm_sydney_quiz', 'quiz', 'm_sydney_match', 'match'],
      ['npc_jack', 'sydney', 'm_sydney_map', 'mapfind', 'm_sydney_blank', 'blank'],
      ['npc_lucas', 'rio', 'm_rio_quiz', 'quiz', 'm_rio_order', 'order'],
      ['npc_isabela', 'rio', 'm_rio_blank', 'blank', 'm_rio_ox', 'ox'],
    ];
    for (const [npcId, cityId, first, firstKind, next, nextKind] of chains) {
      const npc = getNpc(cityId, npcId)!;
      expect(npc.missionIds).toEqual([first, next]);
      expect(getMission(next)!.prerequisiteMissionId).toBe(first);
      expect(getMission(first)!.prerequisiteMissionId).toBeUndefined();
      const p = createProgress();
      if (npc.cardId) {
        expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'showCard', cardId: npc.cardId });
        p.readCards.push(npc.cardId);
      }
      expect(p.missions[next]!.status).toBe('locked');
      expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'accept', missionId: first });
      const ev: ProgressEvent[] = [];
      acceptMission(p, first, ev);
      const a = decideNpcInteraction(p, npc, cityId);
      expect(a.kind === 'startMinigame' && a.spec.kind).toBe(firstKind);
      applyMinigameResult(p, first, { kind: firstKind as MinigameResult['kind'], success: true, correct: 5, total: 5, answeredIds: [] }, ev);
      expect(ev.at(-1)).toEqual({ type: 'mission.changed', missionId: next, status: 'available', count: 0 });
      expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'accept', missionId: next });
      acceptMission(p, next, ev);
      const nextDef = getMission(next)!;
      expect(nextDef.objective.type === 'minigame' && nextDef.objective.spec.kind).toBe(nextKind);
      expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'startMinigame', missionId: next, spec: nextDef.objective.type === 'minigame' ? nextDef.objective.spec : null });
    }
    // guards hand out the defeat mission of their city's monster
    const guards: [string, CityId, string, string][] = [['npc_karim', 'cairo', 'm_cairo_defeat', 'scarab'], ['npc_jackson', 'newyork', 'm_newyork_defeat', 'taxi_bug'], ['npc_ruby', 'sydney', 'm_sydney_defeat', 'seagull'], ['npc_pedro', 'rio', 'm_rio_defeat', 'monkey']];
    for (const [npcId, cityId, mid, monster] of guards) {
      const p = createProgress();
      const npc = getNpc(cityId, npcId)!;
      expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'accept', missionId: mid });
      const ev: ProgressEvent[] = [];
      acceptMission(p, mid, ev);
      for (let i = 0; i < 3; i++) countDefeat(p, monster, ev);
      expect(decideNpcInteraction(p, npc, cityId)).toEqual({ kind: 'turnIn', missionId: mid });
    }
  });

  it('star bonus on success: 3★ +10, 2★ +5, 1★ or none +0; stats.minigames counts clears only', () => {
    expect([starBonus(3), starBonus(2), starBonus(1), starBonus(undefined)]).toEqual([10, 5, 0, 0]);
    expect(resultStars({ kind: 'match', success: true, correct: 6, total: 6, answeredIds: [], stars: 2 })).toBe(2);
    expect(resultStars({ kind: 'match', success: true, correct: 6, total: 6, answeredIds: [], stars: 7 as 3 })).toBeUndefined();

    const play = (stars: 1 | 2 | 3 | undefined) => {
      const p = createProgress();
      p.missions.m_seoul_match!.status = 'active';
      const ev: ProgressEvent[] = [];
      const fail = applyMinigameResult(p, 'm_seoul_match', { kind: 'match', success: false, correct: 3, total: 6, answeredIds: [] }, ev);
      expect(fail).toBe(true);
      expect(p.stats.minigames).toBe(0);
      const r = { kind: 'match' as const, success: true, correct: 6, total: 6, answeredIds: [], ...(stars ? { stars } : {}) };
      applyMinigameResult(p, 'm_seoul_match', r, ev);
      return { p, ev };
    };
    const star3 = play(3);
    expect(star3.p.points).toBe(40);
    expect(star3.p.totalEarned).toBe(40);
    expect(star3.ev.filter((e) => e.type === 'points.changed')).toEqual([
      { type: 'points.changed', delta: 30, points: 30, reason: 'mission:m_seoul_match' },
      { type: 'points.changed', delta: 10, points: 40, reason: 'stars:m_seoul_match:3' },
    ]);
    expect(star3.p.stats).toEqual({ defeated: 0, quizAnswered: 0, quizCorrect: 0, minigames: 1 }); // match is not a quiz
    expect(star3.p.missions.m_seoul_match).toMatchObject({ status: 'turnedIn', count: 6, attempts: 2 });
    expect(play(2).p.points).toBe(35);
    expect(play(1).p.points).toBe(30);
    const none = play(undefined);
    expect(none.p.points).toBe(30);
    expect(none.ev.filter((e) => e.type === 'points.changed')).toHaveLength(1);
  });
});
