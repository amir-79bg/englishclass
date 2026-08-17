// Rules every data/curriculum.json must satisfy before it can be written or used.
// Run standalone to check the working copy:  node tools/validate-curriculum.js
//
// This is a COMPANION to tools/validate.js, deliberately not part of it.
// validate.js owns words.json and is called by rebuild.js/ingest.js on the path
// that writes the shipped bundle; its FIELDS list errors on any unexpected key,
// so CEFR level data can never live on a words.json entry. Bolting a second,
// unrelated artifact onto that function would change a contract two writers
// depend on. Instead the curriculum artifact gets its own checker with the same
// shape (`{ errors, warnings }`, module + CLI) and the same rule: errors block a
// write, warnings are reported for a human to judge.
//
// The dangerous failure this exists to catch is a SILENT one: `i` is a pointer
// into words.json, and words.json can grow (tools/ingest.js appends). A stale or
// hand-edited curriculum.json whose `i` points at the wrong word would teach the
// learner a Persian gloss belonging to a different English word, with nothing on
// screen to reveal it. So every `i` is re-resolved against the real headword,
// not merely range-checked.
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l, n) => [l, n]));
const ENTRY_FIELDS = ['en', 'level', 'source', 'pos', 'from', 'status', 'i'];
const STATUSES = ['matched', 'pending'];
// Every source needs these before the app can legally show a credits screen:
// CEFR-J is free for research and commercial use *provided the dataset is
// cited*, and Octanove C1/C2 is CC BY-SA 4.0. An empty citation string is a
// licence breach, not a cosmetic gap, so it is an error.
const SOURCE_FIELDS = ['id', 'name', 'version', 'citation', 'licence', 'licenceUrl', 'url'];

const key = s => String(s || '').toLowerCase().trim();

// The canonical order of `entries`: level first (the file is a level-by-level
// work-list, so grouping by level is what a reader and a content task both
// want), then headword. Comparison is on raw code units — NOT localeCompare,
// whose result depends on the machine's ICU locale data and would make the
// generator non-deterministic across machines.
function compareEntries(a, b) {
  const ra = LEVEL_RANK[a.level], rb = LEVEL_RANK[b.level];
  if (ra !== rb) return (ra == null ? 99 : ra) - (rb == null ? 99 : rb);
  const ka = key(a.en), kb = key(b.en);
  if (ka !== kb) return ka < kb ? -1 : 1;
  if (a.en !== b.en) return a.en < b.en ? -1 : 1;
  return 0;
}

