// Content aggregation + accessors + integrity validation. Pure data; no side effects.
import type { BlankItem, CityDef, CityId, ContentPool, ItemDef, LearnCard, MapTarget, MatchPair, MinigameContent, MinigameKind, MinigameSpec, MissionDef, MonsterDef, NpcDef, OrderItem, QuizItem } from '../types';
import { MAP_COLS, MAP_ROWS } from '../constants';
import { SEOUL } from './cities/seoul';
import { PARIS } from './cities/paris';
import { SEOUL_QUIZ } from './quizzes/seoul';
import { PARIS_QUIZ } from './quizzes/paris';
import { SEOUL_MINIGAMES } from './minigames/seoul';
import { PARIS_MINIGAMES } from './minigames/paris';
import { CITY_MARKERS } from './continents';
import { isRegionId } from './regions';
import { MONSTERS, getMonsterDef } from './monsters';
import { ITEMS, getItem } from './items';
import { isWalkable, tileForChar } from './tiles';
import { findBuildings, rectFilledWith } from '../map/buildings';

export { getItem, ITEMS } from './items';
export { getMonsterDef, MONSTERS } from './monsters';
export { CITY_MARKERS, getMarker } from './continents';

export const CITIES: Partial<Record<CityId, CityDef>> = { seoul: SEOUL, paris: PARIS };
export const PLAYABLE_CITIES: readonly CityDef[] = [SEOUL, PARIS];
export const PLAYABLE_CITY_IDS: readonly CityId[] = PLAYABLE_CITIES.map((c) => c.id);
export const ALL_MISSIONS: readonly MissionDef[] = PLAYABLE_CITIES.flatMap((c) => c.missions);
export const ALL_CARDS: readonly LearnCard[] = PLAYABLE_CITIES.flatMap((c) => c.cards);
export const ALL_QUIZ: readonly QuizItem[] = [...SEOUL_QUIZ, ...PARIS_QUIZ];
/** Match / map-find / order / blank data per city (spec 7, appendix A). Stage C appends the new cities here. */
const MINIGAME_CONTENT: readonly MinigameContent[] = [SEOUL_MINIGAMES, PARIS_MINIGAMES];
export const ALL_PAIRS: readonly MatchPair[] = MINIGAME_CONTENT.flatMap((c) => c.pairs);
export const ALL_MAP_TARGETS: readonly MapTarget[] = MINIGAME_CONTENT.flatMap((c) => c.mapTargets);
export const ALL_ORDERS: readonly OrderItem[] = MINIGAME_CONTENT.flatMap((c) => c.orders);
export const ALL_BLANKS: readonly BlankItem[] = MINIGAME_CONTENT.flatMap((c) => c.blanks);

const MISSION_BY_ID: Record<string, MissionDef> = Object.fromEntries(ALL_MISSIONS.map((m) => [m.id, m]));
const CARD_BY_ID: Record<string, LearnCard> = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));

export function getCity(id: CityId): CityDef {
  const c = CITIES[id];
  if (!c) throw new Error(`City not playable: ${id}`);
  return c;
}
export function hasCity(id: string): id is CityId {
  return Object.prototype.hasOwnProperty.call(CITIES, id);
}
export function getMission(id: string): MissionDef | undefined {
  return MISSION_BY_ID[id];
}
export function getNpc(cityId: CityId, npcId: string): NpcDef | undefined {
  return CITIES[cityId]?.npcs.find((n) => n.id === npcId);
}
export function getNpcAnywhere(npcId: string): NpcDef | undefined {
  for (const c of PLAYABLE_CITIES) {
    const n = c.npcs.find((x) => x.id === npcId);
    if (n) return n;
  }
  return undefined;
}
export function getCard(id: string): LearnCard | undefined {
  return CARD_BY_ID[id];
}
export function getMonster(id: string): MonsterDef {
  return getMonsterDef(id);
}
export function quizPool(cityId: CityId): QuizItem[] {
  return ALL_QUIZ.filter((q) => q.cityId === cityId);
}
/** Every item any minigame of `cityId` may draw from (spec 7.0). Fresh arrays: logics may keep references. */
export function minigamePool(cityId: CityId): ContentPool {
  return {
    quiz: quizPool(cityId),
    pairs: ALL_PAIRS.filter((p) => p.cityId === cityId),
    mapTargets: ALL_MAP_TARGETS.filter((t) => t.cityId === cityId),
    orders: ALL_ORDERS.filter((o) => o.cityId === cityId),
    blanks: ALL_BLANKS.filter((b) => b.cityId === cityId),
  };
}
export function isPlayableCityId(id: unknown): id is CityId {
  return typeof id === 'string' && PLAYABLE_CITY_IDS.includes(id as CityId);
}

