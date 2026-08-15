# گفت‌وگوی آزاد — UX review

**Section:** free discussion. Screens `disc` (hub) and `dses` (session runner).
**Logic:** `dcSessions`…`dcFinish` and `discVals`, `data/src/app.jsx:1559–1742`.
**Markup:** `data/src/template.html:10815–10859` (`isDisc`) and `10862–10957` (`isDSes`).
**Data:** `window.DISC` — asset `0592dc99-726f-4190-aa79-f892c95cbf80`.

Written in English for the implementer. Every string that ships to the learner is given in Persian, verbatim.

Fits inside the structure decided in `docs/ux-structure-plan.md`: `disc` becomes **شنیدن و گفتن › گفت‌وگوی آزاد** (depth 2), `dses` becomes its runner (depth 3) with the shared location strip and a single **بستن**. Nothing below changes that placement; everything below is inside the two screens.

---

## The data, verified

24 sessions, and the shape is perfectly uniform — this is the best-maintained curriculum in the app:

| | |
|---|---|
| levels | A1, A2, B1, B2, C1, C2 — **exactly 4 sessions each**, no thin level |
| methods | 10, all used: `hotseat` 3, `compare` 3, `role` 3, `problem` 3, `debate` 3, `wouldyou` 2, `story` 2, `rank` 2, `agree` 2, `picture` 1 |
| per session | `id lv method target title titleFa brief phrases ladder task taskFa check` — **all 12 present on all 24**, zero gaps |
| `phrases` | exactly 5 on every session, each `{en, fa}` |
| `ladder` | exactly `start` 3 / `follow` 3 / `deep` 2 = **8 questions** on every session |
| `check` | exactly 3 Persian items on every session |
| `target` | 60–75s (A1) → 90 (A2) → 120 (B1) → 150 (B2) → 180 (C1) → 210 (C2) |
| `tips` | 3 Persian lines per level, all 6 levels present |
| `methods[k]` | `fa`, `icon`, `c`, `how` — a full Persian explanation on all 10 |

**There is no unrendered field.** I went looking for the usual gold — a `pit`-style explanation sitting in the data and never reaching the screen — and this section does not have one. `brief` → `dBrief` (`app.jsx:1703`), `phrases` → `dPhrases` (1705), `ladder` → `dQ` (1709), `task`/`taskFa` → `dTask`/`dTaskFa` (1729), `check` → `dChecks` (1730), `tips` → `dTips` (1736), and the 10 methods are explained **twice**: the full list behind the hub disclosure (`dMethodList`, 1682) and the current session's own `how` on the runner (`dMethodHow`, 1702).

That is worth stating plainly, because it changes what this report is. The discussion section's problem is **not** hidden content. It is that a learner is handed four numbered blocks of correctly-rendered material and never told, moment to moment, which one they are supposed to be talking into — and that the one device that could give them feedback, the microphone, is never explained, never connected to anything, and does not turn off when they leave.

There is exactly one dead field, and it is state rather than data: **`dNote`** is initialised in `openDisc` (`app.jsx:1574`) and never read or written anywhere in the file — while the prep-timer label tells the learner **«زمان آمادگی — یادداشت بردار»** (`app.jsx:1716`), i.e. instructs them to take notes in an app that gives them nowhere to write.

---

## Walking it as a first-time learner

**Entry.** Home card (`template.html:9698–9704`) reads «گفتگوی آزاد — A1 تا C2» plus `discCardDesc`: *"۲۴ جلسه‌ی گفتگوی آزاد در ۱۰ روش استاندارد — با تایمر آزمون، سؤال‌های پلکانی و ضبط صدا"*. Four nouns, none of which mean anything yet. There is also header icon #5 (`template.html:9612`), a 32px `ph-chats-circle` whose only label is a `title=` tooltip that does not exist on a phone. Both land on `disc`.

