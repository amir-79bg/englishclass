# مسیر یادگیری — the learning path

**Status:** decided, not implemented. Written for whoever edits `data/src/app.jsx` and `data/src/template.html` and then rebuilds.
**Written in English on purpose** — the reader is the implementer. Every string that ships to the learner is given in Persian, verbatim, ready to paste.

Assumes `docs/ux-structure-plan.md`, which is **shipped**: `NAV` (`app.jsx:20`), the three hubs (`HUBS`, `app.jsx:30`), the location strip (`CRUMB`, `app.jsx:2318`), `vocab_ui_v1` with `remember()`/`resumeGo()` (`app.jsx:90–108`), and the two-state lead card (`leadKicker`…`leadGo`, `app.jsx:2132–2139`) all exist in the source. This document does not re-decide any of that. It fills the one thing that structure left empty: **what the app tells you to do, and what it says when you finish.**

---

## The path in one paragraph

The app has one spine and two supports, and they are run **once a day, in the same order, as one thing called «درس امروز»**: twenty word cards, then one ساختار exercise, then one شنیدن-و-گفتن activity — about fifteen minutes, and when the third tick lands the day is over and the app says so. The order is not arbitrary and is the app's whole argument: **واژه‌ها gives you the units, ساختار teaches you to assemble them, شنیدن و گفتن makes you produce them** — you cannot chunk a sentence out of words you have never met, and you cannot talk for two minutes about a topic whose grammar you have not drilled. The A1→C2 ladder is the shared axis: every section opens at the same level, and a level is finished not by exhausting its 4,210 word-cards — nobody ever will — but by clearing **four checkpoints**, one per curriculum: pass a 300-word quiz, clear the level's three grammar lessons, clear جمله‌سازی, and do two listening texts and one discussion. That is roughly twenty sessions, about three weeks, and it is the first thing in this app that a person can actually finish. Nothing is ever locked: the app recommends exactly one next action at a time and everything else stays one tap away, because an adult studying alone does not need a gate, they need a sentence that says *this one, now*. And every completion screen in the app — all thirteen of them — stops offering a way back and starts naming the next thing, four of them across a section boundary, which is the connection the app has never made.

---

## 1. The unit of work: «درس امروز»

**One sitting is three steps and about fifteen minutes.**

| Step | Section | Size | Minutes | Complete when |
|---|---|---|---|---|
| ۱ | واژه‌ها › کارت‌ها | **۲۰ کارت** | ~۷ | `d.days[today()] >= (d.goal \|\| 20)` |
| ۲ | ساختار | **one exercise** (a grammar drill, a جمله‌سازی mode, or a collocation drill — 4–15 items) | ~۵ | that runner reaches its `done` state |
| ۳ | شنیدن و گفتن | **one text or one session** (20 lines + 3 questions, or one timed discussion) | ~۵ | listening quiz finished, or `dcFinish()` called |

Sizes are measured, not guessed. A grammar drill is 1–5 items (`GRAM`, verified: A1 lesson 1 = 5 choose / 4 fill / 3 err / 3 order; C2 lessons = 3/2/1/1). A جمله‌سازی mode is 6 chunk items, 3 expand items (2–3 steps each), or 4 combine items — identical at every level. Every listening text is exactly 20 lines and 3 questions. Discussion targets run 60s (A1) → 210s (C2) of speaking plus 30s prep.

**Why twenty cards.** It is what the app already promises on first run (`leadDesc`, `app.jsx:2136`) and never delivers, and `d.days[today()]` is already incremented on every `advance()` (`app.jsx:414`), so the counter exists. Note honestly: `d.days` counts **card answers, including a word re-shown after a wrong answer**, so the label must read **کارت**, not **واژه**. The first-run copy changes accordingly.

**Why three steps and not one.** A one-step session cannot fix "no flow" — the complaint is not that a session is missing, it is that the seven curricula have no stated relationship. The relationship *is* the session: three steps, three sections, same order, every day. That sentence is the product.

**What marks the day complete.** All three ticks in `vocab_ui_v1.day`. The app then shows the done card (§4, rule 13) and the lead card on «امروز» switches to its rest state until midnight.

---

## 2. The order, and why

**Spine: واژه‌ها › کارت‌ها.** It is the only place any English word is introduced, it is the only section with a genuine 10,524-item curriculum behind it, and it is the section every other section silently depends on. It is step 1 every single day, without exception.

