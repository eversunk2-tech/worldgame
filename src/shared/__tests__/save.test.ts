import { describe, expect, it } from 'vitest';
import { ALL_MISSIONS } from '../content';
import { createProgress } from '../logic/progress';
import { applyAction } from '../logic/reducer';
import { LEGACY_KEYS, SAVE_KEY, SAVE_VERSION, fromSave, migrate, toSave, validate } from '../save/schema';

/** A real v0.1 (v2) save: Seoul stamped, Paris unlocked, a hair bought and equipped, furniture placed. */
const V2_FIXTURE = {
  version: 2,
  savedAt: 1758672000000,
  progress: {
    profile: { name: '리뷰어', createdAt: 1758670000000 },
    points: 244, totalEarned: 269,
    missions: {
      m_seoul_quiz: { missionId: 'm_seoul_quiz', status: 'turnedIn', count: 5, attempts: 1 },
      m_seoul_ox: { missionId: 'm_seoul_ox', status: 'turnedIn', count: 5, attempts: 2 },
      m_seoul_defeat: { missionId: 'm_seoul_defeat', status: 'turnedIn', count: 3, attempts: 0 },
      m_paris_quiz: { missionId: 'm_paris_quiz', status: 'available', count: 0, attempts: 0 },
      m_paris_ox: { missionId: 'm_paris_ox', status: 'active', count: 0, attempts: 0 },
      m_paris_defeat: { missionId: 'm_paris_defeat', status: 'available', count: 0, attempts: 0 },
    },
    stamps: ['seoul'],
    readCards: ['card_seoul_geo', 'card_seoul_climate', 'card_seoul_culture'],
    avatar: { body: 'body_light', hair: 'hair_long_brown', top: 'top_tshirt_blue', hat: null },
    owned: ['body_light', 'body_tan', 'hair_short_black', 'top_tshirt_blue', 'hair_long_brown', 'fur_plant', 'fur_souvenir_seoul'],
    room: [{ itemId: 'fur_plant', gx: 0, gy: 0 }, { itemId: 'fur_souvenir_seoul', gx: 3, gy: 2 }],
    lastCity: 'paris',
    stats: { defeated: 4, quizAnswered: 15, quizCorrect: 13 },
  },
};

