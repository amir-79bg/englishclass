# دستور زبان — grammar section UX review

**Scope:** screens `gram`, `glesson`, and the grammar half of the shared runner `csrun`.
**Logic:** `goGram` / `gramLessons` / `openGramLesson` / `gramDrill` / `gramGame` and the `cs*` engine, `app.jsx:1034–1170`; render values in `courseVals()`, `app.jsx:1224–1378`. Markup: `template.html:10438` (`gram`), `10471` (`glesson`), `10578` (`csrun`).
**Assumes** the structure decided in `docs/ux-structure-plan.md`: `gram` becomes ساختار › دستور زبان (hub, depth 2), `glesson` the درس (depth 3), `csrun` the runner (depth 4), with the shared location strip and a single **بستن**.

**Overlap notice.** `csrun` is shared with collocations. Everything below is scoped to the grammar side: `cs.kind === 'gram'`, items built by `gramDrill` / `gramGame`. Where a proposal touches shared `csVals` code I say so and give a `kind === 'gram'` guard. The collocation reviewer owns `cVerbDrill` / `cMeaningDrill` / `cProduceDrill` / `cGame`.

---

## What the data actually contains

Loaded from the `dca9788e-…` asset (`window.GRAM`). 6 levels × 3 lessons = **18 lessons**, and that is the entire course.

| Field | Count | Rendered? |
|---|---|---|
| `t`, `why` (why the topic matters) | 18 / 18 | yes — `glesson` (`template.html:10475`, `10478`) |
| `rules` | 80 total, 3–6 per lesson | yes — `10480–10488` |
| `ex` (`en` + `fa`, with speaker) | 68 total | yes — `10490–10501` |
| **`pit`** (`bad` / `good` / `fa`) | **43 items, present in all 18 lessons** | **`glesson` only — `10503–10514`. Never inside a drill.** |
| `choose` (`q`, `opts`, `a`, **`why`**) | 74 questions, **`why` present on 74/74** | option grid yes; **`why` yes in `choose` mode, never in `game` mode** |
| `fill` (`q`, `a`, `alts?`, `fa`) | 52, `fa` on 52/52 | `fa` shown as a *pre-answer* hint only |
| **`err` (`s`, `fix`, **`fa`** = why it is wrong)** | 34, **`fa` on 34/34** | **`fa` is NEVER rendered anywhere in the app** |
| `order` (`fa`, `chunks`) | 23 | yes |

183 drill questions total across the whole course.

---

## The wrong-answer path in `csrun`, traced

There are four grammar drill modes. `gramDrill` (`app.jsx:1154`) maps `err → 'error'` and passes the rest through. What a learner sees after getting each one wrong:

| mode | wrong-answer feedback | source | is there an unrendered explanation? |
|---|---|---|---|
| `choose` | correct option turns green, theirs red, **and a purple box with `it.why`** | `csHasWhy`, `app.jsx:1343`; `template.html:10615–10617` | no — this one is done right |
| `game` (same `choose` items) | red/green for 620 ms, then auto-advance | `csPick`, `app.jsx:1090–1101` | **yes — `it.why` is on the item and `csHasWhy` excludes `game`** |
| `fill` | one red line: `درستش: cooks` | `csFeedback`, `app.jsx:1351` | lesson `pit` only |
| `error` | one red line: `درستش: My brother studies medicine.` | same line | **yes — `it.fa` ("با brother فعل s می‌گیرد.") is on every one of the 34 items and is read by nothing** |
| `order` | `ترتیب درست: I drink tea every morning` | `csOrderFeedback`, `app.jsx:1357` | lesson `pit` only |

`csStart` (`app.jsx:1052`) copies `kind, mode, title, key, back, items` into `cs`. **The lesson object is not carried into the runner at all**, which is the mechanical reason `pit` cannot appear there even though the learner is drilling exactly the mistakes it describes.

---

## Findings, ranked by confusion removed per unit of work

### 1. 🔴 The «غلط را پیدا کن» drill hides the reason it already has — 34 explanations, zero renders

**Now.** The learner is shown `Does she works at night?` and told `این جمله یک غلط دارد — شکل درستش را بنویس`. They type something wrong. They get one red line: `درستش: Does she work at night?`. They are left to diff two English sentences themselves and infer the rule — which is the exact skill they came here lacking. Then **بعدی**.

