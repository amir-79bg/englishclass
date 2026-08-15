// Repair Persian typography in the glosses.
//   node tools/normalise-fa.js [--dry]
//
// Deliberately narrow. Two traps make a general rule dangerous here:
//
//   * The tanwin in کاملاً / قطعاً / احتمالاً is CORRECT Persian for these
//     Arabic-loan adverbs. Stripping "Arabic marks" would break the spelling of
//     83 correct entries.
//   * Not every word starting می is the verb prefix — میراث, میدان, خمیردندان,
//     میانبر are ordinary words. A blind می → می‌ rule corrupts them.
//
// So the prefix rule fires only in front of a known verb stem, and the suffix
// rules only where the remainder is long enough to be a word on its own.
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./bundle');

const ZWNJ = '‌';
const dry = process.argv.includes('--dry');

// Present and past stems that actually follow می / نمی in everyday Persian.
const STEMS = ['کن', 'کرد', 'شو', 'شد', 'رو', 'رفت', 'آی', 'آمد', 'ده', 'داد', 'گیر', 'گرفت',
  'خواه', 'خواست', 'توان', 'توانست', 'گوی', 'گفت', 'بین', 'دید', 'دان', 'دانست', 'زن', 'زد',
  'خور', 'خورد', 'نویس', 'نوشت', 'خوان', 'خواند', 'بر', 'برد', 'یاب', 'یافت', 'ماند', 'مان',
  'رسد', 'رس', 'ارز', 'ارزید', 'پرس', 'پرسید', 'فهم', 'فهمید', 'ساز', 'ساخت', 'افت', 'افتاد'];
const VERB = new RegExp('^(نمی|می)(' + STEMS.join('|') + ')');

// Suffixes that always take ZWNJ after a stem of reasonable length. Comparative
// تر / ترین are deliberately excluded: without part-of-speech information a
// suffix rule also corrupts ordinary words such as انگشتر and پوستر.
const SUFFIX = [['شده', 3], ['شدن', 3], ['کننده', 3], ['ها', 3], ['های', 3], ['هایی', 3]];
// Words ending like one of the suffixes above but written joined.
const JOINED = new Set(['بارها', 'اژدها']);
// A bare present stem is not a complete indicative verb. This exception also
// prevents the noun میدان from being read as می + دان.
const NON_VERBS = new Set(['میدان']);

const fix = s => {
  if (typeof s !== 'string' || s.includes(ZWNJ)) return s;
  return s.split(' ').map(token => {
    // Split the punctuation off, or «فراتر never matches the exception list and
    // a trailing «.» defeats the suffix rules.
    const m0 = /^([^؀-ۿ]*)([؀-ۿ]+)([\s\S]*)$/.exec(token);
    if (!m0) return token;
    const [, lead, word, tail] = m0;
    const put = w => lead + w + tail;

    if (JOINED.has(word)) return token;
    const m = VERB.exec(word);
    if (m && !NON_VERBS.has(word)) return put(m[1] + ZWNJ + word.slice(m[1].length));
    for (const [suf, min] of SUFFIX) {
      if (word.endsWith(suf) && word.length - suf.length >= min) return put(word.slice(0, -suf.length) + ZWNJ + suf);
    }
    // Do not infer reduplication from repeated halves. اساس and the perfectly
    // valid possessive کمکم ("my help" / "help me" in context) make that
    // transformation unsafe without lexical or sentence-level information.
    return token;
  }).join(' ');
};

const p = path.join(ROOT, 'data', 'words.json');
const words = JSON.parse(fs.readFileSync(p, 'utf8'));
const changes = [];
for (const w of words) {
  for (const field of ['fa', 'exfa']) {
    const before = w[field];
    if (!before) continue;
    const after = fix(before);
    if (after !== before) { changes.push([w.en, field, before, after]); w[field] = after; }
  }
}

console.log(`${changes.length} strings repaired`);
changes.slice(0, 15).forEach(([en, f, b, a]) => console.log(`  ${en.padEnd(18)}${f}  ${b}  ->  ${a}`));
if (dry) return console.log('\ndry run — nothing written');
fs.writeFileSync(p, JSON.stringify(words, null, 1), 'utf8');
console.log('words.json updated — run node tools/rebuild.js to fold it in');
