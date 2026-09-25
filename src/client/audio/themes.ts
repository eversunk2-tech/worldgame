// BGM patterns (spec 6.5 + appendix C): 8 songs, one per scene/city. The 3 tracks of a theme share the same total beat
// count (asserted on load).
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

/** Hijaz scale on D (D Eb F# G A Bb C), low sustained bass drone, maqsum doumbek (dum-tek-tek-dum-tek), 8 bars = 32 beats. */
export const CAIRO_THEME: BgmTheme = {
  id: 'cairo', bpm: 100, beatsPerBar: 4, leadWave: 'triangle',
  lead: [
    ['D5', 1], ['C5', .5], ['Bb4', .5], ['A4', 1], ['G4', .5], ['F#4', .5],
    ['G4', .5], ['F#4', .5], ['Eb4', 1], ['D4', 2],
    ['A4', 1], ['Bb4', .5], ['A4', .5], ['G4', 1], ['F#4', .5], ['G4', .5],
    ['A4', 3], ['-', 1],
    ['D4', .5], ['Eb4', .5], ['F#4', .5], ['G4', .5], ['A4', 1], ['Bb4', 1],
    ['C5', .5], ['Bb4', .5], ['A4', .5], ['G4', .5], ['F#4', 1], ['G4', 1],
    ['A4', .5], ['G4', .5], ['F#4', .5], ['Eb4', .5], ['F#4', 1], ['Eb4', 1],
    ['D4', 3], ['-', 1],
  ],
  bass: [['D2', 4], ['D2', 4], ['D2', 4], ['A1', 4], ['D2', 4], ['G2', 4], ['A1', 4], ['D2', 4]],
  drums: rep([['k', .5], ['h', .5], ['-', .5], ['h', .5], ['k', .5], ['-', .5], ['s', .5], ['-', .5]] as DrumStep[], 8),
};

/**
 * The sequencer swings a lead step when its *index* is odd and it is an eighth (bgm.ts). Phrases are written in
 * eighths and whole beats; after every note that fills an even number of eighths a zero-length rest keeps the step
 * parity equal to the eighth position, so exactly the off-beat eighths are delayed.
 */
const swingSafe = (phrase: Step[]): Step[] => phrase.flatMap((st): Step[] => ((st[1] * 2) % 2 === 0 ? [st, ['-', 0]] : [st]));

/** 12-bar blues in C (C7 C7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7), swing 0.2, walking bass, 12 bars = 48 beats. */
export const NEWYORK_THEME: BgmTheme = {
  id: 'newyork', bpm: 126, beatsPerBar: 4, leadWave: 'square', swing: 0.2,
  lead: swingSafe([
    ['G4', .5], ['Bb4', .5], ['C5', 1], ['-', .5], ['G4', .5], ['Bb4', .5], ['C5', .5],
    ['Eb5', .5], ['C5', .5], ['Bb4', .5], ['G4', .5], ['C5', 2],
    ['G4', .5], ['Bb4', .5], ['C5', 1], ['-', .5], ['G4', .5], ['Bb4', .5], ['C5', .5],
    ['Eb5', .5], ['E5', .5], ['G5', 1], ['E5', .5], ['C5', .5], ['-', 1],
    ['C5', .5], ['Eb5', .5], ['F5', 1], ['-', .5], ['C5', .5], ['Eb5', .5], ['F5', .5],
    ['A5', .5], ['F5', .5], ['Eb5', .5], ['C5', .5], ['F5', 2],
    ['G4', .5], ['Bb4', .5], ['C5', 1], ['-', .5], ['G4', .5], ['Bb4', .5], ['C5', .5],
    ['Eb5', .5], ['C5', .5], ['Bb4', .5], ['G4', .5], ['C5', 1], ['-', 1],
    ['D5', .5], ['F5', .5], ['G5', 1], ['F5', .5], ['D5', .5], ['B4', 1],
    ['C5', .5], ['Eb5', .5], ['F5', 1], ['Eb5', .5], ['C5', .5], ['A4', 1],
    ['G4', .5], ['Bb4', .5], ['C5', .5], ['Eb5', .5], ['E5', .5], ['G5', .5], ['C6', 1],
    ['B5', .5], ['G5', .5], ['F5', .5], ['D5', .5], ['B4', 1], ['G4', 1],
  ]),
  // walking quarter notes through each chord
  bass: [
    ['C3', 1], ['E3', 1], ['G3', 1], ['A3', 1], ['Bb3', 1], ['A3', 1], ['G3', 1], ['E3', 1],
    ['C3', 1], ['E3', 1], ['G3', 1], ['A3', 1], ['Bb3', 1], ['A3', 1], ['G3', 1], ['E3', 1],
    ['F2', 1], ['A2', 1], ['C3', 1], ['D3', 1], ['Eb3', 1], ['D3', 1], ['C3', 1], ['A2', 1],
    ['C3', 1], ['E3', 1], ['G3', 1], ['A3', 1], ['Bb3', 1], ['A3', 1], ['G3', 1], ['E3', 1],
    ['G2', 1], ['B2', 1], ['D3', 1], ['E3', 1], ['F2', 1], ['A2', 1], ['C3', 1], ['D3', 1],
    ['C3', 1], ['E3', 1], ['G3', 1], ['E3', 1], ['G2', 1], ['A2', 1], ['B2', 1], ['D3', 1],
  ],
  drums: rep([['k', 1], ['s', 1], ['k', 1], ['s', 1]] as DrumStep[], 12),
};

