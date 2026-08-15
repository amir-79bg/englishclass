# ترکیب‌های رایج — collocations UX review

**Scope:** screen `colloc` (`template.html:10532–10576`), the drill runner `csrun` (`template.html:10578–10689`), and the builders `cGroups` / `cGroup` / `cVerbDrill` / `cMeaningDrill` / `cProduceDrill` / `cGame` plus the `isColloc` / `isCsRun` branches of `courseVals` (`app.jsx:1172–1222`, `1284–1377`).
**Data:** `window.COLLOC2` — asset `456306af-9ddf-4578-8ecd-ae8659b7d079`, **22 groups, 349 phrases**. Item shape is exactly `{ en, fa }`. Group shape is `{ key, label, use, items }`; **all 22 groups have a non-empty `use`**.

**Status:** proposals only. Written against `docs/ux-structure-plan.md`, in which this section becomes **ساختار › ترکیب‌های رایج**, keeps `csrun` as its runner, and is explicitly *not* given a level ladder (plan, change 6: label it `بر پایه‌ی فعل، نه سطح`). Nothing below contradicts that.

**`csrun` is shared with grammar.** Where a finding is in shared code I say so and scope the fix to `cs.kind === 'colloc'` so the grammar reviewer's proposals and mine cannot collide. Findings 1, 4, 6 and 8 touch shared code; all four are gated on `kind`.

---

## Headline

The section is not badly *presented* — the hub actually does several things right that other sections don't: it says what a collocation is in plain Persian (`template.html:10544`), and **it already renders `g.use`** (`template.html:10550–10552`), so the brief's suspicion that `use` is never shown is wrong on the hub. The problems are elsewhere, and two of them are severe:

1. **The hardest drill gives away its own answer.** `cProduceDrill` sets `fa: it.en`, and `csHint` renders `'راهنما: ' + it.fa`. «از فارسی بساز — سخت‌ترین تمرین» prints the exact English answer on screen before the learner types. It is impossible to fail. One-word fix.
2. **The flagship drill almost never asks the question it is named after.** «کدام فعل درست است؟» draws its three distractors from a 132-word bank of *every first word in every other group*. For the `make` group, **81 % of questions have no other core verb among the four options** — the learner picks `make` out of `make / bitterly / I'm / long`. The one comparison the whole section exists to teach (make vs do vs take vs have) is the one it hardly ever presents.

Both are logic, not content. So is most of the rest of this list.

---

## Ranked findings

Ordered by confusion removed per unit of work. **Findings 1–5 need no new content at all** — every string or field they render already exists in the data or in a sibling code path.

---

### 1. 🔴 GOLD — «از فارسی بساز» prints the answer as its own hint

**Now.** The learner taps the drill labelled `سخت‌ترین تمرین — کل عبارت را بنویس`, sees the Persian prompt `تصمیم گرفتن`, and directly under it, in the hint line, `راهنما: make a decision`. They copy it into the box. Ten items later they score 100 % and are told `خیلی خوب — این درس جا افتاده`. The one drill that trains production trains nothing, and the learner has no way to know the score is meaningless.

**Cause.** `app.jsx:1205`:

```js
const items = shuffled(g.items, ...).slice(0, 8).map(it => ({ q: this.cFa(it.fa), a: it.en, fa: it.en }));
```

`fa` is the runner's hint channel (`app.jsx:1323`: `hint = it.fa ? 'راهنما: ' + it.fa : '...'`), and it has been set to the answer. Compare `cVerbDrill`'s typing branch (`app.jsx:1182`), which correctly puts the *Persian* in `fa`.

**The change.** Drop `fa` from the produce item, and give the fill mode a colloc-appropriate default hint. In `app.jsx:1205`:

```js
.map(it => ({ q: this.cFa(it.fa), a: it.en, hintCount: it.en.split(' ').length }));
```

and in `courseVals` (`app.jsx:1323`), when `cs.kind === 'colloc'` and `it.fa` is absent, render `'کل عبارت را انگلیسی بنویس — ' + it.hintCount + ' کلمه'` instead of the generic `جای خالی را پر کن`. The word count is derived, not authored. If a graded hint is wanted, the first letter (`it.en[0]`) is equally free.

**Data.** Already there. No new content.
**Cost.** Trivial. One item-builder line, one `hint` branch. Shared code touched, gated on `kind`.

---

### 2. 🔴 GOLD — «کدام فعل درست است؟» offers non-verbs as distractors

