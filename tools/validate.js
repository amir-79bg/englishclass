// Rules every edited words.json must satisfy before it can go back into the app.
// Run standalone to check the working copy:  node tools/validate.js
//
// errors   block a rebuild — they would corrupt saved progress or break the UI.
// warnings are reported only — real content sometimes breaks them (brand names,
//          mRNA, MySQL), so they are for humans to judge.
const FIELDS = ['i', 'en', 'fa', 'cat', 'ex', 'exfa', 'ipa', 'syn'];
const { CATS, validateCategoryDefinitions } = require('./categories');
const FA = /[؀-ۿ]/;

function validate(words, current) {
  const errors = validateCategoryDefinitions(), warnings = [];
  const label = i => `[${i}] ${(words[i] && words[i].en) || '?'}`;
  const at = (i, msg) => errors.push(`${label(i)}: ${msg}`);
  const warn = (i, msg) => warnings.push(`${label(i)}: ${msg}`);

  if (!Array.isArray(words)) return { errors: ['words.json is not an array'], warnings: [] };
  // The list may grow, shrink or have its spellings corrected while the app has
  // no users. What breaks on a shift is SAVED progress — d.order, d.mastered,
  // d.starred and vocab_sr_v1 are keyed by index, and vocab_overrides,
  // vocab_mysent, vocab_catover, vocab_famap are keyed by the headword string.
  // None of that exists yet, so both are warnings rather than errors.
  //
  // ONCE THE APP HAS BEEN USED BY ANYONE, turn these two back into errors:
  // after that point a moved index or a renamed headword silently orphans data
  // with no error and no way to recover it.
  if (current && words.length !== current.length) {
    warnings.push(`list length ${current.length} -> ${words.length} — safe only while no saved progress exists`);
  }

  words.forEach((w, i) => {
    // Index order is load-bearing: saved progress and VOCAB_ORDER both address
    // words by position, so reordering silently corrupts every user's data.
    if (w.i !== i) at(i, `field "i" is ${w.i} but must equal its index ${i}`);
    if (current && current[i] && w.en !== current[i].en) warn(i, `"en" changed from "${current[i].en}"`);

    if (!w.fa || !String(w.fa).trim()) at(i, 'empty "fa"');
    if (!w.ex || !String(w.ex).trim()) at(i, 'empty "ex"');
    if (!w.exfa || !String(w.exfa).trim()) at(i, 'empty "exfa"');
    if (!CATS.includes(w.cat)) at(i, `unknown category "${w.cat}"`);
    Object.keys(w).forEach(k => { if (!FIELDS.includes(k)) at(i, `unexpected field "${k}"`); });

    // fa is rendered as an answer button in multiple-choice drills; a long gloss
    // overflows the layout.
    if (w.fa && w.fa.length > 60) at(i, `"fa" is ${w.fa.length} chars — keep it under 60`);
    if (w.ipa != null && !/^\/.+\/$/.test(w.ipa)) at(i, `"ipa" must be wrapped in slashes, got "${w.ipa}"`);
    if (w.syn != null && !Array.isArray(w.syn)) at(i, '"syn" must be an array of strings');
    if (Array.isArray(w.syn)) {
      if (w.syn.some(s => typeof s !== 'string' || !s.trim())) at(i, '"syn" has empty entries');
      if (w.syn.some(s => s.toLowerCase() === String(w.en).toLowerCase())) at(i, '"syn" repeats the word itself');
    }

    if (w.fa && /[a-zA-Z]{3,}/.test(w.fa)) warn(i, `"fa" contains English: "${w.fa}"`);
    if (w.ex && FA.test(w.ex)) warn(i, '"ex" contains Persian text');
    if (w.exfa && !FA.test(w.exfa)) warn(i, '"exfa" is not Persian');
    if (w.ex && w.en && !String(w.ex).toLowerCase().includes(String(w.en).toLowerCase().split(' ')[0])) {
      warn(i, `example does not contain the word: "${w.ex}"`);
    }
  });

  return { errors, warnings };
}

module.exports = { validate, CATS, FIELDS };

if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const { ROOT, readBundle, readWords } = require('./bundle');
  const words = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
  const { errors, warnings } = validate(words, readWords(readBundle()));
  const show = (list, kind) => {
    if (!list.length) return;
    console.error(`${list.length} ${kind}:`);
    list.slice(0, 60).forEach(e => console.error('  ' + e));
    if (list.length > 60) console.error(`  ...and ${list.length - 60} more`);
  };
  show(errors, 'error(s)');
  show(warnings, 'warning(s)');
  if (!errors.length) console.log(`ok — ${words.length} entries valid`);
  process.exit(errors.length ? 1 : 0);
}
