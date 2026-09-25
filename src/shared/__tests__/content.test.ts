import { describe, expect, it } from 'vitest';
import type { CityId } from '../types';
import { ALL_BLANKS, ALL_MAP_TARGETS, ALL_MISSIONS, ALL_ORDERS, ALL_PAIRS, ALL_QUIZ, MONSTERS, PLAYABLE_CITIES, getCity, getItem, getMission, getNpc, minigameKindsOf, minigamePool, quizPool, validateContent } from '../content';
import { CITY_MARKERS, CONTINENT_LABELS, OCEAN_LABELS, lonLatToXY } from '../content/continents';
import { ITEMS, STARTER_ITEM_IDS } from '../content/items';
import { isWalkable, rowsToGrid, TILES } from '../content/tiles';
import { CARD_READ_POINTS, MAP_COLS, MAP_ROWS, MAPFIND_CITY_RADIUS_PX, STAR_BONUS } from '../constants';
import { rankForTotal } from '../content/ranks';
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

  it('from the spawn every NPC, sign, monster zone and the entrance can be reached (NPC/sign tiles block)', () => {
    for (const city of PLAYABLE_CITIES) {
      const blocked = new Set([...city.npcs.map((n) => n.at), ...city.signs.map((sg) => sg.at)].map((p) => `${p.tx},${p.ty}`));
      const seen = new Set([`${city.spawn.tx},${city.spawn.ty}`]);
      const queue = [city.spawn];
      while (queue.length) {
        const { tx, ty } = queue.shift()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const k = `${tx + dx},${ty + dy}`;
          if (seen.has(k) || blocked.has(k) || !isWalkable(city.rows, tx + dx, ty + dy)) continue;
          seen.add(k);
          queue.push({ tx: tx + dx, ty: ty + dy });
        }
      }
      const besideReached = (p: { tx: number; ty: number }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${p.tx + dx!},${p.ty + dy!}`));
      for (const n of city.npcs) expect([city.id, n.id, besideReached(n.at)]).toEqual([city.id, n.id, true]);
      for (const sg of city.signs) expect([city.id, sg.id, besideReached(sg.at)]).toEqual([city.id, sg.id, true]);
      for (const z of city.monsterZones) expect([city.id, z.monsterId, seen.has(`${z.center.tx},${z.center.ty}`)]).toEqual([city.id, z.monsterId, true]);
      expect([city.id, seen.has(`${city.entrance.tx},${city.entrance.ty}`)]).toEqual([city.id, true]);
    }
  });

  it('monster spawn points stay ≥ 150px from every NPC (new cities, spec 11.3) and out of aggro range of the city spawn', () => {
    // same ring + snap rule as client/entities/spawn.ts (ring at radius × 0.6, nearest walkable tile)
    const snap = (rows: readonly string[], tx: number, ty: number) => {
      const rx = Math.round(tx), ry = Math.round(ty);
      if (isWalkable(rows, rx, ry)) return { tx: rx, ty: ry };
      for (let r = 1; r <= 6; r++) {
        let best: { tx: number; ty: number } | null = null;
        let bestD = Infinity;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !isWalkable(rows, rx + dx, ry + dy)) continue;
          const d = (rx + dx - tx) ** 2 + (ry + dy - ty) ** 2;
          if (d < bestD) { bestD = d; best = { tx: rx + dx, ty: ry + dy }; }
        }
        if (best) return best;
      }
      return { tx: rx, ty: ry };
    };
    for (const city of PLAYABLE_CITIES) {
      const id = city.id;
      for (const z of city.monsterZones) {
        const aggro = MONSTERS[z.monsterId]!.aggroRange;
        for (let i = 0; i < z.count; i++) {
          const a = (i / z.count) * Math.PI * 2;
          const sp = snap(city.rows, z.center.tx + Math.cos(a) * z.radiusTiles * 0.6, z.center.ty + Math.sin(a) * z.radiusTiles * 0.6);
          if (id !== 'seoul' && id !== 'paris') { // A.1/A.2 zones were tuned in earlier stages (> 140px)
            for (const n of city.npcs) {
              const px = Math.hypot(sp.tx - n.at.tx, sp.ty - n.at.ty) * 32;
              expect([id, z.monsterId, n.id, px >= 150]).toEqual([id, z.monsterId, n.id, true]);
            }
          }
          // idle monsters never notice a player standing on the city spawn (entering, or reviving after a faint)
          const fromSpawn = Math.hypot(sp.tx - city.spawn.tx, sp.ty - city.spawn.ty) * 32;
          expect([id, z.monsterId, fromSpawn > aggro]).toEqual([id, z.monsterId, true]);
        }
      }
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

  it('has 6 cities (one per continent), 30 missions, 66 quiz items, 31 items, 9 markers, 6+5 labels', () => {
    expect(PLAYABLE_CITIES.map((c) => c.id)).toEqual(['seoul', 'paris', 'cairo', 'newyork', 'sydney', 'rio']);
    expect(new Set(PLAYABLE_CITIES.map((c) => c.continent)).size).toBe(6);
    expect(ALL_MISSIONS).toHaveLength(30); // 5 per city (spec 7.5)
    expect(ALL_QUIZ).toHaveLength(66);
    for (const city of PLAYABLE_CITIES) {
      expect([city.id, quizPool(city.id).filter((q) => q.kind === 'choice').length]).toEqual([city.id, 6]);
      expect([city.id, quizPool(city.id).filter((q) => q.kind === 'ox').length]).toEqual([city.id, 5]);
      expect(city.cards.map((c) => c.topic)).toEqual(['geo', 'climate', 'culture']);
      expect(city.signs).toHaveLength(3);
      expect(city.npcs.map((n) => n.role)).toEqual(['guide', 'teacher', 'guard']);
      expect(city.missions).toHaveLength(5);
      expect(new Set(city.monsterZones.map((z) => z.monsterId)).size).toBe(2);
    }
    expect(ITEMS).toHaveLength(31);
    expect(CITY_MARKERS).toHaveLength(9);
    expect(CITY_MARKERS.filter((m) => m.status === 'playable').map((m) => m.cityId).sort()).toEqual(['cairo', 'newyork', 'paris', 'rio', 'seoul', 'sydney']);
    expect(CONTINENT_LABELS).toHaveLength(6);
    expect(OCEAN_LABELS).toHaveLength(5);
  });

  it('paid item total is 750 (spec 8.4); body_dark is a free starter; one souvenir per playable city', () => {
    const paid = ITEMS.filter((i) => i.price > 0);
    expect(paid).toHaveLength(20);
    expect(paid.reduce((s, i) => s + i.price, 0)).toBe(750);
    expect(STARTER_ITEM_IDS).toContain('body_dark');
    expect(['hat_pharaoh', 'hat_liberty', 'hat_cork', 'top_brazil'].map((id) => getItem(id)?.price)).toEqual([45, 45, 40, 40]);
    const souvenirs = ITEMS.filter((i) => i.unlockStamp);
    expect(souvenirs.map((i) => i.unlockStamp)).toEqual(['seoul', 'paris', 'cairo', 'newyork', 'sydney', 'rio']);
    expect(souvenirs.map((i) => i.name)).toEqual(['남산타워 모형', '에펠탑 모형', '피라미드 모형', '자유의 여신상 모형', '오페라 하우스 모형', '예수상 모형']);
  });

  it('clearing all six cities pays about 1,000 ± 100 points without monsters (spec 8.4, 12.2-C) and reaches 세계 여행가', () => {
    const missions = ALL_MISSIONS.reduce((sum, m) => sum + m.rewardPoints, 0);
    const cards = PLAYABLE_CITIES.reduce((sum, c) => sum + c.cards.length, 0) * CARD_READ_POINTS;
    const matchStars = ALL_MISSIONS.filter((m) => m.objective.type === 'minigame' && m.objective.spec.kind === 'match').length * STAR_BONUS[3];
    expect([missions, cards, matchStars]).toEqual([960, 90, 30]);
    const total = missions + cards;
    expect(total).toBeGreaterThanOrEqual(900);
    expect(total + matchStars).toBeLessThanOrEqual(1100);
    expect(rankForTotal(total)).toBe('세계 여행가');
    // every paid item is affordable after a full run (spec 8.4: 750 P)
    expect(ITEMS.filter((i) => i.price > 0).reduce((sum, i) => sum + i.price, 0)).toBeLessThanOrEqual(total);
  });

  it('new cities: theme, landmarks, entrance/spawn, stamp = all 5 missions (spec 8.1, A.3–A.6)', () => {
    const want: Record<string, { theme: string; landmarks: string[]; entrance: [number, number]; spawn: [number, number]; facing: string; monsters: string[] }> = {
      cairo: { theme: 'sand/dirt/sandstone/palm/palm/river/stone/cairo', landmarks: ['pyramids', 'sphinx', 'mosque', 'museum'], entrance: [39, 10], spawn: [37, 10], facing: 'left', monsters: ['scarab', 'mummy_cat'] },
      newyork: { theme: 'grass/asphalt/skyscraper/round/round/sea/hedge/newyork', landmarks: ['empire', 'liberty'], entrance: [39, 14], spawn: [36, 14], facing: 'left', monsters: ['pizza_rat', 'taxi_bug'] },
      sydney: { theme: 'grass/asphalt/modern/gum/palm/sea/hedge/sydney', landmarks: ['opera', 'harbour_bridge'], entrance: [39, 15], spawn: [37, 15], facing: 'left', monsters: ['kangaroo', 'seagull'] },
      rio: { theme: 'grass/asphalt/colorful/tropical/palm/sea/hedge/rio', landmarks: ['maracana', 'christ', 'sugarloaf'], entrance: [0, 9], spawn: [2, 9], facing: 'right', monsters: ['monkey', 'toucan'] },
    };
    for (const [id, w] of Object.entries(want)) {
      const city = getCity(id as CityId);
      const t = city.theme;
      expect([id, [t.ground, t.road, t.building, t.tree, t.streetTree, t.water, t.wall, t.bgm].join('/')]).toEqual([id, w.theme]);
      expect(city.landmarks.map((l) => l.kind)).toEqual(w.landmarks);
      expect([city.entrance.tx, city.entrance.ty, city.spawn.tx, city.spawn.ty, city.spawnFacing]).toEqual([...w.entrance, ...w.spawn, w.facing]);
      expect(city.stampMissionIds).toEqual(city.missions.map((m) => m.id));
      expect([...new Set(city.monsterZones.map((z) => z.monsterId))]).toEqual(w.monsters);
      for (const m of w.monsters) expect(MONSTERS[m]!.cityId).toBe(id);
      expect(getMarker(id as CityId).name).toBe(city.name);
    }
    // review Stage C M3 / L10: 나디아 no longer places the gold mask in the old museum; no market stall stands under the
    // mosque's overhang (rows 14-15, cols 23-26) — the stall that sat at (23,14) is now at (22,14)
    const cairo = getCity('cairo');
    expect(cairo.npcs.find((n) => n.id === 'npc_nadia')!.idleText).toBe('여기는 이집트 박물관이야. 미라와 파라오의 보물이 가득하지.');
    // the art in the overhang: minarets fill columns 23 and 26 (rows 14-15), the dome and crescent reach only row 15
    const mosque = cairo.landmarks.find((l) => l.kind === 'mosque')!;
    expect([mosque.at, mosque.w, mosque.overhang]).toEqual([{ tx: 23, ty: 16 }, 4, 2]);
    for (const y of [14, 15]) for (const x of [23, 26]) expect([x, y, cairo.rows[y]![x]]).toEqual([x, y, 'S']);
    expect(cairo.rows[15]!.slice(23, 27)).toBe('SSSS');
    expect([cairo.rows[14]![22], cairo.rows[14]![23]]).toEqual(['m', 'S']);
    // Liberty Island (rows 27-28) is cut off from Manhattan by water: none of its tiles can be reached (review Stage C M4)
    const ny = getCity('newyork');
    expect(ny.rows[26]).toBe('~'.repeat(40));
    const reach = new Set([`${ny.spawn.tx},${ny.spawn.ty}`]);
    const todo = [ny.spawn];
    while (todo.length) {
      const { tx, ty } = todo.pop()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const k = `${tx + dx},${ty + dy}`;
        if (reach.has(k) || !isWalkable(ny.rows, tx + dx, ty + dy)) continue;
        reach.add(k);
        todo.push({ tx: tx + dx, ty: ty + dy });
      }
    }
    for (const k of ['4,27', '7,27', '4,28', '7,28']) expect([k, reach.has(k)]).toEqual([k, false]);
    // Rio's monkeys stand on the dark-grass patch that marks their zone (review Stage C L12)
    const rio = getCity('rio');
    const monkey = rio.monsterZones.find((z) => z.monsterId === 'monkey')!;
    expect(monkey.center).toEqual({ tx: 4, ty: 16 });
    for (let y = 11; y <= 13; y++) expect(rio.rows[y]!.slice(2, 7)).not.toContain(',');
    for (const [x, y] of [[4, 16], [5, 16], [3, 15], [3, 17], [2, 16], [6, 16]] as const) expect([x, y, rio.rows[y]![x]]).toEqual([x, y, ',']);
    // the harbour bridge is an overlay over walkable 'B' tiles; every other landmark is a solid 'P' block
    const bridge = getCity('sydney').landmarks.find((l) => l.kind === 'harbour_bridge')!;
    expect(bridge.solid).toBe(false);
    for (let y = bridge.at.ty; y < bridge.at.ty + bridge.h; y++) for (let x = bridge.at.tx; x < bridge.at.tx + bridge.w; x++) expect(getCity('sydney').rows[y]![x]).toBe('B');
  });

  it('Seoul spawn/entrance match the spec', () => {
    const seoul = getCity('seoul');
    expect(seoul.entrance).toEqual({ tx: 0, ty: 10 });
    expect(seoul.spawn).toEqual({ tx: 2, ty: 10 });
    expect(getCity('paris').entrance).toEqual({ tx: 39, ty: 10 });
  });

  it('every city carries 8 pairs, 5 map targets, 2 order and 4 blank items (appendix A)', () => {
    for (const { id: cityId } of PLAYABLE_CITIES) {
      const pool = minigamePool(cityId);
      expect(pool.pairs.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${cityId}_p0${n}`));
      expect(pool.mapTargets.map((t) => t.id)).toEqual([1, 2, 3, 4, 5].map((n) => `${cityId}_t0${n}`));
      expect(pool.orders.map((o) => o.id)).toEqual([`${cityId}_r01`, `${cityId}_r02`]);
      expect(pool.blanks.map((b) => b.id)).toEqual([1, 2, 3, 4].map((n) => `${cityId}_b0${n}`));
      expect(pool.quiz).toHaveLength(11);
    }
    expect([ALL_PAIRS.length, ALL_MAP_TARGETS.length, ALL_ORDERS.length, ALL_BLANKS.length]).toEqual([48, 30, 12, 24]);
    expect(minigamePool('beijing')).toEqual({ quiz: [], pairs: [], mapTargets: [], orders: [], blanks: [] });
    expect(getCity('seoul').npcs.find((n) => n.id === 'npc_hanbyeol')).toBeDefined();
  });

  it('ordering answers follow the appendix values (spec 12.4)', () => {
    const answer = (id: string) => {
      const o = ALL_ORDERS.find((x) => x.id === id)!;
      const sorted = [...o.items].sort((a, b) => (o.direction === 'asc' ? a.value - b.value : b.value - a.value));
      return sorted.map((i) => i.label).join(' < ');
    };
    expect(answer('cairo_r01')).toBe('스핑크스 < 예수상(리우) < 자유의 여신상(뉴욕) < 대피라미드');
    expect(answer('cairo_r02')).toBe('시드니 < 리우데자네이루 < 뉴욕 < 카이로');
    expect(answer('newyork_r01')).toBe('브루클린 다리 < 자유의 여신상 < 엠파이어 스테이트 빌딩 < 원 월드 트레이드 센터');
    expect(answer('newyork_r02')).toBe('뉴욕 < 리우데자네이루 < 파리 < 카이로');
    expect(answer('sydney_r01')).toBe('시드니 < 리우데자네이루 < 카이로 < 파리');
    expect(answer('sydney_r02')).toBe('여름 < 가을 < 겨울 < 봄'); // months only in the notes (shown after answering)
    expect(ALL_ORDERS.find((o) => o.id === 'sydney_r02')!.items.map((i) => i.note)).toEqual(['12~2월', '3~5월', '6~8월', '9~11월']);
    expect(answer('rio_r01')).toBe('서울 < 시드니 < 리우데자네이루 < 파리');
    expect(answer('rio_r02')).toBe('예수상 < 남산(서울) < 팡지아수카르 < 코르코바두산');
    // review Stage C M1: 남산 is 270 m above sea level (국토지리정보원 270.85 m), and the prompt says heights of hills are elevations
    const rio2 = ALL_ORDERS.find((o) => o.id === 'rio_r02')!;
    expect([rio2.prompt, rio2.items.map((i) => i.value), rio2.items[1]!.note]).toEqual(['높이가 낮은 것부터 순서대로(산은 바다 위 높이)', [38, 270, 396, 710], '270m']);
    // review Stage C L6: positions are written 북위/남위·동경/서경, never as negative numbers
    for (const o of ALL_ORDERS) for (const it of o.items) expect([o.id, it.note ?? '']).not.toEqual([o.id, expect.stringMatching(/-\d/)]);
    // longitudes / latitudes agree with the world-map markers
    const lon = (c: CityId) => Math.round(getMarker(c).lonLat[0]);
    expect(ALL_ORDERS.find((o) => o.id === 'newyork_r02')!.items.map((i) => i.value)).toEqual([lon('newyork'), lon('rio'), lon('paris'), lon('cairo')]);
    const lat = (c: CityId) => Math.round(getMarker(c).lonLat[1] * 10) / 10;
    expect(ALL_ORDERS.find((o) => o.id === 'sydney_r01')!.items.map((i) => i.value)).toEqual([lat('sydney'), lat('rio'), lat('cairo'), lat('paris')]);
  });

  it('the particle right after a blank fits every option, so grammar never gives the answer away (6 cities, review Stage C L5)', () => {
    // final consonant index of the last Hangul syllable (0 = none, 8 = ㄹ), null when the word does not end in Hangul
    const jong = (word: string): number | null => { const w = word.trim(); const c = w.charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c < 11172 ? c % 28 : null; };
    const PARTICLES: readonly [string, string][] = [['으로', '로'], ['을', '를'], ['은', '는'], ['과', '와'], ['이', '가']]; // [after a batchim, after a vowel]
    let checked = 0;
    for (const b of ALL_BLANKS) {
      b.blanks.forEach((slot, i) => {
        const after = b.text.split(`[${i}]`)[1] ?? '';
        if (after.startsWith('(') || /^[가-힣]+\(/.test(after)) return; // written as (이)가 / 을(를): fits any option
        for (const [hard, soft] of PARTICLES) {
          const form = after.startsWith(hard) ? hard : after.startsWith(soft) ? soft : null;
          if (!form) continue;
          if (form === '이' && /[가-힣]/.test(after[1] ?? '')) return; // 이다·이고… is the copula, not the subject particle
          for (const option of slot.options) {
            const j = jong(option);
            if (j === null) continue;
            const takesHard = hard === '으로' ? j !== 0 && j !== 8 : j !== 0;
            expect([b.id, i, option, form]).toEqual([b.id, i, option, takesHard ? hard : soft]);
            checked++;
          }
          return;
        }
      });
    }
    expect(checked).toBeGreaterThanOrEqual(40); // 11 particle blanks × 4 options across the 6 cities
    expect(ALL_BLANKS.find((b) => b.id === 'newyork_b03')!.blanks.map((s) => s.options)).toEqual([
      ['자유의 여신상', '예수상', '에펠탑', '개선문'], ['프랑스', '에스파냐', '이탈리아', '러시아'],
    ]);
  });

  it('every city uses 3+ minigame kinds (spec 7.5 table); the follow-up missions chain from quiz/ox and stay out of the stamp', () => {
    expect(minigameKindsOf(getCity('seoul'))).toEqual(['quiz', 'ox', 'match', 'mapfind']);
    expect(minigameKindsOf(getCity('paris'))).toEqual(['quiz', 'ox', 'blank', 'order']);
    expect(minigameKindsOf(getCity('cairo')).sort()).toEqual(['mapfind', 'match', 'ox', 'quiz']);
    expect(minigameKindsOf(getCity('newyork')).sort()).toEqual(['blank', 'order', 'ox', 'quiz']);
    expect(minigameKindsOf(getCity('sydney')).sort()).toEqual(['blank', 'mapfind', 'match', 'quiz']);
    expect(minigameKindsOf(getCity('rio')).sort()).toEqual(['blank', 'order', 'ox', 'quiz']);
    // each of the six kinds is used by at least two cities
    for (const kind of ['quiz', 'ox', 'match', 'mapfind', 'order', 'blank'] as const) {
      expect([kind, PLAYABLE_CITIES.filter((c) => minigameKindsOf(c).includes(kind)).length >= 2]).toEqual([kind, true]);
    }
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
    // Seoul–Beijing (29px) and Paris–London (10px) are the close pairs; the new cities' targets have no close marker
    expect(close.sort()).toEqual(['paris_t01~london', 'paris_t05~paris', 'seoul_t01~beijing', 'seoul_t04~seoul']);
  });

  it('projects lon/lat onto the 960×540 map', () => {
    expect(lonLatToXY([0, 0])).toEqual({ x: 480, y: 270 });
    expect(lonLatToXY([-180, 90])).toEqual({ x: 0, y: 0 });
  });
});