**Support 1: ساختار.** Words are units; ساختار is the assembly instruction. `SENT`'s chunk items are level-L sentences made of level-L vocabulary; `GRAM`'s drills are sentences; `COLLOC2` is literally *which word goes next to which word*. All three are operations on a stock of words, and are worthless without one.

**Support 2: شنیدن و گفتن.** Both activities are production, not recognition. A listening text is 20 continuous lines with no glossary; a discussion session asks for 1–3.5 minutes of unscripted speech against a `check` list. They need the units *and* the assembly. They go last.

So: **input → assembly → output.** Same order daily. The learner can say it in one breath: «هر روز: بیست کارت، یک تمرین ساختار، یک کار شنیدن یا گفتن.»

### The order **inside** each support, at a given level L

**ساختار — the level's ladder, in this order (18 items per level):**

1. `دستور زبان` lesson 1 of L → its four drills, in the order `choose → fill → err → order`
2. lesson 2 → its drills · 3. lesson 3 → its drills
4. `جمله‌سازی` in its authored order: `pattern → chunk → expand → combine → free`
5. When all of the above are ≥۷۰٪: `ترکیب‌های رایج`, first group with an unscored drill, in `COLLOC2` order.

Grammar comes before جمله‌سازی because grammar lessons carry the only *explanatory prose* in the app (`why`, `rules`, `ex`, `pit` — 43 hand-written Persian-speaker pitfalls), and جمله‌سازی is drill-only: it assumes the rule and asks you to apply it. Collocations come last and are the overflow lane, **on purpose**: they are the one curriculum with no level axis (keyed by verb: `make`/`do`/`take`…, `app.jsx:1324`), so they cannot be part of a level ladder without inventing a level for them — which the structure plan already forbade. They are always available and never blocking.

**شنیدن و گفتن — the level's items (8 per level; 6 at C1/C2):**

1. First unread listening text of L → read with translation → play all → **quiz** → **shadow-record**
2. Then the next unread text; alternating with
3. First undone discussion session of L.

Listening precedes discussion at the same level because the text is where the model sentences come from — a learner who has just shadowed twenty lines about work has phrases to reach for when the discussion timer starts. The app should say this, once, on the first discussion of each level (§4, rule 12).

---

## 3. Prerequisites: nothing is locked. Exactly one thing is recommended.

**The decision: zero hard locks, zero disabled controls, and never more than one recommendation on screen at a time.**

The argument, in the app's own terms:

- **A lock here would have to disable real controls.** The level chips (`gLvChips2`, `lsLvChips`, `dLvChips`, `sbLvChips`) and the 22 collocation chips are the primary navigation of four screens. Greying eighteen of twenty-eight chips does not read as "not yet", it reads as "broken" — and the structure plan's own constraint is that nothing currently reachable becomes unreachable.
- **The learner may already be a B2.** There is no account, no placement test, and `levelOf(round)` starts everyone at A1 because it is derived from a counter that starts at 1. An app that locks B2 content behind 4,210 A1 cards would be wrong about most of its users on day one.
- **But the current state — everything open, nothing recommended — is the failure being fixed.** "Free choice" and "no guidance" are the same screen.

So the line is drawn here: **the path is advisory and singular.**

1. The lead card names **one** action. Not a list, not a menu.
2. Every completion screen names **one** primary next action (§4). Alternatives are ghost buttons, never absent.
3. Content ahead of the learner's level is entered freely but is **annotated**, not blocked. Opening a B2 listening text at A2 shows one dismissible amber line above the text:
   > «این متن دو سطح از جای فعلی تو جلوتر است. اگر سنگین بود، به سطح A2 برگرد — چیزی از دست نمی‌رود.»
4. The one place the path leans hardest, and still does not lock: entering a grammar drill for a lesson whose page has never been opened shows, above the first question:
   > «این درس را هنوز نخوانده‌ای. [ اول درس را بخوان ] — یا همین‌طور ادامه بده.»
   Both buttons work. The drill is running behind the note.
5. The recommended level carries the pin it already has (`levelChips` uses `ph-fill ph-map-pin` for the current band, `app.jsx:2148`); that same chip renderer is what marks the recommendation on all four section screens.

---

## 4. The completion rules table

Every activity, what it says at the end, and where the primary button goes. **Rule: the primary is always a specific next activity. «بازگشت» never occupies the primary slot again.** ✚ marks a hand-off across a section boundary — the app's main missing connection.

