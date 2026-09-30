const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'data', 'src', 'app.jsx'), 'utf8');
const template = fs.readFileSync(path.join(root, 'data', 'src', 'template.html'), 'utf8');

const method = (name, next) => {
  const start = app.indexOf(`  ${name}(`);
  assert.notEqual(start, -1, `${name} exists`);
  const end = next ? app.indexOf(`  ${next}(`, start + 1) : -1;
  assert.notEqual(end, -1, `${next} follows ${name}`);
  return app.slice(start, end);
};

test('lesson queue gates introductions before both test phases', () => {
  const body = method('chunkOrder', 'queueStats');
  const learn = body.indexOf('if (phased.A.length) return phased.A.slice()');
  const recognition = body.indexOf('if (phased.B.length) return shuffled(phased.B');
  const retrieval = body.indexOf('if (phased.C.length) return shuffled(phased.C');
  const reviews = body.indexOf('return due;');
  assert.ok(learn >= 0 && learn < recognition);
  assert.ok(recognition < retrieval);
  assert.ok(retrieval < reviews);
  assert.doesNotMatch(body, /lowerFresh|band0 > 0/);
});

test('correct phase answers advance state without interleaved scheduling', () => {
  const body = method('ilAdvance', 'advanceLessonIfDone');
  assert.match(body, /if \(turn === 'A'\) \{\s*rec\.turn = 'B'; rec\.fails = 0;\s*\}/);
  assert.match(body, /if \(turn === 'B'\) \{ rec\.turn = 'C'; rec\.fails = 0; \}/);
  assert.match(body, /else \{ this\.srCompleteInitialLearning\(w\.i\); rec\.turn = 'done'; \}/);
  assert.match(body, /else \{ gapMin = IL_RETRY_GAP_MIN; gapMax = IL_RETRY_GAP_MAX; reschedule = true; \}/);
  assert.doesNotMatch(app, /IL_GAP_B_|IL_GAP_C_/);
});

test('phase transitions may append the same lesson words again', () => {
  const body = method('extendQueue', 'startQuiz');
  assert.match(body, /const more = this\.chunkOrder\(d, n\);/);
  assert.doesNotMatch(body, /filter\(i => d\.order\.indexOf\(i\) < 0\)/);
});

test('saved interleaved sessions migrate without deleting per-word progress', () => {
  const body = method('load', 'save');
  assert.match(app, /const IL_FLOW_V = 2/);
  assert.match(body, /if \(n && d\.ilFlowV !== IL_FLOW_V\)/);
  assert.match(body, /const phase = this\.ilLessonState\(d\)/);
  assert.match(body, /d\.order = \[\];\s*d\.pos = 0;\s*d\.order = this\.chunkOrder\(d, n\)/);
  assert.doesNotMatch(body, /removeItem\('vocab_session_v1'\)/);
});

test('study screen shows a minimal phase indicator above the main card', () => {
  for (const prop of ['showStudyPhase', 'studyPhaseLabel', 'studyPhaseCount', 'studyPhaseBarStyle']) {
    assert.match(app, new RegExp(`${prop}:`));
  }
  assert.match(app, /isLearnPhase \? 'آموزش واژه‌ها' : 'آزمون درس'/);
  const phaseAt = template.indexOf('<sc-if value="{{ showStudyPhase }}"');
  const cardAt = template.indexOf('<div class="vcard study-card"');
  assert.ok(phaseAt >= 0 && phaseAt < cardAt);
  assert.match(template, /class="study-phase"[\s\S]*?class="study-phase-bar"/);
  assert.match(template, /\.study-phase\{margin:0 3px 8px;padding:0 2px\}/);
  assert.match(template, /\.study-phase-track\{height:2px/);
  assert.doesNotMatch(template, /study-phase-hint|studyPhaseHint/);
});
