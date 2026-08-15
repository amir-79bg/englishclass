// Print a range of words so an agent can read its assignment without loading
// all 10k entries into context.
//   node tools/slice.js 0 199                -> entries by index 0..199
//   node tools/slice.js 0 199 --order        -> by TEACHING position instead
//   node tools/slice.js 0 199 --missing ipa  -> only those lacking that field
//
// --order matters: the list is stored in its original index order, but taught
// in VOCAB_ORDER, which puts the words the course itself uses first. Work on
// "the first 200 words a learner meets" means --order, not indices.
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, readAsset, VOCAB_UUID } = require('./bundle');

const [start, end] = process.argv.slice(2, 4).map(Number);
if (!Number.isInteger(start) || !Number.isInteger(end)) {
  console.error('usage: node tools/slice.js <start> <end> [--missing <field>] [--cat <name>]');
  process.exit(1);
}
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const missing = arg('--missing');
const cat = arg('--cat');

const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));

let out;
if (process.argv.includes('--order')) {
  const js = readAsset(readBundle(), VOCAB_UUID);
  const a = js.indexOf('[', js.indexOf('window.VOCAB_ORDER'));
  const order = JSON.parse(js.slice(a, js.indexOf('];', a) + 1));
  out = order.slice(start, end + 1).map(i => words[i]).filter(Boolean);
} else {
  out = words.slice(start, end + 1);
}
if (missing) out = out.filter(w => w[missing] == null || (Array.isArray(w[missing]) && !w[missing].length));
if (cat) out = out.filter(w => w.cat === cat);

console.log(JSON.stringify(out, null, 1));
console.error(`${out.length} entr(ies) of ${Math.min(end + 1, words.length) - start} in range`);
