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
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./bundle');
const { validate, FIELDS } = require('./validate');

const dry = process.argv.includes('--dry');
const wordsPath = path.join(ROOT, 'data', 'words.json');
const patchDir = path.join(ROOT, 'data', 'patches');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const original = JSON.parse(JSON.stringify(words));

const files = fs.existsSync(patchDir) ? fs.readdirSync(patchDir).filter(f => f.endsWith('.json')).sort() : [];
if (!files.length) return console.log('no patches in data/patches/');

const problems = [];
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
