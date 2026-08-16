'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(__dirname, 'build-docs.js');
const TEMPLATE = path.join(__dirname, 'docs-template.html');

function makeFixture(t, documents) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'english-class-docs-'));
  const docsDirectory = path.join(root, 'docs');
  const toolsDirectory = path.join(root, 'tools');

  fs.mkdirSync(docsDirectory, { recursive: true });
  fs.mkdirSync(toolsDirectory, { recursive: true });
  fs.copyFileSync(TEMPLATE, path.join(toolsDirectory, 'docs-template.html'));

  for (const [relativePath, source] of Object.entries(documents)) {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, source, 'utf8');
  }

  t.after(() => {
    const expectedPrefix = path.join(os.tmpdir(), 'english-class-docs-');
    assert.ok(root.startsWith(expectedPrefix), `refusing to remove unexpected test path: ${root}`);
    fs.rmSync(root, { recursive: true, force: true });
  });

  return root;
}

function runBuild(root, ...arguments_) {
  return spawnSync(process.execPath, [BUILD_SCRIPT, '--root', root, ...arguments_], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function assertSuccessful(result) {
  assert.equal(
    result.status,
    0,
    `command failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function readPortal(root) {
  return fs.readFileSync(path.join(root, 'docs', 'index.html'), 'utf8');
}

function embeddedData(portal) {
  const match = portal.match(
    /<script\b(?=[^>]*\bid="docs-data")(?=[^>]*\btype="application\/json")[^>]*>([\s\S]*?)<\/script>/i,
  );

  assert.ok(match, 'generated portal must contain the embedded #docs-data JSON payload');
  return JSON.parse(match[1]);
}

test('recursively discovers new Unicode Markdown documents and produces deterministic bytes', (t) => {
  const root = makeFixture(t, {
    'docs/README.md': '# راهنمای اصلی\n\nمتن فارسی و English text.\n',
    'docs/بخش‌ها/شروع.md': '# شروع سریع\n\nمحتوای پوشهٔ تو در تو.\n',
    'docs/ignored.txt': '# This is not Markdown\n',
  });

  const first = runBuild(root);
  assertSuccessful(first);
  const firstPortal = readPortal(root);
  const sentinelTime = new Date('2001-01-01T00:00:00.000Z');
  fs.utimesSync(path.join(root, 'docs', 'index.html'), sentinelTime, sentinelTime);
  const firstMtime = fs.statSync(path.join(root, 'docs', 'index.html')).mtimeMs;

  const firstData = embeddedData(firstPortal);
  assert.deepEqual(
    firstData.docs.map((document) => document.sourceHref).sort(),
    ['README.md', 'بخش‌ها/شروع.md'].sort(),
  );
  assert.deepEqual(
    firstData.docs.map((document) => document.title).sort(),
    ['راهنمای اصلی', 'شروع سریع'].sort(),
  );

  const second = runBuild(root);
  assertSuccessful(second);
  const secondPortal = readPortal(root);
  const secondMtime = fs.statSync(path.join(root, 'docs', 'index.html')).mtimeMs;

  assert.equal(secondPortal, firstPortal, 'identical inputs must produce identical output bytes');
  assert.equal(secondMtime, firstMtime, 'an unchanged build must not rewrite the generated file');

  fs.writeFileSync(
    path.join(root, 'docs', 'بخش‌ها', 'سند تازه.md'),
    '# سند تازه\n\nاین سند باید بدون تغییر generator کشف شود.\n',
    'utf8',
  );
  assertSuccessful(runBuild(root));
  const updatedData = embeddedData(readPortal(root));
  assert.ok(updatedData.docs.some((document) => document.sourceHref === 'بخش‌ها/سند تازه.md'));
  assert.ok(updatedData.docs.some((document) => document.title === 'سند تازه'));
});

test('renders GFM safely and blocks raw HTML and unsafe URL schemes', (t) => {
  const root = makeFixture(t, {
    'docs/security.md': [
      '# Rendering',
      '',
      '| نام | مقدار |',
      '| --- | --- |',
      '| کلید | value |',
      '',
      '```js',
      'const tag = "<script>alert(1)</script>";',
      '```',
      '',
      '<img src=x onerror="globalThis.compromised=true">',
      '',
      '[unsafe](javascript:alert(1))',
      '',
      '[safe](https://example.com/reference)',
      '',
      '![remote diagram](https://example.com/diagram.png)',
      '',
    ].join('\n'),
  });

  assertSuccessful(runBuild(root));
  const data = embeddedData(readPortal(root));
  assert.equal(data.meta.schemaVersion, 1);
  assert.equal(data.docs.length, 1);
  const rendered = data.docs[0].html;

  assert.match(rendered, /<table>/u);
  assert.match(rendered, /<pre><code class="language-js">/u);
  assert.match(rendered, /&lt;img src=x onerror=&quot;globalThis\.compromised=true&quot;&gt;/u);
  assert.doesNotMatch(rendered, /<img\b[^>]*onerror/iu);
  assert.doesNotMatch(rendered, /<img\b/iu);
  assert.doesNotMatch(rendered, /href="javascript:/iu);
  assert.match(rendered, /href="https:\/\/example\.com\/reference"/u);
  assert.match(rendered, /class="doc-image-reference"/u);
  assert.match(rendered, /<code>https:\/\/example\.com\/diagram\.png<\/code>/u);
});

