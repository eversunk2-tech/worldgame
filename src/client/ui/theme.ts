// Shared UI style constants (spec 5.9). Galmuri is a bitmap font: only integer multiples of its design sizes are
// used — 12px (Galmuri11), 15px (Galmuri14), 24px (Galmuri11 ×2), 30px (Galmuri14 ×2). Do not add other px values.
import { FONT_FAMILY } from '../assets/fonts';

const FALLBACK = "'DungGeunMo', system-ui, sans-serif";

export const FONT = {
  /** 12px regular — labels, hints, name tags */
  small: { fontFamily: `${FONT_FAMILY.g11}, ${FALLBACK}`, fontSize: '12px' },
  /** 15px — body text, dialog, buttons */
  body: { fontFamily: `${FONT_FAMILY.g14}, ${FALLBACK}`, fontSize: '15px' },
  /** 12px bold — small emphasis */
  bold: { fontFamily: `${FONT_FAMILY.g11}, ${FALLBACK}`, fontSize: '12px', fontStyle: 'bold' },
  /** 24px bold — panel titles, headings */
  title: { fontFamily: `${FONT_FAMILY.g11}, ${FALLBACK}`, fontSize: '24px', fontStyle: 'bold' },
  /** 30px — big numbers / title screen */
  big: { fontFamily: `${FONT_FAMILY.g14}, ${FALLBACK}`, fontSize: '30px' },
} as const;
export type FontKind = keyof typeof FONT;

export const THEME = {
  bg: 0x1b1b2f,
  bgCss: '#1b1b2f',
  panel: 0x2b2d4a,
  panelAlpha: 0.9,
  border: 0x8f9bff,
  borderCss: '#8f9bff',
  accent: 0xffd166,
  accentCss: '#ffd166',
  text: '#ffffff',
  textDim: '#b8bce0',
  danger: 0xff6b6b,
  dangerCss: '#ff6b6b',
  success: 0x6bd77b,
  successCss: '#6bd77b',
  info: '#8ecbff',
  fontFamily: FONT.body.fontFamily,
} as const;

export type StyleOverrides = Omit<Partial<Phaser.Types.GameObjects.Text.TextStyle>, 'fontSize' | 'fontFamily'> & { size?: FontKind };

/** Body text style (15px); pass `size` to pick another size class (never a raw fontSize). */
export function textStyle(overrides: StyleOverrides = {}): Phaser.Types.GameObjects.Text.TextStyle {
  const { size, ...rest } = overrides;
  return { ...FONT[size ?? 'body'], color: THEME.text, ...rest };
}

export function titleStyle(overrides: StyleOverrides = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return textStyle({ size: 'title', ...overrides });
}

/** Text with a black outline (readable over the map). */
export function outlined(overrides: StyleOverrides = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return textStyle({ stroke: '#000000', strokeThickness: 3, ...overrides });
}

/** Pick the Korean particle by whether the last syllable has a final consonant (받침). */
export function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return without;
  return (code - 0xac00) % 28 === 0 ? without : withBatchim;
}
