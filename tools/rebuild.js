// Fold data/words.json back into the bundle, after validating it.
//   node tools/rebuild.js [--dry]
const fs = require('fs');
const path = require('path');
const { ROOT, HTML, readBundle, writeBundle, readWords, writeWords, readCats, writeCats, readLevels, writeLevels } = require('./bundle');
const { validate } = require('./validate');
const { categoryAsset } = require('./categories');
const { readCurriculum, levelIndex, levelIndexStats } = require('./curriculum');
const { validateCurriculum } = require('./validate-curriculum');

const dry = process.argv.includes('--dry');
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
const b = readBundle();
const current = readWords(b);
const currentCats = readCats(b);
const nextCats = categoryAsset();
// The taught sequence comes from data/curriculum.json, not from slicing
// VOCAB_ORDER by percentage — see tools/curriculum.js for why. Validated here
// too: this is the last gate before the levels reach a learner, and a bad
// index would silently teach the wrong gloss rather than fail loudly.
const curriculum = readCurriculum();
const curErrors = validateCurriculum(curriculum, words).errors;
if (curErrors.length) {
  console.error(`refusing to rebuild — data/curriculum.json has ${curErrors.length} problem(s):`);
  curErrors.slice(0, 20).forEach(e => console.error('  ' + e));
  process.exit(1);
}
const nextLevels = levelIndex(curriculum, words);
const currentLevels = readLevels(b);
const levelsChanged = JSON.stringify(nextLevels) !== JSON.stringify(currentLevels);

const { errors, warnings } = validate(words, current);
if (warnings.length) console.warn(`${warnings.length} warning(s) — run node tools/validate.js to see them`);
if (errors.length) {
  console.error(`refusing to rebuild — ${errors.length} problem(s):`);
  errors.slice(0, 40).forEach(e => console.error('  ' + e));
  if (errors.length > 40) console.error(`  ...and ${errors.length - 40} more`);
  process.exit(1);
}

const changed = words.filter((w, i) => JSON.stringify(w) !== JSON.stringify(current[i])).length;
const catsChanged = JSON.stringify(nextCats) !== JSON.stringify(currentCats);
const lvStats = levelIndexStats(nextLevels);
console.log(`${changed} of ${words.length} entries changed`);
console.log(`category metadata ${catsChanged ? 'changed' : 'unchanged'} (${Object.keys(nextCats).length} categories)`);
console.log(`curriculum ${levelsChanged ? 'changed' : 'unchanged'} — ${lvStats.total} teachable words ` +
            `(${Object.entries(lvStats.byLevel).map(([L, n]) => `${L} ${n}`).join(' · ')})`);
if (dry) return console.log('dry run — bundle untouched');

const backup = HTML.replace(/\.html$/, '.backup.html');
if (!fs.existsSync(backup)) fs.copyFileSync(HTML, backup);
writeWords(b, words);
writeCats(b, nextCats);
writeLevels(b, nextLevels);
writeBundle(b);
console.log(`rebuilt ${path.basename(HTML)} (${(fs.statSync(HTML).size / 1048576).toFixed(2)} MB)`);