/** Returns a list of problems; empty when the content is consistent. */
export function validateContent(): string[] {
  const errors: string[] = [];
  const missionIds = new Set<string>();
  const itemIds = new Set<string>();

  for (const item of ITEMS) {
    if (itemIds.has(item.id)) errors.push(`duplicate item id ${item.id}`);
    itemIds.add(item.id);
    if (item.slot === 'furniture' && !item.size) errors.push(`furniture ${item.id} has no size`);
    if (item.unlockStamp && !PLAYABLE_CITY_IDS.includes(item.unlockStamp)) errors.push(`item ${item.id} unlockStamp not playable`);
  }
  for (const slot of ['body', 'hair', 'top'] as const) {
    if (!ITEMS.some((i: ItemDef) => i.slot === slot && i.default)) errors.push(`no default item for slot ${slot}`);
  }

  for (const city of PLAYABLE_CITIES) {
    const tag = `city ${city.id}`;
    if (city.rows.length !== MAP_ROWS) errors.push(`${tag}: ${city.rows.length} rows (want ${MAP_ROWS})`);
    city.rows.forEach((row, y) => {
      if (row.length !== MAP_COLS) errors.push(`${tag}: row ${y} has ${row.length} cols (want ${MAP_COLS})`);
      for (const ch of row) if (!tileForChar(ch)) errors.push(`${tag}: unknown tile char '${ch}' in row ${y}`);
    });
    const walk = (label: string, p: { tx: number; ty: number }) => {
      if (!isWalkable(city.rows, p.tx, p.ty)) errors.push(`${tag}: ${label} at (${p.tx},${p.ty}) is not walkable`);
    };
    walk('entrance', city.entrance);
    walk('spawn', city.spawn);
    if (city.rows[city.entrance.ty]?.[city.entrance.tx] !== 'E') errors.push(`${tag}: entrance tile is not 'E'`);
    // v0.2: buildings must be filled rectangles ≥ 2x2, landmarks must sit on 'P' cells, theme must be well-formed
    for (const err of findBuildings(city.rows).errors) errors.push(`${tag}: ${err}`);
    const coveredP = new Set<string>();
    const lmIds = new Set<string>();
    for (const lm of city.landmarks) {
      if (lmIds.has(lm.id)) errors.push(`${tag}: duplicate landmark id ${lm.id}`);
      lmIds.add(lm.id);
      if (lm.w < 1 || lm.h < 1) errors.push(`${tag}: landmark ${lm.id} has empty size`);
      if (lm.at.tx < 0 || lm.at.ty < 0 || lm.at.tx + lm.w > MAP_COLS || lm.at.ty + lm.h > MAP_ROWS) errors.push(`${tag}: landmark ${lm.id} out of map`);
      if (lm.solid !== false) {
        if (!rectFilledWith(city.rows, lm.at.tx, lm.at.ty, lm.w, lm.h, 'P')) errors.push(`${tag}: landmark ${lm.id} footprint is not all 'P'`);
        for (let y = lm.at.ty; y < lm.at.ty + lm.h; y++) for (let x = lm.at.tx; x < lm.at.tx + lm.w; x++) coveredP.add(`${x},${y}`);
      }
    }
    city.rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === 'P' && !coveredP.has(`${x},${y}`)) errors.push(`${tag}: 'P' at (${x},${y}) belongs to no landmark`);
    });
    const th = city.theme;
    if (!th) errors.push(`${tag}: theme missing`);
    else {
      if (!['grass', 'sand'].includes(th.ground)) errors.push(`${tag}: theme.ground ${th.ground}`);
      if (!['dirt', 'cobble', 'asphalt'].includes(th.road)) errors.push(`${tag}: theme.road ${th.road}`);
      if (!['village', 'hanok', 'parisian', 'sandstone', 'skyscraper', 'colorful', 'modern'].includes(th.building)) errors.push(`${tag}: theme.building ${th.building}`);
      for (const t of [th.tree, th.streetTree]) if (!['round', 'pine', 'palm', 'tropical', 'plane', 'gum'].includes(t)) errors.push(`${tag}: theme tree ${t}`);
      if (!['river', 'sea'].includes(th.water)) errors.push(`${tag}: theme.water ${th.water}`);
      if (!['stone', 'hedge'].includes(th.wall)) errors.push(`${tag}: theme.wall ${th.wall}`);
    }
    for (const npc of city.npcs) {
      walk(`npc ${npc.id}`, npc.at);
      for (const mid of npc.missionIds) {
        const m = city.missions.find((x) => x.id === mid);
        if (!m) errors.push(`${tag}: npc ${npc.id} references unknown mission ${mid}`);
        else if (m.giverNpcId !== npc.id) errors.push(`${tag}: mission ${mid} giver mismatch (${m.giverNpcId} vs ${npc.id})`);
      }
      if (npc.cardId && !city.cards.some((c) => c.id === npc.cardId)) errors.push(`${tag}: npc ${npc.id} cardId unknown`);
      if (typeof npc.bubble !== 'string' || npc.bubble.length === 0 || npc.bubble.length > 12) errors.push(`${tag}: npc ${npc.id} bubble must be 1-12 chars`);
    }
    for (const sign of city.signs) {
      walk(`sign ${sign.id}`, sign.at);
      if (!city.cards.some((c) => c.id === sign.cardId)) errors.push(`${tag}: sign ${sign.id} cardId unknown`);
    }
    for (const card of city.cards) {
      if (card.cityId !== city.id) errors.push(`${tag}: card ${card.id} cityId mismatch`);
      if (card.lines.length < 3) errors.push(`${tag}: card ${card.id} too short`);
    }
    for (const m of city.missions) {
      if (missionIds.has(m.id)) errors.push(`duplicate mission id ${m.id}`);
      missionIds.add(m.id);
      if (m.cityId !== city.id) errors.push(`${tag}: mission ${m.id} cityId mismatch`);
      if (!city.npcs.some((n) => n.id === m.giverNpcId)) errors.push(`${tag}: mission ${m.id} giver ${m.giverNpcId} unknown`);
      if (m.prerequisiteMissionId && !ALL_MISSIONS.some((x) => x.id === m.prerequisiteMissionId)) errors.push(`${tag}: mission ${m.id} prerequisite unknown`);
      if (m.objective.type === 'defeat') {
        if (!MONSTERS[m.objective.monsterId]) errors.push(`${tag}: mission ${m.id} monster unknown`);
      } else {
        for (const err of minigameSpecErrors(m.objective.spec)) errors.push(`${tag}: mission ${m.id} ${err}`);
      }
    }
    for (const mid of city.stampMissionIds) {
      if (!city.missions.some((m) => m.id === mid)) errors.push(`${tag}: stampMissionIds references unknown ${mid}`);
    }
    // spec 7.0: every city uses at least 3 different minigame kinds
    const kinds = minigameKindsOf(city);
    if (kinds.length < 3) errors.push(`${tag}: minigame missions use ${kinds.length} kinds (${kinds.join(', ')}), want ≥ 3`);
    for (const zone of city.monsterZones) {
      const def = MONSTERS[zone.monsterId];
      if (!def) errors.push(`${tag}: zone monster ${zone.monsterId} unknown`);
      else if (def.cityId !== city.id) errors.push(`${tag}: zone monster ${zone.monsterId} belongs to ${def.cityId}`);
      walk(`zone ${zone.monsterId}`, zone.center);
    }
  }

  const quizIds = new Set<string>();
  for (const q of ALL_QUIZ) {
    if (quizIds.has(q.id)) errors.push(`duplicate quiz id ${q.id}`);
    quizIds.add(q.id);
    if (!PLAYABLE_CITY_IDS.includes(q.cityId)) errors.push(`quiz ${q.id} cityId not playable`);
    if (q.kind === 'choice' && (q.choices.length !== 4 || q.answer < 0 || q.answer > 3)) errors.push(`quiz ${q.id} malformed`);
  }

  errors.push(...minigameContentErrors());

  for (const marker of CITY_MARKERS) {
    if (marker.status === 'playable' && !CITIES[marker.cityId]) errors.push(`marker ${marker.cityId} playable but no CityDef`);
    if (marker.unlock.type === 'missionsTurnedIn') {
      for (const mid of marker.unlock.missionIds) if (!MISSION_BY_ID[mid]) errors.push(`marker ${marker.cityId} unlock mission ${mid} unknown`);
    }
  }
  if (getItem('body_light') === undefined) errors.push('body_light missing');
  return errors;
}

