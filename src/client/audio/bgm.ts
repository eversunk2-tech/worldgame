// Step sequencer BGM (spec 6.5): a 25 ms timer schedules notes up to 120 ms ahead on 3 tracks. Switching songs
// crossfades over 300 ms; the same song is never restarted; tab hide pauses scheduling (no note pile-up on return).
import type { BgmId } from '../../shared/types';
import { audio, noteHz } from './AudioEngine';
import { BGM_THEMES, type BgmTheme, type DrumStep, type Step } from './themes';

const LOOKAHEAD = 0.12;
const TICK_MS = 25;
const FADE = 0.3;
const LEAD_GAIN = 0.12;
const BASS_GAIN = 0.18;

class Song {
  readonly gain: GainNode;
  private pos = 0;           // beat position of the next lead step (each track keeps its own cursor)
  private cursors = { lead: 0, bass: 0, drums: 0 };
  private nextTime = { lead: 0, bass: 0, drums: 0 };
  private nodes = new Set<AudioScheduledSourceNode>();
  stopped = false;

  constructor(readonly theme: BgmTheme, private readonly ctx: AudioContext, out: AudioNode, startAt: number) {
    this.gain = ctx.createGain();
    this.gain.gain.setValueAtTime(0.0001, startAt);
    this.gain.gain.exponentialRampToValueAtTime(1, startAt + FADE);
    this.gain.connect(out);
    this.nextTime = { lead: startAt, bass: startAt, drums: startAt };
  }

  private get secPerBeat(): number {
    return 60 / this.theme.bpm;
  }

  /** Schedule everything that starts before `until`. */
  schedule(until: number): void {
    if (this.stopped) return;
    this.track('lead', this.theme.lead, until, (note, t, dur) => this.osc(this.theme.leadWave ?? 'square', note, t, dur, LEAD_GAIN));
    this.track('bass', this.theme.bass, until, (note, t, dur) => this.osc('triangle', note, t, dur, BASS_GAIN));
    this.track('drums', this.theme.drums, until, (kind, t) => this.drum(kind as DrumStep[0], t));
  }

  private track(name: 'lead' | 'bass' | 'drums', steps: readonly (Step | DrumStep)[], until: number, play: (v: string, t: number, dur: number) => void): void {
    if (!steps.length) return;
    while (this.nextTime[name] < until) {
      const i = this.cursors[name] % steps.length;
      const [v, beats] = steps[i]!;
      let t = this.nextTime[name];
      const dur = beats * this.secPerBeat;
      // swing: delay every other half-beat step slightly
      if (this.theme.swing && name !== 'drums' && i % 2 === 1 && beats <= 0.5) t += this.theme.swing * this.secPerBeat * 0.5;
      if (v !== '-') play(v, t, dur);
      this.nextTime[name] += dur;
      this.cursors[name] += 1;
    }
    void this.pos;
  }

  private osc(wave: OscillatorType, note: string, t: number, dur: number, gain: number): void {
    const hz = noteHz(note);
    if (!hz) return;
    const o = this.ctx.createOscillator();
    o.type = wave;
    o.frequency.value = hz;
    const g = this.ctx.createGain();
    const len = Math.max(0.05, dur * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.setValueAtTime(gain, t + len * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g);
    g.connect(this.gain);
    o.start(t);
    o.stop(t + len + 0.02);
    this.nodes.add(o);
    o.onended = () => { o.disconnect(); g.disconnect(); this.nodes.delete(o); };
  }

  private drum(kind: DrumStep[0], t: number): void {
    if (kind === '-') return;
    if (kind === 'k' || kind === 'ks') this.kick(t);
    if (kind === 's' || kind === 'ks') this.noiseHit(t, 0.08, 'bandpass', 1800, 0.18);
    if (kind === 'h') this.noiseHit(t, 0.02, 'highpass', 6000, 0.08);
  }

  private kick(t: number): void {
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(this.gain);
    o.start(t); o.stop(t + 0.12);
    this.nodes.add(o);
    o.onended = () => { o.disconnect(); g.disconnect(); this.nodes.delete(o); };
  }

  private noiseHit(t: number, dur: number, type: BiquadFilterType, hz: number, gain: number): void {
    const buf = audio.noiseBuffer();
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = hz;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.gain);
    src.start(t); src.stop(t + dur + 0.02);
    this.nodes.add(src);
    src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect(); this.nodes.delete(src); };
  }

  /** Fade out and release every node. */
  stop(at: number): void {
    if (this.stopped) return;
    this.stopped = true;
    this.gain.gain.cancelScheduledValues(at);
    this.gain.gain.setValueAtTime(Math.max(0.0001, this.gain.gain.value), at);
    this.gain.gain.exponentialRampToValueAtTime(0.0001, at + FADE);
    window.setTimeout(() => {
      for (const n of this.nodes) { try { n.stop(); } catch { /* already stopped */ } n.disconnect(); }
      this.nodes.clear();
      this.gain.disconnect();
    }, FADE * 1000 + 50);
  }

  /** Re-anchor cursors to `now` after a pause (drops the queue instead of piling notes up). */
  resumeAt(now: number): void {
    this.nextTime = { lead: now, bass: now, drums: now };
  }
}

class Bgm {
  private current: Song | null = null;
  private wanted: BgmId | null = null;
  private timer: number | null = null;
  private duckGain = 1;
  private paused = false;

  constructor() {
    audio.onHidden(() => this.pause());
    audio.onVisible(() => this.resume());
  }

  /** Start `id` (crossfade from the current song). No-op when it is already playing. Before unlock: remembered. */
  play(id: BgmId): void {
    this.wanted = id;
    if (!audio.ready || !audio.ctx || !audio.bgmGain) return;
    if (this.current && this.current.theme.id === id && !this.current.stopped) return;
    const now = audio.ctx.currentTime;
    this.current?.stop(now);
    this.current = new Song(BGM_THEMES[id], audio.ctx, audio.bgmGain, now + 0.05);
    this.applyDuck();
    this.ensureTimer();
  }

  /** Called from the unlock handler: start whatever scene asked for while audio was locked. */
  kick(): void {
    if (this.wanted && (!this.current || this.current.stopped)) this.play(this.wanted);
  }

  stop(): void {
    this.wanted = null;
    if (this.current && audio.ctx) this.current.stop(audio.ctx.currentTime);
    this.current = null;
  }

  /** Scale the music while a minigame runs (0.4) and back (1). */
  duck(factor: number): void {
    this.duckGain = factor;
    this.applyDuck();
  }

  private applyDuck(): void {
    if (audio.bgmGain && audio.ctx) audio.bgmGain.gain.setTargetAtTime(0.35 * this.duckGain, audio.ctx.currentTime, 0.1);
  }

  private ensureTimer(): void {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    if (this.paused || !audio.ctx || !this.current || this.current.stopped) return;
    if (audio.muted) return; // muted: keep the cursor parked (spec: 음소거 시 스케줄 정지)
    this.current.schedule(audio.ctx.currentTime + LOOKAHEAD);
  }

  private pause(): void {
    this.paused = true;
  }

  private resume(): void {
    this.paused = false;
    if (this.current && audio.ctx) this.current.resumeAt(audio.ctx.currentTime + 0.05);
  }

  /** After unmute, continue from now rather than the parked time. */
  onUnmuted(): void {
    if (this.current && audio.ctx) this.current.resumeAt(audio.ctx.currentTime + 0.05);
  }

  get currentId(): BgmId | null {
    return this.current && !this.current.stopped ? this.current.theme.id : null;
  }
}

export const bgm = new Bgm();