| # | Activity ends | Today | Primary button (new) | Goes to | Secondary |
|---|---|---|---|---|---|
| 1 | **۲۰ کارت روز تمام** (new event, inside `advance()`) | nothing exists | ✚ **«قدم دوم: {نام تمرین ساختار}»** | that ساختار runner | «ده کارت دیگر» · «برای امروز بس است» → home |
| 2 | **دوره‌ی واژه تمام** (`result` kind `round`, `app.jsx:2028`) | «دوره‌ی بعد» / «بعداً»→home | ✚ **«قدم دوم: {…}»** if today's step 2 is undone, else «دوره‌ی {n+1} · {روش}» | ساختار runner / `nextRound()` | the other of the two |
| 3 | **آزمون ۳۰۰ لغت — قبول** (`app.jsx:2024`) | «ادامه‌ی مرور» / «بازگشت به خانه» | ✚ **«قدم دوم: {…}»** | ساختار runner | «ادامه‌ی مرور» → `study` |
| 4 | **آزمون ۳۰۰ لغت — رد** | «ادامه‌ی مرور» / «آزمون دوباره» | **«آزمون دوباره»** | `startQuiz(mile)` | «۲۰ کارت دیگر مرور کن» → `study` |
| 5 | **درس دستور زبان خوانده شد** (`glesson`; today only `glBack`→`gram`) | «بازگشت» | **«حالا تمرین کن — چهارگزینه‌ای · {n} سؤال»** | `gramDrill(les,'choose')` | «بستن» in the strip |
| 6 | **تمرین دستور زبان تمام** — نمره ≥۷۰٪ (`csrun` done, `kind:'gram'`) | «بازگشت» → `glesson` | **«تمرین بعدی این درس: {نام}»**; when all four ≥۷۰٪ → **«درس بعدی: {t}»**; when the level's 3 lessons are done → ✚ **«قدم سوم: {…}»** | `csStart` / `openGramLesson` / skills runner | «بستن» |
| 7 | **تمرین دستور زبان تمام** — نمره <۷۰٪ | same «بازگشت» | **«همین تمرین را دوباره بده»** | `csStart` same cfg | «درس را دوباره بخوان» → `glesson` |
| 8 | **تمرین ترکیب‌های رایج تمام** (`csrun`, `kind:'colloc'`) | «بازگشت» → `colloc` | ≥۷۰٪: **«تمرین بعدی این گروه: {نام}»**, then **«گروه بعدی: {label}»**; <۷۰٪: **«دوباره»** | `cVerbDrill`/`cMeaningDrill`/`cProduceDrill` | ✚ «برگرد به درس امروز» → home |
| 9 | **حالت جمله‌سازی تمام** (`sbrun` done) | «دوباره» → same mode | **«تمرین بعدی: {الگو→بلوک→گسترش→ترکیب→آزاد}»**; after `free` → ✚ **«قدم سوم: {…}»** | `sbStart(next)` / skills runner | «دوباره» |
| 10 | **متن شنیداری** (no completion event exists today) | — | **«آزمون درک مطلب — ۳ سؤال»** (`ltQuizGo`, already wired at `template.html:10795`) — promote to the page's single primary | in-page quiz | «پخش دوباره» |
| 11 | **آزمون متن تمام** (`lqrClose`, `app.jsx:1736` — returns to the same text) | «بستن آزمون» | ≥۷۰٪: **«حالا بازگویی کن — صدای خودت را ضبط کن»** (scrolls to `ltRecGo`); after recording → ✚ **«جلسه‌ی گفت‌وگو: {titleFa}»**. <۷۰٪: **«یک بار دیگر متن را با ترجمه بخوان»** | recorder / `openDisc` / line 1 with `ltShowFa` on | «بستن» |
| 12 | **جلسه‌ی گفت‌وگو ثبت شد** (`dcFinish`, `app.jsx:1838` — stays on the screen) | «ثبت شد» and nothing else | **«درس امروز تمام شد»** card (rule 13) | home | «جلسه‌ی بعدی: {titleFa}» |
| 13 | **هر سه قدم امروز تیک خورد** (new) | nothing exists | **«تمام شد — فردا می‌بینمت»** card with three ticks and today's numbers | home | «یک تمرین اضافه» → the ساختار hub |
| 14 | **بازی جفت‌سازی / بازی جمله / بازی دستور زبان / بازی ترکیب‌ها** | `gQuit`→`words`, `sbgRetry`, `csGameRetry` | ✚ **«برگرد به درس امروز»** | home lead card | «دوباره» |
| 15 | **تمرین دسته (`exercise`) تمام** (`exBack`→`browse`, `app.jsx:741`) | «بازگشت به فهرست» | **«تمرین بعدی این دسته: {گفتن→شنیدن→نوشتن}»** | `startEx(next)` | ✚ «برگرد به درس امروز» |