**Now.** Question: `___ a decision   (تصمیم گرفتن)`. Options: `make · bitterly · I'm · long`. The learner picks `make` in half a second, having learned nothing, and does this ten times. Later they write *do a decision* in real life, because the app never once made them choose between `make` and `do`.

**Cause.** `app.jsx:1183–1184`:

```js
let bank = mine.filter(x => x !== f);
if (bank.length < 3) bank = bank.concat(others.filter(x => x !== f));
```

All nine verb groups contain exactly **one** distinct first word each (`make`→1, `do`→1, `take`→1, `have`→1, `get`→1, `go`→1, `come`→1, `keep`→1, `put_set`→2 — verified against the data). So `mine.filter(...)` is always empty for them and the bank is always `others` — 132 distinct first words drawn from the 13 function groups, of which only 9 are core verbs. P(a given distractor is a core verb) = 0.068; **P(all three distractors are non-verbs) = 0.81**.

**The change.** Give the verb groups a curated bank instead of the leftovers bank. One line in `cVerbDrill`, no data change:

```js
const CORE = ['make','do','take','have','get','go','come','keep','put','set'];
let bank = mine.filter(x => x !== f);
if (bank.length < 3) bank = CORE.filter(x => x !== f).concat(others.filter(x => x !== f && CORE.indexOf(x) < 0));
```

`bank` is sampled from the front by the existing `while` loop only if the loop is changed to prefer the head; simplest correct version is to take the first three CORE entries after a seeded shuffle and only fall back to `others` if fewer than three exist. Every one of the ten verbs is already a first word somewhere in `COLLOC2`, so the constant is a restatement of the data, not new content.

For the 13 function groups the current same-group bank is already right (they have 7–15 distinct first words each) and should keep working unchanged.

**Data.** Already there.
**Cost.** Trivial — one constant and two lines in `cVerbDrill` (`app.jsx:1183–1186`). This is the single highest-value change in the section.

---

### 3. 🔴 GOLD — the drill card is called «کدام فعل درست است؟» for 13 groups where the blank is not a verb

**Now.** The learner picks the group `نظر دادن`, taps `کدام فعل درست است؟`, and is shown `___ my opinion   (به نظر من)` with options `in · from · as · to`. None of them is a verb. In `سلام و گپ روزمره` the same card produces `___ are you doing (چطوری؟)` → `how`. The learner reasonably concludes they have misunderstood the button, or that the app is broken.

The label is hard-coded at `app.jsx:1295` regardless of group.

**The change.** Make the two labels depend on the group. The verb groups are exactly the first nine keys of `COLLOC2` (`make do take have get go come keep put_set`); the rest are phrase groups. In the `cgDrills` builder (`app.jsx:1294–1298`):

| key | verb groups (first 9) | function groups (other 13) |
|---|---|---|
| `_choose` | `کدام فعل درست است؟` / `انتخاب از بین گزینه‌ها` | **`کدام کلمه اول می‌آید؟`** / **`شروع درست عبارت را انتخاب کن`** |
| `_fill` | `تایپ کن` / `فعل درست را بنویس` | **`تایپ کن`** / **`کلمه‌ی اول عبارت را بنویس`** |

and the runner title at `app.jsx:1190` likewise (`'انتخاب درست · '` is already neutral and can stay).

**Data.** Already there — the split is `COLLOC2.indexOf(g) < 9`, or better, a nine-key constant so it survives data edits.
**Cost.** Trivial. Four strings and one boolean.

---

### 4. 🟠 GOLD — `use` is shown on the hub and then vanishes exactly when it is needed

**Now.** The hub does render the group's `use` (`template.html:10550–10552`) — `«روزمره و کاری — make یعنی به وجود آوردن چیزی که قبلاً نبوده»`. Good. But the moment the learner taps a drill, `csrun` replaces the whole screen and the only surviving context is `cs.title` (`app.jsx:1309`, `template.html:10588`). They are now choosing between `make` and `do` with the one sentence that distinguishes them no longer on screen. This is the *only* explanatory text the section owns, and it is shown only where it isn't needed.

Once fix 2 lands and the options actually become `make / do / take / have`, this stops being a nicety and becomes required.

**The change.** Pass it through and render it under the runner header:

