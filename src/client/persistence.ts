// localStorage save / load / clear. Only client code knows about saving; shared stays pure.
import type { GameState, QuestProgress, QuestStatus, SimEvent, Vec3 } from '../shared/types';
import { MAP } from '../shared/data/map';
import { QUEST_MAP } from '../shared/data/quests';
import { MAX_LEVEL, statsForLevel, xpToNext } from '../shared/data/levels';
import { clone } from '../shared/vec';

export const SAVE_KEY = 'play1.save';
export const SAVE_VERSION = 1;
export const SAVE_INTERVAL = 5;
const MIN_SAVE_GAP = 0.5;

export interface SaveData {
  version: number; savedAt: number;
  player: { level: number; xp: number; maxHp: number; atk: number; hp: number; pos: Vec3; yaw: number };
  quests: Record<string, QuestProgress>;
}

const QUEST_STATUSES: readonly QuestStatus[] = ['locked', 'available', 'active', 'completed', 'turnedIn'];

// Module state for maybeSave
let sinceLastSave = 0;
let dirty = false;
let lastGroundPos: Vec3 = clone(MAP.playerSpawn);
let lastGroundYaw = 0;
let onSaved: (() => void) | undefined;

/** Register a callback fired after each successful save (HUD "저장됨" indicator). */
export function setOnSaved(cb: () => void): void {
  onSaved = cb;
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isVec3(v: unknown): v is Vec3 {
  return typeof v === 'object' && v !== null && isNum((v as Vec3).x) && isNum((v as Vec3).y) && isNum((v as Vec3).z);
}

function validate(raw: unknown): SaveData | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const d = raw as Partial<SaveData>;
  if (d.version !== SAVE_VERSION) return null;
  if (!isNum(d.savedAt)) return null;
  const p = d.player;
  if (typeof p !== 'object' || p === null) return null;
  if (!isNum(p.level) || !isNum(p.xp) || !isNum(p.maxHp) || !isNum(p.atk) || !isNum(p.hp) || !isNum(p.yaw)) return null;
  if (!isVec3(p.pos)) return null;
  const b = MAP.bounds;
  if (p.pos.x < b.minX || p.pos.x > b.maxX || p.pos.z < b.minZ || p.pos.z > b.maxZ || p.pos.y < 0 || p.pos.y > 50) return null;
  if (p.level < 1 || p.level > 99) return null;
  if (typeof d.quests !== 'object' || d.quests === null) return null;
  for (const [id, q] of Object.entries(d.quests)) {
    if (!QUEST_MAP[id]) return null;
    if (typeof q !== 'object' || q === null) return null;
    if (q.questId !== id || !QUEST_STATUSES.includes(q.status) || !isNum(q.count)) return null;
  }
  return d as SaveData;
}

/** Apply saved data to `state` if present and valid. Returns whether anything was applied. */
export function load(state: GameState): boolean {
  let text: string | null = null;
  try {
    text = localStorage.getItem(SAVE_KEY);
  } catch (err) {
    console.warn('[persistence] localStorage unavailable, starting without save:', err);
    return false;
  }
  if (!text) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.warn('[persistence] corrupt save (JSON), starting new game:', err);
    clear();
    return false;
  }
  const data = validate(parsed);
  if (!data) {
    console.warn('[persistence] invalid save data, starting new game');
    clear();
    return false;
  }

  // Stats are derived from level (not trusted from the file); xp/count are clamped to valid ranges.
  const p = state.player;
  p.level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(data.player.level)));
  const stats = statsForLevel(p.level);
  p.maxHp = stats.maxHp;
  p.atk = stats.atk;
  p.xp = Math.min(xpToNext(p.level) - 1, Math.max(0, Math.floor(data.player.xp)));
  p.hp = data.player.hp <= 0 ? p.maxHp : Math.min(data.player.hp, p.maxHp);
  p.pos = clone(data.player.pos);
  p.yaw = data.player.yaw;
  p.vel = { x: 0, y: 0, z: 0 };
  for (const [id, q] of Object.entries(data.quests)) {
    state.quests[id] = { questId: id, status: q.status, count: Math.max(0, Math.floor(q.count)) };
  }
  lastGroundPos = clone(p.pos);
  lastGroundYaw = p.yaw;
  return true;
}

function buildSaveData(state: GameState): SaveData {
  const p = state.player;
  if (p.alive && p.onGround) {
    lastGroundPos = clone(p.pos);
    lastGroundYaw = p.yaw;
  }
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    player: {
      level: p.level, xp: p.xp, maxHp: p.maxHp, atk: p.atk, hp: p.hp,
      pos: clone(lastGroundPos), yaw: lastGroundYaw,
    },
    quests: JSON.parse(JSON.stringify(state.quests)) as Record<string, QuestProgress>,
  };
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData(state)));
    sinceLastSave = 0;
    dirty = false;
    onSaved?.();
  } catch (err) {
    console.warn('[persistence] save failed:', err);
  }
}

const IMMEDIATE_EVENTS = new Set<SimEvent['type']>([
  'player:levelup', 'quest:accepted', 'quest:progress', 'quest:completed', 'quest:turnedIn',
]);

export function maybeSave(state: GameState, events: SimEvent[], dt: number): void {
  sinceLastSave += dt;
  for (const e of events) {
    if (IMMEDIATE_EVENTS.has(e.type)) { dirty = true; break; }
  }
  if (dirty && sinceLastSave >= MIN_SAVE_GAP) {
    save(state);
  } else if (sinceLastSave >= SAVE_INTERVAL) {
    save(state);
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('[persistence] clear failed:', err);
  }
}
