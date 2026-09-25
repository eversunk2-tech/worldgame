import { describe, expect, it } from 'vitest';
import {
  allWaterVariants, bridgeVariant, crosswalkVariant, fenceVariant, groundVariant, hash, isBaseWaterVariant, N, E, S, W, NE, NW, SE, SW, RN, RE, RS, RW,
  roadMask, roadVariant, rockVariant, variant, WATER_SHAPES, waterMask, waterQuads, waterVariant,
} from '../map/autotile';
import { getCity, PLAYABLE_CITIES } from '../content';

describe('hash / variant', () => {
  it('is deterministic and spreads values', () => {
    expect(hash(3, 4)).toBe(hash(3, 4));
    expect(hash(3, 4)).not.toBe(hash(4, 3));
    const buckets = new Set<number>();
    for (let x = 0; x < 40; x++) for (let y = 0; y < 30; y++) buckets.add(variant(x, y, 20));
    expect(buckets.size).toBe(20);
    expect(variant(5, 5, 1)).toBe(0);
  });

  it('ground variants are roughly 85/10/5', () => {
    let base = 0, alt = 0, flower = 0;
    for (let x = 0; x < 100; x++) for (let y = 0; y < 100; y++) {
      const v = groundVariant(x, y);
      if (v === 'base') base++; else if (v === 'alt') alt++; else flower++;
    }
    expect(base).toBeGreaterThan(8000);
    expect(alt).toBeGreaterThan(700);
    expect(flower).toBeGreaterThan(300);
    expect(flower).toBeLessThan(700);
  });
});

