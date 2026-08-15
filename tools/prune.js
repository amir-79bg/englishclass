// Remove entries from the word list and renumber everything that points at it.
//   node tools/prune.js <indices.json> [--dry]
//
// The input is a JSON array of indices to remove, e.g. [12, 480, 5206].
//
// Removing an entry shifts every index above it, so this also rewrites
// VOCAB_ORDER. That is only safe while no learner has saved progress — saved
// progress addresses words by index, and nothing here can migrate it. Once the
// app has been used, prune nothing: drop entries from the teaching order
// instead, which leaves indices alone.
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, writeBundle, readAsset, writeAsset, VOCAB_UUID } = require('./bundle');
const { validate } = require('./validate');

const listFile = process.argv[2];
if (!listFile) { console.error('usage: node tools/prune.js <indices.json> [--dry]'); process.exit(1); }
const dry = process.argv.includes('--dry');

const wordsPath = path.join(ROOT, 'data', 'words.json');
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const drop = new Set(JSON.parse(fs.readFileSync(listFile, 'utf8')).map(Number).filter(n => Number.isInteger(n)));

const bad = [...drop].filter(i => i < 0 || i >= words.length);
if (bad.length) { console.error('indices out of range:', bad.slice(0, 10).join(', ')); process.exit(1); }

console.log(`removing ${drop.size} of ${words.length} entries`);
console.log('   ' + [...drop].slice(0, 12).map(i => words[i].en).join(', ') + (drop.size > 12 ? ' …' : ''));

// old index -> new index, for everything that survives.
const remap = new Map();
const kept = [];
words.forEach((w, i) => {
  if (drop.has(i)) return;
  remap.set(i, kept.length);
  kept.push(Object.assign({}, w, { i: kept.length }));
});

const { errors, warnings } = validate(kept, null);
if (warnings.length) console.warn(`${warnings.length} warning(s) — run node tools/validate.js afterwards`);
if (errors.length) {
  console.error(`refusing to prune — ${errors.length} error(s):`);
  errors.slice(0, 20).forEach(e => console.error('  ' + e));
  process.exit(1);
}

// VOCAB_ORDER holds indices, so it has to be remapped and the dropped ones
// removed — an order entry pointing past the end deals a blank card.
const b = readBundle();
const js = readAsset(b, VOCAB_UUID);
const a = js.indexOf('[', js.indexOf('window.VOCAB_ORDER'));
const z = js.indexOf('];', a);
const order = JSON.parse(js.slice(a, z + 1));
const newOrder = order.map(i => remap.get(i)).filter(i => i != null);

console.log(`words ${words.length} -> ${kept.length} · teaching order ${order.length} -> ${newOrder.length}`);
if (dry) return console.log('dry run — nothing written');

fs.writeFileSync(wordsPath, JSON.stringify(kept, null, 1), 'utf8');
writeAsset(b, VOCAB_UUID, js.slice(0, a) + JSON.stringify(newOrder) + js.slice(z + 1));
writeBundle(b);

// The stage boundaries are counted off the order, so they move too.
const stagesPath = path.join(ROOT, 'data', 'stages.json');
if (fs.existsSync(stagesPath)) {
  const st = JSON.parse(fs.readFileSync(stagesPath, 'utf8'));
  const shrink = n => Math.round(n * (newOrder.length / order.length));
  fs.writeFileSync(stagesPath, JSON.stringify({ core: shrink(st.core), periphery: shrink(st.periphery), total: kept.length }, null, 1));
  console.log('stages.json rescaled — update STAGES in app.jsx to match');
}
console.log('words.json and VOCAB_ORDER updated — run node tools/rebuild.js to fold the data in');
