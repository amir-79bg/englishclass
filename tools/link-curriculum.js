// After tools/ingest.js adds a word that a curriculum entry has been waiting
// on, the entry is still "pending" — ingest.js only touches words.json. This
// is the other half: re-resolve every pending curriculum entry against the
// current words.json, and promote the ones that now exist to "matched".
//   node tools/link-curriculum.js [--dry]
//
// Deliberately conservative: a pending entry is promoted only when a words.json
// row now carries that exact headword (case-insensitive) AND has real content
// (fa + ex + exfa) — the same completeness bar tools/ingest.js itself enforces
// for a new entry, so a linked entry is never a bare stub with a blank card.
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./bundle');
const { readCurriculum, CURRICULUM } = require('./curriculum');
const { validateCurriculum, LEVELS } = require('./validate-curriculum');

const dry = process.argv.includes('--dry');
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
const cur = readCurriculum();

const key = s => String(s || '').toLowerCase().trim();
const byKey = new Map();
words.forEach((w, i) => { const k = key(w.en); if (!byKey.has(k)) byKey.set(k, i); });

const usable = v => v != null && String(v).trim().length > 0;

let promoted = 0;
const promotedWords = [];
cur.entries.forEach(e => {
  if (e.status !== 'pending') return;
  const i = byKey.get(key(e.en));
  if (i == null) return;
  const w = words[i];
  if (!usable(w.fa) || !usable(w.ex) || !usable(w.exfa)) return;
  e.status = 'matched';
  e.i = i;
  promoted++;
  promotedWords.push(`${e.en} (${e.level}) -> [${i}]`);
});

console.log(`${promoted} pending entr(ies) promoted to matched`);
if (promoted) promotedWords.forEach(s => console.log('  ' + s));

// counts.matched/pending/pendingByLevel are the only fields promotion changes.
const matched = cur.entries.filter(e => e.status === 'matched').length;
const pending = cur.entries.length - matched;
const pendingByLevel = Object.fromEntries(LEVELS.map(l => [l, 0]));
cur.entries.forEach(e => { if (e.status === 'pending') pendingByLevel[e.level]++; });
cur.counts.matched = matched;
cur.counts.pending = pending;
cur.counts.pendingByLevel = pendingByLevel;

const { errors, warnings } = validateCurriculum(cur, words);
if (warnings.length) console.warn(`${warnings.length} warning(s) — run node tools/validate-curriculum.js`);
if (errors.length) {
  console.error(`refusing to write — ${errors.length} error(s):`);
  errors.slice(0, 40).forEach(e => console.error('  ' + e));
  process.exit(1);
}

if (!promoted) { console.log('nothing to link'); process.exit(0); }
if (dry) { console.log('dry run — data/curriculum.json untouched'); process.exit(0); }
fs.writeFileSync(CURRICULUM, JSON.stringify(cur, null, 1), 'utf8');
console.log('data/curriculum.json updated — run node tools/rebuild.js to fold it into the app');
