# واژه‌ها — the word course, reviewed as a first-time learner

**Scope:** screens `study`, `quiz`, `result`, `browse`, `add`. Logic: `prepare`, `advance`, `startQuiz`, `check`, `renderVals` in `data/src/app.jsx`.
**Status:** proposals only. Nothing here is implemented.
**Assumes** `docs/ux-structure-plan.md`. Where that plan already covers something (the location strip, the one-word exit, the tab bar, the naming rule), I say so and do not re-decide it. Everything below is *inside* the runners, which that plan explicitly left to this review.

Written in English for the implementer. Every string that ships to a learner is given in Persian, verbatim.

---

## The one-paragraph verdict

This is the best-built section in the app and the one with the most learners-per-minute, and it is undone by three things. **First, five of the values needed to orient a learner are already computed in `renderVals` and rendered nowhere** — the mode name, the level, the round number, the streak, and the Persian translation of the example sentence. **Second, the mode a learner is in is never named on the screen they are looking at**, so `• • • • •` with no other context is a genuinely unreadable screen. **Third, on a wrong answer the app shows the right answer but never the sentence that would explain it** — except in `type`/`listen`, where it does. Underneath all that sits one data problem that no amount of UI work can fix: the 10,524 example sentences are **36 templates**, and the `cloze` mode is built entirely on them.

Ranked below by confusion removed per unit of work. Items 1–6 need **no new content at all** — the field exists, the value is computed, it is simply not on the screen.

---

# Part 1 — Fixes where the data already exists and is not rendered

These are the cheap ones. Every one is an edit of ten lines or fewer.

---

### 1. `cloze` mode hides the Persian translation of the very sentence it just asked about

**What the learner experiences now.** Round 5. The screen shows `Do you remember that _____?` and four English options. They pick one. The correct option turns green — and the sentence at the top **still says `_____`**. They never see the finished sentence, and they never see what it means in Persian. In `mcq`, `type`, `listen` and `flash` the Persian example sentence *is* shown. In the one mode built on the example sentence, it is suppressed.

**Where.** `app.jsx:1988`:

```js
showSentence: !!sent && !isCloze && answered,
```

and `app.jsx:1767`, where `promptText` is blanked unconditionally, with no `answered` branch.

**Data support: complete.** `ex` and `exfa` are present on **all 10,524 words** — I checked every entry, zero missing. `sentenceEn`, `sentenceFa` and `hasSentenceFa` are already computed and already have markup at `template.html:9805–9811`. This is a one-condition change.

**The change.**
- `showSentence: !!sent && answered` — drop `!isCloze`.
- In the `isCloze` branch, when `s.picked != null`, stop blanking: show `sent.s` whole, with the target word wrapped in the accent colour so the eye lands on it.
- Keep the same box at 9805; it already renders `sentenceFa` underneath.

**Cost: trivial.**

---

### 2. The study screen never says which of the five modes you are in

**What the learner experiences now.** They press شروع. The card shows `• • • • •`, a hint reading «به تلفظ گوش کن و لغت را بنویس», and an input. Nothing on the screen says this is *شنیداری*, that it is one of five rotating methods, that it will change, or that they are on round 1 of 5 of level A1. Two weeks later the same button produces a completely different screen and nothing explains why. The five-mode rotation is the cleverest thing in the app and the study screen is the one place it is never mentioned.

**Where.** These are all computed in `renderVals` and appear **zero times** in `template.html` (verified by grep):

| value | `app.jsx` | renders |
|---|---|---|
| `roundName` — the mode name (فلش‌کارت / چهارگزینه‌ای / …) | 1889 | **0** |
| `levelLabel` — A1…C2 | 1901 | **0** |
| `roundInLevel` — 1…5 | 1902 | **0** |
| `totalWords` — 10524 | 1889 | **0** |
| `streak` — consecutive days, maintained in `load()` at 216–220 | 1889 | **0** |

`resumeTitle` (1899) already assembles exactly the right sentence — `سطح A1 · دوره‌ی ۱ از ۵ · فلش‌کارت` — and is rendered only on `home`, where the learner is about to leave.

**The change.** One line above the progress bar at `template.html:9743`, in the same 11px muted style as `posLabel`:

```
سطح A1 · دوره ۱ از ۵ · شنیداری
```