**The data already has the answer.** Every `err` item carries `fa`, and `fa` is not a translation — it is the rule, in Persian: `"بعد از does فعل ساده."`, `"مدت → for."`, `"yesterday با گذشته ساده."`. All 34 of 34. Nothing in `app.jsx` or `template.html` ever reads it. This is the single clearest gap in the section.

**The change.** In `courseVals()` beside `csFeedback` (`app.jsx:1351`), add:

```js
out.csHasReason = cs.checked && cs.mode === 'error' && !!it.fa;
out.csReason    = it.fa || '';
```

Render it directly under the feedback line in the `csIsError` block (`template.html:10636`), reusing the existing `csHasWhy` box markup from `10616` verbatim so it looks identical to the four-choice explanation. Show it on right answers too — confirming *why* you were right is worth as much at A1.

**Data needed.** None. Zero new content.
**Cost.** Trivial — two values, one copied `<sc-if>`. Grammar-only by construction: collocations never use `mode: 'error'`.

---

### 2. 🔴 «بازی گرامر» throws a beginner into 74 timed questions with the explanations switched off

**Now.** `gram` puts an orange **بازی گرامر · رکورد: 0** button in the header row (`template.html:10448`), visually the loudest thing on the screen and above the lesson list. `gramGame` (`app.jsx:1163`) pools every `choose` question from A1 up to the current level and starts a 45-second, 3-lives timer. A learner who has read no lesson gets a stream of `My father ___ to work by bus.` with 620 ms per verdict, no rules, no `why`, and then a trophy screen. Nothing on the button says it is timed, that it is a review of lessons, or that it covers *all* levels up to this one rather than the one they are looking at.

**Two separate fixes, both cheap:**

