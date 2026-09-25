// localStorage adapter (spec 6.8). The only file that touches localStorage. Validation lives in shared/save/schema.
import type { Progress } from '../shared/types';
import { LEGACY_KEYS, SAVE_KEY, SAVE_VERSION, migrate, toSave } from '../shared/save/schema';

const SAVE_THROTTLE_MS = 500;
/**
 * Original text of a save from another version, stored once before it is migrated (spec 13: v0.1 saves must not be
 * lost to a migration bug). Kept when an unusable save is discarded; removed only when the player deletes progress.
 */
export const BACKUP_KEY = 'play1.progress.backup';

type Listener = () => void;

class Storage {
  /** false once a localStorage access has thrown; the game continues without saving. */
  available = true;
  private dirty = false;
  private timer: number | null = null;
  private lastSaveAt = 0;
  private getProgress: (() => Progress) | null = null;
  private savedListeners: Listener[] = [];
  private failListeners: Listener[] = [];

  bind(getProgress: () => Progress): void {
    this.getProgress = getProgress;
  }

  onSaved(fn: Listener): () => void {
    this.savedListeners.push(fn);
    return () => { this.savedListeners = this.savedListeners.filter((f) => f !== fn); };
  }
  onUnavailable(fn: Listener): () => void {
    this.failListeners.push(fn);
    return () => { this.failListeners = this.failListeners.filter((f) => f !== fn); };
  }

  /** Remove old 3D-era keys. */
  removeLegacy(): void {
    for (const k of LEGACY_KEYS) {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    }
  }

  hasSave(): boolean {
    try { return localStorage.getItem(SAVE_KEY) !== null; } catch { return false; }
  }

  /** Load + validate. Corrupt data is discarded (warn) so the game starts fresh. */
  load(): Progress | null {
    let text: string | null = null;
    try {
      text = localStorage.getItem(SAVE_KEY);
    } catch (err) {
      console.warn('[storage] localStorage unavailable:', err);
      this.markUnavailable();
      return null;
    }
    if (text === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.warn('[storage] corrupt save (not JSON), starting a new game:', err);
      this.discard();
      return null;
    }
    const version = typeof parsed === 'object' && parsed !== null ? (parsed as { version?: unknown }).version : SAVE_VERSION;
    if (version !== SAVE_VERSION) this.backupOnce(text); // e.g. a v0.1 (v2) save about to be migrated
    const data = migrate(parsed);
    if (!data) {
      console.warn('[storage] invalid save data, starting a new game');
      this.discard();
      return null;
    }
    return data.progress;
  }

  /** Keep the pre-migration text once; an existing backup is never overwritten. Failures are ignored. */
  private backupOnce(text: string): void {
    try {
      if (localStorage.getItem(BACKUP_KEY) === null) localStorage.setItem(BACKUP_KEY, text);
    } catch { /* best effort: the game goes on without a backup */ }
  }

  /** Mark dirty and schedule a throttled save. */
  requestSave(): void {
    this.dirty = true;
    if (this.timer !== null) return;
    const wait = Math.max(0, SAVE_THROTTLE_MS - (Date.now() - this.lastSaveAt));
    this.timer = window.setTimeout(() => { this.timer = null; this.flush(); }, wait);
  }

  /** Save immediately if dirty. */
  flush(): void {
    if (!this.dirty) return;
    if (this.timer !== null) { window.clearTimeout(this.timer); this.timer = null; }
    const progress = this.getProgress?.();
    if (!progress) return;
    this.dirty = false;
    this.write(progress);
  }

  private write(progress: Progress): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave(progress, Date.now())));
      this.lastSaveAt = Date.now();
      for (const fn of this.savedListeners) fn();
      return true;
    } catch (err) {
      console.warn('[storage] save failed:', err);
      this.markUnavailable();
      return false;
    }
  }

  /** Delete the save and its migration backup (진행 초기화 / 새로 시작 — the player chose to drop the progress). */
  clear(): void {
    this.discard();
    try { localStorage.removeItem(BACKUP_KEY); } catch { /* ignore */ }
  }

  /** Drop the current save (unusable data) but keep the backup, so a failed migration can still be recovered. */
  private discard(): void {
    this.dirty = false;
    if (this.timer !== null) { window.clearTimeout(this.timer); this.timer = null; }
    try { localStorage.removeItem(SAVE_KEY); } catch (err) { console.warn('[storage] clear failed:', err); }
  }

  private markUnavailable(): void {
    if (!this.available) return;
    this.available = false;
    for (const fn of this.failListeners) fn();
  }
}

export const storage = new Storage();
