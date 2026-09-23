// Content aggregation + accessors + integrity validation. Pure data; no side effects.
import type { CityDef, CityId, ItemDef, LearnCard, MissionDef, MonsterDef, NpcDef, QuizItem } from '../types';
import { MAP_COLS, MAP_ROWS } from '../constants';
import { SEOUL } from './cities/seoul';
import { PARIS } from './cities/paris';
import { SEOUL_QUIZ } from './quizzes/seoul';
import { PARIS_QUIZ } from './quizzes/paris';
import { CITY_MARKERS } from './continents';
import { MONSTERS, getMonsterDef } from './monsters';
import { ITEMS, getItem } from './items';
import { isWalkable, tileForChar } from './tiles';

export { getItem, ITEMS } from './items';
export { getMonsterDef, MONSTERS } from './monsters';
export { CITY_MARKERS, getMarker } from './continents';

export const CITIES: Partial<Record<CityId, CityDef>> = { seoul: SEOUL, paris: PARIS };
export const PLAYABLE_CITIES: readonly CityDef[] = [SEOUL, PARIS];
export const PLAYABLE_CITY_IDS: readonly CityId[] = PLAYABLE_CITIES.map((c) => c.id);
export const ALL_MISSIONS: readonly MissionDef[] = PLAYABLE_CITIES.flatMap((c) => c.missions);
export const ALL_CARDS: readonly LearnCard[] = PLAYABLE_CITIES.flatMap((c) => c.cards);
export const ALL_QUIZ: readonly QuizItem[] = [...SEOUL_QUIZ, ...PARIS_QUIZ];

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
    for (const npc of city.npcs) {
      walk(`npc ${npc.id}`, npc.at);
      for (const mid of npc.missionIds) {
        const m = city.missions.find((x) => x.id === mid);
        if (!m) errors.push(`${tag}: npc ${npc.id} references unknown mission ${mid}`);
        else if (m.giverNpcId !== npc.id) errors.push(`${tag}: mission ${mid} giver mismatch (${m.giverNpcId} vs ${npc.id})`);
      }
      if (npc.cardId && !city.cards.some((c) => c.id === npc.cardId)) errors.push(`${tag}: npc ${npc.id} cardId unknown`);
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
        const pool = quizPool(m.objective.spec.cityId).filter((q) => (m.objective.type === 'minigame' && m.objective.spec.kind === 'quiz' ? q.kind === 'choice' : q.kind === 'ox'));
        if (pool.length < m.objective.spec.count) errors.push(`${tag}: mission ${m.id} pool ${pool.length} < count ${m.objective.spec.count}`);
        if (m.objective.spec.passCount > m.objective.spec.count) errors.push(`${tag}: mission ${m.id} passCount > count`);
      }
    }
    for (const mid of city.stampMissionIds) {
      if (!city.missions.some((m) => m.id === mid)) errors.push(`${tag}: stampMissionIds references unknown ${mid}`);
    }
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

  for (const marker of CITY_MARKERS) {
    if (marker.status === 'playable' && !CITIES[marker.cityId]) errors.push(`marker ${marker.cityId} playable but no CityDef`);
    if (marker.unlock.type === 'missionsTurnedIn') {
      for (const mid of marker.unlock.missionIds) if (!MISSION_BY_ID[mid]) errors.push(`marker ${marker.cityId} unlock mission ${mid} unknown`);
    }
  }
  if (getItem('body_light') === undefined) errors.push('body_light missing');
  return errors;
}