- `csStart` config gains `use` — set it in `cVerbDrill` (`app.jsx:1190`), `cMeaningDrill` (`1202`) and `cProduceDrill` (`1206`) to `g.use`; store it in `csStart`'s state object (`app.jsx:1054–1056`).
- In `courseVals` add `out.csUse = cs.use || ''; out.csHasUse = !!cs.use;` next to `csTitle` (`app.jsx:1309`).
- In `template.html`, insert directly after the header row (after line `10597`) the **same markup already used at `10551`** — the lightbulb strip. Copy it verbatim, swap `cgUse`→`csUse` / `cgHasUse`→`csHasUse`.

`csHasUse` is false for grammar drills (`gramDrill`/`gramGame` never set `use`), so the grammar runner is unchanged and the grammar reviewer's work is unaffected.

**Data.** Already there, on all 22 groups, and already styled. Nothing to write.
**Cost.** Trivial to moderate — three call sites, two vals, one copied markup block.

---

### 5. 🟠 GOLD — the group chips carry no progress, though the identical pattern exists ten lines away in grammar

**Now.** 22 mint-green pills in a wrapping block (`template.html:10545–10549`), all visually identical, no numbers. The learner has done four drills in `make` and two in `work`; the hub cannot tell them that. There is no way to see how far into 22 groups they are, so there is no reason to think of them as a set at all — which is precisely why the section reads as a bag of unrelated buttons.

Grammar solves exactly this, one screen over: `gLvChips2` (`app.jsx:1245–1246`) counts completed drills per level and appends `· 3/9` to the chip label, with a tick icon per row.

**The change.** Apply the same shape to `cgChips2` (`app.jsx:1288`):

```js
out.cgChips2 = G.map(x => {
  const dn = ['_choose','_fill','_mean','_prod'].filter(m => this.csScore('c_' + x.key + m) != null).length;
  return { label: x.label + (dn ? ' · ' + dn + '/۴' : ''), style: chip(g.key === x.key, '#8fd9c1'),
           pick: () => this.setState({ cgKey: x.key }) };
});
```

Add above the chip row one line of Persian, so the count means something: **`۲۲ گروه — هر گروه ۴ تمرین دارد`**.

**Data.** Already stored. `csSaveScore` has been writing `c_<key>_<drill>` into `vocab_course.s` all along (`app.jsx:1147`, read at `1300`); the hub already displays those per-drill percentages inside `cgDrills` (`app.jsx:1300–1301`) — it just never aggregates them. **Zero new state, zero new content.**
**Cost.** Trivial. One replaced line, one added string.

---

### 6. 🟠 The colloc result screen tells the learner to go and read a lesson that does not exist

**Now.** Finish any collocation drill below 70 % and the result reads `اشکال ندارد؛ درس را یک بار بخوان و برگرد.` There is no درس in this section — no reading screen, no explanation page, nothing to go back to. The learner is sent to find something that isn't there. This is grammar copy leaking through the shared runner (`app.jsx:1365`).

**The change.** Branch `csScoreDesc` on `cs.kind`. For `kind === 'colloc'`:

- ≥70 %: `خیلی خوب — این گروه جا افتاده.`
- <70 %: `اشکال ندارد؛ فهرست همین گروه را یک بار بخوان و دوباره امتحان کن.` — which is true, because `cgItems` (`template.html:10564–10574`) is exactly that list and `csQuit` lands the learner on it.

Grammar's string stays byte-identical, so this cannot conflict with the grammar review.

**Data.** No new content beyond two short strings, both describing existing screens.
**Cost.** Trivial.

---

### 7. 🟠 Nothing on the hub says which group to start with, or that the 22 are two different kinds of thing

**Now.** 22 chips in `COLLOC2` order, defaulting to `make`. Nine of them are verb groups (`با make`, `با do`, …) teaching *which verb takes which noun*; thirteen are situation groups (`نظر دادن`, `جلسه و مذاکره`, `آکادمیک آیلتس`) teaching *ready-made phrases for a context*. These are two unrelated study jobs presented in one undifferentiated row, and a beginner tapping `آکادمیک آیلتس` first gets C1 academic phrasing with no warning.

The architect has ruled out inventing a level axis here (plan, change 6), and I agree — but "no levels" does not have to mean "no order".

**The change.** Split the chip row into two labelled bands, using the existing 9/13 boundary, with one line of Persian above each:

```
فعل‌های پایه — کدام فعل با کدام کلمه می‌آید        [ با make ] [ با do ] … (9)
موقعیت‌ها — عبارت‌های آماده برای هر موقعیت        [ نظر دادن ] [ موافقت و مخالفت ] … (13)
```

