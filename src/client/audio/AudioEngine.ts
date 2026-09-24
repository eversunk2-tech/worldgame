// Web Audio singleton (spec 6.5). The AudioContext is created on the first user gesture (main.ts → unlock()); until
// then every play request is ignored (never queued). master ← bgmGain / sfxGain; mute sets master to 0.
const MASTER = 0.6;
const BGM = 0.35;
const SFX = 0.6;

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  bgmGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  muted = false;
  private noise: AudioBuffer | null = null;
  private hiddenListeners: (() => void)[] = [];
  private visibleListeners: (() => void)[] = [];

  /** Create/resume the context. Safe to call repeatedly; call from a user-gesture handler. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER;
      this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = BGM;
      this.bgmGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = SFX;
      this.sfxGain.connect(this.master);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.hiddenListeners.forEach((f) => f());
        else this.visibleListeners.forEach((f) => f());
      });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : MASTER, this.ctx.currentTime, 0.02);
  }

  /** 1 s of white noise, shared by every noise burst. */
  noiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noise) {
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      // deterministic LCG noise — no Math.random dependency, identical every run
      let x = 0x2545f491;
      for (let i = 0; i < len; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; d[i] = (x / 0xffffffff) * 2 - 1; }
      this.noise = buf;
    }
    return this.noise;
  }

  onHidden(fn: () => void): void { this.hiddenListeners.push(fn); }
  onVisible(fn: () => void): void { this.visibleListeners.push(fn); }
}

export const audio = new AudioEngine();

/** Frequency of a note name like 'C5', 'Eb4', 'F#3'. */
export function noteHz(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let n = base[m[1]!]!;
  if (m[2] === '#') n += 1;
  if (m[2] === 'b') n -= 1;
  const octave = Number(m[3]);
  const midi = (octave + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
