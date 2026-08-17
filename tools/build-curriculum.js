// Build data/curriculum.json — the real CEFR level map for the taught course.
//   node tools/build-curriculum.js [--dry]
//
// WHY THIS EXISTS
// data/words.json has no defensible difficulty ordering. VOCAB_ORDER is
// frequency-scored only for the ~1,800 words that appear in the app's own
// curricula; everything past that (82% of the catalog) is sorted by WORD
// LENGTH. docs/placement-test-methodology.md §2.4 measured the damage: the
// "advanced" bands fill up with proper nouns, acronyms and junk (tripadvisor,
// pentium, scsi) while genuinely basic A1/A2 words (aunt, bucket, asleep,
// ankle, boil, balcony) are missing from the catalog altogether.
//
// So the taught sequence stops being derived from that ordering. It comes from
// two externally-authored, openly-licensed CEFR wordlists instead. This file
// assigns LEVELS only — the Persian gloss, example and translation still come
// from data/words.json for every word that exists there.
//
// WHY A SEPARATE FILE, not a field on each word
// tools/validate.js pins FIELDS = ['i','en','fa','cat','ex','exfa','ipa','syn']
// and errors on anything else, and tools/rebuild.js depends on that contract.
// Adding `cefr` to word entries would mean changing a validator that guards
// every learner's saved progress. A sidecar keyed by index costs nothing and
// breaks nothing.
//
// SHAPE AND ORDERING are owned by tools/validate-curriculum.js, not by this
// file: the writer and the checker must not drift, so the canonical sort
// (compareEntries) and the field lists are imported from there rather than
// reimplemented here. Note that comparison is on raw code units, NOT
// localeCompare — localeCompare depends on the machine's ICU data and would
// make the output differ between machines while still looking "sorted".
//
// No timestamp is written, so two runs over unchanged inputs are byte-identical
// and a no-op regeneration shows as no diff. Source identity is pinned by
// SHA-256 instead of a build date.
//
// An entry with status "matched" carries `i`, the data/words.json index whose
// Persian content it reuses. An entry with status "pending" has no row in the
// catalog yet: it belongs to the course but nobody has written its Persian
// gloss. That set is the work-list for the content pass, and tools/ingest.js is
// the sanctioned way to add those words later — it appends, so existing indices
// (and every learner's saved progress) never move.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateCurriculum, compareEntries, LEVELS, LEVEL_RANK } = require('./validate-curriculum');

const ROOT = path.join(__dirname, '..');
const dry = process.argv.includes('--dry');

// Licence text transcribed from data/sources/README-cefr.md, which is the
// upstream README kept verbatim next to the CSVs. Carried as structured data
// rather than a comment so a credits screen can be rendered from the same
// source of truth that produced the levels — CEFR-J's permission is explicitly
// conditional on citing the dataset, so an empty citation here is a licence
// breach and validate-curriculum.js treats it as an error.
const SOURCES = [
  {
    id: 'cefrj',
    name: 'CEFR-J Wordlist',
    version: '1.5',
    author: 'Yukio Tono, Tokyo University of Foreign Studies',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    licence: 'Free for research and commercial use with proper citation. Copyright Tono Laboratory, TUFS.',
    licenceUrl: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    citation: 'The CEFR-J Wordlist Version 1.5, compiled by Yukio Tono, Tokyo University of Foreign Studies.',
    coverage: 'A1-B2',
    file: 'data/sources/cefrj-vocabulary-profile-1.5.csv'
  },
  {
    id: 'octanove',
    name: 'Octanove Vocabulary Profile C1/C2',
    version: '1.0',
    author: 'Octanove Labs',
    url: 'https://github.com/openlanguageprofiles/olp-en-cefrj',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    citation: 'Octanove Vocabulary Profile C1/C2 version 1.0 by Octanove Labs, licensed under CC BY-SA 4.0.',
    coverage: 'C1-C2',
    file: 'data/sources/octanove-vocabulary-profile-c1c2-1.0.csv'
  }
];

