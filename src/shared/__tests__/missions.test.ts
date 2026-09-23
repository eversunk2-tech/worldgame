import { describe, expect, it } from 'vitest';
import { getCity, getNpc } from '../content';
import type { ProgressEvent } from '../logic/events';
import { acceptMission, applyMinigameResult, countDefeat, decideNpcInteraction, turnInMission, unlockDependents } from '../logic/missions';
import { createProgress } from '../logic/progress';

const hanbyeol = getNpc('seoul', 'npc_hanbyeol')!;
const horang = getNpc('seoul', 'npc_horang')!;
const onyu = getNpc('seoul', 'npc_onyu')!;

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
    expect(p.stats).toEqual({ defeated: 0, quizAnswered: 5, quizCorrect: 3 });
    expect(applyMinigameResult(p, 'm_seoul_ox', { kind: 'ox', success: true, correct: 4, total: 5, answeredIds: [] }, ev)).toBe(true);
    expect(p.missions.m_seoul_ox!).toMatchObject({ status: 'turnedIn', attempts: 2 });
    expect(p.points).toBe(30);
    // kind mismatch / not active → rejected
    expect(applyMinigameResult(p, 'm_seoul_ox', { kind: 'ox', success: true, correct: 5, total: 5, answeredIds: [] }, ev)).toBe(false);
    acceptMission(p, 'm_seoul_quiz', ev);
    expect(applyMinigameResult(p, 'm_seoul_quiz', { kind: 'ox', success: true, correct: 5, total: 5, answeredIds: [] }, ev)).toBe(false);
    expect(decideNpcInteraction(p, onyu, 'seoul')).toEqual({ kind: 'talk', text: onyu.idleText });
  });

  it('unlockDependents opens locked missions whose prerequisite was turned in', () => {
    const p = createProgress();
    // No prerequisites in v0.1 content; simulate one.
    p.missions.m_paris_ox!.status = 'locked';
    const ev: ProgressEvent[] = [];
    unlockDependents(p, 'm_seoul_quiz', ev);
    expect(p.missions.m_paris_ox!.status).toBe('locked'); // not a dependent
    expect(ev).toEqual([]);
    expect(getCity('paris').missions.every((m) => !m.prerequisiteMissionId)).toBe(true);
  });
});
