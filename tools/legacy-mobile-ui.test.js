const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'data', 'src', 'template.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'data', 'src', 'app.jsx'), 'utf8');

test('lesson browser exposes compact progress and row hierarchy', () => {
  for (const className of ['lesson-browser', 'lesson-resume-dock', 'lesson-unit', 'lesson-row', 'lesson-review-icon']) {
    assert.match(template, new RegExp(`class="[^"]*${className}`));
  }
  assert.doesNotMatch(template, /lesson-hero|lesson-continue|lesson-start/);
  assert.match(app, /lbProgressLabel = completedLessons/);
  assert.match(app, /lbProgressBarStyle =/);
});

test('lesson units start collapsed, avoid repeated lock copy, and mark the current unit', () => {
  assert.match(app, /go: \(\) => this\.setState\(\{ screen: 'lessons', lbUnit: 0 \}\)/);
  assert.match(app, /const openUnit = s\.lbUnit \|\| 0/);
  assert.match(app, /current: isCurrentUnit/);
  assert.match(template, /class="lesson-current-badge"[\s\S]*?>بخش فعلی</);
  assert.doesNotMatch(template, /\{\{ lbIntro \}\}|\{\{ u\.lockedHint \}\}|با تمام‌شدن درس قبلی باز می‌شود/);
  assert.doesNotMatch(app, /out\.lbIntro =|lockedHint:/);
});