**Hub (`disc`).** Actually decent. Title, a paragraph that does describe the shape of a session, a dashed «روش‌های گفتگو چیست؟» button that expands all ten methods with real Persian explanations, six level chips with `done/total` counts, and four session rows. A learner can orient here. Two problems: the methods disclosure defaults closed and is styled as a dashed secondary button, so the single most explanatory thing on the screen looks optional; and `dTotal` — *«مجموع زمان صحبت تو: X دقیقه»* — is the headline stat and, for reasons in §3 below, is frequently a permanent zero.

**Runner (`dses`).** Here it falls apart. The learner gets, top to bottom: title, `brief`, `how`, then **۱ عبارت‌های آماده**, **۲ سؤال‌های پلکانی**, **۳ تکلیف اصلی و تایمر**, **۴ خودارزیابی**. Numbering four blocks is more guidance than any other section in this app gives — and it still does not answer the question the learner is actually asking, which is *when do I start talking, and to whom?*

- Caption 2 is *«سؤال‌های پلکانی — دکمه‌ی بلندگو سؤال را می‌پرسد»*. It describes a **button**, not a task. It never says "answer each one out loud." A learner can read all 8 questions, press the speaker on each, and complete step 2 having said nothing.
- Step 3's `task` is a *second, different* speaking assignment ("Introduce yourself in one minute…"). Nothing states the relationship between 8 ladder questions and 1 task: sequence? alternatives? warm-up? The timer is attached only to step 3, which implies step 2 is optional — but the `check` items are written to grade step 2 (`"هر جواب حداقل دو جمله بود"` — *every answer*, plural, i.e. the ladder).
- Step 4 is tappable from the moment the screen opens, before a word has been spoken.

**Feedback.** There is none except self-grading. That is inherent to the activity and not a defect — but the app owns a microphone and uses it as decoration. See §2.

**Progress.** The best-served part. Level chips show `A1 · 2/4`, done rows get a green border, rows show `n بار انجام شده`, `dSavedLabel` reports best self-assessment. Fine as is.

**Exit and return.** `dBack` (`app.jsx:1704`) goes hub-ward — correct destination, wrong word (**بازگشت**; the plan standardises on **بستن**). But leaving mid-session silently destroys ticked checks, elapsed speaking time and the recording, and does not stop the microphone.

---

## Ranked fixes

Ranked by confusion removed per unit of work. Items 1–4 need **no new curriculum content**; 1, 3 and 4 are string and control-flow edits only.

---

### 1. Tell the learner what to *do* in each of the four steps — rewrite four static captions

**Now.** The four step captions are hard-coded strings in the template. All four name a UI control or a noun; none contains a verb aimed at the learner:

- `template.html:10877` — «۱ · عبارت‌های آماده — قبل از شروع بلند تکرارشان کن» *(the only one that does instruct)*
- `template.html:10890` — «۲ · سؤال‌های پلکانی — دکمه‌ی بلندگو سؤال را می‌پرسد»
- `template.html:10907` — «۳ · تکلیف اصلی و تایمر»
- `template.html:10932` — «۴ · خودارزیابی — هر مورد را که رعایت کردی بزن»

The learner never learns that steps 2 and 3 are both *speaking*, that step 2 comes first as practice and step 3 is the timed performance, or that nobody is listening and that is intentional.

**The change.** Replace the three weak captions, and add one orientation line directly under `dBrief` at `template.html:10874`. All static text; no data, no state, no logic.

New line under the brief (static, same for every session):

> **این جلسه چهار قدم دارد و کسی آن‌طرف نیست — همه‌اش را بلند برای خودت می‌گویی:**
> «عبارت‌ها را تمرین کن ← به هشت سؤال بلند جواب بده ← تکلیف اصلی را با تایمر انجام بده ← ضبطت را گوش کن و خودت را ارزیابی کن.»

Caption 2 → «۲ · هشت سؤال، سه پله — هر سؤال را بلند جواب بده، دست‌کم دو جمله. دکمه‌ی بلندگو سؤال را برایت می‌خواند.»

