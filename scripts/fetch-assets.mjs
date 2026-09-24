#!/usr/bin/env node
// scripts/fetch-assets.mjs — v0.2 asset pipeline (spec 3.2 / 3.4).
//
// Downloads the four approved Kenney CC0 packs (and nothing else: every URL lives in ALLOWLIST below, no URL is
// accepted from the command line), extracts exactly one transparent spritesheet PNG + License.txt from each zip
// into public/assets/vendor/<pack>/, checks the 16px + 1px-spacing grid, and writes manifest.json.
//
//   node scripts/fetch-assets.mjs           download (cached zips in .cache/assets are reused), extract, verify
//   node scripts/fetch-assets.mjs --check   verify existing vendor files + manifest only (no network access)
//
// Node 20+, no dependencies (the zip reader below is a minimal stored/deflate extractor).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, '.cache', 'assets');
const VENDOR_DIR = path.join(ROOT, 'public', 'assets', 'vendor');
const MANIFEST_PATH = path.join(VENDOR_DIR, 'manifest.json');

/**
 * The only downloads this script will ever perform (spec 3.2, decision 14). Frozen: not extensible at runtime.
 * Every pack is CC0 (license link recorded per entry and written to manifest.json).
 */
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const ALLOWLIST = Object.freeze([
  Object.freeze({ id: 'kenney-roguelike-rpg', zip: 'kenney_roguelike-rpg-pack.zip', expectBytes: 715373, url: 'https://kenney.nl/media/pages/assets/roguelike-rpg-pack/12c03cd78b-1677697420/kenney_roguelike-rpg-pack.zip', license: CC0 }), // CC0 (creativecommons.org)
  Object.freeze({ id: 'kenney-roguelike-city', zip: 'kenney_roguelike-modern-city.zip', expectBytes: 519937, url: 'https://kenney.nl/media/pages/assets/roguelike-modern-city/0ff3dfff2b-1677694743/kenney_roguelike-modern-city.zip', license: CC0 }), // CC0 (creativecommons.org)
  Object.freeze({ id: 'kenney-roguelike-characters', zip: 'kenney_roguelike-characters.zip', expectBytes: 63243, url: 'https://kenney.nl/media/pages/assets/roguelike-characters/53ffff4133-1729196490/kenney_roguelike-characters.zip', license: CC0 }), // CC0 (creativecommons.org)
  Object.freeze({ id: 'kenney-roguelike-indoors', zip: 'kenney_roguelike-indoors.zip', expectBytes: 112227, url: 'https://kenney.nl/media/pages/assets/roguelike-indoors/4d5b520b03-1702169567/kenney_roguelike-indoors.zip', license: CC0 }), // CC0 (creativecommons.org)
]);

/**
 * Spritesheet candidates, tried in order; the first pattern matching exactly one entry wins (spec 3.2 + 13절).
 * Older zips ship `Spritesheet/` or `Tilesheets/roguelike*_transparent.png` (`_magenta` is ignored); newer re-packs ship `Tilemap/tilemap.png`
 * (the spaced sheet — `tilemap_packed.png` has no spacing and fails the grid check, so it is never used).
 */
