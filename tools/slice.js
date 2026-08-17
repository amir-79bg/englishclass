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
//
// DO NOT TRUST THIS LIST TO BE COMPLETE. It was, twice. The first eight below
// were taken from docs/dictionary-audit.md §F2 and used to declare every level
// "100% clean" — but the audit only enumerated its top-20 shapes, and a second,
// more natural-sounding generation of templates sat in the long tail and passed
// straight through the filter. A gloss auditor reading B2/C1/C2 noticed them by
// eye. To find the real set, do not grep for known shapes; count repeats:
//
//   node -e 'const {readBundle,readLevels,readWords}=require("./tools/bundle");
//     const b=readBundle(),lv=readLevels(b),W=readWords(b);const m=new Map();
//     [...new Set(Object.values(lv).flat())].forEach(i=>{const w=W[i];if(!w.ex)return;
//     const k=w.ex.toLowerCase().split(String(w.en).toLowerCase().split(" ")[0]).join("~");
//     m.set(k,(m.get(k)||0)+1)});
//     [...m].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([k,n])=>console.log(n,k))'
//
// Any shape reused three or more times across distinct headwords is a template,
// whatever it sounds like. Add it here when one turns up.
const TEMPLATES = [
  /^do you remember that .+\?$/i,
  /^i need a new .+ for my work\.$/i,
  /^we talked about the .+ for an hour\.$/i,
  /^this .+ is very important to me\.$/i,
  /^the .+ changed everything for us\.$/i,
  /^the weather was very .+ yesterday\.$/i,
  /^learning to .+ takes time and practice\.$/i,
  /^he looked .+ after the meeting\.$/i,
  // Second generation, found 2026-08-18 — 562 taught words across nine shapes.
  /^everything felt .+ after the trip\.$/i,
  /^this room is too .+ for me\.$/i,
  /^it is not easy to .+ every day\.$/i,
  /^i like to .+ in the morning\.$/i,
  /^to .+ well, you need patience\.$/i,
  /^he answered .+\.$/i,
  /^they spoke .+ about the problem\.$/i,
  /^i .+ drink tea at night\.$/i,
  /^she .+ finished the work\.$/i
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
