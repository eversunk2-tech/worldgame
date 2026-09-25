import { describe, expect, it } from 'vitest';
import { getCity } from '../content';
import type { CityId } from '../types';
import { findBuildings } from '../map/buildings';
import { commonFloor, FLOOR_CHARS, floorUnder, landmarkFloor, landmarkRegion } from '../map/floor';

describe('floorUnder (ground under solid tiles, review Stage C M5 · re-review N2)', () => {
  it('takes the most common walkable floor among the 4 neighbours', () => {
    expect(floorUnder(['.d.', 'd#d', '.d.'], 1, 1)).toBe('d');
    expect(floorUnder(['.Q.', '-bQ', '...'], 1, 1)).toBe('Q'); // Q ×2 beats - and .
    expect(floorUnder(['...', 'dT.', '.d.'], 1, 1)).toBeNull(); // . at N and E, d at S and W → 2:2 tie → theme ground
  });

  it('ignores roads, bridges, entrances, water and other solid tiles; flowers count as grass', () => {
    expect(floorUnder(['.=.', '=l=', '.-.'], 1, 1)).toBe('-');
    expect(floorUnder(['.B.', 'E#~', '.x.'], 1, 1)).toBeNull();
    expect(floorUnder(['###', '###', '###'], 1, 1)).toBeNull(); // inside a large building
    expect(floorUnder(['.*.', '*T*', '.*.'], 1, 1)).toBe('.');
    expect(floorUnder(['T'], 0, 0)).toBeNull(); // off-map neighbours are skipped
    expect(FLOOR_CHARS).toEqual(['.', ',', 'S', 's', 'F', 'd', '-', 'Q']);
  });

  it('a tie between floors takes no side: the theme ground (null)', () => {
    expect(floorUnder(['.Q.', '#b-', '.=.'], 1, 1)).toBeNull(); // Q (N) and - (E) once each
    expect(floorUnder(['.#.', '-b.', '.Q.'], 1, 1)).toBeNull(); // . (E), Q (S), - (W) once each
    expect(floorUnder(['.Q.', 'QbQ', '.-.'], 1, 1)).toBe('Q'); // 3:1 is no tie
    expect(commonFloor(['Q', '.', '*', 'Q'])).toBeNull(); // flowers count as grass → Q 2 : . 2
    expect(commonFloor(['=', 'B', undefined])).toBeNull();
  });

  it('a landmark footprint (P region) takes one floor: the most common floor on the ring around the whole region', () => {
    // bottom-left P (1,2) alone would see . (W) and Q (S) → tie; the region's ring has . ×10, Q ×4 → . for every cell
    const a = ['.....', '.PPP.', '.PPP.', 'QQQQ.'];
    expect(landmarkRegion(a, 2, 2)).toHaveLength(6);
    for (let y = 1; y <= 2; y++) for (let x = 1; x <= 3; x++) expect([x, y, floorUnder(a, x, y)]).toEqual([x, y, '.']);
    // the middle cell sees Q (N) and . (S) → tie on its own; the ring (Q ×7, . ×5) makes the whole region plaza
    const b = ['QQQQQ', 'QPPPQ', '.....'];
    for (const x of [1, 2, 3]) expect(floorUnder(b, x, 1)).toBe('Q');
    // a tie on the ring → theme ground; no floor on the ring (rocks) → theme ground
    expect(landmarkFloor(['.PQ'], 1, 0)).toBeNull();
    expect(landmarkFloor(['RRRR', 'RPPR', 'RRRR'], 1, 1)).toBeNull();
    expect(landmarkRegion(['.P.'], 0, 0)).toEqual([]);
  });

  it('every landmark in the six cities stands on one floor (Gyeongbokgung: grass under both podium corners)', () => {
    const regionFloors = (id: CityId) => {
      const rows = getCity(id).rows;
      const out = new Map<string, Set<string>>();
      for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y]!.length; x++) {
        if (rows[y]![x] !== 'P') continue;
        const key = landmarkRegion(rows, x, y).map(([a, c]) => `${a},${c}`).sort()[0]!;
        const set = out.get(key) ?? new Set<string>();
        set.add(String(floorUnder(rows, x, y)));
        out.set(key, set);
      }
      return [...out.values()].map((set) => [...set]);
    };
    expect(regionFloors('seoul')).toEqual([['.'], ['null']]);            // 경복궁, 남산타워 (rocks and trees around)
    expect(regionFloors('paris')).toEqual([['.'], ['.'], ['.'], ['.']]);
    expect(regionFloors('cairo')).toEqual([['S'], ['S'], ['S'], ['S']]);
    expect(regionFloors('newyork')).toEqual([['-'], ['S']]);             // 엠파이어 on the sidewalk, 자유의 여신상 on sand
    expect(regionFloors('sydney')).toEqual([['Q']]);                     // 오페라 하우스 on the plaza
    expect(regionFloors('rio')).toEqual([['.'], ['null'], ['null']]);   // 마라카낭; 예수상·팡지아수카르 on rocks
    const seoul = getCity('seoul').rows;
    expect([seoul[6]![14], seoul[6]![19]]).toEqual(['P', 'P']);
    expect([floorUnder(seoul, 14, 6), floorUnder(seoul, 19, 6)]).toEqual(['.', '.']);
  });

  it('the 9 cells the old N, E, S, W tie rule split now take the theme ground or their landmark floor', () => {
    const at = (id: CityId, x: number, y: number) => floorUnder(getCity(id).rows, x, y);
    expect([at('seoul', 14, 6), at('seoul', 19, 6)]).toEqual(['.', '.']);   // was Q / . (left/right podium corners)
    expect(at('seoul', 33, 24)).toBeNull();                                 // rock: . : , tie
    expect([at('sydney', 17, 23), at('sydney', 20, 23), at('sydney', 17, 24), at('sydney', 20, 24)]).toEqual([null, null, null, null]);
    expect([at('rio', 25, 7), at('rio', 35, 21)]).toEqual([null, null]);    // tree d : ., rock S : .
  });

  it("Rio's hillside houses stand on dirt: all 16 roof-row cells and their wall rows", () => {
    const rows = getCity('rio').rows;
    const houses = findBuildings(rows).rects.filter((b) => b.x0 >= 25 && b.y0 <= 7);
    expect(houses).toHaveLength(8);
    const roofCells: string[] = [];
    for (const b of houses) {
      for (let y = b.y0; y < b.y0 + b.h; y++) for (let x = b.x0; x < b.x0 + b.w; x++) {
        expect([x, y, floorUnder(rows, x, y)]).toEqual([x, y, 'd']);
        if (y === b.y0) roofCells.push(`${x},${y}`);
      }
    }
    expect(roofCells).toHaveLength(16);
  });

  it("New York: Times Square lamps stand on the plaza, the benches before the Empire State on the sidewalk", () => {
    const rows = getCity('newyork').rows;
    expect([rows[13]![13], rows[13]![18], rows[13]![23], rows[13]![24]]).toEqual(['l', 'l', 'b', 'b']);
    expect([floorUnder(rows, 13, 13), floorUnder(rows, 18, 13)]).toEqual(['Q', 'Q']);
    expect([floorUnder(rows, 23, 13), floorUnder(rows, 24, 13)]).toEqual(['-', '-']);
    // Liberty Island's footprint takes the island sand
    expect(floorUnder(rows, 5, 27)).toBe('S');
  });
});