Caption 3 → «۳ · تکلیف اصلی — این بار با تایمر و بدون توقف حرف بزن.»

Caption 4 → «۴ · خودارزیابی — اول ضبطت را پخش کن، بعد هر موردی را که رعایت کرده‌ای بزن.»

**Data support.** Complete — pure static strings. Nothing in `DISC` changes.

**Cost.** **Trivial.** Four string replacements plus one added `<div>`.

---

### 2. Give the microphone a stated purpose, and put the playback where the checklist is

**Now.** A button labelled **«ضبط جواب»** (`app.jsx:1726`) sits beside the timer. Nothing says why. Press it, speak, press again, and a bare `<audio controls>` appears at `template.html:10925–10927` with no caption — 260px of unlabelled browser chrome between the timer and the self-assessment. `dcFinish` (`app.jsx:1638`) never looks at it, `dcDone` never stores it, and `openDisc` clears `dUrl` so it is gone the moment you leave. In the only section of this app with no interlocutor and no automatic marking, the one channel that could tell a learner *how they actually sounded* is presented as an unexplained toggle.

Second half of the problem: **recording and the timer are two independent buttons.** The obvious path — press the big orange «۳۰ ثانیه آمادگی + زمان هدف», wait, speak — produces no recording at all. The learner has to know to press both.

**The change.** Three parts, all inside `template.html:10912–10935` and `app.jsx:1594–1634`:

1. Caption the record button's purpose, once, above the timer row: «ضبط برای این است که بعد خودت گوشش بدهی — هیچ‌کس دیگری آن را نمی‌شنود و جایی ذخیره نمی‌شود.»
2. Have `dcPrep()` start the recorder when it starts the prep countdown, and `dcSpeakStart`'s end-of-timer branch (`app.jsx:1618`) stop it, so the default path records automatically. Keep the manual button for re-takes; relabel idle state to «ضبط دوباره».
3. **Move the `dHasUrl` audio block from `10925` to immediately above the `dChecks` grid at `10933`**, under the caption «ضبطت را پخش کن و با فهرست زیر مقایسه کن». The playback and the three things it is meant to be judged against then sit in the same box.

**Data support.** Complete — `check` already exists per session and already renders; the audio already exists. This is a re-ordering plus two captions plus two lines of wiring. No new content.

**Cost.** **Trivial** for parts 1 and 3, **moderate** for part 2 (recorder lifecycle inside the timer, and the `dRec` label states have to stay coherent).

---

### 3. Three straightforward bugs, all cheap

**3a — The microphone keeps recording after the learner leaves the screen.** `dcStop()` (`app.jsx:1575–1578`) clears `this.dIv` and cancels speech synthesis. It never touches `this.dMr`. `dBack`, `goDisc` and `openDisc` all call `dcStop()`. So: start recording, press **بازگشت**, and the `MediaRecorder` and its `getUserMedia` stream stay live — the phone's recording indicator stays lit, indefinitely, with no UI anywhere to turn it off. `mr.onstop` never fires, so the tracks are never stopped either. Fix: in `dcStop`, `if (this.dMr && this.dMr.state !== 'inactive') this.dMr.stop(); this.dMr = null;` and revoke the previous `dUrl` (`URL.revokeObjectURL`) before assigning a new one in `dcRecToggle` (`app.jsx:1628`) — the current code leaks a blob per take. **Cost: trivial.** Rank this first if the owner ships only one thing; it is the only finding here that is a real defect rather than a clarity problem.

**3b — Target time is rendered as nonsense.** `app.jsx:1677`: `'هدف ' + mmss(x.target) + ' دقیقه'`. `mmss(210)` is `"3:30"`, so every C2 row reads **«هدف 3:30 دقیقه»**, and every A1 row reads **«هدف 1:00 دقیقه»**. `dMeta` on the runner (`app.jsx:1701`) has the opposite fault — `'زمان هدف: ' + mmss(x.target)` with no unit at all. Fix: one helper, `mins = t => t >= 60 ? Math.round(t/60) + ' دقیقه' : t + ' ثانیه'`, used in both places. **Cost: trivial.**

