// The one place that turns data/curriculum.json into what the app actually
// needs at runtime, so tools/rebuild.js and any future consumer cannot drift.
//
// data/curriculum.json is the editorial artifact: 8,845 headwords with real
// CEFR levels, their source, and — for the ~half that exist in the catalog —
// the data/words.json index carrying their Persian gloss and example.
//
// The app needs far less than that. It already has every word's content in
// VOCAB_WORDS, so the only thing the curriculum adds is *which words are
// taught, at what level, in what order*. That reduces to a list of indices per
// level (~25 KB) rather than a 1.4 MB copy of the file.
//
// TEACHABILITY IS DECIDED HERE, ONCE. An entry with status "pending" has no
// words.json row, therefore no gloss, no example, nothing to put on a card.
// Dropping those here means no downstream caller has to remember to — a card
// for an unglossed word is simply unrepresentable.
const fs = require('fs');
const path = require('path');
const { LEVELS } = require('./validate-curriculum');

const ROOT = path.join(__dirname, '..');
const CURRICULUM = path.join(ROOT, 'data', 'curriculum.json');

function readCurriculum(file = CURRICULUM) {
  if (!fs.existsSync(file)) {
    throw new Error('data/curriculum.json not found — run node tools/build-curriculum.js');
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// { "A1": [i, ...], ... } — teachable indices only, in the curriculum's own
// order (already sorted by level then headword, so a lesson's eight words are
// alphabetically adjacent rather than arbitrary).
function levelIndex(cur, words) {
  const out = {};
  LEVELS.forEach(L => { out[L] = []; });
  const seen = new Set();
  cur.entries.forEach(e => {
    if (e.status !== 'matched') return;          // pending = no content, never teachable
    if (!LEVELS.includes(e.level)) return;
    if (!Number.isInteger(e.i)) return;
    // Defensive: a stale index that no longer names its own headword must not
    // become a card teaching the wrong Persian gloss. validate-curriculum.js
    // already errors on this, but the bundle write is the last gate before a
    // learner sees it, so it is checked again here rather than assumed.
    const w = words && words[e.i];
    if (words && (!w || String(w.en).toLowerCase().trim() !== e.en.toLowerCase())) return;
    if (seen.has(e.i)) return;                   // one slot per word, ever
    seen.add(e.i);
    out[e.level].push(e.i);
  });
  return out;
}

function levelIndexStats(idx) {
  const byLevel = {};
  let total = 0;
  LEVELS.forEach(L => { byLevel[L] = idx[L].length; total += idx[L].length; });
  return { total, byLevel };
}

module.exports = { CURRICULUM, readCurriculum, levelIndex, levelIndexStats, LEVELS };
