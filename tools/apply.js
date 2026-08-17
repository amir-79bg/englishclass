// Merge agent patch files into data/words.json.
//   node tools/apply.js [--dry]
//
// Agents never edit words.json directly — several of them run at once and would
// clobber each other. Each writes data/patches/<name>.json instead:
//
//   { "12": { "ipa": "/ˈæp.əl/" }, "13": { "syn": ["huge", "vast"] } }
//
// Keys are word indices, values are the fields to overwrite. Anything not
// mentioned is left alone.
//
// PATCHES APPLY IN FILENAME ORDER, AND THAT HAS BITTEN US THREE TIMES.
// When two files write the same field of the same word, the alphabetically
// later one wins — silently. Real cases from this repo:
//
//   * an old proofreading pass re-broke `campus` back to «پردهٔ دانشگاه»
//     (curtain of the university) over a correction, because zzz-* sorts
//     after gloss-*;
//   * 13 gloss fixes in senses-a1-a2-* never landed at all, because
//     senses-core-* and zzz-agent-proofread-* sort after them.
//
// Both looked like the fix simply had not worked. Neither produced any output.
// So collisions are now reported: --collisions lists every one, and a collision
// where the two files disagree on the value is printed as a warning on every
// run. Filename conventions are not a mechanism; this is.
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./bundle');
const { validate, FIELDS } = require('./validate');

const dry = process.argv.includes('--dry');
const showCollisions = process.argv.includes('--collisions');
const wordsPath = path.join(ROOT, 'data', 'words.json');
const patchDir = path.join(ROOT, 'data', 'patches');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const original = JSON.parse(JSON.stringify(words));

const files = fs.existsSync(patchDir) ? fs.readdirSync(patchDir).filter(f => f.endsWith('.json')).sort() : [];
if (!files.length) return console.log('no patches in data/patches/');

const problems = [];
// key = "<index>.<field>" -> { file, value } of whoever wrote it last.
const lastWriter = new Map();
const overridden = [];
let applied = 0;
for (const f of files) {
  const patch = JSON.parse(fs.readFileSync(path.join(patchDir, f), 'utf8'));
  let n = 0;
  for (const [key, fields] of Object.entries(patch)) {
    const i = Number(key);
    if (!Number.isInteger(i) || !words[i]) { problems.push(`${f}: no word at index ${key}`); continue; }
    // "i" is the entry's identity and is never patchable. "en" is editable
    // only while the app has no users: it keys vocab_overrides, vocab_mysent,
    // vocab_catover and vocab_famap, so renaming a headword after release
    // silently discards whatever the learner had edited on it.
    for (const k of Object.keys(fields)) {
      if (k === 'i') { problems.push(`${f}: [${i}] may not patch "i"`); continue; }
      if (!FIELDS.includes(k)) { problems.push(`${f}: [${i}] unknown field "${k}"`); continue; }
      const slot = `${i}.${k}`, prev = lastWriter.get(slot);
      if (prev) {
        overridden.push({
          i, k, word: words[i].en,
          from: prev.file, fromValue: prev.value,
          to: f, toValue: fields[k],
          conflicting: JSON.stringify(prev.value) !== JSON.stringify(fields[k])
        });
      }
      lastWriter.set(slot, { file: f, value: fields[k] });
      words[i][k] = fields[k];
      n++;
    }
  }
  console.log(`${f}: ${n} field(s)`);
  applied += n;
}

if (problems.length) {
  console.error(`${problems.length} patch problem(s):`);
  problems.slice(0, 40).forEach(p => console.error('  ' + p));
  process.exit(1);
}

// A collision where both files write the SAME value is harmless duplication.
// A collision where they disagree means one file's edit was discarded — which
// is exactly the failure that went unnoticed three times, so it is always
// reported even without --collisions.
const conflicts = overridden.filter(o => o.conflicting);
if (conflicts.length) {
  console.warn(`\n${conflicts.length} field(s) overwritten by a later-sorting patch — the earlier edit was discarded:`);
  const show = showCollisions ? conflicts : conflicts.slice(0, 12);
  show.forEach(o => {
    console.warn(`  [${o.i}] ${o.word} .${o.k}`);
    console.warn(`      ${o.from} wrote: ${JSON.stringify(o.fromValue)}`);
    console.warn(`      ${o.to} won with: ${JSON.stringify(o.toValue)}`);
  });
  if (!showCollisions && conflicts.length > show.length) {
    console.warn(`  ...and ${conflicts.length - show.length} more — run with --collisions to see all`);
  }
  console.warn('  If the losing edit was the correct one, move it into the patch that sorts last.');
}
if (showCollisions && overridden.length > conflicts.length) {
  console.log(`\n(${overridden.length - conflicts.length} further collision(s) wrote an identical value — harmless)`);
}

const { errors, warnings } = validate(words, original);
if (warnings.length) console.warn(`${warnings.length} warning(s) — run node tools/validate.js after applying`);
if (errors.length) {
  console.error(`refusing to apply — ${errors.length} error(s):`);
  errors.slice(0, 40).forEach(e => console.error('  ' + e));
  process.exit(1);
}

const touched = words.filter((w, i) => JSON.stringify(w) !== JSON.stringify(original[i])).length;
console.log(`${applied} field(s) across ${touched} word(s)`);
if (dry) return console.log('dry run — words.json untouched');
fs.writeFileSync(wordsPath, JSON.stringify(words, null, 1), 'utf8');
console.log('words.json updated — run node tools/rebuild.js to fold it into the app');