// ---------------------------------------------------------------- minigame content checks (spec 7.0)

/** Pool items a spec can draw from (same filters the logics use). */
function poolSizeFor(spec: MinigameSpec): number {
  const pool = minigamePool(spec.cityId);
  switch (spec.kind) {
    case 'quiz':
    case 'ox': {
      const want = spec.kind === 'quiz' ? 'choice' : 'ox';
      return pool.quiz.filter((q) => q.kind === want && (!spec.topics || spec.topics.includes(q.topic))).length;
    }
    case 'match': return pool.pairs.length;
    case 'mapfind': return pool.mapTargets.length;
    case 'order': return pool.orders.length;
    case 'blank': return pool.blanks.length;
  }
}

/** Problems with one mission's minigame spec: pool size, pass count, per-kind limits. */
function minigameSpecErrors(spec: MinigameSpec): string[] {
  const errors: string[] = [];
  const size = poolSizeFor(spec);
  if (!PLAYABLE_CITY_IDS.includes(spec.cityId)) errors.push(`spec cityId ${spec.cityId} not playable`);
  if (spec.kind === 'match') {
    if (spec.pairs !== 6 && spec.pairs !== 8) errors.push(`match pairs ${String(spec.pairs)} (want 6 or 8)`);
    if (size < spec.pairs) errors.push(`pool ${size} pairs < ${spec.pairs}`);
    if (!Number.isInteger(spec.maxAttempts) || spec.maxAttempts < spec.pairs) errors.push(`match maxAttempts ${spec.maxAttempts} < pairs`);
    return errors;
  }
  if (!Number.isInteger(spec.count) || spec.count < 1) errors.push(`count ${spec.count} must be ≥ 1`);
  if (size < spec.count) errors.push(`pool ${size} < count ${spec.count}`);
  if (!Number.isInteger(spec.passCount) || spec.passCount < 1) errors.push(`passCount ${spec.passCount} must be ≥ 1`);
  if (spec.passCount > spec.count) errors.push('passCount > count');
  if (spec.kind === 'order' && (!Number.isInteger(spec.triesPerQuestion) || spec.triesPerQuestion < 1)) errors.push('order triesPerQuestion must be ≥ 1');
  return errors;
}

