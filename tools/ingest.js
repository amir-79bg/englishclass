// Merge an external dictionary into the word list.
//   node tools/ingest.js <file.json> [--dry] [--limit N]
//
// The input is an array of { en, fa, cat?, ex?, exfa?, ipa?, syn? }.
//
// Two rules make this safe, and both are enforced rather than trusted:
//   * an existing headword is ENRICHED, never replaced — a field the app
//     already has (a hand-written example, a corrected gloss) always wins over
//     the imported one, because the imported data is bulk and ours is edited;
//   * a new headword is APPENDED, so every existing index keeps pointing at the
//     same word and no learner's progress moves.
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, readWords, readAsset, writeAsset, writeBundle, VOCAB_UUID } = require('./bundle');
const { validate, CATS } = require('./validate');

const file = process.argv[2];
if (!file) { console.error('usage: node tools/ingest.js <file.json> [--dry] [--limit N]'); process.exit(1); }
const dry = process.argv.includes('--dry');
const li = process.argv.indexOf('--limit');
const limit = li > 0 ? Number(process.argv[li + 1]) : Infinity;

const wordsPath = path.join(ROOT, 'data', 'words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const incoming = JSON.parse(fs.readFileSync(file, 'utf8'));

const key = s => String(s || '').toLowerCase().trim();
const byEn = new Map(words.map(w => [key(w.en), w]));

// Only fields the app understands, and only when they carry something real.
const FIELDS = ['fa', 'cat', 'ex', 'exfa', 'ipa', 'syn'];
const usable = (k, v) => {
  if (v == null) return false;
  if (k === 'syn') return Array.isArray(v) && v.length > 0;
  if (k === 'cat') return CATS.indexOf(v) >= 0;
  return String(v).trim().length > 0;
};

let enriched = 0, added = 0, skipped = 0, filled = 0;
const problems = [];

for (const raw of incoming) {
  if (added >= limit) break;
  const en = String(raw.en || '').trim();
  if (!en) { skipped++; continue; }

  const existing = byEn.get(key(en));
  if (existing) {
    let touched = false;
    for (const k of FIELDS) {
      // Fill gaps only. Never overwrite what the app already holds.
      if (usable(k, raw[k]) && !usable(k, existing[k])) { existing[k] = raw[k]; touched = true; filled++; }
    }
    if (touched) enriched++;
    continue;
  }

  // A new entry has to be complete enough to render; the app assumes fa and ex.
  if (!usable('fa', raw.fa) || !usable('ex', raw.ex) || !usable('exfa', raw.exfa)) { skipped++; continue; }
  const entry = { i: words.length, en: en, fa: raw.fa, cat: usable('cat', raw.cat) ? raw.cat : 'general', ex: raw.ex, exfa: raw.exfa };
  if (usable('ipa', raw.ipa)) entry.ipa = raw.ipa;
  if (usable('syn', raw.syn)) entry.syn = raw.syn;
  words.push(entry);
  byEn.set(key(en), entry);
  added++;
}

const original = readWords(readBundle());
const { errors, warnings } = validate(words, original);
console.log(`enriched ${enriched} existing (${filled} empty fields filled) · added ${added} new · skipped ${skipped} unusable`);
console.log(`list: ${original.length} -> ${words.length} entries`);
if (warnings.length) console.warn(`${warnings.length} warning(s) — run node tools/validate.js to see them`);
if (problems.length) problems.slice(0, 20).forEach(p => console.error('  ' + p));
if (errors.length) {
  console.error(`refusing to write — ${errors.length} error(s):`);
  errors.slice(0, 20).forEach(e => console.error('  ' + e));
  process.exit(1);
}
if (dry) return console.log('dry run — nothing written');

fs.writeFileSync(wordsPath, JSON.stringify(words, null, 1), 'utf8');

// New indices must also enter the teaching order, or they exist in the list and
// are never dealt as cards. They go at the end: unranked, after everything the
// course actually uses.
if (added) {
  const b = readBundle();
  const js = readAsset(b, VOCAB_UUID);
  const a = js.indexOf('[', js.indexOf('window.VOCAB_ORDER'));
  const z = js.indexOf('];', a);
  const order = JSON.parse(js.slice(a, z + 1));
  const seen = new Set(order);
  for (let i = original.length; i < words.length; i++) if (!seen.has(i)) order.push(i);
  writeAsset(b, VOCAB_UUID, js.slice(0, a) + JSON.stringify(order) + js.slice(z + 1));
  writeBundle(b);
  console.log(`VOCAB_ORDER extended to ${order.length} entries`);
}
console.log('words.json updated — run node tools/rebuild.js to fold it into the app');
