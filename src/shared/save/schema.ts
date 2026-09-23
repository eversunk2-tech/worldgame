// Save format v2 (spec 6.8): validation, (de)serialization, migration skeleton. No storage access here.
import type { AvatarEquip, CityId, MissionProgress, MissionStatus, Progress, RoomPlacement } from '../types';
import { ALL_MISSIONS, getCard, isPlayableCityId } from '../content';
import { getItem, STARTER_ITEM_IDS, defaultForSlot } from '../content/items';
import { canPlace } from '../logic/inventory';
import { createMissionTable, normalizeName } from '../logic/progress';

export const SAVE_KEY = 'play1.progress';
export const SAVE_VERSION = 2;
export const LEGACY_KEYS = ['play1.save'];

export interface SaveData { version: 2; savedAt: number; progress: Progress }

const MISSION_STATUSES: readonly MissionStatus[] = ['locked', 'available', 'active', 'completed', 'turnedIn'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const nonNegInt = (v: unknown, fallback = 0): number => (isNonNegInt(v) ? v : fallback);

function validateMissions(raw: unknown): Record<string, MissionProgress> {
  const table = createMissionTable();
  if (!isObj(raw)) return table;
  for (const m of ALL_MISSIONS) {
    const entry = raw[m.id];
    if (!isObj(entry)) continue;
    const status = entry.status;
    if (typeof status !== 'string' || !MISSION_STATUSES.includes(status as MissionStatus)) continue;
    table[m.id] = {
      missionId: m.id,
      status: status as MissionStatus,
      count: nonNegInt(entry.count),
      attempts: nonNegInt(entry.attempts),
    };
  }
  return table;
}

function validateOwned(raw: unknown): string[] {
  const owned = new Set<string>(STARTER_ITEM_IDS);
  if (Array.isArray(raw)) for (const id of raw) if (typeof id === 'string' && getItem(id)) owned.add(id);
  return [...owned];
}

function validateAvatar(raw: unknown, owned: string[]): AvatarEquip {
  const a = isObj(raw) ? raw : {};
  const pick = (slot: 'body' | 'hair' | 'top'): string => {
    const id = a[slot];
    if (typeof id === 'string') {
      const item = getItem(id);
      if (item && item.slot === slot && owned.includes(id)) return id;
    }
    return defaultForSlot(slot);
  };
  let hat: string | null = null;
  if (typeof a.hat === 'string') {
    const item = getItem(a.hat);
    if (item && item.slot === 'hat' && owned.includes(a.hat)) hat = a.hat;
  }
  return { body: pick('body'), hair: pick('hair'), top: pick('top'), hat };
}

function validateRoom(raw: unknown, base: Progress): RoomPlacement[] {
  if (!Array.isArray(raw)) return [];
  const probe: Progress = { ...base, room: [] };
  for (const p of raw) {
    if (!isObj(p) || typeof p.itemId !== 'string') continue;
    const item = getItem(p.itemId);
    if (!item || item.slot !== 'furniture') continue;
    if (!isNonNegInt(p.gx) || !isNonNegInt(p.gy)) continue;
    if (!canPlace(probe, item, p.gx, p.gy).ok) continue;
    probe.room.push({ itemId: p.itemId, gx: p.gx, gy: p.gy });
  }
  return probe.room;
}

/** Structural + referential validation. Returns null when the save is unusable; otherwise a cleaned copy. */
export function validate(raw: unknown): SaveData | null {
  if (!isObj(raw)) return null;
  if (raw.version !== SAVE_VERSION) return null;
  const p = raw.progress;
  if (!isObj(p)) return null;
  const profile = isObj(p.profile) ? p.profile : {};
  const stats = isObj(p.stats) ? p.stats : {};
  const savedAt = typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt) ? raw.savedAt : 0;

  const owned = validateOwned(p.owned);
  const totalEarned = nonNegInt(p.totalEarned);
  const points = Math.min(nonNegInt(p.points), totalEarned);

  const stamps: CityId[] = [];
  if (Array.isArray(p.stamps)) for (const s of p.stamps) if (isPlayableCityId(s) && !stamps.includes(s)) stamps.push(s);
  const readCards: string[] = [];
  if (Array.isArray(p.readCards)) for (const c of p.readCards) if (typeof c === 'string' && getCard(c) && !readCards.includes(c)) readCards.push(c);

  const progress: Progress = {
    profile: {
      name: normalizeName(profile.name),
      createdAt: typeof profile.createdAt === 'number' && Number.isFinite(profile.createdAt) ? profile.createdAt : 0,
    },
    points,
    totalEarned,
    missions: validateMissions(p.missions),
    stamps,
    readCards,
    avatar: validateAvatar(p.avatar, owned),
    owned,
    room: [],
    lastCity: isPlayableCityId(p.lastCity) ? p.lastCity : null,
    stats: {
      defeated: nonNegInt(stats.defeated),
      quizAnswered: nonNegInt(stats.quizAnswered),
      quizCorrect: nonNegInt(stats.quizCorrect),
    },
  };
  progress.room = validateRoom(p.room, progress);
  return { version: SAVE_VERSION, savedAt, progress };
}

/** Upgrade older formats to the current version, then validate. Only v2 exists in v0.1. */
export function migrate(raw: unknown): SaveData | null {
  if (!isObj(raw)) return null;
  const version = raw.version;
  switch (version) {
    case SAVE_VERSION:
      return validate(raw);
    // case 3: future — e.g. add profile.id, then fall through to validate
    default:
      return null;
  }
}

export function toSave(progress: Progress, savedAt = 0): SaveData {
  return { version: SAVE_VERSION, savedAt, progress: JSON.parse(JSON.stringify(progress)) as Progress };
}

export function fromSave(save: SaveData): Progress {
  return JSON.parse(JSON.stringify(save.progress)) as Progress;
}