describe('water autotile', () => {
  const pond = [
    '.....',
    '.~~~.',
    '.~~~.',
    '.~~~.',
    '.....',
  ];
  it('masks 8 neighbours with the map edge counting as water', () => {
    expect(waterMask(pond, 2, 2)).toBe(N | NE | E | SE | S | SW | W | NW);
    expect(waterMask(pond, 1, 1) & (N | W | NW | NE | SW)).toBe(0);
    expect(waterMask(pond, 1, 1) & (E | S | SE)).toBe(E | S | SE);
    // top-left corner of the map: N/W/NW neighbours are outside → water-like
    expect(waterMask(['~~', '~~'], 0, 0)).toBe(0xff);
  });
  it('picks fill / edges / outer corners around a pond', () => {
    expect(waterVariant(waterMask(pond, 2, 2))).toBe('fill');
    expect(waterVariant(waterMask(pond, 2, 1))).toBe('edge_n');
    expect(waterVariant(waterMask(pond, 3, 2))).toBe('edge_e');
    expect(waterVariant(waterMask(pond, 2, 3))).toBe('edge_s');
    expect(waterVariant(waterMask(pond, 1, 2))).toBe('edge_w');
    expect(waterVariant(waterMask(pond, 1, 1))).toBe('c_nw');
    expect(waterVariant(waterMask(pond, 3, 1))).toBe('c_ne');
    expect(waterVariant(waterMask(pond, 1, 3))).toBe('c_sw');
    expect(waterVariant(waterMask(pond, 3, 3))).toBe('c_se');
  });
  it('inner corners when only a diagonal is land; bridges and entrances count as water', () => {
    const lake = ['~~~', '~~.', '~~~'];
    expect(waterVariant(waterMask(lake, 0, 1))).toBe('fill');
    expect(waterVariant(waterMask(lake, 1, 0))).toBe('in_se');
    expect(waterVariant(waterMask(lake, 1, 2))).toBe('in_ne');
    const river = ['.....', '~~B~~', '~~B~~', '.....'];
    expect(waterVariant(waterMask(river, 1, 1))).toBe('edge_n');
    expect(waterVariant(waterMask(river, 3, 2))).toBe('edge_s');
  });
  it('1-wide channels keep a shore band on both banks (ch_h / ch_v)', () => {
    expect(waterVariant(waterMask(['...', '~~~', '...'], 1, 1))).toBe('ch_h');
    expect(waterQuads(waterMask(['...', '~~~', '...'], 1, 1))).toEqual(['n', 'n', 's', 's']);
    expect(waterVariant(waterMask(['.~.', '.~.', '.~.'], 1, 1))).toBe('ch_v');
    expect(waterQuads(waterMask(['.~.', '.~.', '.~.'], 1, 1))).toEqual(['w', 'e', 'w', 'e']);
    // bridges count as water, so a channel under a bridge row stays a channel
    expect(waterVariant(waterMask(['.....', '~~B~~', '.....'], 1, 1))).toBe('ch_h');
  });

  it('channel ends, lone pools and channel mouths (edge + inner corner)', () => {
    expect(waterVariant(waterMask(['...', '.~~', '...'], 1, 1))).toBe('ch_end_w'); // land N, S, W; water continues E
    expect(waterVariant(waterMask(['...', '~~.', '...'], 1, 1))).toBe('ch_end_e');
    expect(waterVariant(waterMask(['...', '.~.', '.~.'], 1, 1))).toBe('ch_end_n');
    expect(waterVariant(waterMask(['.~.', '.~.', '...'], 1, 1))).toBe('ch_end_s');
    expect(waterVariant(waterMask(['...', '.~.', '...'], 1, 1))).toBe('lone');
    // channels between the banks (rows 0 and 4) and an island (row 2, x ≥ 2) meet open water on the left
    const mouth = ['.....', '~~~~~', '~~...', '~~~~~', '.....'];
    expect(waterVariant(waterMask(mouth, 2, 1))).toBe('ch_h');
    expect(waterVariant(waterMask(mouth, 1, 1))).toBe('q_nnfi'); // north shore + the island's corner at SE
    expect(waterVariant(waterMask(mouth, 1, 3))).toBe('q_fiss'); // south shore + the island's corner at NE
    // outer corner with the opposite diagonal also land (a channel bend)
    expect(waterVariant(waterMask(['...', '.~~', '.~.'], 1, 1))).toBe('q_cnwi');
  });

  it('every mask maps to one of the 47 blob shapes; named shapes keep their quadrant codes', () => {
    const all = allWaterVariants();
    expect(all).toHaveLength(47);
    expect(new Set(all.map((v) => v.variant)).size).toBe(47);
    for (const { variant, quads } of all) {
      const named = WATER_SHAPES[quads.join('')];
      expect(variant).toBe(named ?? `q_${quads.join('')}`);
    }
    const base = all.filter((v) => isBaseWaterVariant(v.variant)).map((v) => v.variant).sort();
    expect(base).toEqual(['c_ne', 'c_nw', 'c_se', 'c_sw', 'edge_e', 'edge_n', 'edge_s', 'edge_w', 'fill', 'in_ne', 'in_nw', 'in_se', 'in_sw']);
    for (let m = 0; m < 256; m++) expect(all.some((v) => v.variant === waterVariant(m))).toBe(true);
  });

  it("Paris: the 16 channel tiles around the Île de la Cité get both banks, the 4 channel mouths an inner corner", () => {
    const rows = getCity('paris').rows;
    const shapes = new Map<string, string[]>();
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y]!.length; x++) {
      if (rows[y]![x] !== '~') continue;
      const v = waterVariant(waterMask(rows, x, y));
      if (!isBaseWaterVariant(v)) shapes.set(v, [...(shapes.get(v) ?? []), `${x},${y}`]);
    }
    expect(shapes.get('ch_h')).toHaveLength(16);
    expect(shapes.get('ch_h')).toEqual(expect.arrayContaining(['14,15', '15,15', '18,15', '19,15', '22,15', '25,15', '14,18', '25,18']));
    expect([...shapes.keys()].sort()).toEqual(['ch_h', 'q_fiss', 'q_ifss', 'q_nnfi', 'q_nnif']);
    // New York: the 1-wide water row between Manhattan and Liberty Island (review Stage C M4) is a channel with two
    // mouths; the other four maps use only the sheet's own cells
    const composites = (rows: readonly string[]) => {
      const out: string[] = [];
      for (let y = 0; y < 30; y++) for (let x = 0; x < 40; x++) {
        if (rows[y]![x] !== '~') continue;
        const v = waterVariant(waterMask(rows, x, y));
        if (!isBaseWaterVariant(v)) out.push(`${v}@${x},${y}`);
      }
      return out;
    };
    expect(composites(getCity('newyork').rows)).toEqual(['q_nnfi@3,26', 'ch_h@4,26', 'ch_h@5,26', 'ch_h@6,26', 'ch_h@7,26', 'q_nnif@8,26']);
    for (const city of PLAYABLE_CITIES) {
      if (city.id === 'paris' || city.id === 'newyork') continue;
      expect([city.id, composites(city.rows)]).toEqual([city.id, []]);
    }
  });
});

