// Turn the raw Wiktionary/WordNet candidate dump into something safe to import.
//   node tools/clean-dict.js <candidates.json> <out.json> [--report]
//
// The raw data is usable but not shippable: ZWNJ is stripped from every Persian
// string, Arabic letter forms leak in, some entries carry twenty glosses, and a
// handful are obscene. Each of those is repaired or dropped here rather than in
// the app.
const fs = require('fs');

const [inFile, outFile] = process.argv.slice(2);
if (!inFile || !outFile) { console.error('usage: node tools/clean-dict.js <candidates.json> <out.json>'); process.exit(1); }

const ZWNJ = '‌';
// Only rules that are safe in every context. Persian ZWNJ placement is
// morphological, and a wrong join is a spelling error a learner would see, so
// coverage is deliberately traded away for precision.
const PREFIX = ['می', 'نمی'];                       // verb prefixes, always joined
const SUFFIX = ['ها', 'های', 'هایی', 'تر', 'ترین'];  // plural and comparative
const restoreZwnj = s => {
  let out = String(s).trim();
  if (out.includes(ZWNJ)) return out;
  out = out.split(' ').map(word => {
    if (word.length < 4) return word;
    for (const p of PREFIX) {
      // می + stem, but not a word that merely starts with those letters, so
      // require enough left over to be a stem.
      if (word.startsWith(p) && word.length - p.length >= 3) return p + ZWNJ + word.slice(p.length);
    }
    for (const s2 of SUFFIX) {
      if (word.endsWith(s2) && word.length - s2.length >= 3) return word.slice(0, -s2.length) + ZWNJ + s2;
    }
    // Reduplication: کمکم -> کم‌کم
    const half = word.length / 2;
    if (Number.isInteger(half) && half >= 2 && word.slice(0, half) === word.slice(half)) {
      return word.slice(0, half) + ZWNJ + word.slice(half);
    }
    return word;
  }).join(' ');
  return out;
};

// Arabic-only letters that should be their Persian equivalents.
const dearabize = s => String(s)
  .replace(/ي/g, 'ی')            // Arabic ya -> Persian ye
  .replace(/ك/g, 'ک')            // Arabic kaf -> Persian ke
  .replace(/[ً-ْٰ]/g, '')   // harakat and dagger alef
  .replace(/ة/g, 'ه');           // ta marbuta -> he

const RUDE = /\b(fuck|shit|cunt|dick|cock|whore|slut|bitch|piss|arse|ass|bastard|wank|blow ?job|porn|nigger|faggot|penis|vagina)\b/i;
const FA = /[؀-ۿ]/;
const flat = a => (Array.isArray(a) ? a : [a]).filter(Boolean);

// The source's part of speech mapped onto the 29 categories the app knows.
const POS = { noun: 'noun', verb: 'verb', adj: 'adj', adv: 'adv', phrase: 'phrase', prep: 'phrase', conj: 'phrase', name: 'people' };

const raw = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const stats = { in: raw.length, rude: 0, noFa: 0, zwnjFixed: 0, arabicFixed: 0, trimmed: 0, kept: 0, thin: 0 };
const out = [];

for (const e of raw) {
  const en = String(e.w || '').trim();
  if (!en || RUDE.test(en)) { stats.rude += RUDE.test(en) ? 1 : 0; continue; }

  let glosses = flat(e.fa).map(g => String(g).trim()).filter(g => g && FA.test(g) && !RUDE.test(g));
  if (!glosses.length) { stats.noFa++; continue; }

  glosses = glosses.map(g => {
    const de = dearabize(g);
    if (de !== g) stats.arabicFixed++;
    const zw = restoreZwnj(de);
    if (zw !== de) stats.zwnjFixed++;
    return zw;
  });

  // Three senses is the most the drills can present; more is noise.
  if (glosses.length > 3) { glosses = glosses.slice(0, 3); stats.trimmed++; }
  const fa = glosses.join(' / ');
  if (fa.length > 60) continue;   // the validator's limit — the gloss is a button label

  const ipa = e.ipa && /^\/.+\/$/.test(e.ipa) ? e.ipa : null;
  const syn = flat(e.syn).map(s => String(s).trim()).filter(s => s && s.toLowerCase() !== en.toLowerCase()).slice(0, 4);
  // Keep only an example that actually contains the word and is a plain sentence.
  const ex = flat(e.ex).map(String).find(s =>
    s.length >= 15 && s.length <= 110 &&
    new RegExp('\\b' + en.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(s) &&
    !/[«»“”‘’]/.test(s) && !FA.test(s)) || null;

  // An entry with nothing but a bare gloss is a dictionary line, not teaching
  // material. Counted, and kept — search coverage is the point — but it will
  // not be dealt as a card because it has no example.
  if (!ipa && !syn.length && !ex) stats.thin++;

  const rec = { en: en, fa: fa };
  if (POS[e.pos]) rec.cat = POS[e.pos];
  if (ex) rec.ex = ex;
  if (ipa) rec.ipa = ipa;
  if (syn.length) rec.syn = syn;
  out.push(rec);
  stats.kept++;
}

fs.writeFileSync(outFile, JSON.stringify(out, null, 1), 'utf8');
console.log(`in ${stats.in} · kept ${stats.kept} · dropped ${stats.in - stats.kept} (obscene ${stats.rude}, no Persian gloss ${stats.noFa})`);
console.log(`repaired: ZWNJ ${stats.zwnjFixed} glosses · Arabic letters ${stats.arabicFixed} · gloss lists trimmed ${stats.trimmed}`);
console.log(`of the kept: ${stats.kept - stats.thin} carry IPA, a synonym or an example; ${stats.thin} are a bare gloss`);
console.log(`with an English example: ${out.filter(x => x.ex).length} · with IPA: ${out.filter(x => x.ipa).length} · with synonyms: ${out.filter(x => x.syn).length}`);
console.log(`-> ${outFile}`);
