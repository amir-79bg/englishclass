// Extract the five authored curricula out of the bundle so they can be read and
// corrected, and fold them back in.
//   node tools/curricula.js extract   -> data/curricula/<name>.js
//   node tools/curricula.js rebuild [--dry]
//
// Unlike the word list these are hand-written JS files (`window.GRAM = {...}`),
// so they go out and come back verbatim — no JSON round-trip that would strip
// comments or reformat someone's work.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, readBundle, writeBundle, readAsset, writeAsset, HTML } = require('./bundle');

const ASSETS = {
  grammar: { uuid: 'dca9788e-44f6-4c35-8178-a7a6297cb03f', global: 'GRAM' },
  sentences: { uuid: '34d1c5c1-b9f4-4615-8a79-553cb010b907', global: 'SENT' },
  listening1: { uuid: '9a1062d3-94c3-4ade-abb6-b74ad47612ef', global: 'LISTEN_1' },
  listening2: { uuid: '919e7d4d-7e19-450d-85f0-d7cfe6c243b4', global: 'LISTEN_2' },
  discussion: { uuid: '0592dc99-726f-4190-aa79-f892c95cbf80', global: 'DISC' },
  collocations: { uuid: '456306af-9ddf-4578-8ecd-ae8659b7d079', global: 'COLLOC2' }
};

const dir = path.join(ROOT, 'data', 'curricula');
const cmd = process.argv[2];

// A curriculum file that does not parse, or that no longer defines its global,
// would blank out a whole section of the app at load with no error.
function check(name, src) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  try { vm.runInContext(src, ctx); } catch (e) { throw new Error(`${name}: does not parse — ${e.message}`); }
  const g = ASSETS[name].global;
  if (ctx.window[g] == null) throw new Error(`${name}: window.${g} is not defined after loading`);
  return ctx.window[g];
}

if (cmd === 'extract') {
  const b = readBundle();
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, a] of Object.entries(ASSETS)) {
    const src = readAsset(b, a.uuid);
    check(name, src);
    fs.writeFileSync(path.join(dir, name + '.js'), src, 'utf8');
    console.log(`${name.padEnd(13)} ${(src.length / 1024).toFixed(0)} KB -> data/curricula/${name}.js`);
  }
} else if (cmd === 'rebuild') {
  const dry = process.argv.includes('--dry');
  const b = readBundle();
  let changed = 0;
  for (const [name, a] of Object.entries(ASSETS)) {
    const file = path.join(dir, name + '.js');
    if (!fs.existsSync(file)) continue;
    const next = fs.readFileSync(file, 'utf8');
    if (next === readAsset(b, a.uuid)) continue;
    check(name, next);
    console.log(`${name}: changed`);
    if (!dry) writeAsset(b, a.uuid, next);
    changed++;
  }
  if (!changed) return console.log('no changes');
  if (dry) return console.log('dry run — bundle untouched');
  const backup = HTML.replace(/\.html$/, '.backup.html');
  if (!fs.existsSync(backup)) fs.copyFileSync(HTML, backup);
  writeBundle(b);
  console.log(`rebuilt ${path.basename(HTML)} (${(fs.statSync(HTML).size / 1048576).toFixed(2)} MB)`);
} else {
  console.error('usage: node tools/curricula.js extract | rebuild [--dry]');
  process.exit(1);
}