**3c — «یادداشت بردار» with nowhere to write.** The prep-phase label (`app.jsx:1716`) tells the learner to take notes during the 30 seconds; `dNote` was clearly meant to hold them and is dead state (`app.jsx:1574`, never read). Either add the textarea the string implies, or — cheaper and equally honest — change the label to **«۳۰ ثانیه فکر کن — جمله‌ی اولت را در ذهنت بساز»** and delete `dNote`. **Cost: trivial** for the string; small for the textarea.

Also in this bracket, and one line each: `dcSpeakStart` speaks **"Start speaking now."** in English (`app.jsx:1610`) to a learner who by construction cannot yet speak English — an A1 user hears a foreign sentence and does not know the timer just flipped; the visible `dTimerLabel` already says «حالا صحبت کن», so the utterance can simply be dropped. And `isDisc` is gated on `all.length > 0` (`app.jsx:1660`), so if `DISC` ever fails to load the learner gets a completely blank screen with no message; a one-line fallback card would cost nothing.

---

### 4. Make the eight ladder questions read as eight

**Now.** `dQPos` (`app.jsx:1710`) is `(qi+1) + ' / ' + qs.length` **within the current tier**, and `dcTier` (`app.jsx:1593`) resets `dQ` to 0. So the counter reads `1 / 3`, `2 / 3`, `3 / 3` — and then stops. Nothing indicates that `3 / 3` is one third of the way through, that «عمیق‌تر» and «چالشی» hold five more questions, or that the tiers are meant to be walked in order (`start` → `follow` → `deep`) rather than picked between. Press «بعدی» on the last question of a tier and nothing happens at all: `dcGoQ` clamps at the end (`app.jsx:1590`) with no feedback and no advance to the next tier. A learner who does not press the three chips — which look like filters, not stages — sees 3 of the 24 authored questions and believes they have finished the section.

**The change.** Two edits in `discVals`, one in `dcGoQ`:

- `dQPos` becomes a session-wide counter: compute the offset of the current tier within `['start','follow','deep']` and render `(offset + qi + 1) + ' / ' + total`, where `total` is `start.length + follow.length + deep.length` (always 8). One line.
- When `dcGoQ(+1)` is called on the last question of a non-final tier, advance to the next tier with `dQ: 0` instead of clamping — the chips stay for jumping around, but the plain «بعدی» arrow now walks all eight.
- Label the tier chips with their counts and stage meaning rather than bare words: «شروع ۳» / «عمیق‌تر ۳» / «چالشی ۲», built from `qs.length` per tier in the `dTiers` map (`app.jsx:1706`).

**Data support.** Complete — the ladder is fully in the data and fully rendered; only the counter and the advance rule are wrong.

**Cost.** **Trivial to moderate.** Three small edits in one method.

---

### 5. Do not lose the session on exit, and stop paying for ticked boxes

**Now.** Everything a learner does in `dses` lives in component state: `dChecks`, `dSpent`, `dRec`, `dUrl`, `dPhase`. Leaving for any reason — **بازگشت**, a header icon, a reload — destroys all of it with no warning. `openDisc` (`app.jsx:1571`) resets the lot on every entry, so re-entering a half-done session starts from zero even though `vocab_disc` is right there and already stores per-session records.

Compounding it: `dSpent` only increments inside the `dcSpeakStart` interval (`app.jsx:1617`). A learner who reads the questions and answers them aloud without ever pressing the timer records **zero seconds** — and the hub's headline stat, «مجموع زمان صحبت تو: X دقیقه» (`app.jsx:1694`), stays at 0 forever while they do the work correctly. The section's one motivational number is the one most easily left blank.

