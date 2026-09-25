import { describe, expect, it } from 'vitest';
import { ALL_BLANKS, ALL_MAP_TARGETS, ALL_MISSIONS, ALL_ORDERS, ALL_PAIRS, ALL_QUIZ, PLAYABLE_CITIES, getCity, getMission, getNpc, minigameKindsOf, minigamePool, quizPool, validateContent } from '../content';
import { CITY_MARKERS, CONTINENT_LABELS, OCEAN_LABELS, lonLatToXY } from '../content/continents';
import { ITEMS } from '../content/items';
import { isWalkable, rowsToGrid, TILES } from '../content/tiles';
import { MAP_COLS, MAP_ROWS, MAPFIND_CITY_RADIUS_PX } from '../constants';
import { getMarker } from '../content/continents';
import { distancePx } from '../logic/geo';
import { judgeMapTarget } from '../logic/minigame/mapfind';

describe('validateContent', () => {
  it('reports no problems', () => {
    expect(validateContent()).toEqual([]);
  });

  it('every city map is 40×30 and spawn/entrance/npc/sign tiles are walkable', () => {
    for (const city of PLAYABLE_CITIES) {
      expect(city.rows).toHaveLength(MAP_ROWS);
      for (const row of city.rows) expect(row).toHaveLength(MAP_COLS);
      expect(isWalkable(city.rows, city.spawn.tx, city.spawn.ty)).toBe(true);
      expect(isWalkable(city.rows, city.entrance.tx, city.entrance.ty)).toBe(true);
      for (const n of city.npcs) expect(isWalkable(city.rows, n.at.tx, n.at.ty)).toBe(true);
      for (const s of city.signs) expect(isWalkable(city.rows, s.at.tx, s.at.ty)).toBe(true);
      for (const z of city.monsterZones) expect(isWalkable(city.rows, z.center.tx, z.center.ty)).toBe(true);
    }
  });

  it('rowsToGrid maps legend chars to ids (27 kinds, ids 0-15 unchanged)', () => {
    const grid = rowsToGrid(['.~T', 'E#*', '-xQ']);
    expect(grid).toEqual([[0, 3, 5], [14, 7, 15], [16, 17, 26]]);
    expect(TILES).toHaveLength(27);
    expect(TILES.map((t) => t.char).join('')).toBe('.,=~BTR#SsFYPWE*-xpdfbltmvQ');
  });

  it('cities carry a theme, landmarks on P cells and 12-char NPC bubbles', () => {
    const seoul = getCity('seoul');
    expect(seoul.theme).toEqual({ ground: 'grass', road: 'cobble', building: 'hanok', tree: 'round', streetTree: 'plane', water: 'river', wall: 'stone', bgm: 'seoul' });
    expect(seoul.landmarks.map((l) => l.kind)).toEqual(['gyeongbokgung', 'namsan_tower']);
    expect(getCity('paris').landmarks.map((l) => l.kind)).toEqual(['arc', 'louvre', 'notredame', 'eiffel']);
    for (const city of PLAYABLE_CITIES) for (const n of city.npcs) expect(n.bubble.length).toBeLessThanOrEqual(12);
    expect(getCity('paris').npcs.find((n) => n.id === 'npc_pierre')!.at).toEqual({ tx: 12, ty: 19 });
  });

  it('has 2 cities, 10 missions, 22 quiz items, 22 items, 9 markers, 6+5 labels', () => {
    expect(PLAYABLE_CITIES).toHaveLength(2);
    expect(ALL_MISSIONS).toHaveLength(10);
    expect(ALL_QUIZ).toHaveLength(22);
    expect(quizPool('seoul').filter((q) => q.kind === 'choice')).toHaveLength(6);
    expect(quizPool('seoul').filter((q) => q.kind === 'ox')).toHaveLength(5);
    expect(quizPool('paris')).toHaveLength(11);
    expect(ITEMS).toHaveLength(22);
    expect(CITY_MARKERS).toHaveLength(9);
    expect(CONTINENT_LABELS).toHaveLength(6);
    expect(OCEAN_LABELS).toHaveLength(5);
  });

  it('paid item total is 580', () => {
    const paid = ITEMS.filter((i) => i.price > 0);
    expect(paid).toHaveLength(16);
    expect(paid.reduce((s, i) => s + i.price, 0)).toBe(580);
  });

  it('Seoul spawn/entrance match the spec', () => {
    const seoul = getCity('seoul');
    expect(seoul.entrance).toEqual({ tx: 0, ty: 10 });
    expect(seoul.spawn).toEqual({ tx: 2, ty: 10 });
    expect(getCity('paris').entrance).toEqual({ tx: 39, ty: 10 });
  });

  it('Seoul and Paris each carry 8 pairs, 5 map targets, 2 order and 4 blank items (appendix A)', () => {
    for (const cityId of ['seoul', 'paris'] as const) {
      const pool = minigamePool(cityId);
      expect(pool.pairs.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${cityId}_p0${n}`));
      expect(pool.mapTargets.map((t) => t.id)).toEqual([1, 2, 3, 4, 5].map((n) => `${cityId}_t0${n}`));
      expect(pool.orders.map((o) => o.id)).toEqual([`${cityId}_r01`, `${cityId}_r02`]);
      expect(pool.blanks.map((b) => b.id)).toEqual([1, 2, 3, 4].map((n) => `${cityId}_b0${n}`));
      expect(pool.quiz).toHaveLength(11);
    }
    expect([ALL_PAIRS.length, ALL_MAP_TARGETS.length, ALL_ORDERS.length, ALL_BLANKS.length]).toEqual([16, 10, 4, 8]);
    expect(minigamePool('cairo')).toEqual({ quiz: [], pairs: [], mapTargets: [], orders: [], blanks: [] });
    expect(getCity('seoul').npcs.find((n) => n.id === 'npc_hanbyeol')).toBeDefined();
  });

  it('every city uses 3+ minigame kinds; the follow-up missions chain from quiz/ox and stay out of the stamp', () => {
    expect(minigameKindsOf(getCity('seoul'))).toEqual(['quiz', 'ox', 'match', 'mapfind']);
    expect(minigameKindsOf(getCity('paris'))).toEqual(['quiz', 'ox', 'blank', 'order']);
    const chain: [string, string, string, string][] = [
      ['m_seoul_match', 'm_seoul_quiz', 'npc_hanbyeol', 'match'],
      ['m_seoul_map', 'm_seoul_ox', 'npc_onyu', 'mapfind'],
      ['m_paris_blank', 'm_paris_quiz', 'npc_marie', 'blank'],
      ['m_paris_order', 'm_paris_ox', 'npc_louis', 'order'],
    ];
    for (const [id, pre, npc, kind] of chain) {
      const m = getMission(id)!;
      expect(m.prerequisiteMissionId).toBe(pre);
      expect(m.giverNpcId).toBe(npc);
      expect(m.rewardPoints).toBe(30);
      expect(m.objective.type === 'minigame' && m.objective.spec.kind).toBe(kind);
      expect(getCity(m.cityId).stampMissionIds).not.toContain(id);
      expect(getNpc(m.cityId, npc)!.missionIds).toEqual([pre, id]);
    }
    expect(getMission('m_seoul_match')!.objective).toEqual({ type: 'minigame', spec: { kind: 'match', cityId: 'seoul', pairs: 6, maxAttempts: 14 } });
    expect(getMission('m_paris_order')!.objective).toEqual({ type: 'minigame', spec: { kind: 'order', cityId: 'paris', count: 2, passCount: 2, triesPerQuestion: 2 } });
    expect(getCity('seoul').stampMissionIds).toEqual(['m_seoul_quiz', 'm_seoul_ox', 'm_seoul_defeat']);
  });

  it('city map targets near another marker (< 2R) are still told apart by the nearest-marker rule', () => {
    const R = MAPFIND_CITY_RADIUS_PX;
    const close: string[] = [];
    for (const t of ALL_MAP_TARGETS) {
      if (t.target.type !== 'city') continue;
      const own = getMarker(t.target.id);
      expect([t.id, judgeMapTarget(t, own.lonLat[0], own.lonLat[1])]).toEqual([t.id, true]);
      for (const m of CITY_MARKERS) {
        if (m.cityId === own.cityId) continue;
        if (distancePx(lonLatToXY(own.lonLat), lonLatToXY(m.lonLat)) >= 2 * R) continue;
        close.push(`${t.id}~${m.cityId}`);
        expect([t.id, m.cityId, judgeMapTarget(t, m.lonLat[0], m.lonLat[1])]).toEqual([t.id, m.cityId, false]);
      }
    }
    // Seoul–Beijing (29px) and Paris–London (10px) are the close pairs in the Seoul/Paris data
    expect(close).toEqual(expect.arrayContaining(['seoul_t01~beijing', 'seoul_t04~seoul', 'paris_t01~london', 'paris_t05~paris']));
  });

  it('projects lon/lat onto the 960×540 map', () => {
    expect(lonLatToXY([0, 0])).toEqual({ x: 480, y: 270 });
    expect(lonLatToXY([-180, 90])).toEqual({ x: 0, y: 0 });
  });
});
