// Dump the word list out of the bundle into data/words.json for agents to edit.
//   node tools/extract.js
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, readWords } = require('./bundle');

const out = path.join(ROOT, 'data', 'words.json');
const words = readWords(readBundle());
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(words, null, 1), 'utf8');
console.log(`extracted ${words.length} words -> data/words.json`);