// Minimal RFC-4180 splitter — these files quote any field containing a comma
// and escape a literal quote by doubling it. Nothing more is needed and a
// dependency would be worse than fifteen lines.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let k = 0; k < text.length; k++) {
    const c = text[k];
    if (quoted) {
      if (c === '"') {
        if (text[k + 1] === '"') { field += '"'; k++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function readSource(src) {
  const abs = path.join(ROOT, src.file);
  if (!fs.existsSync(abs)) throw new Error(`missing source file ${src.file} — see ${src.url}`);
  const raw = fs.readFileSync(abs);
  const rows = parseCSV(raw.toString('utf8'));
  const head = rows.shift().map(h => h.trim().toLowerCase());
  const iHead = head.indexOf('headword'), iPos = head.indexOf('pos'), iCefr = head.indexOf('cefr');
  if (iHead < 0 || iCefr < 0) {
    throw new Error(`${src.file}: expected 'headword' and 'CEFR' columns, got ${head.join(',')}`);
  }
  return {
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    rows: rows
      .filter(r => r.length > iCefr && r[iHead].trim() && r[iCefr].trim())
      .map(r => ({
        headword: r[iHead].trim(),
        pos: (iPos >= 0 ? r[iPos] : '').trim(),
        cefr: r[iCefr].trim().toUpperCase()
      }))
  };
}

// ---- collect -----------------------------------------------------------------
const stats = { raw: {}, slashForms: 0, collapsed: 0, skippedLevel: 0 };
// key = lowercase surface form. Lowest CEFR wins: a word counts as introduced at
// the earliest level any sense of it is taught, which is what a learner actually
// meets first. Every part of speech seen for a form is accumulated, because a
// later task (same-POS distractor selection) needs them and they cost little.
const map = new Map();

SOURCES.forEach(src => {
  const { sha256, rows } = readSource(src);
  src.sha256 = sha256;
  stats.raw[src.id] = rows.length;
  rows.forEach(r => {
    if (!LEVELS.includes(r.cefr)) { stats.skippedLevel++; return; }
    // One row can cover several surface forms: "a.m./A.M./am/AM",
    // "dehumanize/dehumanise". Not splitting these loses ~5% of matches.
    const forms = r.headword.split('/').map(s => s.trim()).filter(Boolean);
    if (forms.length > 1) stats.slashForms += forms.length - 1;
    forms.forEach(form => {
      const k = form.toLowerCase();
      const prev = map.get(k);
      if (!prev) {
        map.set(k, {
          en: form,
          level: r.cefr,
          source: src.id,
          pos: r.pos ? [r.pos] : [],
          from: forms.length > 1 ? r.headword : null
        });
        return;
      }
      stats.collapsed++;
      if (r.pos && !prev.pos.includes(r.pos)) prev.pos.push(r.pos);
      if (LEVEL_RANK[r.cefr] < LEVEL_RANK[prev.level]) {
        prev.level = r.cefr;
        prev.source = src.id;
      }
    });
  });
});

// ---- resolve against the existing catalog ------------------------------------
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
// First index wins for the handful of duplicate headwords in the catalog, so the
// mapping is stable across runs regardless of how duplicates are ordered.
const byHeadword = new Map();
words.forEach(w => {
  const k = String(w.en || '').toLowerCase().trim();
  if (k && !byHeadword.has(k)) byHeadword.set(k, w.i);
});

const entries = [];
for (const [k, v] of map) {
  const i = byHeadword.get(k);
  const e = { en: v.en, level: v.level, source: v.source };
  if (v.pos.length) e.pos = v.pos.slice().sort();
  if (v.from) e.from = v.from;
  e.status = i == null ? 'pending' : 'matched';
  if (i != null) e.i = i;
  entries.push(e);
}
entries.sort(compareEntries);

const byLevel = Object.fromEntries(LEVELS.map(l => [l, 0]));
const pendingByLevel = Object.fromEntries(LEVELS.map(l => [l, 0]));
const bySource = {};
let matched = 0, pending = 0;
entries.forEach(e => {
  byLevel[e.level]++;
  bySource[e.source] = (bySource[e.source] || 0) + 1;
  if (e.status === 'matched') matched++;
  else { pending++; pendingByLevel[e.level]++; }
});

const out = {
  v: 1,
  generator: 'tools/build-curriculum.js',
  note: 'Levels come from the sources below. A "matched" entry reuses the Persian gloss and example at that index in data/words.json. A "pending" entry belongs to the course but has no catalog content yet.',
  levels: LEVELS,
  sources: Object.fromEntries(SOURCES.map(s => [s.id, {
    id: s.id, name: s.name, version: s.version, author: s.author, url: s.url,
    licence: s.licence, licenceUrl: s.licenceUrl, citation: s.citation,
    coverage: s.coverage, file: s.file, sha256: s.sha256
  }])),
  counts: { total: entries.length, matched, pending, byLevel, pendingByLevel, bySource },
  entries
};

// ---- validate before writing -------------------------------------------------
const { errors, warnings } = validateCurriculum(out, words);

console.log(`sources: ${SOURCES.map(s => `${s.id} ${stats.raw[s.id]} rows`).join(', ')}`);
console.log(`slash-variant forms added: ${stats.slashForms}; duplicate headword rows collapsed: ${stats.collapsed}` +
            (stats.skippedLevel ? `; rows skipped for a non-A1..C2 level: ${stats.skippedLevel}` : ''));
console.log(`entries: ${out.counts.total} (${LEVELS.map(l => `${l} ${byLevel[l]}`).join(' · ')})`);
console.log(`matched to data/words.json: ${matched} — pending content: ${pending} ` +
            `(${LEVELS.map(l => `${l} ${pendingByLevel[l]}`).join(' · ')})`);
if (warnings.length) {
  console.warn(`${warnings.length} warning(s):`);
  warnings.forEach(w => console.warn('  ' + w));
}
if (errors.length) {
  console.error(`refusing to write — ${errors.length} problem(s):`);
  errors.slice(0, 20).forEach(e => console.error('  ' + e));
  if (errors.length > 20) console.error(`  ...and ${errors.length - 20} more`);
  process.exit(1);
}

const dest = path.join(ROOT, 'data', 'curriculum.json');
const json = JSON.stringify(out, null, 2) + '\n';
if (dry) {
  const same = fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') === json;
  return console.log(`dry run — ${same ? 'output matches the file on disk' : 'output DIFFERS from the file on disk'}`);
}
fs.writeFileSync(dest, json);
console.log(`wrote data/curriculum.json (${(json.length / 1024).toFixed(0)} KB)`);