describe('save schema v3', () => {
  it('constants match the spec', () => {
    expect(SAVE_KEY).toBe('play1.progress');
    expect(SAVE_VERSION).toBe(3);
    expect(LEGACY_KEYS).toEqual(['play1.save']);
  });

  it('toSave/fromSave round-trip yields an equal, independent copy', () => {
    const p = createProgress('둘리', 42);
    applyAction(p, { type: 'card.read', cardId: 'card_seoul_climate' });
    const s = toSave(p, 1);
    expect(s.version).toBe(3);
    const back = fromSave(s);
    expect(back).toEqual(p);
    back.points = 999;
    expect(p.points).toBe(5);
    expect(s.progress.points).toBe(5);
  });

  it('migrates a v0.1 (v2) save to v3 keeping stamps, items, room, lastCity', () => {
    const s = migrate(JSON.parse(JSON.stringify(V2_FIXTURE)));
    expect(s).not.toBeNull();
    expect(s!.version).toBe(3);
    const p = s!.progress;
    expect(p.settings).toEqual({ muted: false });
    expect(p.stats).toEqual({ defeated: 4, quizAnswered: 15, quizCorrect: 13, minigames: 0 });
    expect(p.points).toBe(244);
    expect(p.stamps).toEqual(['seoul']);
    expect(p.owned).toEqual(expect.arrayContaining(['hair_long_brown', 'fur_souvenir_seoul']));
    expect(p.avatar.hair).toBe('hair_long_brown');
    expect(p.room).toEqual([{ itemId: 'fur_plant', gx: 0, gy: 0 }, { itemId: 'fur_souvenir_seoul', gx: 3, gy: 2 }]);
    expect(p.lastCity).toBe('paris');
    expect(p.missions.m_paris_ox).toMatchObject({ status: 'active' });
    expect(Object.keys(p.missions)).toHaveLength(ALL_MISSIONS.length); // every mission of the content gets a row
    // re-saving writes version 3
    expect(toSave(p).version).toBe(3);
  });

  it('muted:true survives a round trip and non-booleans become false', () => {
    const p = createProgress();
    applyAction(p, { type: 'settings.setMuted', muted: true });
    expect(p.settings.muted).toBe(true);
    const s = validate(JSON.parse(JSON.stringify(toSave(p))));
    expect(s!.progress.settings.muted).toBe(true);
    const bad = validate({ version: 3, progress: { settings: { muted: 'yes' } } });
    expect(bad!.progress.settings.muted).toBe(false);
    const missing = validate({ version: 3, progress: {} });
    expect(missing!.progress.settings).toEqual({ muted: false });
  });

  it('coerces stats.minigames and clamps points to totalEarned', () => {
    const s = validate({ version: 3, savedAt: 'x', progress: { points: 500, totalEarned: 100, stats: { defeated: -1, quizAnswered: 'a', minigames: 2.5 } } });
    expect(s!.progress.points).toBe(100);
    expect(s!.progress.stats).toEqual({ defeated: 0, quizAnswered: 0, quizCorrect: 0, minigames: 0 });
    expect(s!.savedAt).toBe(0);
  });

  it('forces stamp missions back to turnedIn when a status was corrupted', () => {
    const raw = JSON.parse(JSON.stringify(V2_FIXTURE));
    raw.progress.missions.m_seoul_defeat.status = 'weird';
    raw.progress.missions.m_seoul_ox = { missionId: 'm_seoul_ox', status: 'available', count: 0, attempts: 0 };
    const s = migrate(raw);
    expect(s!.progress.missions.m_seoul_defeat!.status).toBe('turnedIn');
    expect(s!.progress.missions.m_seoul_ox!.status).toBe('turnedIn');
    expect(s!.progress.stamps).toEqual(['seoul']);
  });

  it('rejects wrong versions, non-objects and missing progress', () => {
    expect(validate(null)).toBeNull();
    expect(validate('x')).toBeNull();
    expect(validate({ version: 99 })).toBeNull();
    expect(validate({ version: 2, progress: {} })).toBeNull();
    expect(validate({ version: 3 })).toBeNull();
    expect(validate({ version: 3, progress: 'nope' })).toBeNull();
    expect(migrate({ version: 1, progress: {} })).toBeNull();
    expect(migrate({ version: 4, progress: {} })).toBeNull();
    expect(migrate({ version: '2', progress: {} })).toBeNull();
    expect(migrate(42)).toBeNull();
  });

  it('validate repairs a minimal v3 save with defaults', () => {
    const s = validate({ version: 3, savedAt: 5, progress: {} });
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
    p.room = [
      { itemId: 'fur_rug', gx: 0, gy: 0 },
      { itemId: 'nope', gx: 5, gy: 5 },
      { itemId: 'fur_chair', gx: 1, gy: 1 }, // overlaps rug
    ];
    p.stamps = ['seoul', 'beijing', 'seoul']; // beijing is a comingSoon marker, not a playable city
    p.readCards = ['card_seoul_geo', 'bogus'];
    p.missions.m_paris_ox = { missionId: 'm_paris_ox', status: 'weird' as 'active', count: 1, attempts: 1 };
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
    // seoul is stamped → its 3 stamp missions are forced to turnedIn even though this progress never played them
    expect(q.missions.m_seoul_quiz!.status).toBe('turnedIn');
    expect(q.readCards).toEqual(['card_seoul_geo']);
    expect(q.missions.m_paris_ox!.status).toBe('available');
    expect(q.missions.fake).toBeUndefined();
    expect(q.profile.name).toHaveLength(12);
  });

  it('keeps the new cities: lastCity rio, six stamps, their souvenirs and a room of souvenirs (spec 9, C-6)', () => {
    const p = createProgress();
    const all = ['seoul', 'paris', 'cairo', 'newyork', 'sydney', 'rio'] as const;
    p.stamps = [...all];
    for (const m of ALL_MISSIONS) p.missions[m.id]!.status = 'turnedIn';
    p.owned.push('fur_souvenir_cairo', 'fur_souvenir_newyork', 'fur_souvenir_sydney', 'fur_souvenir_rio', 'hat_pharaoh', 'top_brazil');
    p.avatar = { body: 'body_dark', hair: 'hair_short_black', top: 'top_brazil', hat: 'hat_pharaoh' };
    p.room = [{ itemId: 'fur_souvenir_cairo', gx: 0, gy: 0 }, { itemId: 'fur_souvenir_rio', gx: 7, gy: 5 }];
    p.lastCity = 'rio';
    const s = validate(JSON.parse(JSON.stringify(toSave(p, 7))));
    expect(s).not.toBeNull();
    const q = s!.progress;
    expect(q.lastCity).toBe('rio');
    expect(q.stamps).toEqual([...all]);
    expect(q.avatar).toEqual({ body: 'body_dark', hair: 'hair_short_black', top: 'top_brazil', hat: 'hat_pharaoh' });
    expect(q.room).toEqual(p.room);
    expect(q.missions.m_rio_defeat!.status).toBe('turnedIn');
    expect(Object.keys(q.missions)).toHaveLength(30);
  });

  it('a v0.1 save meets the new cities: their missions start fresh, body_dark is added as a starter', () => {
    const s = migrate(JSON.parse(JSON.stringify(V2_FIXTURE)));
    const p = s!.progress;
    expect(p.owned).toContain('body_dark');
    for (const id of ['m_cairo_quiz', 'm_cairo_match', 'm_newyork_quiz', 'm_newyork_order', 'm_sydney_quiz', 'm_sydney_map', 'm_rio_quiz', 'm_rio_blank', 'm_cairo_defeat']) {
      expect([id, p.missions[id]!.status]).toEqual([id, 'available']);
    }
    for (const id of ['m_cairo_map', 'm_cairo_ox', 'm_newyork_blank', 'm_newyork_ox', 'm_sydney_match', 'm_sydney_blank', 'm_rio_order', 'm_rio_ox']) {
      expect([id, p.missions[id]!.status]).toEqual([id, 'locked']);
    }
  });

  it('a stamp of a new city forces its five missions to turnedIn; unknown cities are dropped from lastCity', () => {
    const s = validate({ version: 3, progress: { stamps: ['cairo'], lastCity: 'nairobi', missions: { m_cairo_ox: { status: 'available', count: 0, attempts: 0 } } } });
    const p = s!.progress;
    expect(p.stamps).toEqual(['cairo']);
    for (const id of ['m_cairo_quiz', 'm_cairo_map', 'm_cairo_match', 'm_cairo_ox', 'm_cairo_defeat']) expect(p.missions[id]!.status).toBe('turnedIn');
    expect(p.missions.m_newyork_quiz!.status).toBe('available');
    expect(p.lastCity).toBeNull();
    expect(validate({ version: 3, progress: { lastCity: 'sydney' } })!.progress.lastCity).toBe('sydney');
  });
});