describe('road autotile', () => {
  it('maps every 4-neighbour mask to a piece', () => {
    expect(roadVariant(0)).toBe('lone');
    expect(roadVariant(RE | RW)).toBe('h');
    expect(roadVariant(RN | RS)).toBe('v');
    expect(roadVariant(RN | RE | RS | RW)).toBe('cross');
    expect(roadVariant(RN | RE | RW)).toBe('t_n');
    expect(roadVariant(RS | RE | RW)).toBe('t_s');
    expect(roadVariant(RN | RS | RE)).toBe('t_e');
    expect(roadVariant(RN | RS | RW)).toBe('t_w');
    expect(roadVariant(RN | RE)).toBe('c_ne');
    expect(roadVariant(RS | RW)).toBe('c_sw');
    expect(roadVariant(RN)).toBe('end_n');
    expect(roadVariant(RW)).toBe('end_w');
  });
  it('reads neighbours (road, bridge, entrance, crosswalk, map edge)', () => {
    const rows = [
      '.=...',
      'E=x=B',
      '.=...',
    ];
    expect(roadMask(rows, 1, 1)).toBe(RN | RE | RS | RW);
    expect(roadVariant(roadMask(rows, 1, 1))).toBe('cross');
    expect(roadVariant(roadMask(rows, 2, 1))).toBe('h');
    expect(roadVariant(roadMask(rows, 1, 0))).toBe('v'); // map edge above counts as connected
    expect(roadVariant(roadMask(rows, 0, 1))).toBe('h'); // entrance at the edge continues off-map
    expect(roadVariant(roadMask(rows, 4, 1))).toBe('h');
  });
  it('2-wide roads render as edge pieces, 1-wide dead ends as caps', () => {
    const rows = [
      '......',
      '.==...',
      '.==...',
      '......',
      '.===..',
      '......',
    ];
    expect(roadVariant(roadMask(rows, 1, 1))).toBe('c_se');
    expect(roadVariant(roadMask(rows, 2, 1))).toBe('c_sw');
    expect(roadVariant(roadMask(rows, 1, 2))).toBe('c_ne');
    expect(roadVariant(roadMask(rows, 1, 4))).toBe('end_e');
    expect(roadVariant(roadMask(rows, 3, 4))).toBe('end_w');
  });
});

describe('orientation helpers', () => {
  it('bridge / crosswalk / fence / rock', () => {
    const river = ['..B..', '~~B~~', '~~B~~', '..B..'];
    expect(bridgeVariant(river, 2, 1)).toBe('v');
    expect(bridgeVariant(river, 2, 0)).toBe('v');
    expect(bridgeVariant(['.~.', 'BBB', '.~.'], 1, 1)).toBe('h');
    expect(bridgeVariant(['...', '.B.', '...'], 1, 1)).toBe('v');
    expect(crosswalkVariant(['...', '=x=', '...'], 1, 1)).toBe('h');
    expect(crosswalkVariant(['.=.', '.x.', '.=.'], 1, 1)).toBe('v');
    expect(fenceVariant(['fff'], 1, 0)).toBe('h');
    expect(fenceVariant(['f', 'f', 'f'], 0, 1)).toBe('v');
    expect(fenceVariant(['.f.'], 1, 0)).toBe('post');
    const rocks = ['RRR', 'RRR', 'RR.'];
    expect(rockVariant(rocks, 1, 1)).toBe('hill');
    expect(rockVariant(rocks, 1, 0)).toBe('hill'); // map edge counts as rock
    expect(rockVariant(rocks, 2, 1)).toBe('rock');
  });
});
