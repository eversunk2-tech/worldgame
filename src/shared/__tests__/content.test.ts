import { describe, expect, it } from 'vitest';
import { ALL_MISSIONS, ALL_QUIZ, PLAYABLE_CITIES, getCity, quizPool, validateContent } from '../content';
import { CITY_MARKERS, CONTINENT_LABELS, OCEAN_LABELS, lonLatToXY } from '../content/continents';
import { ITEMS } from '../content/items';
import { isWalkable, rowsToGrid } from '../content/tiles';
import { MAP_COLS, MAP_ROWS } from '../constants';

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

  it('rowsToGrid maps legend chars to ids', () => {
    const grid = rowsToGrid(['.~T', 'E#*']);
    expect(grid).toEqual([[0, 3, 5], [14, 7, 15]]);
  });

  it('has 2 cities, 6 missions, 22 quiz items, 22 items, 9 markers, 6+5 labels', () => {
    expect(PLAYABLE_CITIES).toHaveLength(2);
    expect(ALL_MISSIONS).toHaveLength(6);
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

  it('projects lon/lat onto the 960×540 map', () => {
    expect(lonLatToXY([0, 0])).toEqual({ x: 480, y: 270 });
    expect(lonLatToXY([-180, 90])).toEqual({ x: 0, y: 0 });
  });
});
