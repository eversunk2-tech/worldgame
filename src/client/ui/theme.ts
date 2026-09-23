// Shared UI style constants (spec 6.9).

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
  fontFamily: "'Galmuri11', 'DungGeunMo', system-ui, sans-serif",
  fontSize: 16,
  titleSize: 24,
} as const;

export function textStyle(overrides: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: THEME.fontFamily,
    fontSize: `${THEME.fontSize}px`,
    color: THEME.text,
    ...overrides,
  };
}

export function titleStyle(overrides: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return textStyle({ fontSize: `${THEME.titleSize}px`, fontStyle: 'bold', ...overrides });
}

/** Pick the Korean particle by whether the last syllable has a final consonant (받침). */
export function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return without;
  return (code - 0xac00) % 28 === 0 ? without : withBatchim;
}
