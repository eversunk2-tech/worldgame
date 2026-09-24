// Code-generated sound effects (spec 6.5): oscillators + gain envelopes and filtered noise bursts. Every node is
// disconnected on `ended`. Calls before the context is unlocked are ignored.
import { audio } from './AudioEngine';

type Wave = OscillatorType;

function tone(wave: Wave, from: number, to: number | null, dur: number, gain = 0.25, delay = 0, filterHz?: number): void {
  const ctx = audio.ctx;
  const out = audio.sfxGain;
  if (!ctx || !out || !audio.ready) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = osc;
  if (filterHz) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterHz; osc.connect(f); node = f; }
  node.connect(g);
  g.connect(out);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  osc.onended = () => { osc.disconnect(); g.disconnect(); if (node !== osc) node.disconnect(); };
}

function noise(dur: number, gain = 0.2, filter: { type: BiquadFilterType; hz: number } | null = null, delay = 0): void {
  const ctx = audio.ctx;
  const out = audio.sfxGain;
  const buf = audio.noiseBuffer();
  if (!ctx || !out || !buf || !audio.ready) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = src;
  if (filter) { const f = ctx.createBiquadFilter(); f.type = filter.type; f.frequency.value = filter.hz; src.connect(f); node = f; }
  node.connect(g);
  g.connect(out);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  src.onended = () => { src.disconnect(); g.disconnect(); if (node !== src) node.disconnect(); };
}

const STEP_HZ: Record<string, number> = { grass: 700, sand: 1200, road: 2500, sidewalk: 2500, plaza: 2500, bridge: 400 };

export const sfx = {
  click: () => tone('square', 880, null, 0.04, 0.12),
  open: () => tone('triangle', 440, 660, 0.08, 0.2),
  correct: () => { tone('triangle', 523.25, null, 0.07, 0.25); tone('triangle', 659.25, null, 0.07, 0.25, 0.07); tone('triangle', 783.99, null, 0.09, 0.25, 0.14); },
  wrong: () => tone('sawtooth', 220, 110, 0.2, 0.2, 0, 900),
  coin: () => { tone('square', 1200, 1800, 0.06, 0.12); tone('square', 1200, 1800, 0.06, 0.12, 0.08); },
  /** footstep: short noise burst filtered by the ground kind */
  step: (ground: string) => noise(0.025, ground === 'road' || ground === 'sidewalk' || ground === 'plaza' ? 0.1 : 0.16, { type: 'lowpass', hz: STEP_HZ[ground] ?? 700 }),
  hit: () => { noise(0.06, 0.25, { type: 'lowpass', hz: 1500 }); tone('square', 150, null, 0.06, 0.15); },
  hurt: () => tone('sawtooth', 300, 120, 0.15, 0.2, 0, 1200),
  defeat: () => { tone('square', 800, 1600, 0.06, 0.15); tone('square', 1600, 400, 0.12, 0.15, 0.06); },
  emote: () => tone('sine', 700, 1000, 0.08, 0.2),
  stamp: () => [523.25, 659.25, 783.99, 1046.5].forEach((hz, i) => tone('triangle', hz, null, i === 3 ? 0.25 : 0.1, 0.25, i * 0.1)),
  unlock: () => [392, 493.88, 587.33, 783.99, 987.77, 1174.66].forEach((hz, i) => tone('triangle', hz, null, 0.09, 0.2, i * 0.07)),
  flip: () => tone('square', 500, null, 0.03, 0.1),
};
