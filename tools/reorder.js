// Re-order VOCAB_ORDER so the words taught first are the ones the app's OWN
// grammar, sentence, listening, discussion and collocation material uses.
//   node tools/reorder.js [--dry]
//
// The shipped order was roughly length-sorted, not frequency-sorted, so the
// "A1" band opened on cast/chef/cure/desk while take/have-to/work sat thousands
// of places back. The CEFR labels it fed were therefore unfounded.
//
// Rebuild-time only: `i` and `en` stay frozen and no app code changes. Saved
// progress is safe — d.order is persisted and only regenerated when wordCount
// changes, and mastered/starred are keyed by the frozen index.
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const { ROOT, readBundle, writeBundle, readAsset, writeAsset, readWords, VOCAB_UUID } = require('./bundle');

const CURRICULA = {
  GRAM: 'dca9788e-44f6-4c35-8178-a7a6297cb03f',
  SENT: '34d1c5c1-b9f4-4615-8a79-553cb010b907',
  LISTEN_1: '9a1062d3-94c3-4ade-abb6-b74ad47612ef',
  LISTEN_2: '919e7d4d-7e19-450d-85f0-d7cfe6c243b4',
  DISC: '0592dc99-726f-4190-aa79-f892c95cbf80',
  COLLOC2: '456306af-9ddf-4578-8ecd-ae8659b7d079'
};

// Never dealt as cards: grammatical glue and stray single letters teach nothing
// as isolated flashcards, and several are JSON artefacts rather than words.
const PARKED = new Set(('a an the and or but if then than that this these those of to in on at by for with from into over under ' +
  'is am are was were be been being do does did done have has had will would shall should can could may might must ' +
  'i you he she it we they me him her us them my your his its our their mine yours ' +
  'not no yes as so such very too also just only even still yet ever never ' +
  'what which who whom whose when where why how ' +
  'title ing tion ght mit val alt cas ide ati').split(/\s+/));

const TEMPLATE_MIN = 20; // an example shared by more than 20 words is a template

function courseFrequency(bundle) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const uuid of Object.values(CURRICULA)) vm.runInContext(readAsset(bundle, uuid), ctx);

  // Every English string anywhere in the six curricula, flattened.
  const text = [];
  const walk = v => {
    if (typeof v === 'string') { if (/[a-zA-Z]/.test(v)) text.push(v); return; }
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') return Object.values(v).forEach(walk);
  };
  walk(ctx.window);

  const corpus = ' ' + text.join(' ').toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const tokens = corpus.trim().split(' ');
  const unigram = {};
  for (const t of tokens) unigram[t] = (unigram[t] || 0) + 1;
  return { corpus, unigram, size: tokens.length };
}

function build() {
  const b = readBundle();
  const words = readWords(b);
  const { corpus, unigram, size } = courseFrequency(b);

  // Which examples are templates rather than real sentences.
  const exCount = {};
  for (const w of words) exCount[w.ex] = (exCount[w.ex] || 0) + 1;
  const faCount = {};
  for (const w of words) faCount[w.fa] = (faCount[w.fa] || 0) + 1;

  const freq = w => {
    const en = w.en.toLowerCase();
    if (en.includes(' ')) {                       // phrase: count the phrase itself
      let n = 0, i = 0;
      const needle = ' ' + en + ' ';
      while ((i = corpus.indexOf(needle, i)) >= 0) { n++; i += needle.length - 1; }
      return n;
    }
    return unigram[en] || 0;
  };

  const scored = words.map(w => {
    const en = w.en.toLowerCase();
    const cf = freq(w);
    let s = cf >= 3 ? 3000 + Math.min(cf, 800) : (cf >= 1 ? 2000 + cf : 1000);
    if (PARKED.has(en) || en.length <= 2) s -= 2500;
    if (exCount[w.ex] <= TEMPLATE_MIN) s += 60;
    if (faCount[w.fa] === 1) s += 30;
    if (/^[A-Z]/.test(w.en) && cf === 0) s -= 400;
    if (en.includes(' ')) s -= 20;
    s -= 4 * Math.min(w.en.length, 20);
    return { i: w.i, en: w.en, cf, s };
  });

  // Stable: ties keep the original order rather than shuffling on every rebuild.
  scored.sort((a, b2) => b2.s - a.s || a.i - b2.i);
  return { b, words, scored, corpusSize: size };
}

const { b, words, scored, corpusSize } = build();
const order = scored.map(x => x.i);

const core = scored.filter(x => x.cf >= 3).length;
const periphery = scored.filter(x => x.cf >= 1 && x.cf < 3).length;
const parked = scored.filter(x => PARKED.has(x.en.toLowerCase()) || x.en.length <= 2).length;

console.log(`course corpus: ${corpusSize} tokens`);
console.log(`هسته‌ی دوره (cf>=3): ${core} · واژه‌های دوره (cf 1-2): ${periphery} · گنجینه: ${words.length - core - periphery} · parked: ${parked}`);
console.log('\nfirst 40 under the new order:');
console.log('  ' + scored.slice(0, 40).map(x => x.en).join(', '));

if (process.argv.includes('--dry')) {
  console.log('\ndry run — bundle untouched');
} else {
  const js = readAsset(b, VOCAB_UUID);
  const start = js.indexOf('[', js.indexOf('window.VOCAB_ORDER'));
  const end = js.indexOf('];', start);
  if (start < 0 || end < 0) throw new Error('reorder: VOCAB_ORDER array not found');
  writeAsset(b, VOCAB_UUID, js.slice(0, start) + JSON.stringify(order) + js.slice(end + 1));
  writeBundle(b);
  console.log(`\nrebuilt (${(fs.statSync(b.file).size / 1048576).toFixed(2)} MB)`);
}

// The stage boundaries the app needs to label progress honestly.
fs.writeFileSync(path.join(ROOT, 'data', 'stages.json'),
  JSON.stringify({ core: core, periphery: core + periphery, total: words.length }, null, 1));