const SHEET_PATTERNS = Object.freeze([/(Sprite|Tile)sheets?\/roguelike\w*_transparent\.png$/i, /(^|\/)Tilemap\/tilemap\.png$/i]);
const LICENSE_RE = /(^|\/)License\.txt$/i;
const CELL = 16;
const SPACING = 1;
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class AssetError extends Error {}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ------------------------------------------------------------------ zip reader (stored + deflate only)

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Parse the central directory → [{ name, method, compSize, uncompSize, crc, localOffset }]. */
function listZip(buf) {
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new AssetError('zip: end of central directory not found');
  const entriesTotal = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset + cdSize > buf.length) throw new AssetError('zip: central directory out of range');
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < entriesTotal; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new AssetError(`zip: bad central directory entry at ${p}`);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const compSize = buf.readUInt32LE(p + 20);
    const uncompSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    entries.push({ name, method, crc, compSize, uncompSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Extract one entry (validated: no path escape, stored or deflate, size + CRC match). */
function extractEntry(buf, entry) {
  const norm = entry.name.replace(/\\/g, '/');
  if (norm.startsWith('/') || norm.split('/').includes('..') || /^[a-zA-Z]:/.test(norm)) {
    throw new AssetError(`zip: refusing suspicious path ${entry.name}`);
  }
  const p = entry.localOffset;
  if (p + 30 > buf.length || buf.readUInt32LE(p) !== 0x04034b50) throw new AssetError(`zip: bad local header for ${entry.name}`);
  const nameLen = buf.readUInt16LE(p + 26);
  const extraLen = buf.readUInt16LE(p + 28);
  const start = p + 30 + nameLen + extraLen;
  const end = start + entry.compSize;
  if (end > buf.length) throw new AssetError(`zip: data out of range for ${entry.name}`);
  const raw = buf.subarray(start, end);
  let data;
  if (entry.method === 0) data = Buffer.from(raw);
  else if (entry.method === 8) data = inflateRawSync(raw);
  else throw new AssetError(`zip: unsupported compression method ${entry.method} for ${entry.name}`);
  if (data.length !== entry.uncompSize) throw new AssetError(`zip: size mismatch for ${entry.name} (${data.length} vs ${entry.uncompSize})`);
  if (crc32(data) !== entry.crc) throw new AssetError(`zip: CRC mismatch for ${entry.name}`);
  return data;
}

// ------------------------------------------------------------------ png + grid

function pngSize(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIG)) throw new AssetError('not a PNG (bad signature)');
  if (buf.subarray(12, 16).toString('ascii') !== 'IHDR') throw new AssetError('PNG: IHDR chunk missing');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Kenney roguelike sheets: 16px cells with 1px spacing, no margin → (w+1) % 17 === 0. Some sheets carry a trailing
 * 1px spacer on one axis (Characters is 918x203: 54*17 wide, 12*17-1 high) → w % 17 === 0 is accepted as well.
 * Either way cell (col,row) starts at (col*17, row*17).
 */
function gridFor(width, height) {
  const pitch = CELL + SPACING;
  const axis = (n, label) => {
    if ((n + SPACING) % pitch === 0) return (n + SPACING) / pitch;
    if (n % pitch === 0) return n / pitch;
    throw new AssetError(`grid mismatch: ${label} ${n}px is not a ${CELL}px + ${SPACING}px-spacing grid (${width}x${height})`);
  };
  return { cols: axis(width, 'width'), rows: axis(height, 'height') };
}

// ------------------------------------------------------------------ pipeline

async function download(pack) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const zipPath = path.join(CACHE_DIR, pack.zip);
  if (existsSync(zipPath) && statSync(zipPath).size === pack.expectBytes) {
    console.log(`  reuse   ${path.relative(ROOT, zipPath)} (${pack.expectBytes} B)`);
    return readFileSync(zipPath);
  }
  if (!ALLOWLIST.includes(pack)) throw new AssetError('download refused: not in ALLOWLIST');
  console.log(`  fetch   ${pack.url}`);
  const res = await fetch(pack.url, { redirect: 'error' });
  if (!res.ok) throw new AssetError(`network: HTTP ${res.status} for ${pack.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length !== pack.expectBytes) throw new AssetError(`size mismatch for ${pack.zip}: got ${buf.length} B, expected ${pack.expectBytes} B`);
  writeFileSync(zipPath, buf);
  console.log(`  saved   ${path.relative(ROOT, zipPath)} (${buf.length} B)`);
  return buf;
}

function extractPack(pack, zipBuf) {
  const entries = listZip(zipBuf);
  const norm = (e) => e.name.replace(/\\/g, '/');
  let sheets = [];
  for (const re of SHEET_PATTERNS) {
    sheets = entries.filter((e) => re.test(norm(e)));
    if (sheets.length === 1) break;
  }
  const license = entries.find((e) => LICENSE_RE.test(norm(e)));
  if (sheets.length !== 1) {
    console.error(`zip listing for ${pack.zip} (individual Tiles/*.png collapsed):`);
    let tiles = 0;
    for (const e of entries) { if (/\/tile_\d+\.png$/i.test(norm(e))) tiles++; else console.error(`    ${e.name}`); }
    if (tiles) console.error(`    (+ ${tiles} Tiles/tile_NNNN.png files)`);
    throw new AssetError(`no spritesheet pattern matched exactly one entry in ${pack.zip} (patterns: ${SHEET_PATTERNS.join(' | ')})`);
  }
  if (!license) throw new AssetError(`License.txt not found in ${pack.zip}`);
  const png = extractEntry(zipBuf, sheets[0]);
  const { width, height } = pngSize(png);
  const { cols, rows } = gridFor(width, height);
  const licenseText = extractEntry(zipBuf, license);
  const dir = path.join(VENDOR_DIR, pack.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'sheet.png'), png);
  writeFileSync(path.join(dir, 'License.txt'), licenseText);
  return {
    source: pack.url,
    license: pack.license,
    zipBytes: zipBuf.length,
    zipSha256: sha256(zipBuf),
    file: sheets[0].name,
    sheetBytes: png.length,
    sheetSha256: sha256(png),
    width, height, cols, rows,
    fetchedAt: new Date().toISOString(),
  };
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) throw new AssetError(`manifest missing: ${path.relative(ROOT, MANIFEST_PATH)} (run: npm run assets)`);
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

function checkPack(pack, manifest) {
  const entry = manifest[pack.id];
  if (!entry) throw new AssetError(`manifest has no entry for ${pack.id}`);
  const dir = path.join(VENDOR_DIR, pack.id);
  const sheetPath = path.join(dir, 'sheet.png');
  if (!existsSync(sheetPath)) throw new AssetError(`missing ${path.relative(ROOT, sheetPath)}`);
  if (!existsSync(path.join(dir, 'License.txt'))) throw new AssetError(`missing License.txt for ${pack.id}`);
  const png = readFileSync(sheetPath);
  const { width, height } = pngSize(png);
  const { cols, rows } = gridFor(width, height);
  if (entry.width !== width || entry.height !== height || entry.cols !== cols || entry.rows !== rows) {
    throw new AssetError(`manifest/sheet mismatch for ${pack.id}: manifest ${entry.width}x${entry.height} ${entry.cols}x${entry.rows}, file ${width}x${height} ${cols}x${rows}`);
  }
  if (entry.sheetSha256 && entry.sheetSha256 !== sha256(png)) throw new AssetError(`sheet.png sha256 mismatch for ${pack.id}`);
  if (entry.source !== pack.url) throw new AssetError(`manifest source for ${pack.id} is not the allow-listed URL`);
  return { cols, rows, width, height };
}

function printTable(rowsOut) {
  console.log('\n  pack                          size        grid (cols x rows)');
  for (const r of rowsOut) console.log(`  ${r.id.padEnd(30)}${`${r.width}x${r.height}`.padEnd(12)}${r.cols} x ${r.rows} = ${r.cols * r.rows} cells`);
  console.log('');
}

async function main() {
  const check = process.argv.includes('--check');
  const extra = process.argv.slice(2).filter((a) => a !== '--check');
  if (extra.length) throw new AssetError(`unknown arguments: ${extra.join(' ')} (this script takes no URLs; see ALLOWLIST)`);
  const out = [];
  if (check) {
    const manifest = readManifest();
    for (const pack of ALLOWLIST) {
      const r = checkPack(pack, manifest);
      out.push({ id: pack.id, ...r });
    }
    printTable(out);
    console.log('assets:check OK');
    return;
  }
  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
  // download everything first so a bad zip layout in one pack never blocks caching the others
  const zips = new Map();
  for (const pack of ALLOWLIST) {
    console.log(`[${pack.id}] download`);
    zips.set(pack.id, await download(pack));
  }
  for (const pack of ALLOWLIST) {
    console.log(`[${pack.id}] extract`);
    const zipBuf = zips.get(pack.id);
    const entry = extractPack(pack, zipBuf);
    manifest[pack.id] = entry;
    out.push({ id: pack.id, cols: entry.cols, rows: entry.rows, width: entry.width, height: entry.height });
    console.log(`  extract ${entry.file} → public/assets/vendor/${pack.id}/sheet.png (${entry.width}x${entry.height}, ${entry.cols}x${entry.rows})`);
  }
  mkdirSync(VENDOR_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  printTable(out);
  console.log(`manifest written: ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main().catch((err) => {
  console.error(`fetch-assets: ${err instanceof AssetError ? err.message : err?.stack ?? err}`);
  process.exit(1);
});