and directly under it, `MODES[n].desc`, which already reads as an instruction:

> «فقط صدا را می‌شنوی و لغت را می‌نویسی»

Both strings already exist in `MODES` (`app.jsx:3–9`) and in `info` (`app.jsx:1741`). Add `modeDesc: info.desc` to the returned object; `roundName` and `levelLabel` need no new logic at all.

The architect's location strip gives this screen `واژه‌ها · کارت‌ها` and a position counter. That is the *path*; this is the *task*. Both are needed and they are different lines.

**Cost: trivial.** Two template lines, one new val.

---

### 3. `mcq` is the only mode that never plays the word

**What the learner experiences now.** English word on screen, four Persian options, pick one, move on. In an app whose entire premise is offline pronunciation, the learner can pass 842 words in round 2 without hearing one of them unless they think to press تلفظ each time. `cloze` speaks on pick (`app.jsx:1779`), `type`/`listen` speak on a wrong answer (`check()`, `app.jsx:367`), the quiz speaks on `fa2en` (`app.jsx:352`), the exercise drill speaks on every pick (`app.jsx:399`), the matching game speaks every English tile (`app.jsx:480`). `mcq` alone is silent.

**The change.** `app.jsx:1779`, the options `pick` handler:

```js
pick: () => { if (this.state.picked != null) return;
              this.setState({ picked: i, showBack: true });
              this.speakWord(w.en); }
```

i.e. drop the `if (isCloze)` guard — it already calls `speakWord` for cloze, so this is deleting a condition.

**Cost: trivial.** One clause.

---

### 4. The "write your own sentence" panel says an AI checks it. There is no AI.

**What the learner experiences now.** After every answered word, a box appears: **«جمله‌ی خودت با این لغت — هوش مصنوعی درستی‌اش را چک می‌کند»** (`template.html:9815`). The learner writes a sentence, presses بررسی، and gets back a five-point checklist. They now believe an offline HTML file is talking to a language model. When the checklist misses something obvious — and a regex checklist will — they conclude the AI is broken, rather than that they are looking at a spell-and-structure checker doing exactly what it says.

**Where.** `checkMy()` (`app.jsx:157`) calls `gradeSentence()` (`app.jsx:115`), which is 40 lines of regexes and a nine-entry pitfall table. No network call exists anywhere in the file. `msBusy` is in state and set to `true` nowhere; `this.fetching` (`app.jsx:57`) is never read.

**The irony:** `gradeSentence` is genuinely good and its output is genuinely well rendered. `myChecks` (`app.jsx:1996`) shows five green/amber lines with real explanations — **«جمله باید با حرف بزرگ شروع شود»**, **«با he/she/it فعل s می‌گیرد (he goes، she has)»**. That is the best wrong-answer feedback in the entire app. It just has a false label on it.

**The change.** `template.html:9815`, replace the header string with:

> **«جمله‌ی خودت با این لغت — پنج نکته‌ی ساختاری بررسی می‌شود»**

and change the English placeholder at `template.html:9831` (`"Write your own sentence…"`) to a Persian instruction with an English example, since the learner reading it is at A1:

> `placeholder="یک جمله با این لغت بنویس — مثلاً: I like this."`

Also delete the dead `msBusy` branch in `msBtnStyle` (`app.jsx:2006`), which currently computes a disabled state that can never appear.

**Cost: trivial.** Two strings.

---

### 5. The flash-mode hint tells the learner to do something that does not work

**What the learner experiences now.** Bottom-left of the study screen, `hintLine` (`app.jsx:2011`):

> «روی کارت بزن تا معنی را ببینی»  — *"tap the card to see the meaning"*

The card is `template.html:9748`, `<div class="vcard" style="{{ cardStyle }}">`. It has **no click handler**. Tapping it does nothing. The README records that the keyboard shortcut for the same gesture was removed. So a first-time learner's first instinct — tap the big card — is instructed by the app and silently ignored.

**The change.** Two options, pick one:
- **Make it true** (better): add `sc-camel-on-click="{{ flipCard }}"` to 9748 and `flipCard: () => { if (mode === 'flash' && !s.showBack) this.setState({ showBack: true }); }`. This is the gesture the learner already tried.
- **Make it honest**: change the string to «دکمه‌ی «نمایش معنی» را بزن».

