# ساختار تازه — UX structure plan

**Status:** decided, not implemented. Written for whoever edits `data/src/template.html` and `data/src/app.jsx` and then rebuilds.
**Written in English on purpose** — the reader is the implementer. Every string that ships to the learner is given in Persian, verbatim, ready to paste.

---

## The new structure, in one paragraph

The app becomes **one home screen and three sections**, reached from a **persistent labelled tab bar at the bottom of the screen** — four tabs, each with a Persian word under an icon, never an icon alone. The home tab is called **«امروز»** and shows exactly one thing above the fold: the single next thing to do, with one button. The three sections are **«واژه‌ها»** (everything about individual words: cards, quiz, word list, category drills, matching game), **«ساختار»** (everything about how English is assembled: sentence-building, grammar, common word-pairs), and **«شنیدن و گفتن»** (everything spoken: listening texts with shadowing, free discussion). Each section opens on a small hub that lists its two or three activities as labelled cards — never more than three choices on one screen. Below the hub sit the *runners* (a flashcard round, a quiz, a lesson, a listening text, a discussion session): runners hide the tab bar, fill the screen, and carry a single header line reading `section · activity · 4 / 12` plus one **«بستن»** button that returns exactly one level up. The A1→C2 level ladder, which four of the seven curricula already use internally, becomes the app's single visible spine: every section opens at the learner's current level and says so in the same words in the same place.

Seven parallel curricula become three groups of two or three. Nine unlabelled 32px icons become four labelled tabs. Eleven home-screen entry points become one button plus three cards.

---

## Before / after map — all 18 screens

`screen` values from `app.jsx`; template blocks are `<sc-if value="{{ isX }}">` at the given line in `data/src/template.html`.

| # | `screen` | template | Today | New location | Nav depth |
|---|---|---|---|---|---|
| 1 | `home` | 9620 | 11 entry points, one flat scroll | **«امروز»** tab — resume card + 3 section cards + today's numbers | tab 1 |
| 2 | `study` | 9741 | reached from home button | واژه‌ها › **کارت‌ها** (runner) | 3 |
| 3 | `quiz` | 9855 | auto-fires every 300 words | واژه‌ها › کارت‌ها › **آزمون دوره** (runner) | 3 |
| 4 | `result` | 9883 | after quiz | واژه‌ها › کارت‌ها › **نتیجه** (runner tail) | 3 |
| 5 | `browse` | 9972 | home button + header star icon | واژه‌ها › **فهرست واژه‌ها** | 2 |
| 6 | `add` | 9909 | header icon #1 + home button | واژه‌ها › فهرست واژه‌ها › **افزودن واژه** | 3 |
| 7 | `exercise` | 10043 | launched from `browse` category strip | واژه‌ها › فهرست واژه‌ها › **تمرین این دسته** (runner) | 3 |
| 8 | `game` | 10960 | header icon #8 + home card | واژه‌ها › **بازی جفت‌سازی** (runner) | 2 |
| 9 | `sent` | 10123 | header icon #2 + home card | ساختار › **جمله‌سازی** (hub) | 2 |
| 10 | `sbrun` | 10161 | — | ساختار › جمله‌سازی › runner | 3 |
| 11 | `gram` | 10438 | header icon #3 + home card | ساختار › **دستور زبان** (hub) | 2 |
| 12 | `glesson` | 10471 | — | ساختار › دستور زبان › **درس** | 3 |
| 13 | `colloc` | 10532 | header icon #7 + home card | ساختار › **ترکیب‌های رایج** (hub) | 2 |
| 14 | `csrun` | 10578 | — | ساختار › (دستور زبان \| ترکیب‌های رایج) › runner | 4 |
| 15 | `listen` | 10692 | header icon #6 + home card | شنیدن و گفتن › **شنیدن و بازگویی** (hub) | 2 |
| 16 | `ltext` | 10726 | — | شنیدن و گفتن › شنیدن و بازگویی › **متن** (runner) | 3 |
| 17 | `disc` | 10815 | header icon #5 + home card | شنیدن و گفتن › **گفت‌وگوی آزاد** (hub) | 2 |
| 18 | `dses` | 10862 | — | شنیدن و گفتن › گفت‌وگوی آزاد › **جلسه** (runner) | 3 |