Same `chip()` style, same `pick` handler, one `<sc-for>` becomes two. Optionally mark the last three chips (`meeting`, `business`, `ielts_ac`) with a `پیشرفته` suffix.

**Data.** The grouping is the data's own order; only the two band headings are new text (about 15 words total).
**Cost.** Trivial to moderate — split `cgChips2` into `cgChipsVerb` / `cgChipsFn` and duplicate the template row.

---

### 8. 🟡 A wrong answer explains nothing in three of the four drills

**Now.** Only the verb-choose drill sets `why`, and what it sets is `it.en` — the full correct phrase (`app.jsx:1188`), rendered in the info strip at `template.html:10615–10617`. That is a restatement of the answer, not a reason, but it is at least something. **`cMeaningDrill`, `cProduceDrill` and `cGame` set no `why` at all.** In the meaning drill a wrong answer produces a red border and a green border and nothing else; the learner never finds out what the phrase they *did* pick actually means, which is the single most learnable moment in the drill.

**The change.** Two cheap improvements, both from existing data:

- `cMeaningDrill` (`app.jsx:1196–1200`): keep the source item on each option so a wrong pick can name it. Store `en` alongside each distractor and set `why: it.en + ' = ' + this.cFa(it.fa)` on the item; better, when `cs.picked !== cs.a`, render `«' + pickedEn + '» یعنی ' + pickedFa` — the phrase the learner confused it with. Both strings are already in `COLLOC2`.
- `csHasWhy` (`app.jsx:1343`) is gated on `cs.mode === 'choose'`, which excludes `game`. In the colloc game a wrong tap costs a life and teaches nothing. Showing the correct full phrase for the 620 ms before advancing (`app.jsx:1094–1099`) costs one `<sc-if>`; scope it to `kind === 'colloc'`.

**Data.** Already there. No new content.
**Cost.** Moderate — the meaning-drill change needs the option builder restructured to carry `en` per option.

---

### 9. 🟡 Two real correctness bugs a learner will read as "the app is wrong"

Small, but each one produces a *marked-wrong-when-right*, which destroys trust faster than any layout problem.

**a. Duplicate options in the meaning drill.** `cMeaningDrill` rejects a distractor only if `c.en !== it.en` (`app.jsx:1198`). It does **not** reject one whose Persian gloss equals the correct answer's. Seven such pairs exist in the data: `do a presentation` / `give a presentation` (both `ارائه دادن`), `take a break` / `have a rest`, `get a cold` / `come down with a cold`, `get a promotion` / `get promoted`, `come to a decision` / `reach a decision`, `come up with a solution` / `find a solution`, and a genuine duplicate entry `come to an agreement` present in both the `come` and `meeting` groups. When it fires, the learner sees **two identical Persian options**; `a: opts.indexOf(...)` marks only the first as correct, so tapping the other identical option is scored wrong.
**Fix:** add `&& this.cFa(c.fa) !== this.cFa(it.fa)` to the guard at `app.jsx:1198`. One clause. Trivial.

**b. No accepted alternatives in the typed drills.** `csCheckTyped` accepts `[target].concat(it.alts || [])` (`app.jsx:1110`), but no collocation item ever sets `alts`. In `از فارسی بساز`, the prompt `به توافق رسیدن` accepts only whichever of `come to an agreement` / `reach an agreement` the sampler chose. Same for `ارائه دادن` (do/give a presentation) and the five other pairs above.
**Fix:** in `cProduceDrill`, build a gloss→phrases map once over all 349 items and set `alts` to the other phrases sharing the prompt's gloss. Purely derived from existing data. Trivial to moderate.

**c. Genuinely ambiguous stems.** In `meeting`, four items share the stem `a meeting` (`hold` / `arrange` / `postpone` / `chair`); in `edu`, `major in` / `specialize in`; in `emotion_pos`, `crazy about` / `passionate about`; in `work`, `work experience` / `gain experience`. The prompt's parenthesised Persian gloss does disambiguate all of these, so they are *fair* — but the four-option `___ a meeting` question will routinely show all four correct English verbs at once and demand the learner read the Persian carefully. Worth knowing; I would not change the builder for it, only note it if the ambiguity ever gets reported as a bug.

---

### 10. 🟡 The section forgets which group you were in the moment the app reloads

