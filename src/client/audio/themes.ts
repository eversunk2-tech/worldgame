// BGM patterns (spec 6.5 + appendix C). The 3 tracks of a theme share the same total beat count (asserted on load).
import type { BgmId } from '../../shared/types';

export type Step = [note: string /* 'C5' | '-' */, beats: number];
export type DrumStep = [kind: 'k' | 's' | 'h' | 'ks' | '-', beats: number];
export interface BgmTheme { id: BgmId; bpm: number; beatsPerBar: 3 | 4; lead: Step[]; bass: Step[]; drums: DrumStep[]; leadWave?: OscillatorType; swing?: number }

const rep = <T,>(arr: T[], n: number): T[] => Array.from({ length: n }, () => arr).flat();

/** Appendix C: C major arpeggios (I–vi–IV–V), 8 bars = 32 beats, hats only. */
export const WORLD_THEME: BgmTheme = {
  id: 'world', bpm: 72, beatsPerBar: 4, leadWave: 'triangle',
  lead: [
    ['C5', .5], ['E5', .5], ['G5', .5], ['C6', .5], ['G5', .5], ['E5', .5], ['C5', .5], ['E5', .5],
    ['A4', .5], ['C5', .5], ['E5', .5], ['A5', .5], ['E5', .5], ['C5', .5], ['A4', .5], ['C5', .5],
    ['F4', .5], ['A4', .5], ['C5', .5], ['F5', .5], ['C5', .5], ['A4', .5], ['F4', .5], ['A4', .5],
    ['G4', .5], ['B4', .5], ['D5', .5], ['G5', .5], ['D5', .5], ['B4', .5], ['G4', .5], ['B4', .5],
    ['C5', .5], ['E5', .5], ['G5', .5], ['C6', .5], ['E6', 1], ['D6', .5], ['C6', .5],
    ['A4', .5], ['C5', .5], ['E5', .5], ['A5', .5], ['C6', 1], ['B5', .5], ['A5', .5],
    ['F4', .5], ['A4', .5], ['C5', .5], ['F5', .5], ['A5', 1], ['G5', .5], ['F5', .5],
    ['G4', .5], ['B4', .5], ['D5', .5], ['G5', .5], ['B5', 1], ['C6', 1],
  ],
  bass: [['C3', 2], ['G3', 2], ['A2', 2], ['E3', 2], ['F2', 2], ['C3', 2], ['G2', 2], ['D3', 2],
    ['C3', 2], ['G3', 2], ['A2', 2], ['E3', 2], ['F2', 2], ['C3', 2], ['G2', 2], ['G2', 2]],
  drums: Array.from({ length: 16 }, () => ['h', 2] as DrumStep),
};

/** Lo-fi F major, slow kick + hat, 8 bars = 32 beats. */
export const ROOM_THEME: BgmTheme = {
  id: 'room', bpm: 84, beatsPerBar: 4, leadWave: 'sine',
  lead: [
    ['A4', 1], ['C5', 1], ['F5', 1.5], ['E5', .5],
    ['D5', 1], ['C5', 1], ['A4', 2],
    ['G4', 1], ['A4', 1], ['C5', 1.5], ['D5', .5],
    ['C5', 1], ['A4', 1], ['G4', 2],
    ['F4', 1], ['A4', 1], ['C5', 1.5], ['A4', .5],
    ['D5', 1], ['C5', 1], ['A4', 2],
    ['G4', 1], ['Bb4', 1], ['D5', 1.5], ['C5', .5],
    ['A4', 2], ['F4', 2],
  ],
  bass: [['F2', 4], ['D2', 4], ['Bb2', 4], ['C3', 4], ['F2', 4], ['D2', 4], ['Bb2', 4], ['C3', 4]],
  drums: rep([['k', 1], ['h', 1], ['h', 1], ['h', 1]] as DrumStep[], 8),
};

