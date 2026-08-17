// Shared helpers for reading/writing the single-file artifact bundle.
//
// The app ships as one HTML file. Its assets live in a JSON manifest on a single
// (very long) line, each entry gzipped then base64-encoded. The page template — which
// contains the whole React app source — is a JSON string on another single line.
// These helpers hide that layout so the data tools stay readable.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'english-vocab-v1.html');
// The manifest entry holding window.VOCAB_WORDS / VOCAB_CATS / VOCAB_ORDER.
const VOCAB_UUID = '3350f0d9-3377-4f1f-8ad4-94ed2bec7ad7';

function readBundle(file = HTML) {
  const src = fs.readFileSync(file, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const at = tag => {
    const i = lines.findIndex(l => l.trim() === `<script type="__bundler/${tag}">`);
    if (i < 0) throw new Error(`bundle: <script type="__bundler/${tag}"> not found`);
    return i + 1;
  };
  return { file, eol, lines, manifestLine: at('manifest'), templateLine: at('template') };
}

function writeBundle(b) {
  fs.writeFileSync(b.file, b.lines.join(b.eol), 'utf8');
}

// Assets are decoded on demand — the manifest is ~5MB of base64 and holds fonts
// and SVGs we never touch.
function readAsset(b, uuid) {
  const manifest = JSON.parse(b.lines[b.manifestLine]);
  const e = manifest[uuid];
  if (!e) throw new Error(`bundle: no asset ${uuid}`);
  const buf = Buffer.from(e.data, 'base64');
  return e.compressed ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
}

function writeAsset(b, uuid, text) {
  const manifest = JSON.parse(b.lines[b.manifestLine]);
  const e = manifest[uuid];
  if (!e) throw new Error(`bundle: no asset ${uuid}`);
  const buf = Buffer.from(text, 'utf8');
  // Match the original level-9 gzip so the file does not balloon on rewrite.
  e.data = (e.compressed ? zlib.gzipSync(buf, { level: 9 }) : buf).toString('base64');
  b.lines[b.manifestLine] = JSON.stringify(manifest);
}

function readTemplate(b) {
  return JSON.parse(b.lines[b.templateLine]);
}

function writeTemplate(b, tpl) {
  // Escape "/" inside tags exactly as the bundler does, so the JSON payload can
  // never terminate its own <script> element.
  b.lines[b.templateLine] = JSON.stringify(tpl).replace(/<\//g, '<\\u002F');
}

function assignmentRange(js, name, open, close) {
  const marker = js.indexOf(`window.${name}`);
  if (marker < 0) throw new Error(`bundle: ${name} assignment not found`);
  const start = js.indexOf(open, marker);
  const end = start < 0 ? -1 : js.indexOf(close, start);
  if (start < 0 || end < 0) throw new Error(`bundle: ${name} value not found`);
  return { start, end };
}

// window.VOCAB_WORDS = [ ... ];  → the array, and a writer that puts it back.
function readWords(b) {
  const js = readAsset(b, VOCAB_UUID);
  const { start, end } = assignmentRange(js, 'VOCAB_WORDS', '[', '];\n');
  return JSON.parse(js.slice(start, end + 1));
}

function writeWords(b, words) {
  const js = readAsset(b, VOCAB_UUID);
  const { start, end } = assignmentRange(js, 'VOCAB_WORDS', '[', '];\n');
  writeAsset(b, VOCAB_UUID, js.slice(0, start) + JSON.stringify(words) + js.slice(end + 1));
  if (JSON.stringify(readWords(b)) !== JSON.stringify(words)) throw new Error('bundle: VOCAB_WORDS write round-trip mismatch');
}

// window.VOCAB_CATS = { ... }; -> runtime icon, colour and Persian label map.
function readCats(b) {
  const js = readAsset(b, VOCAB_UUID);
  const { start, end } = assignmentRange(js, 'VOCAB_CATS', '{', '};\n');
  return JSON.parse(js.slice(start, end + 1));
}

function writeCats(b, cats) {
  const js = readAsset(b, VOCAB_UUID);
  const { start, end } = assignmentRange(js, 'VOCAB_CATS', '{', '};\n');
  writeAsset(b, VOCAB_UUID, js.slice(0, start) + JSON.stringify(cats) + js.slice(end + 1));
  if (JSON.stringify(readCats(b)) !== JSON.stringify(cats)) throw new Error('bundle: VOCAB_CATS write round-trip mismatch');
}

// window.VOCAB_LEVELS = { "A1": [i, ...], ... } — the TEACHABLE word indices of
// each CEFR level, in curriculum order. Derived from data/curriculum.json by
// tools/rebuild.js; see tools/build-curriculum.js for where the levels come
// from and why the old VOCAB_ORDER slicing could not be trusted.
//
// Only indices ship, not the curriculum file: the app already has every word's
// content in VOCAB_WORDS, so all this has to add is "which words are taught, at
// what level, in what order" — ~25 KB of integers instead of a 1.4 MB copy.
// Pending curriculum entries have no words.json row at all and are therefore
// absent by construction, which is what keeps an unglossed word off a card.
//
// Unlike the three assignments above, this one may not exist yet in an older
// bundle, so the writer appends it the first time rather than failing.
const LEVELS_DECL = 'window.VOCAB_LEVELS = ';

function readLevels(b) {
  const js = readAsset(b, VOCAB_UUID);
  if (js.indexOf('window.VOCAB_LEVELS') < 0) return null;
  const { start, end } = assignmentRange(js, 'VOCAB_LEVELS', '{', '};');
  return JSON.parse(js.slice(start, end + 1));
}

function writeLevels(b, levels) {
  const js = readAsset(b, VOCAB_UUID);
  const json = JSON.stringify(levels);
  let next;
  if (js.indexOf('window.VOCAB_LEVELS') < 0) {
    next = js.replace(/\s*$/, '') + '\n' + LEVELS_DECL + json + ';\n';
  } else {
    const { start, end } = assignmentRange(js, 'VOCAB_LEVELS', '{', '};');
    next = js.slice(0, start) + json + js.slice(end + 1);
  }
  writeAsset(b, VOCAB_UUID, next);
  if (JSON.stringify(readLevels(b)) !== json) throw new Error('bundle: VOCAB_LEVELS write round-trip mismatch');
}

module.exports = { ROOT, HTML, VOCAB_UUID, readBundle, writeBundle, readAsset, writeAsset, readTemplate, writeTemplate, readWords, writeWords, readCats, writeCats, readLevels, writeLevels };