And `dcFinish` (`app.jsx:1641–1642`) awards `10 + n*5` XP where `n` is the number of self-assessment boxes ticked, while `dcDone` stores `best: Math.max(prev.best, checks)`. The app pays the learner to tick boxes about themselves and records "best" as "most boxes ever ticked". A self-assessment that is scored stops being a self-assessment.

**The change.**

- Persist the in-progress session into `vocab_disc` under `p.cur = { id, checks, spent, tier, q }` on every `dcToggleCheck` and on each timer tick (throttled), and rehydrate it in `openDisc` when `p.cur.id === ses.id`. The recording cannot survive and should not try to — say so in the caption from §2 («جایی ذخیره نمی‌شود»), which makes the loss expected rather than a surprise.
- Decouple XP from the checklist: award a flat `20` on finish. Keep the checks as the learner's own record; keep `n` in `dcDone` but relabel `dSavedLabel` from «بهترین خودارزیابی ۳ مورد» to a neutral «آخرین خودارزیابی: ۳ از ۳».
- Rename `dBack`'s button from **بازگشت** to **بستن** per the structure plan, and let it inherit the shared location strip: `crumb: 'شنیدن و گفتن · گفت‌وگوی آزاد · ' + x.title`.

**Data support.** Complete — `vocab_disc` already exists, is already read and written by `dcProg`/`dcSaveProg`, and is already in the export key list. Additive field, no migration.

**Cost.** **Moderate.**

---

### 6. Promote the method explanation on the runner; open the hub disclosure by default

**Now.** On `dses`, the sentence that explains what kind of speaking this session actually is — `m.how`, e.g. *«باید از یک طرف دفاع کنی — حتی اگر با آن موافق نیستی. این تمرینِ استدلال است.»* — is rendered at `template.html:10875` in `font-size:11.5px; color:rgba(233,233,237,.45)`. That is the **faintest, smallest text on the screen**, smaller than the step captions and fainter than the phrase translations. The genuinely important content is styled as a footnote. On the hub, the same ten explanations are behind a dashed disclosure that defaults closed (`dShowMethods`, `app.jsx:1690`), so a first-time learner most likely never opens it.

**The change.** Two style edits, no logic: raise `template.html:10875` to `12.5px` / `rgba(233,233,237,.7)` and prefix it with the method name in the method's own colour — `dMethodHow` becomes `m.fa + ' — ' + m.how`; both values are already in `discVals` at `app.jsx:1699–1702`. On the hub, default `dShowM` to `true` on the learner's **first** visit only (any `vocab_disc.s` key present ⇒ default closed).

**Data support.** Complete. `methods[k].how` is authored, complete for all 10, and already reaching the screen — it is simply illegible.

**Cost.** **Trivial.**

---

## What is already fine — do not touch it

- **The hub.** Level chips with `done/total`, method-coloured icons, English title plus Persian title plus a meta line per row. It is the clearest hub of any section in this app.
- **The `phrases` block.** Five ready-made sentences, each with a translation and a per-phrase speaker button (`app.jsx:1705`), captioned with an actual instruction. This is the model the other three captions should copy.
- **The progress model.** `dcDone` keeps attempts, best and seconds per session and a running total; the hub surfaces all of it. Nothing needed beyond fixing the zero-seconds hole in §5.
- **The curriculum itself.** 24 uniform sessions, 6 levels × 4, 10 real ESL methods, no thin level, no missing field. Whatever is wrong with this section, the content is not it.

---

## Would need new work (kept separate, and I am not arguing for it)

Only one thing, and only if the owner ever wants the section to give real feedback rather than self-report: a **model answer** per session — 4–6 English sentences performing the `task`, with a Persian gloss, playable through `speakWord` and revealed only after the timer ends. It would turn «خودارزیابی» from "did I feel OK?" into "here is what a good answer sounds like; now compare". That is 24 short paragraphs of new authored content plus one field (`model`) and one collapsed block on the runner. It is the only place in this section where new content would buy more than re-labelling the existing content — and every one of items 1–6 above should ship first, because none of them costs any writing at all.