const surfBar = (root: string, fifth: string, third: string): Step[] => [[root, .5], [root, .5], [fifth, .5], [root, .5], [root, .5], [root, .5], [fifth, .5], [third, .5]];

/** A major surf (| A | A | D | D | E | D | A | E |), driving eighth-note bass, eighth-note hats between kick/snare, 8 bars = 32 beats. */
export const SYDNEY_THEME: BgmTheme = {
  id: 'sydney', bpm: 132, beatsPerBar: 4, leadWave: 'square',
  lead: [
    ['E5', .5], ['A5', .5], ['C#6', .5], ['A5', .5], ['E5', .5], ['C#5', .5], ['E5', 1],
    ['A5', 1], ['G#5', .5], ['F#5', .5], ['E5', 2],
    ['F#5', .5], ['A5', .5], ['D6', .5], ['A5', .5], ['F#5', .5], ['D5', .5], ['F#5', 1],
    ['A5', 1], ['B5', .5], ['A5', .5], ['F#5', 2],
    ['G#5', .5], ['B5', .5], ['E6', .5], ['B5', .5], ['G#5', .5], ['E5', .5], ['G#5', 1],
    ['F#5', .5], ['A5', .5], ['D6', 1], ['C#6', .5], ['B5', .5], ['A5', 1],
    ['C#6', .5], ['B5', .5], ['A5', .5], ['E5', .5], ['C#5', .5], ['E5', .5], ['A5', 1],
    ['B5', 1], ['G#5', 1], ['E5', 1], ['-', 1],
  ],
  bass: [
    ...surfBar('A2', 'E3', 'C#3'), ...surfBar('A2', 'E3', 'C#3'), ...surfBar('D3', 'A3', 'F#3'), ...surfBar('D3', 'A3', 'F#3'),
    ...surfBar('E3', 'B3', 'G#3'), ...surfBar('D3', 'A3', 'F#3'), ...surfBar('A2', 'E3', 'C#3'), ...surfBar('E3', 'B3', 'G#3'),
  ],
  drums: rep([['k', .5], ['h', .5], ['s', .5], ['h', .5], ['k', .5], ['h', .5], ['s', .5], ['h', .5]] as DrumStep[], 8),
};

const bossaBar = (root: string, fifth: string): Step[] => [[root, 1.5], [fifth, .5], [fifth, 1.5], [root, .5]];
/** One bossa bar in sixteenths: kick on 1 and 3, rim (snare) on 2-and and 4, hats on every other sixteenth. */
const BOSSA_DRUMS: DrumStep[] = Array.from({ length: 16 }, (_, i): DrumStep => [i === 0 || i === 8 ? 'k' : i === 6 || i === 12 ? 's' : 'h', .25]);

/** Bossa nova in A minor (Am7 Am7 D7 D7 ×2), syncopated bass that anticipates the next bar, 16th hats, 8 bars = 32 beats. */
export const RIO_THEME: BgmTheme = {
  id: 'rio', bpm: 104, beatsPerBar: 4, leadWave: 'triangle',
  lead: [
    ['E5', 1.5], ['D5', .5], ['C5', 1], ['B4', 1],
    ['A4', .5], ['C5', .5], ['E5', 1], ['G5', 1.5], ['E5', .5],
    ['F#5', 1.5], ['E5', .5], ['D5', 1], ['C5', 1],
    ['A4', 1], ['-', .5], ['C5', .5], ['D5', 2],
    ['E5', .5], ['G5', .5], ['A5', 1], ['G5', .5], ['E5', 1], ['C5', .5],
    ['D5', 1.5], ['C5', .5], ['B4', 1], ['A4', 1],
    ['F#4', .5], ['A4', .5], ['C5', .5], ['E5', .5], ['D5', 1], ['C5', 1],
    ['A4', 3], ['-', 1],
  ],
  bass: [
    ...bossaBar('A2', 'E3'), ...bossaBar('A2', 'E3'), ...bossaBar('D3', 'A2'), ...bossaBar('D3', 'A2'),
    ...bossaBar('A2', 'E3'), ...bossaBar('A2', 'E3'), ...bossaBar('D3', 'A2'), ...bossaBar('D3', 'A2'),
  ],
  drums: rep(BOSSA_DRUMS, 8),
};

export const BGM_THEMES: Record<BgmId, BgmTheme> = {
  world: WORLD_THEME,
  room: ROOM_THEME,
  seoul: SEOUL_THEME,
  paris: PARIS_THEME,
  cairo: CAIRO_THEME,
  newyork: NEWYORK_THEME,
  sydney: SYDNEY_THEME,
  rio: RIO_THEME,
};

const beats = (steps: readonly (Step | DrumStep)[]): number => steps.reduce((s, x) => s + x[1], 0);
for (const t of Object.values(BGM_THEMES)) {
  const l = beats(t.lead), b = beats(t.bass), d = beats(t.drums);
  console.assert(l === b && b === d, `[bgm] ${t.id}: lead ${l} / bass ${b} / drums ${d} beats differ`);
  console.assert(l % t.beatsPerBar === 0, `[bgm] ${t.id}: ${l} beats is not a whole number of ${t.beatsPerBar}/4 bars`);
}
