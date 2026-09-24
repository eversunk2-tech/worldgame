// Runtime session: holds Progress, routes every change through the reducer, emits events, schedules saves (spec 6.11).
import Phaser from 'phaser';
import type { CityId, Progress } from '../shared/types';
import { createProgress, DEFAULT_NAME } from '../shared/logic/progress';
import { applyAction, type Action, type ProgressEvent } from '../shared/logic/reducer';
import { rankForTotal } from '../shared/content/ranks';
import { storage } from './storage';

/** Emits every ProgressEvent under its `type`, plus 'any' with the event, plus 'storage.unavailable'. */
class Session {
  progress: Progress = createProgress();
  readonly events = new Phaser.Events.EventEmitter();
  /** true when the progress was restored from a save (drives Title's [이어하기]). */
  loaded = false;
  /** seed counter for minigames (Math.random is allowed on the client, but a counter is enough and reproducible in logs). */
  private seedCounter = 0;

  constructor() {
    storage.bind(() => this.progress);
    storage.onUnavailable(() => this.events.emit('storage.unavailable'));
    storage.onSaved(() => this.events.emit('storage.saved'));
  }

  /** Boot: drop legacy keys, restore a save when present. */
  init(): void {
    storage.removeLegacy();
    const restored = storage.load();
    if (restored) {
      this.progress = restored;
      this.loaded = true;
    } else {
      this.progress = createProgress();
      this.loaded = false;
    }
  }

  hasSave(): boolean {
    return this.loaded || storage.hasSave();
  }

  newGame(name: string): void {
    storage.clear();
    this.progress = createProgress(name || DEFAULT_NAME, Date.now());
    this.loaded = true;
    storage.requestSave();
  }

  reset(): void {
    storage.clear();
    this.progress = createProgress();
    this.loaded = false;
  }

  dispatch(action: Action): ProgressEvent[] {
    const events = applyAction(this.progress, action);
    let rejected = false;
    for (const e of events) {
      if (e.type === 'rejected') rejected = true;
      this.events.emit(e.type, e);
      this.events.emit('any', e);
    }
    // Any non-rejected action may have changed progress (e.g. city.enter emits no event but sets lastCity).
    if (!rejected) storage.requestSave();
    return events;
  }

  /** Save now (scene transitions, beforeunload). */
  flush(): void {
    storage.flush();
  }

  nextSeed(): number {
    this.seedCounter += 1;
    return (Date.now() + this.seedCounter * 7919) >>> 0;
  }

  get rank(): string {
    return rankForTotal(this.progress.totalEarned);
  }

  get lastCity(): CityId | null {
    return this.progress.lastCity;
  }

  /** Persisted mute flag (spec 9). */
  get muted(): boolean {
    return this.progress.settings.muted;
  }

  setMuted(muted: boolean): void {
    this.dispatch({ type: 'settings.setMuted', muted });
  }
}

export const session = new Session();

window.addEventListener('beforeunload', () => session.flush());