test('creates unique heading IDs, deep links, and rewritten cross-document links', (t) => {
  const root = makeFixture(t, {
    'docs/main.md': [
      '# خانه',
      '',
      '[فایل هدف](nested/هدف.md)',
      '',
      '[بخش هدف](nested/هدف.md#تکراری)',
      '',
    ].join('\n'),
    'docs/nested/هدف.md': [
      '# هدف',
      '',
      '## تکراری',
      '',
      'اولین بخش.',
      '',
      '## تکراری',
      '',
      'دومین بخش.',
      '',
      '[بازگشت](../main.md#خانه)',
      '',
    ].join('\n'),
  });

  assertSuccessful(runBuild(root));
  const data = embeddedData(readPortal(root));
  const mainDocument = data.docs.find((document) => document.sourceHref === 'main.md');
  const targetDocument = data.docs.find((document) => document.sourceHref === 'nested/هدف.md');
  assert.ok(mainDocument);
  assert.ok(targetDocument);

  const duplicateHeadingIds = targetDocument.headings
    .filter((heading) => heading.level === 2 && heading.text === 'تکراری')
    .map((heading) => heading.id);

  assert.equal(duplicateHeadingIds.length, 2, 'both duplicate headings must be addressable');
  assert.notEqual(duplicateHeadingIds[0], duplicateHeadingIds[1], 'duplicate headings need unique IDs');
  assert.match(targetDocument.html, new RegExp(`id="${duplicateHeadingIds[0]}"`, 'u'));
  assert.match(targetDocument.html, new RegExp(`id="${duplicateHeadingIds[1]}"`, 'u'));

  const documentLink = mainDocument.html.match(/<a\b[^>]*href="#doc\/([^/"#]+)"[^>]*>فایل هدف<\/a>/u);
  const deepLink = mainDocument.html.match(/<a\b[^>]*href="#doc\/([^/"#]+)\/([^"]+)"[^>]*>بخش هدف<\/a>/u);
  const returnLink = targetDocument.html.match(/<a\b[^>]*href="#doc\/([^/"#]+)\/([^"]+)"[^>]*>بازگشت<\/a>/u);

  assert.ok(documentLink, 'relative .md link must be rewritten to a document route');
  assert.ok(deepLink, 'relative .md fragment link must be rewritten to a deep route');
  assert.ok(returnLink, 'parent-relative .md fragment link must be rewritten');
  assert.equal(deepLink[1], documentLink[1], 'document and deep links must target the same document ID');
  assert.equal(documentLink[1], targetDocument.id);
  assert.equal(deepLink[2], duplicateHeadingIds[0], 'a source fragment targets the first matching heading');
  assert.equal(returnLink[1], mainDocument.id);
  assert.equal(returnLink[2], mainDocument.headings[0].id);
  assert.doesNotMatch(`${mainDocument.html}\n${targetDocument.html}`, /href="[^"]*\.md(?:#|")/iu);
});

test('--check detects missing, stale, and newly added documentation without writing', (t) => {
  const root = makeFixture(t, {
    'docs/one.md': '# One\n\nInitial content.\n',
  });
  const outputPath = path.join(root, 'docs', 'index.html');

  const missing = runBuild(root, '--check');
  assert.equal(missing.status, 1);
  assert.match(`${missing.stdout}\n${missing.stderr}`, /Documentation portal is stale/u);
  assert.equal(fs.existsSync(outputPath), false, '--check must not create a missing output');

  assertSuccessful(runBuild(root));
  const fresh = runBuild(root, '--check');
  assertSuccessful(fresh);
  assert.match(fresh.stdout, /Documentation portal is up to date\./u);

  fs.appendFileSync(path.join(root, 'docs', 'one.md'), '\nChanged.\n', 'utf8');
  const stale = runBuild(root, '--check');
  assert.equal(stale.status, 1);
  assert.match(`${stale.stdout}\n${stale.stderr}`, /Documentation portal is stale/u);

  assertSuccessful(runBuild(root));
  fs.mkdirSync(path.join(root, 'docs', 'nested'));
  fs.writeFileSync(path.join(root, 'docs', 'nested', 'new.md'), '# Newly discovered\n', 'utf8');
  const newDocument = runBuild(root, '--check');
  assert.equal(newDocument.status, 1, 'a newly added Markdown document must make the snapshot stale');

  fs.rmSync(outputPath);
  const missingAgain = runBuild(root, '--check');
  assert.equal(missingAgain.status, 1);
  assert.equal(fs.existsSync(outputPath), false, '--check must remain read-only');
});

test('generated output is a self-contained offline HTML document', (t) => {
  const root = makeFixture(t, {
    'docs/offline.md': '# Offline\n\nEverything needed to read this is embedded.\n',
  });

  assertSuccessful(runBuild(root));
  const portal = readPortal(root);

  assert.match(portal, /<!doctype html>/iu);
  assert.match(portal, /<style\b[^>]*>[\s\S]+<\/style>/iu);
  assert.match(portal, /<script\b[^>]*>[\s\S]+<\/script>/iu);
  assert.doesNotMatch(portal, /__DOCS_DATA__/u);
  assert.doesNotMatch(portal, /<script\b[^>]*\bsrc\s*=/iu);
  assert.doesNotMatch(portal, /<link\b[^>]*\brel=["']?stylesheet/iu);
  assert.doesNotMatch(portal, /<(?:img|iframe)\b[^>]*\bsrc\s*=\s*["']?https?:/iu);
  assert.doesNotMatch(portal, /@import\s+(?:url\()?\s*["']?https?:/iu);
  assert.doesNotMatch(portal, /\b(?:fetch|XMLHttpRequest)\s*\(/u);
  assert.doesNotMatch(portal, /<script\b[^>]*\btype=["']module["']/iu);
  const data = embeddedData(portal);
  assert.equal(data.docs.length, 1);
  assert.equal(data.docs[0].sourceHref, 'offline.md');
});

test('labels the execution plan as canonical and known legacy snapshots explicitly', (t) => {
  const root = makeFixture(t, {
    'docs/EXECUTION_PLAN.md': '# برنامه اجرا\n\nسند زنده پروژه.\n',
    'docs/methodology.md': '# روش آموزش\n\nتصمیم‌های نسخه قدیمی.\n',
    'docs/new-supporting-note.md': '# یادداشت تازه\n\nسند جدید پروژه.\n',
  });

  assertSuccessful(runBuild(root));
  const documents = embeddedData(readPortal(root)).docs;
  const bySource = new Map(documents.map(document => [document.sourceHref, document]));

  assert.equal(bySource.get('EXECUTION_PLAN.md').lifecycle, 'canonical');
  assert.match(bySource.get('EXECUTION_PLAN.md').notice, /مرجع رسمی/u);
  assert.equal(bySource.get('methodology.md').lifecycle, 'legacy');
  assert.match(bySource.get('methodology.md').notice, /superseded/u);
  assert.equal(bySource.get('new-supporting-note.md').lifecycle, 'supporting');
});