/** `[0]`, `[1]` … marks in a blank sentence, in reading order. */
export function blankMarks(text: string): number[] {
  return [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
}

/** Integrity of the match / map-find / order / blank data (ids, cities, shapes). */
function minigameContentErrors(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const checkId = (id: string, cityId: CityId, letter: string, what: string) => {
    if (ids.has(id)) errors.push(`duplicate ${what} id ${id}`);
    ids.add(id);
    if (!PLAYABLE_CITY_IDS.includes(cityId)) errors.push(`${what} ${id} cityId ${cityId} not playable`);
    if (!new RegExp(`^${cityId}_${letter}\\d{2}$`).test(id)) errors.push(`${what} ${id} id must look like ${cityId}_${letter}01`);
  };
  const nonEmpty = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

  for (const p of ALL_PAIRS) {
    checkId(p.id, p.cityId, 'p', 'pair');
    if (!nonEmpty(p.left) || !nonEmpty(p.right)) errors.push(`pair ${p.id} has an empty side`);
    if (!['geo', 'climate', 'culture'].includes(p.topic)) errors.push(`pair ${p.id} topic ${p.topic}`);
  }
  for (const t of ALL_MAP_TARGETS) {
    checkId(t.id, t.cityId, 't', 'map target');
    if (!nonEmpty(t.prompt) || !nonEmpty(t.hint)) errors.push(`map target ${t.id} needs prompt and hint`);
    if (t.target.type === 'city') {
      const cityId = t.target.id;
      if (!CITY_MARKERS.some((m) => m.cityId === cityId)) errors.push(`map target ${t.id} city ${cityId} has no marker`);
    } else if (!isRegionId(t.target.id)) errors.push(`map target ${t.id} region ${String(t.target.id)} unknown`);
  }
  for (const o of ALL_ORDERS) {
    checkId(o.id, o.cityId, 'r', 'order');
    if (o.direction !== 'asc' && o.direction !== 'desc') errors.push(`order ${o.id} direction ${String(o.direction)}`);
    if (o.items.length < 3 || o.items.length > 5) errors.push(`order ${o.id} has ${o.items.length} items (want 3-5)`);
    const values = o.items.map((i) => i.value);
    if (values.some((v) => !Number.isFinite(v))) errors.push(`order ${o.id} has a non-numeric value`);
    if (new Set(values).size !== values.length) errors.push(`order ${o.id} has duplicate values`);
    if (o.items.some((i) => !nonEmpty(i.label))) errors.push(`order ${o.id} has an empty label`);
    if (!nonEmpty(o.prompt) || !nonEmpty(o.explanation)) errors.push(`order ${o.id} needs prompt and explanation`);
  }
  for (const b of ALL_BLANKS) {
    checkId(b.id, b.cityId, 'b', 'blank');
    const marks = blankMarks(b.text);
    if (b.blanks.length < 1 || b.blanks.length > 2) errors.push(`blank ${b.id} has ${b.blanks.length} blanks (want 1-2)`);
    if (marks.length !== b.blanks.length || marks.some((n, i) => n !== i)) errors.push(`blank ${b.id} text marks [${marks.join(',')}] do not match ${b.blanks.length} blanks`);
    b.blanks.forEach((slot, i) => {
      if (slot.options.length !== 4 || new Set(slot.options).size !== 4) errors.push(`blank ${b.id}[${i}] needs 4 distinct options`);
      if (!slot.options.includes(slot.answer)) errors.push(`blank ${b.id}[${i}] options do not include the answer`);
    });
    if (!nonEmpty(b.explanation)) errors.push(`blank ${b.id} needs an explanation`);
  }
  return errors;
}

/** Minigame kinds used by a city's missions (spec 7.0: at least 3 per city). */
export function minigameKindsOf(city: CityDef): MinigameKind[] {
  const kinds: MinigameKind[] = [];
  for (const m of city.missions) if (m.objective.type === 'minigame' && !kinds.includes(m.objective.spec.kind)) kinds.push(m.objective.spec.kind);
  return kinds;
}
