// Galmuri pixel fonts via the FontFace API (spec 5.9). Boot awaits this (3 s timeout) before creating any Text so
// glyph metrics are right; on failure the CSS fallback families in theme.ts take over.
import g11 from 'galmuri/dist/Galmuri11.woff2?url';
import g11b from 'galmuri/dist/Galmuri11-Bold.woff2?url';
import g14 from 'galmuri/dist/Galmuri14.woff2?url';
import g9 from 'galmuri/dist/Galmuri9.woff2?url';

export const FONT_FAMILY = { g11: 'Galmuri11', g14: 'Galmuri14', g9: 'Galmuri9' } as const;

export const fontStatus = { loaded: false, attempted: false };

const FACES: { family: string; url: string; weight: string }[] = [
  { family: FONT_FAMILY.g11, url: g11, weight: '400' },
  { family: FONT_FAMILY.g11, url: g11b, weight: '700' },
  { family: FONT_FAMILY.g14, url: g14, weight: '400' },
  { family: FONT_FAMILY.g9, url: g9, weight: '400' },
];

/** Resolves true when every face loaded within `timeoutMs`; false on timeout/error (game continues with fallbacks). */
export async function loadFonts(timeoutMs = 3000): Promise<boolean> {
  fontStatus.attempted = true;
  if (typeof FontFace === 'undefined' || !document.fonts) return false;
  const loads = FACES.map((f) => {
    const face = new FontFace(f.family, `url(${f.url})`, { weight: f.weight });
    document.fonts.add(face);
    return face.load();
  });
  const timeout = new Promise<'timeout'>((resolve) => window.setTimeout(() => resolve('timeout'), timeoutMs));
  try {
    const result = await Promise.race([Promise.all(loads), timeout]);
    fontStatus.loaded = result !== 'timeout';
  } catch (err) {
    console.warn('[fonts] Galmuri failed to load, using fallback fonts:', err);
    fontStatus.loaded = false;
  }
  return fontStatus.loaded;
}