**Cost: trivial** either way.

---

### 6. `streak` and `totalWords` are maintained and never shown; the star count is explained better on `home` than on the card

Minor but free. `d.streak` is carefully maintained across day boundaries (`app.jsx:216–220`) and shown to nobody. Put it in the «امروز» stat tiles the architect is keeping (`template.html:9638–9647`) as a third tile: **«{{ streak }} روز پشت سر هم»**.

Separately: the browse row's tick button (`template.html:10023`) has **no `title` and no label** — it is a bare circle icon that silently writes `d.mastered`. Its neighbour, the star, has `title="ستاره‌دار"`, which does not exist on touch. On the study card the same star is properly labelled **«بلد نیستم — ستاره»** (`app.jsx:1892`). Use the same words in browse: a 10px caption row above the list reading **«ستاره = بلد نیستم · تیک = بلدم»**.

**Cost: trivial.**

---

# Part 2 — Real confusion, real work

---

### 7. Some questions are literally unanswerable, because 883 words share a Persian gloss with another word in the same category

**What the learner experiences now.** In `mcq`, they see `toronto` and four Persian options — and **two of them read «نام خاص»**. One is marked green, the other red. There is no reading of that screen in which the learner is at fault, and nothing tells them the app is at fault either. In `type` mode it is worse: the prompt is **«نام خاص»** and the instruction is «املای انگلیسی را بنویس». There are **114 words** with that exact gloss. The learner cannot win; `check()` (`app.jsx:363`) does a strict `norm()` equality, so 113 of 114 correct-in-spirit answers are marked wrong and the app says **«درستش: austin»**.

**Measured, not estimated.** Over `data/words.json`:

- 476 Persian glosses are shared by more than one word — **1,194 words affected**.
- Restricted to same-category collisions (which is the pool `buildOptions` actually draws from, `app.jsx:284–285`): **341 clusters, 883 words**.
- Largest: `noun|نام خاص` (114), `noun|نام خانوادگی` (23), `noun|نام زنانه` (9), `noun|نام شهر` (6), `noun|نام مردانه` (6).

Neither `buildOptions` (`app.jsx:288`), `startQuiz` (`app.jsx:341`) nor `exPrepare` (`app.jsx:388`) deduplicates by **label** — all three deduplicate by word index or by `en`, which does not stop two options rendering identical text.

**The change, in two parts.**

**7a — stop showing two identical options.** In all three distractor loops, reject a candidate whose displayed label equals one already in the pool or the target's:

```js
if (c && c.i !== w.i && c.fa !== w.fa && !pool.some(p => p.fa === c.fa)) pool.push(c);
```

Three lines, three call sites. Fixes `mcq`, the milestone quiz, and the لیسنینگ drill. **Data support: complete — no new content.** **Cost: trivial.**

**7b — stop *asking* an unanswerable question.** `type` and the no-sentence `cloze` fallback (`app.jsx:1768`) prompt from `fa` alone. When `fa` is not unique the question has no single answer. Cheapest honest fix, no new content: when the current word's gloss is shared, append the category and first letter to the prompt hint —

> «املای انگلیسی را بنویس — دسته: اسم‌ها · با a شروع می‌شود»

`this.catLabel(w.cat)` and `w.en[0]` are both to hand. **Cost: moderate** (needs a precomputed gloss-frequency map, ~10 lines).

**The actual fix is content, and it is not mine.** 476 glosses need disambiguating — «نام خاص» → «تورنتو (نام شهر)». That is the `translator` agent's job across roughly 1,200 indices, and the second question the owner should ask is whether `austin`, `toronto` and `marilyn` belong in an English-vocabulary course at all. Flagging, not deciding.

---

### 8. `cloze` — «جای خالی یک جمله‌ی واقعی را پر کن» — is built on 36 sentence templates

**What the learner experiences now.** Round 5 of every level. `Do you remember that _____?` — and the blank could be any noun in English. They are not solving a sentence; they are guessing among four options with the sentence contributing nothing. Round 5 feels like round 2 with extra steps, and the mode's own description promises a "real sentence".

**Measured.** Collapsing every `ex` by replacing the target word with `X` yields **36 distinct patterns across 10,524 words**. Five of them cover 8,130:

