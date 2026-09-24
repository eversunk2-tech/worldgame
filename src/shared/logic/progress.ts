// Fresh Progress for a new game (spec 6.0). Mirrors the old createState/createQuestTable pattern.
import type { MissionProgress, Progress } from '../types';
import { ALL_MISSIONS } from '../content';
import { STARTER_ITEM_IDS, defaultForSlot } from '../content/items';

export const DEFAULT_NAME = '여행자';
export const NAME_MIN = 1;
export const NAME_MAX = 12;

export function createMissionTable(): Record<string, MissionProgress> {
  const table: Record<string, MissionProgress> = {};
  for (const m of ALL_MISSIONS) {
    table[m.id] = { missionId: m.id, status: m.prerequisiteMissionId ? 'locked' : 'available', count: 0, attempts: 0 };
  }
  return table;
}

export function createProgress(name: string = DEFAULT_NAME, createdAt = 0): Progress {
  return {
    profile: { name: normalizeName(name), createdAt },
    points: 0,
    totalEarned: 0,
    missions: createMissionTable(),
    stamps: [],
    readCards: [],
    avatar: { body: defaultForSlot('body'), hair: defaultForSlot('hair'), top: defaultForSlot('top'), hat: null },
    owned: [...STARTER_ITEM_IDS],
    room: [],
    lastCity: null,
    settings: { muted: false },
    stats: { defeated: 0, quizAnswered: 0, quizCorrect: 0, minigames: 0 },
  };
}

/** Trim and clamp a display name; falls back to the default when empty. */
export function normalizeName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_NAME;
  const t = raw.trim();
  if (t.length < NAME_MIN) return DEFAULT_NAME;
  return t.length > NAME_MAX ? t.slice(0, NAME_MAX) : t;
}

export function isValidName(raw: string): boolean {
  const t = raw.trim();
  return t.length >= NAME_MIN && t.length <= NAME_MAX;
}
