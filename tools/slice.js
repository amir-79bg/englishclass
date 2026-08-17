// Print a range of words so an agent can read its assignment without loading
// all 10k entries into context.
//   node tools/slice.js 0 199                -> entries by index 0..199
//   node tools/slice.js 0 199 --order        -> by TEACHING position instead
//   node tools/slice.js 0 199 --missing ipa  -> only those lacking that field
//   node tools/slice.js 0 199 --level A1     -> the A1 curriculum, positions 0..199
//   node tools/slice.js 0 199 --level A1 --templated  -> ...only broken examples
//
// --order matters: the list is stored in its original index order, but taught
// in VOCAB_ORDER, which puts the words the course itself uses first. Work on
// "the first 200 words a learner meets" means --order, not indices.
//
// --level matters MORE now (LEG-015): the app no longer teaches from
// VOCAB_ORDER at all. It teaches data/curriculum.json, and only 4,540 of the
// 10,524 catalog entries are in it. Content work aimed at index ranges — or
// even at --order — mostly lands on words no learner will ever be dealt.
// --level walks the real taught sequence of one CEFR level, so "fix A1 first"
// means exactly the words a beginner actually meets, in the order they meet them.
//
// --templated narrows further to the entries whose example sentence is still
// one of the generated template fills (docs/dictionary-audit.md F2), which is
// the actual defect worth an agent's time.
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, readAsset, readLevels, VOCAB_UUID } = require('./bundle');

const [start, end] = process.argv.slice(2, 4).map(Number);
if (!Number.isInteger(start) || !Number.isInteger(end)) {
  console.error('usage: node tools/slice.js <start> <end> [--order] [--level A1] [--templated] [--missing <field>] [--cat <name>]');
  process.exit(1);
}
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const missing = arg('--missing');
const cat = arg('--cat');
const level = arg('--level');

// The template shapes that still dominate the catalog. Kept here rather than in
// an agent prompt so the tool and the reviewer agree on what "broken" means.
const TEMPLATES = [
  /^do you remember that .+\?$/i,
  /^i need a new .+ for my work\.$/i,
  /^we talked about the .+ for an hour\.$/i,
  /^this .+ is very important to me\.$/i,
  /^the .+ changed everything for us\.$/i,
  /^the weather was very .+ yesterday\.$/i,
  /^learning to .+ takes time and practice\.$/i,
  /^he looked .+ after the meeting\.$/i
];

const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));

let out;
if (level) {
  const levels = readLevels(readBundle());
  if (!levels || !levels[level]) {
    console.error(`--level ${level}: not in the bundle. Run node tools/rebuild.js first, or use A1..C2.`);
    process.exit(1);
  }
  out = levels[level].slice(start, end + 1).map(i => words[i]).filter(Boolean);
} else if (process.argv.includes('--order')) {
  const js = readAsset(readBundle(), VOCAB_UUID);
  const a = js.indexOf('[', js.indexOf('window.VOCAB_ORDER'));
  const order = JSON.parse(js.slice(a, js.indexOf('];', a) + 1));
  out = order.slice(start, end + 1).map(i => words[i]).filter(Boolean);
} else {
  out = words.slice(start, end + 1);
}
if (missing) out = out.filter(w => w[missing] == null || (Array.isArray(w[missing]) && !w[missing].length));
if (cat) out = out.filter(w => w.cat === cat);
if (process.argv.includes('--templated')) out = out.filter(w => TEMPLATES.some(re => re.test(w.ex || '')));

console.log(JSON.stringify(out, null, 1));
console.error(`${out.length} entr(ies) of ${Math.min(end + 1, words.length) - start} in range`);