Plus two **new** hub screens (`struct`, `skills`) and one **new** sheet (`prefs`). Nothing else is added; nothing is deleted.

Two things that are today navigation targets but not screens, and where they go:

- **ستاره‌دارها** (header icon #4, `goStars()` at `app.jsx:195`) is `browse` with `catFilter:'__star'`. It becomes a filter chip *inside* فهرست واژه‌ها, not a top-level destination. It is currently the only header icon that lands on a screen that looks identical to another header icon's destination — that alone is a large part of "نمی‌فهمم چی به چی".
- **پشتیبان‌گیری / بازیابی / پاک کردن پیشرفت** (template 9730–9737) leave the home scroll and become the **«تنظیمات»** sheet, opened from a gear in the top-right of «امروز» only.

### The three sections, and why these three

| Section | Persian | Contains | The sentence a learner can now say |
|---|---|---|---|
| 1 | **واژه‌ها** | `study` `quiz` `result` `browse` `add` `exercise` `game` | "اینجا کلمه یاد می‌گیرم." |
| 2 | **ساختار** | `sent` `sbrun` `gram` `glesson` `colloc` `csrun` | "اینجا یاد می‌گیرم کلمه‌ها را کنار هم بگذارم." |
| 3 | **شنیدن و گفتن** | `listen` `ltext` `disc` `dses` | "اینجا با زبان کار می‌کنم، نه با کاغذ." |

The cut is by **what the learner does**, not by what the data file is. Grammar and collocations and sentence-building are three answers to one question ("how do words combine?") and belong together; splitting them across three unrelated header icons is precisely why they read as seven unrelated apps. Listening and discussion are the only two activities that use the microphone and the speech synthesiser, which is a real and felt difference — they belong together and nowhere else.

---

## Naming — the rule, and the full table

**Rule: every label the learner reads is an ordinary Persian word. An English word written in Persian letters is used only when Persian has no ordinary equivalent — and that case does not arise anywhere in this app.** Applied uniformly, no exceptions. `لیسنینگ` and `جمله‌سازی` currently sit at the same level in the same nav; after this, they cannot.

| Where | Now | Becomes | File / anchor |
|---|---|---|---|
| header icon #6, home card | `لیسنینگ و شدوئینگ` | **شنیدن و بازگویی** | `template.html:9613`, `9680`; `listenCardDesc` in `app.jsx` |
| browse drill strip | `لیسنینگ` | **شنیدن** | `app.jsx:~615`, `names` map at `app.jsx:544` |
| browse drill strip | `اسپیکینگ` | **گفتن** | same `names` map |
| browse drill strip | `رایتینگ` | **نوشتن** | `app.jsx:620`, same `names` map |
| header icon #7, home card, hub title | `کالوکیشن` / `کالوکیشن‌ها` | **ترکیب‌های رایج** | `template.html:9614`, `9671`, `10532` block title |
| header icon #3, home card, hub title | `گرامر` / `دوره‌ی گرامر` | **دستور زبان** — hub title `دستور زبان — A1 تا C2` | `template.html:9610`, `9662`, `10438` block |
| study mode list | `فلش‌کارت` | **کارت واژه** | `MODES[0].name`, `app.jsx:4` |
| header icon #5, home card | `گفتگوی آزاد` | **گفت‌وگوی آزاد** (half-space, matches the rest of the app's typography) | `template.html:9612`, `9700` |
| game | `بازی لغات — جفت‌سازی` | **بازی جفت‌سازی** | `template.html:9709` |
| everywhere | `لغت` / `لغات` mixed with `واژه` | **واژه** everywhere in nav and headings; `لغت` may stay inside body copy | grep `لغت` in both files |

`جمله‌سازی`, `آزمون`, `دوره`, `تمرین` are already plain Persian and do not move.

**Also settled by the same rule:** the header today has an empty title slot (`template.html:9602–9605` — two blank `<div>`s). The app never says its own name on screen. «امروز» gets a title line: **لغتنامه** with the current level beside it.

---

## The default path

**First run** (no `vocab_app_v1`, or `data.pos === 0` and no other section touched). «امروز» shows *one* card and nothing else above the fold:

> **از اینجا شروع کن**
> «اول ۲۰ واژه‌ی سطح A1 را با کارت یاد می‌گیری. حدود ۷ دقیقه.»
> **[ شروع ]** ← single filled button, starts `study`

The three section cards and today's numbers sit **below** that card, visible only on scroll. A first-time learner is given one action, not eleven. This is the single most important decision in the plan: everything else on the home screen is demoted so that this card has no competition.

**Returning learner.** The same slot becomes a **resume** card, driven by a new `vocab_ui_v1.last` record — `{ screen, level, label, sub }` written on entry to any runner:

> **ادامه‌ی کار**
> «دستور زبان · سطح B1 · درس ۴ از ۹»
> **[ ادامه ]**   [ چیز دیگری ]

`[ ادامه ]` re-enters the exact runner. `[ چیز دیگری ]` scrolls to the three section cards. Today the returning learner gets the same undifferentiated wall as the first-time learner; this is why the app never feels like it remembers them, even though it does.

---

## Where you are — one strip, every screen

Every screen except «امروز» gets the same 28px line directly under the tab bar's absence / above the content:

```
[ ‹ بستن ]        واژه‌ها · کارت‌ها          ۴ / ۱۲
```

Right-aligned (RTL) trail on the right of centre, position counter on the left. Three rules, no exceptions:

1. **The trail is always exactly the path in the map above**, joined by ` · `. Max three parts.
2. **The position counter is the activity's own progress**, not the app's. Values already exist and are already computed: `exPos` (`app.jsx:552`), `posLabel` (`app.jsx:1910`), `quizPos`, `csPos`, `sbPos`. No new logic — they move into a shared strip.
3. **The button goes exactly one level up.** Today `exQuit` (`app.jsx:553`) jumps to `browse`, `gQuit` (`app.jsx:628`) jumps to `home`, `sbQuit` (`app.jsx:836`) to `sent`, `glBack` (`app.jsx:1282`) to `gram` — three different words (`خروج`, `بازگشت`, `بستن`) for three inconsistent destinations. After this change: one word, **بستن**, and the destination is the parent in the map. `gQuit` in particular must stop returning to `home` and return to واژه‌ها.

---

## Ordered changes

Ordered by confusion removed per unit of work. Each of the first five stands on its own; dependencies are stated where they exist.

---

### 1. Apply the naming rule

**What.** Replace the strings in the naming table above, everywhere they occur. They are literal strings in `template.html` (the `title=` attributes at 9608–9616 and the card headings at 9653–9712) and in `app.jsx` (`MODES` at line 4, the `names` map at line 544, the drill-strip labels around 615–621, the `*CardDesc` builders).

**Why.** Fixes "naming is mixed": four transliterations and three plain Persian names sit at the same level in the same navigation. A learner reading `لیسنینگ` next to `جمله‌سازی` cannot tell whether they are the same kind of thing. Nothing else in this plan needs to ship for this to help.

**Cost.** Trivial — about 30 string replacements, no structural change, no state change, no storage change.

**Depends on.** Nothing.

---

### 2. Replace the nine header icons with four labelled bottom tabs

**What.**

- **Delete** `template.html:9607–9617` — the entire `<div>` holding the nine 32×32 buttons.
- **Keep** `template.html:9599–9606` as a slim top bar; fill the empty title slot at 9602–9605 with `لغتنامه` and `{{ levelLabel }}` (already computed, `app.jsx:1901`), and add a gear button on the left opening the new تنظیمات sheet.
- **Add**, as the last child of the page wrapper (`template.html:9596`), a fixed bottom bar:

```html
<div style="position:fixed;inset-inline:0;bottom:0;z-index:20;display:{{ navDisplay }};
            background:#161826;border-top:1px solid rgba(233,233,237,.09);
            padding:6px 8px calc(6px + env(safe-area-inset-bottom))">
  <div style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
    <sc-for list="{{ navTabs }}" as="t" hint-placeholder-count="4">
      <button class="vbtn" sc-camel-on-click="{{ t.go }}" style="{{ t.style }}">
        <i class="{{ t.icon }}" style="font-size:19px"></i>
        <span style="font-size:11px">{{ t.label }}</span>
      </button>
    </sc-for>
  </div>
</div>
```

Each tab is at least 56px tall and a quarter of the width — a real touch target, unlike the current 32px squares. Add `padding-bottom:76px` to the content wrapper at `template.html:9597` so the bar never covers content.

The four tabs:

| icon | label | target |
|---|---|---|
| `ph-house` | **امروز** | `screen:'home'` |
| `ph-cards` | **واژه‌ها** | `screen:'words'` (new hub, see change 3) |
| `ph-brackets-curly` | **ساختار** | `screen:'struct'` (new hub) |
| `ph-headphones` | **شنیدن و گفتن** | `screen:'skills'` (new hub) |

- **Add** to the vals object (`app.jsx:1894`, alongside the existing `isHome`/`isStudy` line): `navTabs` (four objects with `label`, `icon`, `go`, and a `style` string that differs only in colour — active `#b3a9e6` on `rgba(145,132,217,.12)`, inactive `rgba(233,233,237,.5)` on transparent), and `navDisplay`, which is `'block'` on `home`/`words`/`struct`/`skills`/`browse`/`sent`/`gram`/`colloc`/`listen`/`disc` and `'none'` on the ten runner screens (`study` `quiz` `result` `add` `exercise` `game` `sbrun` `glesson` `csrun` `ltext` `dses`).

**Why.** This is the single largest source of the complaint. Nine icon-only buttons whose only labels are `title=` tooltips are, on the phone this app is used on, nine unlabelled squares — the tooltip does not exist on touch. Four labelled tabs also give the app a *shape*: the learner can now see that there are three places to be, and always which one they are in.

**Cost.** Moderate. One markup block deleted, one added, roughly 40 lines of new vals. No change to any existing screen's body.

**Depends on.** Change 3 for the three hub screens the tabs point at. Ship them together, or ship this first with `واژه‌ها`→`browse`, `ساختار`→`sent`, `شنیدن و گفتن`→`listen` as a stopgap — the tab bar is worth having even before the hubs exist.

---

### 3. Add three section hubs, and strip «امروز» down to one action

**What.** Three new `<sc-if>` blocks and three new `screen` values. Each hub is the same 40 lines of markup with different data — build one and repeat it, do not hand-style three:

```
title line:  واژه‌ها          (+ level chip: سطح B1)
2–3 cards:   icon · name · one line of Persian · progress · [ ورود ]
```

| hub `screen` | title | cards |
|---|---|---|
| `words` | **واژه‌ها** | کارت‌ها (`startStudy`) · فهرست واژه‌ها (`goBrowse`) · بازی جفت‌سازی (`goGame`) |
| `struct` | **ساختار** | جمله‌سازی (`goSent`) · دستور زبان (`goGramHome`) · ترکیب‌های رایج (`goCollocHome`) |
| `skills` | **شنیدن و گفتن** | شنیدن و بازگویی (`goListen`) · گفت‌وگوی آزاد (`goDisc`) |

Every `go*` handler already exists (`app.jsx:1895–1897`, `2024`, `2061`, and the `goSent`/`goGram`/`goColloc`/`goListen`/`goDisc` methods). The hub cards are **the existing home cards, moved** — `template.html:9650–9713` is seven cards that already have exactly the icon/title/description/button shape needed. Cut each one from home and paste it into its hub. This is copy work, not design work.

Then **«امروز»** (`template.html:9620–9739`) keeps only:

1. the شروع / ادامه card (change 5 fills it; until then, the existing resume card at 9623–9637 with its *second and third* buttons — `فهرست لغات`, `افزودن لغت` — removed, leaving one button),
2. the two stat tiles (`todayCount`, `accuracy`, 9638–9647),
3. three compact section cards linking to the three hubs,
4. the روش‌های یادگیری list (9716–9728) — **collapsed**, behind a `روش‌ها را ببین` disclosure. It explains the five-mode rotation, which is genuinely useful and genuinely not a first-screen concern.

The backup/reset row (9730–9737) moves to the تنظیمات sheet. `افزودن واژه` becomes a button at the top of فهرست واژه‌ها, where a learner is already looking at words.

**Why.** Fixes "the home screen has 11 entry points with no indication of which one a beginner should press" and "seven parallel curricula with no stated relationship". After this, the relationship is stated structurally: three groups, named, on three screens, in the order a learner meets them.

**Cost.** Moderate. Three new template blocks (mostly relocated markup), three `is*` booleans and three `go*` handlers in the vals object, one home block trimmed.

**Depends on.** Change 2 (nothing navigates to the hubs without tabs). Change 1 should land first so the cards are only written once.

---

### 4. One location strip and one back rule on all 17 non-home screens

**What.** Insert the strip described in *Where you are* above at the top of each of the 17 `<sc-if>` blocks. One shared markup snippet, three values per screen: `crumb` (string), `pos` (string, `''` when the screen has no position), `up` (handler).

Populate them in the vals object next to each screen's existing values — e.g. in `exVals()` set `crumb: 'واژه‌ها · فهرست واژه‌ها · تمرین این دسته'` and reuse `exPos` (`app.jsx:552`); in `csVals` set `crumb: 'ساختار · ' + (cs.kind === 'gram' ? 'دستور زبان' : 'ترکیب‌های رایج') + ' · ' + cs.title`.

Then normalise the exits. Today: `خروج` at `template.html:10052` and `10161`-block, `بازگشت` at `10471`- and `10692`- and `10815`-blocks, `بستن` nowhere. After: the strip's button is always **بستن**, and every handler goes one level up per the map — notably `gQuit` (`app.jsx:628`) changes from `screen:'home'` to `screen:'words'`, and `exQuit` (`app.jsx:553`) keeps `browse` but must preserve `catFilter`.

**Why.** Fixes "no hierarchy, no breadcrumb, nothing tells you where you are", and fixes the fact that the same gesture currently lands in four different places depending on which of the seven curricula you are inside — which is how a learner ends up back at home not knowing how they got there.

**Cost.** Moderate. Seventeen small insertions, all identical in shape; the values are almost all already computed.

**Depends on.** Changes 2 and 3 for the trail text to be true. The back-rule normalisation half can ship independently and is worth doing alone.

---

### 5. Cross-section resume, and the first-run card

**What.** New storage key **`vocab_ui_v1`**, additive — no existing key is renamed, re-scoped, or read differently, so **no migration is needed and no progress is at risk**. Shape:

```json
{ "last": { "screen": "glesson", "level": "B1", "label": "دستور زبان", "sub": "درس ۴ از ۹", "at": 1754... },
  "seen": true }
```

Write it in one place — a `remember(screen, label, sub)` helper called from `startStudy`, `startEx`, `startGame`, `sbStart`, `csStart`, `openGramLesson`, `openText`, `openDisc`. Read it once in the constructor (`app.jsx:47`) alongside the other seven `JSON.parse(localStorage.getItem(...))` calls.

«امروز»'s top card then renders in one of two states — `از اینجا شروع کن` when `!seen`, `ادامه‌ی کار` with the stored label when set. `[ ادامه ]` calls the matching `go*` handler with the stored level.

**Two things that must not be forgotten:**

- Add `'vocab_ui_v1'` to the export key list at **`app.jsx:1925`** (`const keys = [...]`), or backups silently lose it.
- The import handler at `app.jsx:1942` already accepts any `vocab_`-prefixed key, so restore works with no change.

**Why.** Fixes the default-path question for the returning learner. The app already stores per-section progress in six separate keys and can therefore already answer "where was I?" — it just never asks. This is the cheapest possible way to make a seven-curriculum app feel like one course.

**Cost.** Moderate — one helper, eight call sites, one new key, one card with two states.

**Depends on.** Change 3 (the card has to have somewhere uncrowded to live).

---

### 6. Make the level ladder the shared spine

**What.** Four sections already key their content by `A1…C2` and already default to the learner's vocabulary level: `goSent` (`app.jsx:643`), `goGram` (`1047`), `goListen` (`1388`), `goDisc` (`1570`) all fall back to `this.levelOf(this.load().round)`. This is a real shared axis that is completely invisible in the UI. Surface it:

- The `levelChips` row (`app.jsx:1903–1908`, rendered at `template.html:9626`) becomes a shared component rendered identically at the top of all three hubs and «امروز».
- Every hub card shows `سطح B1` in the same place with the same chip style.
- ترکیب‌های رایج (`colloc`) is the one section with no level axis — it is keyed by verb (`make`/`do`/`take`). Do **not** invent levels for it; label its hub card `بر پایه‌ی فعل، نه سطح` so the exception is stated rather than felt as an inconsistency.

**Why.** Answers "are these seven things a sequence, alternatives, or extras?" with: they are five parallel tracks through one shared level ladder, plus one that is organised differently and says so.

**Cost.** Moderate. One extracted chip renderer, four render sites.

**Depends on.** Change 3.

---

### 7. Twelve CSS classes to stop the inline-style drift

**What.** The bundle has 738 inline `style=` attributes and 2 classes (`.vbtn`, `.vcard`, plus `.vrow`) in the `<style>` block at `template.html:9580–9593`. Do **not** attempt a restyle. Add exactly twelve classes to that block, named for what they are — `.vcard-sec`, `.vhub`, `.vcrumb`, `.vnav`, `.vnav-on`, `.vbtn-primary`, `.vbtn-ghost`, `.vchip`, `.vchip-on`, `.vstat`, `.vrunner-head`, `.vsheet` — and use them **only in markup this plan adds**. Existing inline styles stay exactly where they are.

**Why.** "There is no design system, so nothing enforces visual consistency between screens." Twelve classes will not fix 738 inline styles, but they guarantee that the tab bar, the three hubs, the location strip and the resume card — the parts a learner sees on *every* screen — are identical to each other, which is where consistency is actually noticed. Retrofitting old screens can happen later, one screen per sitting, or never.

**Cost.** Moderate to write, and it *reduces* the cost of changes 2–6 if it ships first.

**Depends on.** Nothing. Best sequenced immediately before change 2.

---

## What I deliberately did not change

- **No curriculum removed, no drill mode removed, no feature made unreachable.** Every one of the 18 screens survives, reachable in at most three taps from any other. The complaint was legibility, not volume.
- **No storage key renamed, re-scoped, or restructured.** `vocab_app_v1`, `vocab_course`, `vocab_sent`, `vocab_listen`, `vocab_disc`, `vocab_game`, `vocab_custom`, `vocab_overrides`, `vocab_mysent`, `vocab_mycats`, `vocab_catover`, `vocab_famap`, `vocab_sentences` are all untouched. Only `vocab_ui_v1` is added. **No migration is required by this plan.** If a later change needs one, that plan owes you a migration and this one does not.
- **No visual redesign.** No new palette, no type scale, no spacing system, no touching of the 738 inline styles that already exist. The colours in this plan (`#9184d9`, `#b3a9e6`, `#8fd9c1`, `#e0a458`, `#84c5d9`, `#e0879e`) are the ones the app already uses. Every change here is structural, because structure is what is broken and because restyling 738 attributes buys nothing per unit of edit.
- **No change to any runner's interior.** `study`, `sbrun`, `csrun`, `ltext`, `dses`, `exercise`, `game` keep their bodies exactly as they are. Only their frame changes — a header strip and a consistent exit. Reviewing the inside of each runner is `ux-feature`'s job, one section at a time, and those reports should assume this model.
- **No keyboard shortcuts reintroduced.** The README records why global `preventDefault()` shortcuts were removed. This plan is touch-first and assumes no keyboard at all; nothing in it needs one.
- **The five-mode rotation is not simplified.** `MODES` (flashcard → four-choice → typed → audio → in-sentence, rotating each round) is genuinely clever and is one of the few things the app already explains well. It is collapsed on the home screen, not cut, and its explanation moves into واژه‌ها › کارت‌ها where it is relevant.
- **Grammar and collocations stay two separate hub entries**, even though they share `csrun` and `vocab_course`. They share an engine; they do not share a subject, and merging them would trade one kind of confusion for another.

### One thing I would argue for separately

There are now **three** matching-style games — the standalone `game` screen, `بازی این دسته` inside the browse drill strip, and the `mode:'game'` branch of `csrun` used by both grammar and collocations. They are the same interaction with three entry points and three separate high scores (`vocab_game.best`, `vocab_course.b[key]`). I have kept all three, because deleting features is out of scope and because they are genuinely scoped to different content. But if the owner ever wants to cut something, this is the one place where the app is repeating itself rather than covering more ground — and consolidating them into one game that takes a content scope would remove a real duplication rather than a real feature. That is a separate decision, and it is not baked into anything above.
