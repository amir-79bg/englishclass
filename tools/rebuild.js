// Fold data/words.json back into the bundle, after validating it.
//   node tools/rebuild.js [--dry]
const fs = require('fs');
const path = require('path');
const { ROOT, HTML, readBundle, writeBundle, readWords, writeWords, readCats, writeCats } = require('./bundle');
const { validate } = require('./validate');
const { categoryAsset } = require('./categories');

const dry = process.argv.includes('--dry');
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
const b = readBundle();
const current = readWords(b);
const currentCats = readCats(b);
const nextCats = categoryAsset();

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
console.log(`${changed} of ${words.length} entries changed`);
console.log(`category metadata ${catsChanged ? 'changed' : 'unchanged'} (${Object.keys(nextCats).length} categories)`);
if (dry) return console.log('dry run — bundle untouched');

const backup = HTML.replace(/\.html$/, '.backup.html');
if (!fs.existsSync(backup)) fs.copyFileSync(HTML, backup);
writeWords(b, words);
writeCats(b, nextCats);
writeBundle(b);
console.log(`rebuilt ${path.basename(HTML)} (${(fs.statSync(HTML).size / 1048576).toFixed(2)} MB)`);
