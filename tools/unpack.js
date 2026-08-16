// Write the app's own source out of the bundle so it can be read and grepped.
//   node tools/unpack.js        -> data/src/template.html + data/src/app.jsx
//
// Read-only with respect to the bundle. data/src is the editable source tree;
// changes go back through tools/repack.js (logic in app.jsx, markup elsewhere
// in template.html).
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, readTemplate } = require('./bundle');

const dir = path.join(ROOT, 'data', 'src');
fs.mkdirSync(dir, { recursive: true });

const tpl = readTemplate(readBundle());
fs.writeFileSync(path.join(dir, 'template.html'), tpl, 'utf8');

// The React app source rides inside the template as a <script data-dc-script>.
const m = /<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(tpl);
if (!m) throw new Error('unpack: data-dc-script block not found');
fs.writeFileSync(path.join(dir, 'app.jsx'), m[1], 'utf8');

const lines = s => s.split('\n').length;
console.log(`data/src/template.html  ${lines(tpl)} lines`);
console.log(`data/src/app.jsx        ${lines(m[1])} lines`);