/** Pentatonic (C D E G A) 국악풍, kick-hat-snare-hat 장단, 8 bars = 32 beats. */
export const SEOUL_THEME: BgmTheme = {
  id: 'seoul', bpm: 108, beatsPerBar: 4, leadWave: 'square',
  lead: [
    ['E5', 1], ['G5', .5], ['A5', .5], ['G5', 1], ['E5', 1],
    ['D5', 1.5], ['E5', .5], ['C5', 2],
    ['A4', 1], ['C5', .5], ['D5', .5], ['E5', 1], ['G5', 1],
    ['E5', 1.5], ['D5', .5], ['C5', 2],
    ['G5', 1], ['A5', .5], ['G5', .5], ['E5', 1], ['D5', 1],
    ['C5', 1], ['D5', .5], ['E5', .5], ['G5', 2],
    ['A5', 1], ['G5', .5], ['E5', .5], ['D5', 1], ['C5', 1],
    ['A4', 1.5], ['C5', .5], ['C5', 2],
  ],
  bass: [['C3', 2], ['G2', 2], ['A2', 2], ['E2', 2], ['C3', 2], ['G2', 2], ['A2', 2], ['E2', 2],
    ['C3', 2], ['G2', 2], ['A2', 2], ['E2', 2], ['F2', 2], ['G2', 2], ['C3', 4]],
  drums: rep([['k', 1], ['h', 1], ['s', 1], ['h', 1]] as DrumStep[], 8),
};

/** G major waltz (3/4), accordion-like square lead on beats 2·3, 16 bars = 48 beats. */
export const PARIS_THEME: BgmTheme = {
  id: 'paris', bpm: 150, beatsPerBar: 3, leadWave: 'square',
  lead: [
    ['-', 1], ['B4', 1], ['D5', 1], ['-', 1], ['G5', 1], ['D5', 1],
    ['-', 1], ['B4', 1], ['D5', 1], ['G5', 2], ['A5', 1],
    ['-', 1], ['C5', 1], ['E5', 1], ['-', 1], ['A5', 1], ['E5', 1],
    ['-', 1], ['C5', 1], ['E5', 1], ['A5', 2], ['G5', 1],
    ['-', 1], ['A4', 1], ['C5', 1], ['-', 1], ['F#5', 1], ['C5', 1],
    ['-', 1], ['A4', 1], ['C5', 1], ['F#5', 2], ['E5', 1],
    ['-', 1], ['B4', 1], ['D5', 1], ['-', 1], ['G5', 1], ['B5', 1],
    ['G5', 2], ['D5', 1], ['G5', 3],
  ],
  bass: [['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['D3', 1], ['D3', 1],
    ['C3', 1], ['E3', 1], ['E3', 1], ['C3', 1], ['E3', 1], ['E3', 1], ['C3', 1], ['E3', 1], ['E3', 1], ['C3', 1], ['E3', 1], ['E3', 1],
    ['D3', 1], ['F#3', 1], ['F#3', 1], ['D3', 1], ['F#3', 1], ['F#3', 1], ['D3', 1], ['F#3', 1], ['F#3', 1], ['D3', 1], ['F#3', 1], ['F#3', 1],
    ['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['D3', 1], ['D3', 1], ['G2', 1], ['G2', 1], ['G2', 1]],
  drums: rep([['k', 1], ['h', 1], ['h', 1]] as DrumStep[], 16),
};

export const BGM_THEMES: Record<BgmId, BgmTheme> = {
  world: WORLD_THEME,
  room: ROOM_THEME,
  seoul: SEOUL_THEME,
  paris: PARIS_THEME,
  // Stage C composes these; until then the Seoul pattern stands in (spec 11.1 A-10)
  cairo: { ...SEOUL_THEME, id: 'cairo' },
  newyork: { ...SEOUL_THEME, id: 'newyork' },
  sydney: { ...SEOUL_THEME, id: 'sydney' },
  rio: { ...SEOUL_THEME, id: 'rio' },
};

const beats = (steps: readonly (Step | DrumStep)[]): number => steps.reduce((s, x) => s + x[1], 0);
for (const t of Object.values(BGM_THEMES)) {
  const l = beats(t.lead), b = beats(t.bass), d = beats(t.drums);
  console.assert(l === b && b === d, `[bgm] ${t.id}: lead ${l} / bass ${b} / drums ${d} beats differ`);
  console.assert(l % t.beatsPerBar === 0, `[bgm] ${t.id}: ${l} beats is not a whole number of ${t.beatsPerBar}/4 bars`);
}
