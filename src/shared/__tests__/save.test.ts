import { describe, expect, it } from 'vitest';
import { createProgress } from '../logic/progress';
import { applyAction } from '../logic/reducer';
import { LEGACY_KEYS, SAVE_KEY, SAVE_VERSION, fromSave, migrate, toSave, validate } from '../save/schema';

describe('save schema', () => {
  it('constants match the spec', () => {
    expect(SAVE_KEY).toBe('play1.progress');
    expect(SAVE_VERSION).toBe(2);
    expect(LEGACY_KEYS).toEqual(['play1.save']);
  });

  it('toSave/fromSave round-trip yields an equal, independent copy', () => {
    const p = createProgress('둘리', 42);
    applyAction(p, { type: 'card.read', cardId: 'card_seoul_climate' });
    const s = toSave(p, 1);
    expect(s.version).toBe(2);
    const back = fromSave(s);
    expect(back).toEqual(p);
    back.points = 999;
    expect(p.points).toBe(5);
    expect(s.progress.points).toBe(5);
  });

  it('validate rejects wrong versions, non-objects and missing progress', () => {
    expect(validate(null)).toBeNull();
    expect(validate('x')).toBeNull();
    expect(validate({ version: 99 })).toBeNull();
    expect(validate({ version: 1, progress: {} })).toBeNull();
    expect(validate({ version: 2 })).toBeNull();
    expect(validate({ version: 2, progress: 'nope' })).toBeNull();
    expect(migrate({ version: 99 })).toBeNull();
    expect(migrate(42)).toBeNull();
  });

  it('validate repairs a minimal v2 save with defaults', () => {
    const s = validate({ version: 2, savedAt: 5, progress: {} });
    expect(s).not.toBeNull();
    const p = s!.progress;
    expect(p.profile.name).toBe('여행자');
    expect(p.points).toBe(0);
    expect(p.missions.m_seoul_quiz).toMatchObject({ status: 'available', count: 0, attempts: 0 });
    expect(p.owned).toEqual(expect.arrayContaining(['body_light', 'body_tan', 'hair_short_black', 'top_tshirt_blue']));
    expect(p.avatar).toEqual({ body: 'body_light', hair: 'hair_short_black', top: 'top_tshirt_blue', hat: null });
    expect(p.room).toEqual([]);
    expect(p.lastCity).toBeNull();
  });

  it('drops invalid item ids, unowned equips, bad stamps and overlapping placements only', () => {
    const p = createProgress();
    p.points = 10;
    p.totalEarned = 10;
    p.owned.push('fur_rug', 'fur_chair', 'ghost_item');
    p.avatar.hat = 'hat_crown'; // not owned
    p.avatar.top = 'top_tshirt_blue';
    p.room = [
      { itemId: 'fur_rug', gx: 0, gy: 0 },
      { itemId: 'nope', gx: 5, gy: 5 },
      { itemId: 'fur_chair', gx: 1, gy: 1 }, // overlaps rug
    ];
    p.stamps = ['seoul', 'cairo' as 'seoul', 'seoul'];
    p.readCards = ['card_seoul_geo', 'bogus'];
    p.missions.m_seoul_ox = { missionId: 'm_seoul_ox', status: 'weird' as 'active', count: 1, attempts: 1 };
    (p.missions as Record<string, unknown>).fake = { missionId: 'fake', status: 'active', count: 0, attempts: 0 };
    p.profile.name = '아주아주아주아주긴이름이에요정말';

    const s = validate(JSON.parse(JSON.stringify(toSave(p))));
    expect(s).not.toBeNull();
    const q = s!.progress;
    expect(q.owned).not.toContain('ghost_item');
    expect(q.owned).toContain('fur_rug');
    expect(q.avatar.hat).toBeNull();
    expect(q.room).toEqual([{ itemId: 'fur_rug', gx: 0, gy: 0 }]);
    expect(q.stamps).toEqual(['seoul']);
    expect(q.readCards).toEqual(['card_seoul_geo']);
    expect(q.missions.m_seoul_ox!.status).toBe('available');
    expect(q.missions.fake).toBeUndefined();
    expect(q.profile.name).toHaveLength(12);
  });

  it('clamps points to totalEarned and coerces bad numbers', () => {
    const s = validate({ version: 2, savedAt: 'x', progress: { points: 500, totalEarned: 100, stats: { defeated: -1, quizAnswered: 'a' } } });
    expect(s!.progress.points).toBe(100);
    expect(s!.progress.totalEarned).toBe(100);
    expect(s!.progress.stats).toEqual({ defeated: 0, quizAnswered: 0, quizCorrect: 0 });
    expect(s!.savedAt).toBe(0);
  });
});