Games (14) and category drills (15) are deliberately **not** steps of «درس امروز» — they are the extras lane, and their completion screens say so by pointing back at the lesson rather than pretending to be part of it.

### Exact Persian for the four cross-section hand-offs

Rule 1 — the non-blocking card between two word cards (not a new screen):

> **۲۰ کارت امروز تمام شد.**
> «قدم دوم درس امروز: **دستور زبان A1 — درس «to be»** · حدود ۵ دقیقه.»
> **[ قدم دوم ]**   [ ده کارت دیگر ]   [ برای امروز بس است ]

Rule 6/9 — end of the ساختار step:

> **قدم دوم تمام شد ✓**
> «حالا کاری که یاد گرفتی را بشنو و به زبان بیاور.»
> **[ قدم سوم: متن «My Day» ]**   [ یک تمرین ساختار دیگر ]

Rule 11 — end of the listening quiz, into discussion:

> **۳ از ۳ درست ✓**
> «همین موضوع، این بار با زبان خودت: جلسه‌ی گفت‌وگوی «یک روز من».»
> **[ جلسه‌ی گفت‌وگو ]**   [ بازگویی این متن ]

Rule 13 — the day is done:

> **درس امروز تمام شد**
> ✓ ۲۰ کارت واژه  ✓ دستور زبان — «to be»  ✓ متن «My Day»
> «۱۶ دقیقه، سطح A1. سه کار از چهار کارِ سطح A1 مانده.»
> **[ باشد، فردا ]**   [ یک تمرین اضافه ]

---

## 5. Day-one walkthrough

A brand-new learner, `vocab_ui_v1` empty, `vocab_app_v1` empty.

**Screen 1 — «امروز».** One card above the fold, exactly as `leadKicker`/`leadTitle`/`leadDesc` already render it, with the step list added underneath and the section cards demoted below the fold:

> از اینجا شروع کن
> ### درس امروز — حدود ۱۵ دقیقه
> «سه قدم، هر روز همین سه قدم: واژه یاد می‌گیری، یاد می‌گیری کنارِ هم بگذاری‌شان، بعد به کارشان می‌بری.»
> ① ۲۰ کارت واژه‌ی سطح A1 · ۷ دقیقه
> ② دستور زبان A1 — درس «to be» · ۵ دقیقه
> ③ متن شنیداری «My Day» · ۵ دقیقه
> **[ شروع ]**

**Screen 2 — `study`, card 1 of 20.** The location strip already says `واژه‌ها · کارت‌ها` and `0 / 842`. Add one thin amber bar under it:

> **هدف امروز: ۰ از ۲۰ کارت**

The `0 / 842` counter stays — it is the round's honest position — but it is no longer the only number on screen, which is what made it demoralising.

**Screens 3–22 — twenty cards** in `flash` mode (round 1 → `MODES[0]`).

**Screen 23 — the target card** (rule 1 above), rendered between cards, not as a new screen. Learner presses **[ قدم دوم ]**.

**Screen 24 — `glesson`, «to be».** Opens on the explanation: `why`, `rules`, three examples, the pitfalls block. At the bottom, one primary:

> **[ حالا تمرین کن — چهارگزینه‌ای · ۵ سؤال ]**

**Screens 25–29 — the `choose` drill.** Five questions, each with its `why`.

**Screen 30 — drill result.** Score ≥۷۰٪:

> **۴ از ۵ درست**
> **[ تمرین بعدی این درس: پر کردن جای خالی ]**   [ قدم سوم: متن «My Day» ]

At this point the day's step-2 tick has already landed, so «قدم سوم» is offered as the secondary and the ladder continues as the primary. If the learner presses «قدم سوم»:

**Screen 31 — `ltext`, «My Day».** 20 lines with Persian, playback controls, speed chips. Single primary at the bottom: **[ آزمون درک مطلب — ۳ سؤال ]**.

**Screens 32–34 — three questions. Screen 35 — result → [ حالا بازگویی کن ].**

**Screen 36 — recorder.** After the recording exists: **[ جلسه‌ی گفت‌وگو: «یک روز من» ]** — but the third tick has landed, so the app shows rule 13 first:

> **درس امروز تمام شد** · ✓✓✓ · «۱۶ دقیقه. فردا از کارت ۲۱ ادامه می‌دهیم.»
> **[ باشد، فردا ]**

Total: one first action, three steps, thirteen screens of actual work, and at no point did the learner choose between eleven things.

---

## 6. The loop — a returning learner

On every load of «امروز», the app computes today's plan once and stores it:

```
lv        = ui.lv || levelOf(d.round)               // course level
step1     = کارت‌ها, resume at d.pos, target d.goal||20
step2     = first unfinished item in the ساختار ladder of lv   (§2)
step3     = first unfinished item in the شنیدن و گفتن list of lv (§2)
```

"Unfinished" is read from storage that already exists, with no new bookkeeping:

| Item | Finished when |
|---|---|
| grammar lesson drill | `csScore('g_'+les.id+'_'+mode) >= 70` |
| grammar lesson | all four of its drills ≥۷۰٪ |
| جمله‌سازی mode | `sbLoad().s[lv+'_'+mode] >= 70` (`pattern` and `game` are never gates — see §9) |
| collocation drill | `csScore('c_'+key+suffix) != null` |
| listening text | `lsProg().q[id] >= 70` |
| discussion session | `dcProg().s[id]` exists |

**The lead card, three states.**

- **First run** (`!ui.seen`): as §5.
- **Mid-day** (plan exists, some ticks): kicker «ادامه‌ی درس امروز», title = the next undone step's name, desc = «قدم ۲ از ۳ · حدود ۵ دقیقه», button «ادامه». The existing `resumeGo(ui.last)` stays as the fallback when the plan cannot be computed — it is strictly better than `screen:'words'`.
- **Day complete** (three ticks, same calendar day): kicker «تمام شد», title «درس امروز انجام شده», desc «۲۰ کارت · دستور زبان · شنیدن — فردا از کارت ۲۱ ادامه می‌دهیم.», button **«یک تمرین اضافه»** → the ساختار hub. The day is finished; the app does not pretend otherwise, and it does not stop a learner who wants more.

**When the level's skills items run out.** A level has only 8 skills items (6 at C1/C2) against ~20 sessions. When every text and session of `lv` is finished, step 3 becomes an explicit repeat rather than a silent one:

> ③ **بازگویی متن «My Day»** — «همه‌ی متن‌ها و جلسه‌های سطح A1 را انجام داده‌ای. بازگویی متنی که می‌شناسی، برای لهجه از هر تمرین تازه‌ای مؤثرتر است.»

That is not a fudge: shadowing a known text is the correct repeat for this activity, and §10 records that the content is genuinely thin here.

---

## 7. Level advancement

**Today.** `levelOf(d.round)` (`app.jsx:293`) with `PER_LEVEL = 5`: the level advances only when five full word rounds are exhausted. At A1 that is 5 × 842 = **4,210 cards** — 210 sessions at twenty a day. It will never happen. Meanwhile the other four sections default to that same level (`goSent:775`, `goGram:1188`, `goListen:1565`, `goDisc:1754`) and then drift to whatever chip the learner last tapped, in memory only.

**The decision: a level is finished when its four checkpoints are passed, not when its words are exhausted.**

| Checkpoint | Passed when | Read from |
|---|---|---|
| **واژه‌ها** | any milestone quiz taken at a round of this level scored ≥۷۰٪ | `d.quizzes['<round>:<mile>']` — already records the best percentage of *every* attempt (`app.jsx:466`) |
| **دستور زبان** | all three lessons of the level have ≥۱ drill at ≥۷۰٪ | `vocab_course.s` |
| **جمله‌سازی** | `chunk`, `expand` and `combine` of the level all ≥۷۰٪ | `vocab_sent.s` |
| **شنیدن و گفتن** | ۲ listening quizzes of the level ≥۷۰٪ **and** ۱ discussion session of the level recorded | `vocab_listen.q`, `vocab_disc.s` |

At twenty cards a day the first 300-word quiz arrives on session 15, and the other three checkpoints need ~16 sessions of steps 2 and 3. **A level is about twenty sessions, three weeks.** That is the number the app has never been able to state and now can.

**What the app says, the first time all four flip.** The lead card is replaced, once, by a full-width card (guarded by `ui.lvDone[L]` so it fires exactly once):