function validateCurriculum(cur, words) {
  const errors = [], warnings = [];
  const fail = m => errors.push(m);

  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) {
    return { errors: ['curriculum.json is not an object'], warnings };
  }
  if (!Array.isArray(words)) return { errors: ['words.json is not an array'], warnings };

  if (!Number.isInteger(cur.v) || cur.v < 1) fail(`"v" must be a positive integer, got ${JSON.stringify(cur.v)}`);
  if (JSON.stringify(cur.levels) !== JSON.stringify(LEVELS)) {
    fail(`"levels" must be ${JSON.stringify(LEVELS)}, got ${JSON.stringify(cur.levels)}`);
  }

  // --- sources / attribution -------------------------------------------------
  const sources = cur.sources;
  if (!sources || typeof sources !== 'object' || Array.isArray(sources)) {
    fail('missing or malformed "sources" block — attribution is a licence obligation, not optional');
  } else {
    for (const [id, meta] of Object.entries(sources)) {
      if (!meta || typeof meta !== 'object' || Array.isArray(meta)) { fail(`source "${id}" must be an object`); continue; }
      if (meta.id !== id) fail(`source "${id}" has mismatched inner id "${meta.id}"`);
      for (const f of SOURCE_FIELDS) {
        if (!String(meta[f] || '').trim()) fail(`source "${id}" has empty "${f}"`);
      }
      if (meta.licenceUrl && !/^https?:\/\//.test(String(meta.licenceUrl))) fail(`source "${id}" has a non-URL "licenceUrl"`);
      if (meta.url && !/^https?:\/\//.test(String(meta.url))) fail(`source "${id}" has a non-URL "url"`);
    }
    if (!Object.keys(sources).length) fail('"sources" is empty');
  }
  const knownSource = id => !!(sources && typeof sources === 'object' && sources[id]);

  // --- entries ---------------------------------------------------------------
  if (!Array.isArray(cur.entries)) {
    return { errors: errors.concat('"entries" is not an array'), warnings };
  }

  const seen = new Map();
  const usedSources = new Set();
  const byLevel = Object.fromEntries(LEVELS.map(l => [l, 0]));
  const pendingByLevel = Object.fromEntries(LEVELS.map(l => [l, 0]));
  const bySource = {};
  let matched = 0, pending = 0;

  cur.entries.forEach((e, n) => {
    const label = `entry ${n} (${(e && e.en) || '?'})`;
    const at = m => fail(`${label}: ${m}`);
    if (!e || typeof e !== 'object' || Array.isArray(e)) return fail(`${label} is not an object`);

    Object.keys(e).forEach(k => { if (!ENTRY_FIELDS.includes(k)) at(`unexpected field "${k}"`); });

    const en = e.en;
    if (typeof en !== 'string' || !en.trim()) at('empty "en"');
    else if (en !== en.trim()) at(`"en" has surrounding whitespace: ${JSON.stringify(en)}`);
    else if (en.includes('/')) at(`"en" still contains "/" — slash variants must be split into separate entries`);

    if (!LEVELS.includes(e.level)) at(`level "${e.level}" is outside ${LEVELS.join('–')}`);
    else byLevel[e.level]++;

    if (typeof e.source !== 'string' || !e.source.trim()) at('empty "source"');
    else if (!knownSource(e.source)) at(`source "${e.source}" is not declared in the "sources" block`);
    else { usedSources.add(e.source); bySource[e.source] = (bySource[e.source] || 0) + 1; }

    if (e.pos != null) {
      if (!Array.isArray(e.pos) || !e.pos.length) at('"pos" must be a non-empty array of strings');
      else if (e.pos.some(p => typeof p !== 'string' || !p.trim())) at('"pos" has empty entries');
    }
    if (e.from != null) {
      if (typeof e.from !== 'string' || !e.from.trim()) at('"from" must be a non-empty string');
      // "from" exists only to record a multi-form source row. If it equals the
      // headword it is noise, and if it does not contain the headword the
      // provenance claim is simply false.
      else if (e.from === e.en) at('"from" repeats "en" — omit it when the row was not split');
      else if (!e.from.split('/').map(s => s.trim()).includes(String(e.en))) {
        at(`"from" ${JSON.stringify(e.from)} does not contain "en" ${JSON.stringify(e.en)}`);
      }
    }

    if (!STATUSES.includes(e.status)) at(`status "${e.status}" must be one of ${STATUSES.join('/')}`);
    if (e.status === 'matched') {
      matched++;
      if (!Number.isInteger(e.i)) at('"matched" entry has no integer "i"');
      else if (e.i < 0 || e.i >= words.length) at(`"i" is ${e.i}, outside words.json (0..${words.length - 1})`);
      else if (key(words[e.i].en) !== key(en)) {
        at(`"i" ${e.i} is "${words[e.i].en}" in words.json, not "${en}"`);
      }
    } else if (e.status === 'pending') {
      pending++;
      if (LEVELS.includes(e.level)) pendingByLevel[e.level]++;
      if ('i' in e) at('"pending" entry must not carry an "i" — it has no words.json row yet');
    }

    const k = key(en);
    if (seen.has(k)) at(`duplicate headword — already present as entry ${seen.get(k)}`);
    else seen.set(k, n);

    if (n > 0 && compareEntries(cur.entries[n - 1], e) > 0) {
      at(`out of canonical order (level, then headword) — after "${cur.entries[n - 1].en}"`);
    }
  });

  // --- the counts header must describe the entries it ships with -------------
  const counts = cur.counts;
  if (!counts || typeof counts !== 'object') fail('missing "counts" block');
  else {
    const expect = (path, got, want) => {
      if (got !== want) fail(`counts.${path} says ${JSON.stringify(got)} but the entries give ${want}`);
    };
    expect('total', counts.total, cur.entries.length);
    expect('matched', counts.matched, matched);
    expect('pending', counts.pending, pending);
    for (const l of LEVELS) {
      expect(`byLevel.${l}`, counts.byLevel && counts.byLevel[l], byLevel[l]);
      expect(`pendingByLevel.${l}`, counts.pendingByLevel && counts.pendingByLevel[l], pendingByLevel[l]);
    }
    for (const [id, n] of Object.entries(bySource)) {
      expect(`bySource.${id}`, counts.bySource && counts.bySource[id], n);
    }
  }

  if (sources && typeof sources === 'object') {
    for (const id of Object.keys(sources)) {
      if (!usedSources.has(id)) warnings.push(`source "${id}" is declared but no entry uses it`);
    }
  }
  if (!cur.entries.length) fail('"entries" is empty');

  return { errors, warnings };
}

module.exports = { validateCurriculum, compareEntries, LEVELS, LEVEL_RANK, ENTRY_FIELDS, SOURCE_FIELDS };

if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const { ROOT } = require('./bundle');
  const curPath = path.join(ROOT, 'data', 'curriculum.json');
  if (!fs.existsSync(curPath)) {
    console.error('data/curriculum.json not found — run node tools/build-curriculum.js');
    process.exit(1);
  }
  const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));
  const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
  const { errors, warnings } = validateCurriculum(cur, words);
  const show = (list, kind) => {
    if (!list.length) return;
    console.error(`${list.length} ${kind}:`);
    list.slice(0, 60).forEach(e => console.error('  ' + e));
    if (list.length > 60) console.error(`  ...and ${list.length - 60} more`);
  };
  show(errors, 'error(s)');
  show(warnings, 'warning(s)');
  if (!errors.length) {
    const c = cur.counts;
    console.log(`ok — ${cur.entries.length} entries valid (${c.matched} matched, ${c.pending} pending content)`);
  }
  process.exit(errors.length ? 1 : 0);
}