| pattern | words |
|---|---|
| `Do you remember that X?` | 1,662 |
| `We talked about the X for an hour.` | 1,625 |
| `This X is very important to me.` | 1,624 |
| `I need a new X for my work.` | 1,613 |
| `The X changed everything for us.` | 1,606 |

**This also silently caps fix #1.** Un-blanking the sentence is still worth doing — the learner at least sees a complete English sentence and its Persian — but it will not make the mode teach collocation, because the sentence does not know anything about the word.

**The change.** Two honest options, and they are not exclusive.

- **Cheap, now (trivial).** Stop promising what the data cannot deliver. `MODES[4].desc` (`app.jsx:8`) becomes **«جای خالی را با لغت درست پر کن»** — drop «یک جمله‌ی واقعی». And with fix #1 landed, the mode's real value becomes visible: the learner reads a full English sentence and its Persian after every answer.
- **Expensive, real (large).** 10,524 example sentences rewritten so that the blank is determined by the sentence. This is exactly the `examples` agent's remit (`README.md`, «examples: words 0-199»); at 200 words a pass it is ~53 agent runs. **This is the single largest content debt in the section**, and it degrades `cloze` in this section and the `رایتینگ` drill in `browse` (`app.jsx:558–560`, which blanks the same templated sentence).

---

### 9. The quiz ambushes the learner, cannot be left, and cannot be retaken

Three separate faults, one screen.

**a. It arrives without warning.** `advance()` (`app.jsx:316–317`) fires `startQuiz` the instant `d.pos` hits a multiple of 300. The learner is mid-drill and is suddenly in a 20-question exam headed **«آزمون ۳۰۰ لغت — نمره‌ی قبولی ۷۰٪»**. The study footer does count down («آزمون بعدی: {{ nextQuizIn }} لغت دیگر», `template.html:9850`) but it is 11px, bottom-left, next to a hint line — and it never says what failing does.
→ **Fix:** at `nextQuizIn <= 10`, promote the counter to a coloured strip in `#e0a458` above the card: **«۷ لغت دیگر تا آزمون ۳۰۰ لغت — ۲۰ سؤال، نمره‌ی قبولی ۷۰٪»**. `nextQuizIn` already exists. **Trivial.**

**b. There is no way out.** The `isQuiz` block (`template.html:9855–9881`) has a progress bar, options and a next button. No exit, in any form. The only escape is the global header house icon, which drops `s.quiz` and loses the attempt. Same for `isStudy` — no exit at all in 112 lines of markup.
→ The architect's location strip fixes `study`. The quiz needs one thing more: a **«بعداً می‌دهم»** ghost button that returns to `screen:'study'` *without* burning the milestone.

**c. A failed quiz is gone forever if you do not retry immediately.** `quizAdvance` (`app.jsx:358–359`) writes `d.quizzes[round:mile]` **only on pass**. The trigger is `d.pos % QUIZ_EVERY === 0` — an exact equality, checked once. Press **«ادامه‌ی مرور»** on a 55% result and `pos` becomes 301 on the next word; the condition never holds again for that milestone. Worse, `q.missed` words are spliced into `d.order` (`app.jsx:360`), lengthening it, so the *next* milestone lands on a different set of words than the label «آزمون ۳۰۰ لغت» claims.
→ **Fix:** record every attempt, not only passes — `d.quizzes[k] = {best, tries}` — and let the failed result's **«آزمون دوباره»** stay reachable: when `!d.quizzes[k].passed`, show a persistent amber chip on the study screen reading **«آزمون ۳۰۰ لغت را رد نکردی — دوباره امتحان کن»** that calls `startQuiz(mile)`. **Moderate**; `d.quizzes` is already an object, and the shape change is additive so no migration is needed.

---

### 10. One round is 842 words. Nothing marks the end of a sitting.

**What the learner experiences now.** At A1, `levelSpans(10524)[0]` = **842 words in one round in one mode**, and five rounds to finish A1 — **4,210 cards**. The learner presses شروع, does twenty, and the bar reads `20 / 842`, 2%. There is no "you are done for today", no session boundary, nothing that ever says *stop here*. The only signal that a sitting happened at all is `todayCount` on `home`, which they have already left.