> **سطح A1 تمام شد**
> ✓ آزمون ۳۰۰ لغت — ۸۵٪
> ✓ هر سه درس دستور زبان A1
> ✓ جمله‌سازی A1 — بلوک، گسترش، ترکیب
> ✓ ۲ متن شنیداری و ۱ جلسه‌ی گفت‌وگو
> «سطح A2 هزار و صد و پنجاه‌وهشت واژه‌ی تازه دارد. هیچ‌چیز از A1 پاک نمی‌شود — واژه‌های A1 در فهرست واژه‌ها همیشه در دسترس‌اند.»
> **[ شروع سطح A2 ]**   [ کمی بیشتر در A1 بمانم ]

**What «شروع سطح A2» does.** Three writes, all of them things the app already does elsewhere:

1. `ui.lv = 'A2'`, `ui.lvDone.A1 = 1`.
2. Every section's default level now reads `ui.lv` instead of `levelOf(d.round)` — one helper, four call sites.
3. **Word cards move with the learner**: if `band(d.round) < LEVELS.indexOf('A2')`, set `d.round = 6`, `d.pos = 0`, `d.order = chunkOrder(6, n)`. This is exactly what `nextRound()` (`app.jsx:424`) already does, via the same `set()`. `mastered`, `starred`, `days`, `streak` and `quizzes` are untouched.

**«کمی بیشتر در A1 بمانم»** sets `ui.lvDone.A1 = 1` and nothing else — the card does not come back, the level does not move, and the daily lesson keeps drawing A1 items until the learner uses the level chips or the card is re-offered from the ساختار hub as a small line: «سطح A1 را تمام کرده‌ای — [ برو به A2 ]».

---

## 8. The state you need

**No new key.** Everything lives in `vocab_ui_v1`, which already exists (`uiLoad`, `app.jsx:90`) and — verified — **is already in the export list** at `app.jsx:2170`, so backups carry it. Plus one additive field in `vocab_app_v1`.

```json
// vocab_ui_v1  — existing key, four new fields
{
  "seen": true,
  "last": { "screen": "glesson", "label": "دستور زبان", "sub": "سطح A1 · to be" },

  "lv":   "A1",
  "day":  { "d": "2026-08-09", "w": 1, "s": "g_a1_1_choose", "k": "l_a1_time" },
  "plan": { "d": "2026-08-09", "s": ["gram","a1_1","choose"], "k": ["listen","l_a1_time"] },
  "lvDone": { "A1": 1 }
}
```

| Field | Meaning | Default for a learner who already has progress |
|---|---|---|
| `lv` | the course level all sections open at | **absent ⇒ `levelOf(d.round)`** — read it as `ui.lv \|\| this.levelOf(this.load().round)`. An existing learner opens at exactly the level they open at today. Nothing moves. |
| `day` | today's three ticks; `d` is the date string, so a stale record is ignored | absent, or `d !== today()` ⇒ zero ticks. A learner who studied this morning before the update simply gets a fresh day; `d.days[today()]` still holds their card count, so step 1 may already read as done. Correct behaviour, no migration. |
| `plan` | today's chosen step-2 and step-3 items, so the card does not move under the learner mid-day | absent ⇒ computed on next render and written. |
| `lvDone` | which levels have already been announced | absent ⇒ `{}`. **Important:** an existing learner at, say, B1 would otherwise be shown "A1 تمام شد" retroactively. On first read, if `ui.lv` is absent, seed `lvDone` with every level **below** `levelOf(d.round)` set to `1`. One line, and it is the only piece of back-fill this design needs. |

```json
// vocab_app_v1 — one additive field
{ "goal": 20 }
```

`load()` (`app.jsx:306–333`) already backfills missing fields on every read, so `d.goal` needs no migration; read it as `d.goal || 20` everywhere so an untouched save behaves identically. `d.days`, `d.quizzes`, `d.mastered` are read but **never written differently** by anything in this document.

**Nothing is renamed, re-scoped, deleted, or read differently.** `vocab_course`, `vocab_sent`, `vocab_listen`, `vocab_disc`, `vocab_game` are read-only inputs to the plan computation.

---

## 9. Ordered changes

Ranked by how much of "من هیچ فلویی ندارم" each one removes per unit of work.

---

### 1. The daily target and the first hand-off — «۲۰ کارت، بعد قدم دوم»

