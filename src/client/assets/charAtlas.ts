// Avatar item → Kenney Roguelike Characters part (spec 3.7, 5.6). Sheet is 54×12 (index = col + row*54); every part
// is a single 16×16 front-view cell. `mono` parts are tinted with the item colour (luminance preserved).
// Indices read with tools/tile-index.html?sheet=kenney-roguelike-characters.
export type OverlayKind = 'stripes' | 'hanbok_ribbon' | 'crown_gem' | 'pony_tail' | 'cork_dots' | 'brazil_collar' | 'none';
export type CodePartKind = 'cap' | 'pharaoh' | 'liberty' | 'wide_hat';

export interface CharPartCell {
  sheet: 'char'; index: number; recolor: 'mono' | 'none';
  overlay?: OverlayKind;
  /** colour for parts without an ItemDef (NPC-only) */ color?: number;
  /** extra cells composited on top (e.g. shoes under every body) */ extra?: number[];
}
export interface CharPartCode { code: CodePartKind; color?: number; overlay?: OverlayKind }
export type CharPart = CharPartCell | CharPartCode;

const cell = (index: number, recolor: 'mono' | 'none', extra: Partial<CharPartCell> = {}): CharPartCell => ({ sheet: 'char', index, recolor, ...extra });

/** Dark shoes (3,0) drawn under every body so the feet read in the walk cycle. */
const SHOES = 3;

export const CHAR_PARTS: Record<string, CharPart> = {
  // bodies: (0,0) light, (0,1) tan, (0,2) dark — used as-is
  body_light: cell(0, 'none', { extra: [SHOES] }),
  body_tan: cell(54, 'none', { extra: [SHOES] }),
  body_dark: cell(108, 'none', { extra: [SHOES] }),
  // hair
  hair_short_black: cell(19, 'mono'),                       // (19,0) short cap of hair
  hair_long_brown: cell(76, 'mono'),                        // (22,1) long hair, both sides down to the shoulders
  hair_curly_red: cell(24, 'mono'),                         // (24,0) round bob (closest to curly/bunched)
  hair_pony_blue: cell(20, 'mono', { overlay: 'pony_tail' }), // (20,0) medium hair + code tail
  // tops
  top_tshirt_blue: cell(226, 'mono'),                       // (10,4) white t-shirt
  top_hoodie_green: cell(62, 'mono'),                       // (8,1) shirt with light bib (reads as a hood front)
  top_hanbok: cell(114, 'mono', { overlay: 'hanbok_ribbon' }), // (6,2) long tunic widening at the hem
  top_mariniere: cell(226, 'none', { overlay: 'stripes' }), // white t-shirt + navy stripes
  top_brazil: cell(226, 'mono', { overlay: 'brazil_collar' }), // white t-shirt tinted with the ItemDef yellow (0xf9d342) + green collar
  // hats
  hat_cap_red: { code: 'cap' },                             // no cap with a visor in the pack → code
  hat_gat: cell(460, 'mono'),                               // (28,8) wide-brim hat
  hat_beret: cell(28, 'mono'),                              // (28,0) round hat with a stem (beret)
  hat_crown: cell(138, 'mono', { overlay: 'crown_gem' }),   // (30,2) 3-point crown
  hat_pharaoh: { code: 'pharaoh', color: 0x2a6fd6 },
  hat_liberty: { code: 'liberty', color: 0x7fc8a9 },
  hat_cork: cell(460, 'mono', { overlay: 'cork_dots', color: 0xb08850 }), // wide-brim hat + cork strings
  // NPC-only tops (no ItemDef, spec 5.6)
  robe_white: cell(496, 'none'),                            // (10,9) plain white robe
  dress_plain: cell(114, 'mono', { color: 0x8d6e9e }),      // long tunic tinted mauve
};

export const ROOM_PREVIEW_SCALE = 6;