This is the gap the architect's first-run card writes a promise into — «اول ۲۰ واژه‌ی سطح A1 را با کارت یاد می‌گیری. حدود ۷ دقیقه» — and there is nothing in `study` that delivers it. Someone has to build the twenty.

**The change.** A daily target, stored additively in `vocab_app_v1` (`d.goal`, default 20 — `load()` already backfills missing fields at 221–225, so no migration):

- Second, thinner progress bar on the study screen: **«هدف امروز: ۱۲ از ۲۰»**.
- When `d.days[today] >= d.goal`, `advance()` shows a small non-blocking card between words, not a new screen:
  > **«هدف امروزت تمام شد — ۲۰ لغت.»**
  > **[ ادامه می‌دهم ]** [ برای امروز بس است ]

Everything needed is already stored: `d.days[today()]` is incremented on every `advance` (`app.jsx:311`). **Cost: moderate**, and it is the highest-value moderate item in this report.

**Related, smaller:** the main progress bar's **denominator grows when you get things wrong.** `advance(false)` splices the word back into `d.order` (`app.jsx:308–309`), so `posLabel` goes `50 / 842` → `51 / 843` and `pct` can *fall* after a correct answer that follows several wrong ones. It is defensible arithmetic and an indefensible progress bar. Either hold the denominator at the round's original length, or label it honestly: **«۵۱ از ۸۴۳ (۱ لغت برای مرور دوباره اضافه شد)»**.

---

### 11. `browse` has no empty states, and the drills are invisible until you guess the trigger

**a. The drill strip is hidden by default and never announced.** `hasCatEx` (`app.jsx:535`) requires `catFilter !== 'all'` **and** ≥4 translated words. A learner arriving at فهرست واژه‌ها sees a search box, chips, and a list — and never learns that four drills (اسپیکینگ / لیسنینگ / رایتینگ / بازی) exist behind picking any category chip.
→ **Fix:** when `catFilter === 'all'`, render the same box greyed with one line: **«یک دسته را انتخاب کن تا تمرین‌های همان دسته باز شود»**. **Trivial**, and it makes an entire feature discoverable.

**b. Three empty states are blank pages.**
- Star filter with no stars: `goStars` is reachable from the header on any screen. `browseCount` renders «لغت‌های ستاره‌دار — 0 لغت» over an empty grid.
  → **«هنوز لغتی را ستاره‌دار نکرده‌ای. در کارت‌ها، هر لغتی را که بلد نبودی ستاره بزن تا اینجا جمع شود.»**
- Search with no hits: same blank grid.
  → **«لغتی با «{{ query }}» پیدا نشد.»** plus a button to the `add` screen — this is the exact moment a learner wants to add a word, and `goAdd` already exists.
- A user-created category with 0 words: chips are filtered by `countBy[k] > 0 || myCats.some(...)` (`app.jsx:1854`), so a fresh custom category shows as a chip that leads to nothing.
  → **«این دسته هنوز خالی است. از فهرست، دکمه‌ی پوشه کنار هر لغت را بزن تا به این دسته منتقلش کنی.»**

**Cost: trivial each.** All three are one `sc-if` on a value that already exists.

**c. 10,524 words, 60 at a time.** `limit` starts at 60 and grows by 60 (`app.jsx:2063`). Reaching the end of the unfiltered list is **175 taps of «نمایش بیشتر»**. Nothing indicates position in the list. Given the architect's plan makes فهرست واژه‌ها a top-level destination, it needs a **level filter chip row** (`A1 · ۸۴۲` … `C2`) beside the category chips, reusing `chunkOrder(r)` to define membership. Without it, the learner has no way to see "the words I am currently on". **Cost: moderate.**

---

### 12. `add` — small, but it lies about where بازگشت goes, and deleting a custom word shifts other words' progress

**a.** The بازگشت button (`template.html:9949`) calls `goHome` unconditionally. In the architect's structure `add` sits under فهرست واژه‌ها, so a learner who arrived from browse is thrown two levels up. Change to the plan's single **«بستن»** returning to `browse`.