**What.** Add `d.goal` (default 20). In `advance()`'s callback (`app.jsx:416–422`), after the existing round-end and milestone checks, fire once per day when `d.days[today()]` crosses the goal: a non-blocking card between cards (rule 1). Its primary calls the step-2 launcher. Add the thin «هدف امروز: ۱۲ از ۲۰ کارت» bar to the `study` screen under the location strip. Change the first-run `leadDesc` from «۲۰ واژه» to «۲۰ کارت».

**Why.** This is the single largest piece of "there is no flow": it creates the session that does not exist, *and* it creates the first cross-section hand-off in the app's history. One change, both halves of the complaint.

**Cost.** Moderate. One field, one guard in `advance()`, one card, one bar. **Depends on:** nothing (the step-2 launcher can be a stub that opens the ساختار hub until change 3 lands).

---

### 2. Rewrite every completion screen's primary button

**What.** The thirteen rules in §4. Concretely: `resultActions` (`app.jsx:2024`, `2038`), `exBack`/`exRetry` (`741`, `740`), `gQuit`/`gRetry` (`761`, `760`), `sbRetry` (`1076`, `1123`, `1150`), `csBackGo` (`1544`) and `csGameRetry` (`1554`), `lqrClose` (`1736`), `ltQuizGo` (`1714`) promoted to the text page's sole primary, `dFinishGo` (`1931`) followed by the done card, `glBack` (`1434`) demoted below a new drill primary.

**Why.** *"Not one of them proposes what to do next."* Thirteen dead ends become thirteen sentences, four of which cross a section boundary. This is the change the owner will feel on every screen, not just at the start of a session.

**Cost.** Moderate — thirteen small edits, each one a label and a handler, plus one shared `nextAfter(kind, key, pct)` helper that returns `{label, go}` so the rules live in one place rather than thirteen. **Depends on:** change 4 for the level-scoped "next item" lookups; ships before it in a degraded form (next item *within* the current lesson/group only), which is already most of the value.

---

### 3. «درس امروز» — the three-step lead card and the day record

**What.** Compute the plan (§6), store `ui.day` and `ui.plan`, render the lead card in its three states, and add the three-step list under the button on «امروز». The done card (rule 13). The step-2 and step-3 launchers used by change 1 and change 2.

**Why.** This is where the seven curricula are finally given a stated relationship — not in prose on a hub, but as three numbered steps a learner does today. Changes 1 and 2 make the flow work; this one makes it *visible*.

**Cost.** Moderate. One `todayPlan()` method (~60 lines of lookups against storage that all exists), three card states in the existing lead-card markup (`template.html:9626–9633`), one new done card. **Depends on:** change 1.

---

### 4. `ui.lv` — one course level for all four sections

**What.** Add `uiLevel()` returning `ui.lv || this.levelOf(this.load().round)`. Replace the fallback in `goSent` (`775`), `goGram` (`1188`), `goListen` (`1565`), `goDisc` (`1754`). Seed `lvDone` for existing learners as in §8. The level chip row (`levelChips`, `app.jsx:2144`) renders from `uiLevel()` on «امروز» and all three hubs.

**Why.** Answers "are these a sequence, alternatives, or extras?" structurally: five parallel tracks through **one** ladder that now has a single owner, plus collocations which say out loud that they are organised differently. Today four sections *derive* the same level and then silently diverge the moment a chip is tapped.

**Cost.** Moderate. One helper, four call sites, one seed line. **Depends on:** nothing; makes changes 2, 3 and 5 correct rather than approximate.

---

### 5. The four level checkpoints and the level-complete card

**What.** One `levelStatus(L)` method returning the four booleans of §7 from the five existing progress keys; a compact four-row block on «امروز» below the lead card («سطح A1 — ۲ از ۴ کار انجام شده») and the once-only completion card with its two buttons and the `d.round` jump.

**Why.** Gives the app a finishable unit larger than a day. Without it the level ladder is decoration: visible, shared, and unreachable at 4,210 cards a level.

**Cost.** Moderate-to-large — the status computation is straightforward but touches five keys and needs care around `d.quizzes` keys (`'<round>:<mile>'`, mapped to a level via `band()`). **Depends on:** change 4.

---

### 6. Advisory notes instead of locks

**What.** The two annotations of §3: the level-ahead line on any runner opened above `uiLevel()`, and the unread-lesson line inside a grammar drill. Two strings, two booleans.

**Cost.** Trivial. **Depends on:** change 4 for the comparison level.

---

### 7. Games and category drills point back at the lesson

