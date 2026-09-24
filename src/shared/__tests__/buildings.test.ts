import { describe, expect, it } from 'vitest';
import { buildingParts, findBuildings, rectFilledWith, roofRows } from '../map/buildings';
import { PLAYABLE_CITIES } from '../content';

describe('findBuildings', () => {
  it('finds rectangles of # and sorts them', () => {
    const rows = [
      '........',
      '.##..##.',
      '.##..##.',
      '........',
      '..####..',
      '..####..',
    ];
    const { rects, errors } = findBuildings(rows);
    expect(errors).toEqual([]);
    expect(rects).toEqual([
      { x0: 1, y0: 1, w: 2, h: 2 }, { x0: 5, y0: 1, w: 2, h: 2 }, { x0: 2, y0: 4, w: 4, h: 2 },
    ]);
  });
  it('rejects L-shapes and 1-wide strips', () => {
    expect(findBuildings(['##.', '###']).errors[0]).toMatch(/not a filled rectangle/);
    expect(findBuildings(['###']).errors[0]).toMatch(/1x3|3x1|at least 2x2/);
    expect(findBuildings(['#', '#', '#']).errors[0]).toMatch(/at least 2x2/);
    expect(findBuildings(['..', '..']).rects).toEqual([]);
  });
  it('every playable city map has only rectangular buildings', () => {
    for (const city of PLAYABLE_CITIES) expect(findBuildings(city.rows).errors).toEqual([]);
  });
});

describe('buildingParts', () => {
  it('roof rows = max(1, floor(h/2))', () => {
    expect(roofRows(2)).toBe(1);
    expect(roofRows(3)).toBe(1);
    expect(roofRows(4)).toBe(2);
    expect(roofRows(5)).toBe(2);
  });
  it('lays out a 4x2 building: roof row + wall row with door in the middle', () => {
    const parts = buildingParts({ x0: 10, y0: 5, w: 4, h: 2 });
    expect(parts).toHaveLength(8);
    expect(parts.slice(0, 4).map((p) => p.part)).toEqual(['roof_tl', 'roof_t', 'roof_t', 'roof_tr']);
    const bottom = parts.slice(4);
    expect(bottom.map((p) => p.part)).toEqual(['wall_l', 'window', 'door', 'window']);
    expect(bottom[2]).toEqual({ tx: 12, ty: 6, part: 'door' });
  });
  it('lays out a 4x4 building with two roof rows and windows on upper wall rows', () => {
    const parts = buildingParts({ x0: 0, y0: 0, w: 4, h: 4 });
    const row = (i: number) => parts.slice(i * 4, i * 4 + 4).map((p) => p.part);
    expect(row(0)).toEqual(['roof_tl', 'roof_t', 'roof_t', 'roof_tr']);
    expect(row(1)).toEqual(['roof_l', 'roof_m', 'roof_m', 'roof_r']);
    expect(row(2)).toEqual(['wall_l', 'window', 'wall_m', 'window']);
    expect(row(3)).toEqual(['wall_l', 'window', 'door', 'window']);
  });
  it('windows sit at odd offsets on both sides of the door (symmetric facade)', () => {
    const six = buildingParts({ x0: 0, y0: 0, w: 6, h: 3 });
    expect(six.slice(12).map((p) => p.part)).toEqual(['window', 'wall_m', 'window', 'door', 'window', 'wall_r']);
    const eight = buildingParts({ x0: 0, y0: 0, w: 8, h: 2 });
    expect(eight.slice(8).map((p) => p.part)).toEqual(['wall_l', 'window', 'wall_m', 'window', 'door', 'window', 'wall_m', 'window']);
    const two = buildingParts({ x0: 0, y0: 0, w: 2, h: 2 });
    expect(two.slice(2).map((p) => p.part)).toEqual(['window', 'door']);
  });
  it('rectFilledWith checks landmark footprints', () => {
    const rows = ['PP.', 'PP.', '...'];
    expect(rectFilledWith(rows, 0, 0, 2, 2, 'P')).toBe(true);
    expect(rectFilledWith(rows, 0, 0, 3, 2, 'P')).toBe(false);
    expect(rectFilledWith(rows, 2, 2, 2, 2, 'P')).toBe(false);
  });
});