**Now.** `cgKey` lives only in React state (`app.jsx:1048`, `1288`). Scores persist in `vocab_course`; the group selection does not. A learner working through `کار و حرفه` closes the tab, reopens, taps into the section, and is on `با make` — the section behaves as if it has never met them, even though it has been recording their scores the whole time.

**The change.** Two options, both cheap. Either persist `cgKey` into the existing `vocab_course` blob (`csLoad`/`csSaveScore` already read-modify-write it — add a `cg` field, no new key, no migration, and it is already in the export list because `vocab_course` is), or fold it into the plan's new `vocab_ui_v1.last` record (plan, change 5) so «امروز» can resume straight into a collocation group. The `vocab_course` route is the smaller change and does not block on the plan.

**Data.** No new content.
**Cost.** Trivial.

---

### 11. ⚪ Smaller, verified, cheap

- **The home card undercounts the drills.** `collocCardDesc` (`app.jsx:1239`) says `با ۳ تمرین و بازی سرعت`; `cgDrills` builds **four** (`app.jsx:1294–1298`). Change `۳` to `۴`. Trivial.
- **Speech reads the fragment, not the phrase.** After a verb-choose answer, `csPick` speaks `it.opts[it.a]` (`app.jsx:1104`) — a bare `make`. The learner hears one word where the whole point is the pair. For `kind === 'colloc'`, speak `it.why` (which already holds the full phrase, `app.jsx:1188`) instead. Trivial, and it makes the existing `why` field earn its keep twice.
- **The four drills are unordered and identically weighted.** `کدام فعل درست است؟` (recognition) and `از فارسی بساز` (production) sit in one flat grid of four equal buttons with no suggested order, despite the last one's description already calling itself `سخت‌ترین تمرین`. Numbering them `۱`…`۴` in the existing `d.label` costs four characters and turns a menu into a path. Trivial.
- **Drills never revisit what you got wrong.** Every builder does `shuffled(g.items, Date.now() % …).slice(0, 10)` — a fresh random sample each run, so a phrase you missed has a 50 % chance of not appearing next time and the app never knows you missed it. Out of scope for a legibility pass; flagged because it is the reason the `بهترین ٪` badge can go up while nothing is being learned.
- **Empty state.** If `COLLOC2` fails to load, `isColloc` is still true (`app.jsx:1234`) and the hub renders its header, its intro paragraph and a `بازی سرعت` button; `hasColloc` guards only the inner block. `cGame` → `csStart` returns silently on an empty item list (`app.jsx:1053`), so the button is a dead tap with no message. Two lines: gate the game button on `hasColloc`, and render `فعلاً ترکیبی بارگذاری نشده` when it is false. Trivial, and it is the only true empty state in the section — all 22 groups otherwise carry 10–24 items, so no group is ever thin.
- **Exit is fine, and worth not breaking.** `csQuit` (`app.jsx:1151`) returns to `back: 'colloc'` and `cgKey` survives in state, so the learner lands back on the group they came from. Under the plan's change 4 this becomes the shared `بستن` strip; the destination is already correct and should stay `colloc`, not `home`. The one gap: quitting mid-drill discards the round with no confirmation and no partial credit — shared with grammar, and I defer it to that review.

---

## Would need new work

Kept separate on purpose. None of it is needed to make the section legible; all of it is content authoring.

- **No example sentence anywhere.** Item shape is `{ en, fa }` and nothing else. A learner is told `come up with a solution = راه‌حل پیدا کردن` and never sees it in a sentence, so they cannot tell what goes around it (`come up with a solution to the problem`). This is the section's largest real content gap and would mean writing **349 `ex` + `exfa` pairs** — comparable to one `examples`-agent range times two. If it is ever done, the render slot already exists: the `cgItems` row (`template.html:10566–10572`) has room, and `csrun`'s `why` strip would carry it during drills.
- **`use` for the 13 function groups is thinner than for the verb groups.** `«اسپیکینگ — به جای happy ساده، این‌ها نمره می‌آورند»` tells the learner where to use the group but not, as the verb groups do, what distinguishes it. Rewriting 13 one-liners is small (~150 words) and would make finding 4 pay off across the whole section rather than only the first nine groups.
- **No make/do/take contrast drill.** Once fix 2 lands, the natural next step is one drill that samples across the nine verb groups at once — the only exercise that actually tests the distinction the section is built around. It needs no new content (it is `cVerbDrill` over a merged pool) but it is a new activity, which the brief rightly warns against; noted, not proposed.