- **Show the `why` in game mode.** Change `csHasWhy` (`app.jsx:1343`) from `cs.mode === 'choose'` to `(cs.mode === 'choose' || (cs.mode === 'game' && cs.kind === 'gram'))`. Every grammar game item is a `les.choose` object and therefore already carries `why`. Pair it with a longer wrong-answer delay — bump the `620` in `csPick` (`app.jsx:1099`) to ~1800 ms **when wrong and `cs.kind === 'gram'`**, so the sentence is readable. *(The `kind === 'gram'` guard matters: collocation game items have no `why`, and its pacing is the collocation reviewer's call.)*
- **Label the button honestly.** `gramGameGo`'s label is built at `template.html:10448`; give it a subtitle from `courseVals` — `مرور سریع درس‌های خوانده‌شده · ۴۵ ثانیه، ۳ جان` — and demote it below the lesson list, since on the hub the lesson list is the thing a first-timer should press.

**Data needed.** None for the `why`; one short Persian subtitle string (≈8 words) for the label.
**Cost.** Trivial.

---

### 3. 🟠 The lesson's «اشتباه‌های رایج» vanishes the moment the learner starts making those mistakes

**Now.** `pit` is the section's best content — 43 hand-written `bad` → `good` → Persian-reason triples aimed squarely at Persian speakers. It renders once, on `glesson` (`template.html:10503–10514`), *above* the drill buttons. The learner scrolls past it to reach the drills, then spends the next several minutes making precisely those mistakes with no access to it. In `fill` and `order` modes there is no per-item explanation in the data at all, so `pit` is the only explanation that exists — and the runner cannot reach it because `csStart` never receives the lesson.

**The change.** Two parts:

- Carry it in. In `gramDrill` (`app.jsx:1160`) add `pit: les.pit || [], lesTitle: les.t` to the `csStart` config, and copy them into `st` in `csStart` (`app.jsx:1054`). They are inert for collocations, which pass neither.
- Render it as a **collapsed** disclosure at the bottom of the runner card, visible in every grammar mode: `یادآوری اشتباه‌های رایج این درس` → expands to the same three-line `pit` markup already written at `template.html:10507–10511`. Collapsed by default so it does not become a cheat sheet; expanded state persists across questions within a drill.

This turns a wrong `fill` or `order` answer from a dead end into a one-tap recovery, without writing a word of new content.

**Data needed.** None — `pit` exists on all 18 lessons.
**Cost.** Moderate (two touched call sites, one relocated markup block, one boolean of state).

---

### 4. 🟠 «بررسی ترتیب» does nothing, silently, and the learner cannot tell why

**Now.** In `order` mode the learner taps chunks into the tray and presses **بررسی ترتیب**. If they have not placed *every* chunk, `csCheckOrder` (`app.jsx:1135–1138`) hits `if (cs.seq.length !== it.chunks.length) return;` — no state change, no message, no visual response at all. The button looks broken. With 3–4 chunks and a partial placement this is easy to hit, and the learner has no way to know the rule is "use all of them".

Compounding it: the drill is often a single question. **12 of the 18 lessons have exactly one `order` item**, and 3 order items have only 2 chunks — so «مرتب‌کردن جمله» can be one tap, one tap, بررسی, and a result screen reading `۱ از ۱ درست`. The button on `glesson` advertises `۱ جمله`, which is honest, but the ceremony of a progress bar, a result card and an XP award around a single two-chip question reads as a malfunction.

**The change.**
- Make the disabled state visible: when `cs.seq.length !== it.chunks.length`, style the check button as inactive (the app already has this pattern — `csNextStyle`, `app.jsx:1362`) and put the count in the tray hint: `۲ از ۳ تکه چیده شده`. Both are pure `courseVals` derivations of `cs.seq.length` and `it.chunks.length`.
- For one-question drills, either merge `order` and `err` into one «تمرین کوتاه» run when each has ≤2 items, or at minimum change the result copy for `cs.items.length <= 2` so it does not present a 1/1 as a course milestone.

**Data needed.** None for the button fix; the merge is a builder change, not content.
**Cost.** Trivial for the button state; moderate for the short-drill merge.

---

### 5. 🟠 A wrong answer is never seen again, and the score shown is the best one ever, not the last

**Now.** `csNext` (`app.jsx:1143`) advances and discards. On the result screen the learner gets `۳ از ۵ درست` and `اشکال ندارد؛ درس را یک بار بخوان و برگرد` — it does not say *which* two, and by then the questions are gone. Meanwhile `csSaveScore` (`app.jsx:1035–1038`) only ever raises: `if (pct >= (p.s[key] || 0)) p.s[key] = pct`. So the lesson row badge `میانگین ۸۰٪` (`app.jsx:1253`) and the drill button badge `بهترین ۸۰٪` (`app.jsx:1279`) are a personal record, not a current state — a learner who has regressed sees a green ✓ tick (`avg >= 70`, `app.jsx:1254`) telling them the lesson is solid.

**The change.** Track wrong items during the run — `cs.missed = []`, pushed in `csPick` / `csCheckTyped` / `csCheckOrder`, all three already have the item and the `ok` flag in hand — and on the result screen list them as `prompt → correct answer → why/fa`, all three strings already present per item for `choose` and `error`. Add one button: **دوباره فقط غلط‌ها**, which re-enters `csStart` with `items: cs.missed`. Separately, the row badge should read the most recent score and label the record separately (`بهترین ۸۰٪ · آخرین ۶۰٪`), which needs one extra field in `vocab_course.s`.

**Data needed.** None for the review list. The last-score badge needs one additive field in an existing storage key — no migration, matching the plan's storage stance.
**Cost.** Moderate.

---

### 6. 🟡 Lesson 1 of 3 never says so, and never offers lesson 2

`glesson` (`template.html:10471–10530`) shows a title and a **بازگشت**. It never says *درس ۲ از ۳ · سطح A1*, and when the four drills are done there is no «درس بعدی» — the learner must press back and re-find their place in the list. `gramLvNote` already computes `سطح A1 — ۳ درس` for the hub, and `gramLessons(lv).indexOf(les)` gives the position for free. This is the same value the structure plan's location strip wants (`app.jsx` has no `glPos` today; it is one line). Add a `درس بعدی ›` button beside `بازگشت`, disabled on the last lesson of a level.

**Data needed.** None. **Cost.** Trivial.

### 7. 🟡 Grammar level is inherited from vocabulary progress, silently

`goGram` (`app.jsx:1047`) defaults `gLv` to `this.levelOf(this.load().round)` — the learner's *word-course* band (`band(r) = floor((r-1)/5)`, `app.jsx:197`). Someone who has ground through vocabulary rounds lands on B2 grammar having never opened an A1 grammar lesson, with all six chips unlocked and no indication that grammar has its own starting point. The chips already show real completion (`A1 · 0/3`, `app.jsx:1243–1247`) so the information is on screen — it is just not acted on. Default `gLv` instead to the **lowest level with an incomplete lesson**, falling back to the vocabulary band only when everything is done, and add one line under the hub title: `از A1 شروع کن — هر سطح ۳ درس است`.

**Data needed.** None. **Cost.** Trivial.

### 8. 🟡 English placeholders in a Persian beginner app

`Type here…` (`template.html:10623`) and `Write the correct sentence…` (`10633`) are the only instructions inside the two typing drills, and they are in the language the learner is here to learn. `Write the correct sentence…` is also the only place that reveals the whole sentence must be retyped rather than just the fixed word — a real ambiguity, since the prompt above says only `شکل درستش را بنویس`. Replace with `کل جمله‌ی درست را اینجا بنویس` and `پاسخ را اینجا بنویس`; keep the input `direction:ltr`. Worth knowing while writing the copy: `norm` (`app.jsx:25`) strips punctuation and case, so `dont live` passes for `don't live` — the check is forgiving, and the instruction can say so.

**Data needed.** Two Persian strings. **Cost.** Trivial.

### 9. 🟡 Quitting mid-drill loses the run with no warning

`csQuit` (`app.jsx:1151`) clears `cs` outright; `csSaveScore` only fires from `csNext` on the last item (`app.jsx:1147`). A learner four questions into a five-question drill who taps **خروج** loses all four and the lesson row still reads `شروع نکرده‌ای`. The exit button is unlabelled as destructive and sits next to the title. Given the structure plan renames this to **بستن** anyway, add a confirm when `cs.k > 0 && !cs.done`: `از تمرین بیرون می‌روی؟ پاسخ‌های این دور ذخیره نمی‌شود.` This is shared `csrun` code; the collocation reviewer will want the same thing, and it should be written once.

**Data needed.** One string. **Cost.** Trivial.

---

## What is already good — do not touch

- **The four-choice explanation box** (`csHasWhy` → `template.html:10615–10617`). It fires on right *and* wrong answers, it is styled as information rather than as a verdict, and all 74 questions have content for it. It is the model the other three modes should copy, and findings 1–3 are all "make the rest of the section behave like this".
- **`glesson`'s three-part shape** — why it matters → rules → examples → common mistakes → drills — is genuinely well built, and the hub even explains it in advance (`template.html:10450`). The problem is not the lesson page; it is that everything on it becomes unreachable the moment a drill starts.
- **The pre-answer hint in `fill`** (`راهنما: ` + `it.fa`, `app.jsx:1323`) is the right call — the Persian meaning is a scaffold, not a giveaway, when the blank is a verb form.
- **Per-drill progress** (`csPos`, `csBarStyle`) is present and correct for all non-game modes.

## Structural, not mine

The `gram` screen has **no back or home control of its own** — the only escape is the nine-icon header. Same for `glesson`'s `بازگشت` vs `csrun`'s `خروج` vs the result screen's `بازگشت`: three words for the same gesture. This is exactly change 4 of `docs/ux-structure-plan.md` (one location strip, one **بستن**, one level up) and I am not proposing a separate fix.

## Would need new work (kept separate on purpose)

Listed only so the gap is on record; none of it is recommended before findings 1–5 ship.

- **`fill` and `order` have no per-item explanation in the data.** Finding 3 covers them with the lesson-level `pit`, which is the cheap answer. A per-item `why` on all 52 `fill` and 23 `order` items would be better and would cost 75 short Persian sentences of new authoring.
- **18 lessons is thin for a course billed as «دوره‌ی کامل A1 تا C2»** (`gramCardDesc`, `app.jsx:1238`). Three lessons per level, 183 questions total, and C2 is 9 questions per lesson. Either write more or soften the claim — the second is free and the honest fix for now.
- **`err` at C2 is one question per lesson.** Merging short drills (finding 4) hides this; writing 2–3 more `err` items per C1/C2 lesson would fix it properly.