**b.** `removeWord` (`app.jsx:179–191`) renumbers `d.order` (`i > gone.i ? i - 1 : i`) but only ever deletes the one key from `d.mastered`, and touches `d.starred` **not at all**. Every custom word added after the deleted one now has its tick and its star pointing at its neighbour. Contained to custom words (base indices are below `gone.i`), so it is small — but it is exactly the corruption `README.md` freezes `i` and `en` to prevent, reintroduced at runtime. Shift `mastered` and `starred` in the same pass, or key custom-word progress by `en`. **Cost: trivial to fix, and it is a correctness bug, not a UX one — flagging it here because I found it.**

**c.** The matching game hangs on small categories. `gameLevel` (`app.jsx:467`) takes `slice(0, 6)` pairs, and completion is `matchedN === 6` (`app.jsx:494`) — a hard-coded 6. `hasCatEx` admits categories with ≥4 words, so **«بازی این دسته»** on a 4- or 5-word category produces a board where every tile can be matched and the level never ends: no advance, no score, no message. Use `pairs.length` instead of the literal `6`. No built-in category is below 14 words, so today this only bites user-created categories — but those are one tap to make. **Cost: trivial.**

---

## Summary table

| # | Fix | Data exists? | Cost |
|---|---|---|---|
| 1 | Show the completed sentence + `exfa` in `cloze` | **Yes — all 10,524 words** | trivial |
| 2 | Name the mode/level/round on the study screen | **Yes — `roundName`/`levelLabel`/`roundInLevel` computed, 0 renders** | trivial |
| 3 | Speak the word on `mcq` pick | **Yes — delete a condition** | trivial |
| 4 | Stop claiming an AI checks the learner's sentence | **Yes — string only** | trivial |
| 5 | Flash hint instructs a tap that does nothing | **Yes** | trivial |
| 6 | Render `streak`; label the browse tick/star buttons | **Yes — `streak` computed, 0 renders** | trivial |
| 7a | Reject duplicate option *labels* in all 3 distractor loops (883 words) | **Yes** | trivial |
| 9a | Promote the quiz countdown at ≤10 words | **Yes — `nextQuizIn` exists** | trivial |
| 11a | Tell the learner the drills need a category | **Yes** | trivial |
| 11b | Three empty states in `browse` | **Yes** | trivial |
| 12a/b/c | `add` back target; `removeWord` index shift; game `matchedN === 6` | **Yes** | trivial |
| 8 (cheap half) | Stop `cloze` promising "a real sentence" | **Yes — string only** | trivial |
| 7b | Disambiguating hint when a gloss is not unique | Yes, derived | moderate |
| 9b/c | Quiz exit; make a failed quiz retakeable | Additive to `d.quizzes` | moderate |
| 10 | Daily target and a session boundary; honest progress denominator | Yes — `d.days[today]` already counted | moderate |
| 11c | Level filter in فهرست واژه‌ها | Yes — `chunkOrder` | moderate |
| 8 (real half) | Rewrite 10,524 example sentences | **No — 36 templates today** | large (content) |
| 7 (real half) | Disambiguate 476 shared Persian glosses (~1,200 words) | **No** | large (content) |

---

## Would need new work — kept separate on purpose

Two only, and neither is a new activity.

- **The `ipa` field.** `README.md` records that `ipa` is supported end to end and that no word carries it and nothing renders it. Confirmed: **0 of 10,524**. When the `pronunciation` agent runs, the study card has an obvious slot — under `card.en` at `template.html:9782`, in the same muted Inter style. Worth wiring the render *now*, guarded by `hasIpa`, so the content lands live. **Trivial to wire; the content is the `pronunciation` agent's 53 runs.**
- **`syn`.** Same state, 0 of 10,524. Lower value here — the flashcard is already dense — but it belongs in the `browse` row expansion rather than on the card.

## What I deliberately did not propose

- **No change to the five-mode rotation.** It is the best idea in the app. Every fix above makes it more legible, none simplifies it.
- **No new drill, no new screen, no new curriculum.** Every item is a string, a condition, or a value that is already computed.
- **No re-litigating structure.** The exits, the breadcrumb, the tab bar, the naming of `فلش‌کارت` → `کارت واژه`, and the demotion of `افزودن لغت` off the home screen are all settled in `docs/ux-structure-plan.md` and I have assumed them throughout.
- **No storage migration.** `d.goal` (#10) and the `d.quizzes` shape change (#9c) are both additive into `vocab_app_v1`, which `load()` already backfills field by field.
