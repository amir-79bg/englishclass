const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'data', 'src', 'app.jsx'), 'utf8');
const template = fs.readFileSync(path.join(root, 'data', 'src', 'template.html'), 'utf8');
const { readBundle, readTemplate } = require('./bundle');

test('reset and restore discard same-day initial-learning state', () => {
  assert.match(app, /applyBackup\(dump\)[\s\S]*?removeItem\('vocab_session_v1'\)[\s\S]*?this\._il = null/);
  assert.match(app, /resetAll: \(\) => \{[\s\S]*?'vocab_session_v1'[\s\S]*?this\._il = null/);
});

test('all microphone permission callbacks reject stale screens and stop stale streams', () => {
  for (const [method, screen] of [['exRecordAudio', 'exercise'], ['lsRecToggle', 'ltext'], ['dcRecToggle', 'dses']]) {
    const start = app.indexOf(`  ${method}()`);
    assert.notEqual(start, -1, `${method} exists`);
    const remainder = app.slice(start + 1);
    const relativeEnd = remainder.search(/\n  [A-Za-z_$][\w$]*\([^)]*\) \{/);
    const body = app.slice(start, relativeEnd === -1 ? app.length : start + 1 + relativeEnd);
    assert.match(body, new RegExp(`state\\.screen !== '${screen}'`), `${method} checks its active screen`);
    assert.match(body, /stream\.getTracks\(\)\.forEach\([^)]*=> [^.]+\.stop\(\)\)/, `${method} stops a stale stream`);
    assert.match(body, /MicToken !== token/, `${method} checks its request generation`);
  }
});

test('recording object URLs are revoked and audio sources use property bindings', () => {
  assert.match(app, /const revokeObjectUrl =/);
  assert.match(app, /exStop\(\)[\s\S]*?revokeObjectUrl/);
  assert.match(app, /lsStop\(silent\)[\s\S]*?revokeObjectUrl/);
  assert.match(app, /dcStop\(\)[\s\S]*?revokeObjectUrl/);
  assert.doesNotMatch(template, /<audio[^>]*\ssrc="\{\{/);
  assert.equal((template.match(/<audio[^>]*\ssc-camel-src="\{\{/g) || []).length, 3);
});

test('inner-screen back navigation uses canonical parents instead of stale visit history', () => {
  assert.doesNotMatch(app, /navBack\(|_navPrev|_navPopped/);
  for (const [screen, parent] of [
    ['study', 'lessons'], ['jobdetail', 'jobs'], ['add', 'browse'],
    ['exercise', 'browse'], ['game', 'words'], ['sbrun', 'sent'],
    ['glesson', 'gram'], ['ltext', 'listen'], ['dses', 'disc']
  ]) {
    assert.match(app, new RegExp(`${screen}:\\s*\\[[^\\n]*'${parent}'\\]`), `${screen} returns to ${parent}`);
  }
  assert.match(app, /const up = s\.screen === 'settings' && s\.settingsFrom[\s\S]*?\(s\.cs && s\.cs\.back\)/);
  assert.match(app, /vals\.crumbUp = \(\) => \{[\s\S]*?this\.leaveScreen\(s\.screen\);[\s\S]*?this\.setState\(\{ screen: up \}\)/);
  assert.match(app, /out\.exBack = \(\) => this\.setState\(\{ screen: 'browse'/);
  assert.match(app, /out\.gQuit = \(\) => this\.setState\(\{ screen: 'words'/);
  assert.match(app, /sbQuit\(\)[\s\S]*?screen: 'sent'/);
  assert.match(app, /csQuit\(\)[\s\S]*?screen: \(cs && cs\.back\) \|\| 'home'/);
});

test('the shipped single-file HTML contains the authoritative template', () => {
  const block = /(<script[^>]*data-dc-script[^>]*>)([\s\S]*?)(<\/script>)/;
  assert.match(template, block);
  const expected = template.replace(block, (_, open, old, close) => open + app + close);
  assert.equal(readTemplate(readBundle()), expected);
});