**What.** Rules 14 and 15 — add «برگرد به درس امروز» to the four game-over screens and the `exercise` result, and give the `exercise` result a "next drill in this category" primary.

**Why.** Small, but it is the difference between an extras lane and a place you get lost in. `gQuit` already goes to `words` rather than `home` since the structure plan; this makes the extras *return* the learner to the path instead of merely to a hub.

**Cost.** Trivial. **Depends on:** change 3 for the target.

---

## 10. Where the content is genuinely too thin to carry this path

Stated rather than designed around, as required. All figures measured from the bundle assets.

- **شنیدن و گفتن runs out first, and by a wide margin.** A level is ~20 sessions. A level has **4 listening texts and 4 discussion sessions** — and C1 and C2 have only **2 texts each** (verified: LISTEN A1–B2 = 4, C1 = 2, C2 = 2; DISC = 4 at every level). Step 3 therefore has new content for 8 of ~20 sessions at A1–B2 and 6 of ~20 at C1–C2. §6 turns the remainder into deliberate re-shadowing, which is defensible pedagogy but is not the same as content. **Four more texts per level (24 more overall) would make step 3 self-sufficient**; that is the single highest-value content commission in the app.
- **Every listening text has exactly 3 comprehension questions.** Three questions is a formality, not a checkpoint, and §7 leans on two of them per level as a quarter of level completion. Six per text would let the quiz carry the weight the path puts on it.
- **جمله‌سازی is identical in size at every level** — 3 patterns, 6 chunks, 3 expand, 4 combine, at A1 and at C2 alike. The section does not get bigger as the learner gets better, so the same ladder that takes a beginner five sessions takes a C2 learner five sessions of much easier work per item.
- **C2 grammar drills are below drill size.** Lesson-level counts fall from 5/4/3/3 (A1 lesson 1) to **3/2/1/1** (C2). A one-question «مرتب‌کردن جمله» is a question, not an exercise, and the path treats it as a step of a day.
- **Collocations have no level and cannot get one.** 22 groups, 349 phrases, keyed by verb. The path uses them as the overflow lane precisely because they cannot be slotted into the ladder — this is a fact about the content, not a design preference, and it is why change 4 does not touch them.
- **The word spine is 400× the size of everything else combined.** 10,524 words against 18 lessons, 20 texts, 24 sessions, 22 groups and 96 جمله‌سازی items. Any path that gates on exhausting the words is fiction, which is why §7 gates on checkpoints instead.

---

## 11. What I deliberately left open

- **The five-mode rotation.** `MODES` cycles flashcard → four-choice → typed → audio → in-sentence per round (`app.jsx:353`). It is already a designed sequence with a stated rationale, and the daily lesson simply rides whichever mode the current round is in. Re-sequencing it would be re-deciding a decision that was already made well.
- **Which collocation group comes when.** All 22 stay freely choosable in whatever order the learner likes. They are the one curriculum with no level, the one lane where browsing is the point, and forcing them into an order would be inventing a pedagogy the content does not have.
- **The order of the 10 discussion methods and of the sessions within a level.** Four sessions per level differ by *method*, not by difficulty (`target` is identical within a level — verified: A2 = 90s ×4, B1 = 120s ×4). There is no ordering in the data to surface, so the path takes them first-undone-first and says nothing more.
- **فهرست واژه‌ها, افزودن واژه, and the three games are outside the daily lesson.** They are reference and play. Putting them in the lesson would make the lesson longer without making it better, and rules 14–15 make sure they return the learner to the path.
- **«جمله‌ی خودت» (free writing) is never a checkpoint.** Its score is a heuristic (`sbFreeCheck`, `app.jsx:888`) that cannot fail a serious attempt and cannot pass a bad one reliably; gating a level on it would be dishonest. It stays as the last rung of the جمله‌سازی ladder and as a hand-off point, not a gate.
- **«آزمایشگاه الگو» is not gradable and is not a gate.** `pattern` writes no score (verified: no `sbMark` call in the pattern branch). It is exploration, it belongs first in the ladder, and it completes by the learner leaving it.
- **No streaks, no XP economy, no rewards.** `d.streak` and `vocab_game.xp` already exist and already accumulate; the path does not build on them, because a daily lesson that a person can finish is a better reason to return than a number that punishes them for missing a day.
- **No placement test.** An existing learner keeps their level; a new one starts at A1 and can move the level chip on any of the four sections the moment they find A1 too easy — which, under §3, is never blocked and is annotated when it happens.