test('study actions are fixed above the mobile safe area and do not cover content', () => {
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.study-screen\{padding-bottom:74px\}/);
  assert.match(template, /\.study-action-dock\{position:fixed;[\s\S]*?bottom:0;[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(template, /<sc-if value="\{\{ hasActions \}\}"[\s\S]*?<div class="study-action-dock">/);
  assert.match(app, /hasActions: actions\.length > 0, actions/);
});

test('mobile controls preserve touch target sizing and compact lesson details', () => {
  assert.match(template, /\.study-action-dock>\.vbtn\{[\s\S]*?min-height:54px!important/);
  assert.match(template, /\.lesson-row\{[\s\S]*?min-height:58px/);
  assert.match(template, /\.lesson-word-list\{display:none\}/);
});

test('lesson page hides global navigation and uses one fixed resume dock', () => {
  assert.match(app, /const RUNNERS = \['lessons', 'study'/);
  assert.match(template, /\.lesson-resume-dock\{position:fixed;[\s\S]*?bottom:12px;[\s\S]*?width:min\(680px,calc\(100vw - 24px\)\)/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.lesson-resume-dock\{[\s\S]*?bottom:0;[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(template, /<button class="vbtn lesson-row \{\{ les\.rowClass \}\}"[\s\S]*?sc-camel-on-click="\{\{ les\.start \}\}"/);
  assert.match(app, /showReviewIcon: complete/);
  assert.doesNotMatch(app, /btnLabel: complete \? 'مرور دوباره' : 'شروع تمرین'|canStart: unlocked/);
});

test('word tools reuse the card art instead of consuming prompt space', () => {
  const artStart = template.indexOf('<div class="study-card-art"');
  const bodyStart = template.indexOf('<div class="study-card-body"', artStart);
  const artMarkup = template.slice(artStart, bodyStart);
  assert.match(artMarkup, /class="study-tools"/);
  assert.equal((artMarkup.match(/class="vbtn study-tool/g) || []).length, 3);
  assert.equal((artMarkup.match(/aria-label=/g) || []).length, 4);
  assert.match(template, /\.study-tools\{position:absolute;[\s\S]*?top:11px;left:12px/);
  assert.match(template, /\.study-tool\{[\s\S]*?width:44px;height:44px;min-width:44px!important/);
  assert.doesNotMatch(template.slice(bodyStart, template.indexOf('<sc-if value="{{ hasOptions }}"', bodyStart)), /class="study-tools"/);
  assert.match(app, /cardStarClass:[\s\S]*?'study-tool-starred'/);
  assert.match(app, /cardStarTitle:/);
});

test('study starts with the word card and omits the redundant progress panel', () => {
  assert.doesNotMatch(template, /study-progress-card/);
  assert.doesNotMatch(template, /\{\{ levelWordProgress \}\}|\{\{ levelPctLabel \}\}|\{\{ wordStageLabel \}\}/);
  assert.match(template, /<div class="study-screen">\s*<div class="sr-only" role="status"[\s\S]*?<div class="vcard study-card"/);
  assert.doesNotMatch(app, /levelWordProgress:|levelPctLabel:|wordStageLabel:/);
});

test('assessed modes avoid a duplicate answer panel and reveal synonyms in place', () => {
  assert.match(app, /showFlashAnswer: answered && mode === 'flash'/);
  assert.doesNotMatch(app, /showAnswer:/);
  assert.doesNotMatch(template, /class="study-answer"/);
  assert.doesNotMatch(template, /\.study-answer\{/);
  assert.match(template, /<sc-if value="\{\{ showFlashAnswer \}\}"[\s\S]*?class="study-inline-answer">\{\{ card\.fa \}\}/);
  assert.match(app, /hasSyn: !!\(w\.syn && w\.syn\.length\)/);
  assert.match(app, /synSlotClass: answered \? 'is-revealed' : 'is-concealed'/);
  assert.match(app, /synAriaHidden: answered \? 'false' : 'true'/);
  assert.match(template, /\.study-syn-slot\.is-concealed\{filter:blur\(5px\);opacity:\.28;user-select:none;pointer-events:none\}/);
  const promptStart = template.indexOf('<div class="study-prompt">');
  const optionsStart = template.indexOf('<sc-if value="{{ hasOptions }}"', promptStart);
  const promptMarkup = template.slice(promptStart, optionsStart);
  assert.match(promptMarkup, /\{\{ promptText \}\}[\s\S]*?class="study-syn-slot \{\{ synSlotClass \}\}"[\s\S]*?\{\{ promptHint \}\}/);
  assert.equal((template.match(/<sc-if value="\{\{ hasSyn \}\}"/g) || []).length, 1);
});

test('mobile study hierarchy stays compact, legible, and collision-free', () => {
  for (const className of ['app-header', 'study-card-chip', 'study-prompt-word', 'study-prompt-hint', 'study-input', 'study-example', 'study-compose-toggle']) {
    assert.match(template, new RegExp(`class="[^"]*${className}`));
  }
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.app-header\{padding-bottom:9px!important;margin-bottom:9px!important\}/);
  assert.match(template, /\.study-card-icon,\.study-card-meta\{display:none!important\}/);
  assert.match(template, /\.study-prompt-word\{overflow-wrap:anywhere\}/);
  assert.match(template, /\.study-prompt-word\{font-size:clamp\(27px,9vw,38px\)!important;line-height:1\.18!important/);
  assert.match(template, /\.study-example-fa\{[\s\S]*?color:rgba\(233,233,237,\.68\)/);
  assert.match(template, /\.study-compose-toggle\{width:100%;min-height:44px!important;justify-content:center!important/);
  assert.match(template, /@media \(max-width:360px\)\{[\s\S]*?\.study-card-chip span\{display:none\}/);
});

test('desktop study uses a denser two-column layout while mobile remains separate', () => {
  assert.match(template, /@media \(min-width:521px\)\{[\s\S]*?\.study-screen\{max-width:780px\}/);
  assert.match(template, /@media \(min-width:521px\)\{[\s\S]*?\.study-options\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(template, /class="study-example-content"[\s\S]*?class="study-example-en"[\s\S]*?class="study-example-fa"/);
  assert.match(template, /\.study-example-content\{direction:ltr;grid-template-columns:minmax\(0,1\.15fr\) minmax\(0,\.85fr\)/);
  assert.match(template, /\.study-action-dock>\.vbtn\{min-width:160px;min-height:54px!important/);
  assert.match(template, /\.study-compose-block\{display:grid;justify-items:start/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.study-options\{gap:8px;margin-bottom:12px\}/);
});

test('all level selectors share one compact segmented tab design', () => {
  assert.equal((template.match(/class="level-tabs"/g) || []).length, 6);
  assert.equal((template.match(/class="vbtn level-tab \{\{ [lc]\.tabClass \}\}"/g) || []).length, 6);
  assert.ok((app.match(/tabClass:/g) || []).length >= 6);
  assert.match(template, /\.level-tabs\{display:flex;gap:2px;[\s\S]*?scrollbar-width:none;[\s\S]*?border-radius:12px/);
  assert.match(template, /\.level-tabs::-webkit-scrollbar\{display:none\}/);
  assert.match(template, /\.level-tabs>\.level-tab\.is-active\{[\s\S]*?background:rgba\(145,132,217,\.17\)!important/);
  assert.match(template, /\.level-tabs>\.level-tab\.is-locked\{opacity:\.32!important;cursor:not-allowed!important\}/);
  assert.match(template, /\.level-tabs>\.level-tab:focus-visible\{outline:2px solid #84c5d9!important/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.level-tabs>\.level-tab\{min-height:36px!important/);
});

test('mobile dictionary uses compact tools and clear expandable word rows', () => {
  for (const className of ['dictionary-screen', 'dict-search-input', 'dict-word-list', 'dict-word-row', 'dict-word-actions', 'dict-result-summary']) {
    assert.match(template, new RegExp(`class="[^"]*${className}`));
  }
  assert.match(template, /\.dict-cats\{[\s\S]*?scrollbar-width:thin;[\s\S]*?scroll-snap-type:inline proximity/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.dict-cats\{[^}]*scrollbar-width:none/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.dict-action-button\{min-height:42px!important/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.dict-search-row\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(template, /\.dict-translate-button\{display:none!important\}/);
  assert.match(template, /\.dict-quick\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(template, /\.dict-learned-action\{display:none\}/);
  assert.match(template, /class="dict-state-filters"[\s\S]*?\{\{ clearBrowseFilter \}\}[\s\S]*?\{\{ goLearned \}\}/);
  assert.match(template, /\.dict-cats-mobile \.dict-cats>\.vbtn:first-child\{display:none\}/);
  assert.match(template, /aria-expanded="\{\{ dictToolsOpen \}\}"/);
  assert.match(app, /queryKey: e => \{ if \(e\.key === 'Enter'\) this\.translateDictionaryQuery\(\); \}/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.dict-word-action\{width:36px!important;height:36px!important/);
  assert.match(app, /rowClass: s\.wordMoreEn === x\.en \? 'is-open' : ''/);
  assert.match(app, /moreIcon: s\.wordMoreEn === x\.en \? 'ph ph-caret-up' : 'ph ph-dots-three'/);
  assert.match(app, /browseCount: filtered\.length \+ ' واژه'/);
  const detailsStart = template.indexOf('<div class="dict-word-details">');
  const detailsEnd = template.indexOf('<div class="dict-more-actions">', detailsStart);
  assert.doesNotMatch(template.slice(detailsStart, detailsEnd), /\{\{ w\.fa \}\}/);
});

test('collocations hub has responsive group navigation, drills, and phrase rows', () => {
  for (const className of ['colloc-screen', 'colloc-hero', 'colloc-groups', 'colloc-group-tab', 'colloc-drills', 'colloc-drill', 'colloc-items', 'colloc-item']) {
    assert.match(template, new RegExp(`class="[^"]*${className}`));
  }
  assert.match(template, /\.colloc-groups\{display:flex;[\s\S]*?overflow-x:auto;[\s\S]*?scroll-snap-type:inline proximity/);
  assert.match(template, /\.colloc-drills\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(template, /\.colloc-items\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.colloc-drills\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(template, /@media \(max-width:520px\)\{[\s\S]*?\.colloc-items\{grid-template-columns:1fr/);
  assert.match(template, /sc-camel-on-click="\{\{ cgNextGo \}\}"/);
  assert.match(template, /class="colloc-drill-score">بهترین \{\{ d\.score \}\}/);
  assert.match(template, /aria-label="پخش تلفظ \{\{ w\.en \}\}"/);
  assert.match(app, /tabClass: g\.key === x\.key \? 'is-active' : ''/);
  assert.match(app, /out\.cgItems = g\.items\.map\(\(it, i\) => \(\{ n: String\(i \+ 1\)/);
  assert.match(app, /out\.cgNextGo = \(\) => nextGroup && this\.setState\(\{ cgKey: nextGroup\.key \}\)/);
  assert.match(app, /hasScore: pc != null, score: pc != null \? pc \+ '٪' : ''/);
});
