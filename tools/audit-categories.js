// Cross-check category data across the editable sources and the shipped bundle.
// This is structural QA; semantic changes remain index-based review patches.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, readBundle, readWords, readCats } = require('./bundle');
const { definitions, CATS, categoryAsset, validateCategoryDefinitions } = require('./categories');

const errors = validateCategoryDefinitions();
const warnings = [];
const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
const bundle = readBundle();
const bundledWords = readWords(bundle);
const bundledCats = readCats(bundle);

if (JSON.stringify(words) !== JSON.stringify(bundledWords)) errors.push('data/words.json differs from bundled VOCAB_WORDS');
if (JSON.stringify(categoryAsset()) !== JSON.stringify(bundledCats)) errors.push('data/categories.json differs from bundled VOCAB_CATS');

const counts = Object.fromEntries(CATS.map(k => [k, 0]));
for (const w of words) {
  if (!Object.hasOwn(definitions, w.cat)) errors.push(`[${w.i}] ${w.en}: unknown category "${w.cat}"`);
  else counts[w.cat]++;
}

for (const [key, n] of Object.entries(counts)) {
  if (!n && key !== 'general') warnings.push(`category "${key}" has no words`);
  if (n > 0 && n < 4) errors.push(`category "${key}" has only ${n} word(s); category drills require at least 4`);
}

const byHeadword = new Map();
for (const w of words) {
  const key = String(w.en).normalize('NFKC').toLowerCase().trim();
  if (!byHeadword.has(key)) byHeadword.set(key, []);
  byHeadword.get(key).push(w);
}
for (const group of byHeadword.values()) {
  const cats = [...new Set(group.map(w => w.cat))];
  if (group.length > 1 && cats.length > 1) {
    errors.push(`duplicate headword "${group[0].en}" has conflicting categories: ${group.map(w => `${w.i}:${w.cat}`).join(', ')}`);
  }
}

function readWindowGlobal(file, name) {
  const src = fs.readFileSync(file, 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window[name];
}

for (const [file, name] of [['listening1.js', 'LISTEN_1'], ['listening2.js', 'LISTEN_2']]) {
  const items = readWindowGlobal(path.join(ROOT, 'data', 'curricula', file), name);
  for (const item of items) {
    if (!Object.hasOwn(definitions, item.topic)) errors.push(`${file}:${item.id} uses unknown topic "${item.topic}"`);
    else if (definitions[item.topic].type !== 'topic') errors.push(`${file}:${item.id} uses non-topic category "${item.topic}"`);
  }
}

const show = (title, list) => {
  if (!list.length) return;
  console.error(`${list.length} ${title}:`);
  list.slice(0, 60).forEach(x => console.error('  ' + x));
  if (list.length > 60) console.error(`  ...and ${list.length - 60} more`);
};

show('category error(s)', errors);
show('category warning(s)', warnings);
console.log(CATS.map(k => `${k}=${counts[k]}`).join(' · '));
if (!errors.length) console.log(`ok — ${words.length} words, ${CATS.length} category definitions, bundle and curricula in sync`);
process.exit(errors.length ? 1 : 0);
