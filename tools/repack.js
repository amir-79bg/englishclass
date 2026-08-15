// Fold data/src back into the bundle.
//   node tools/repack.js [--dry]
//
// The counterpart to tools/unpack.js. The two files divide cleanly:
//   data/src/app.jsx        the app logic — authoritative, spliced in below
//   data/src/template.html  the markup   — authoritative for everything else
//
// app.jsx physically lives inside template.html's <script data-dc-script>
// block. Rather than make you edit a 2,000-line script through a 13,000-line
// file, this splices app.jsx over that block. So: edit logic in app.jsx, edit
// markup in template.html, never edit the script block inside template.html.
const fs = require('fs');
const path = require('path');
const { ROOT, HTML, readBundle, writeBundle, readTemplate, writeTemplate } = require('./bundle');

const dry = process.argv.includes('--dry');
const src = path.join(ROOT, 'data', 'src', 'template.html');
if (!fs.existsSync(src)) throw new Error('repack: data/src/template.html missing — run node tools/unpack.js first');

const jsx = path.join(ROOT, 'data', 'src', 'app.jsx');
let next = fs.readFileSync(src, 'utf8');

// The app source must still be extractable, or the page renders nothing.
const block = /(<script[^>]*data-dc-script[^>]*>)([\s\S]*?)(<\/script>)/;
if (!block.test(next)) throw new Error('repack: data-dc-script block missing or malformed — refusing to write');

if (fs.existsSync(jsx)) {
  const logic = fs.readFileSync(jsx, 'utf8');
  // $-sequences are special in String.replace replacements; use a function.
  next = next.replace(block, (_, open, old, close) => {
    if (old !== logic) console.log(`app.jsx spliced in (${old.length} -> ${logic.length} chars)`);
    return open + logic + close;
  });
}

const b = readBundle();
const current = readTemplate(b);

if (next === current) return console.log('no changes');

const diff = next.split('\n').length - current.split('\n').length;
console.log(`template ${current.length} -> ${next.length} chars (${diff >= 0 ? '+' : ''}${diff} lines)`);
if (dry) return console.log('dry run — bundle untouched');

const backup = HTML.replace(/\.html$/, '.backup.html');
if (!fs.existsSync(backup)) fs.copyFileSync(HTML, backup);
writeTemplate(b, next);
writeBundle(b);

// Round-trip immediately: a template that cannot be read back is a broken app.
const check = readTemplate(readBundle());
if (check !== next) throw new Error('repack: round-trip mismatch — bundle may be corrupt, restore from .backup.html');
console.log(`rebuilt ${path.basename(HTML)} (${(fs.statSync(HTML).size / 1048576).toFixed(2)} MB)`);
