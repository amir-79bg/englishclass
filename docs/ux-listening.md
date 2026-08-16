# شنیدن و بازگویی — UX review of the listening section

**Scope:** screens `listen` and `ltext`; logic `lsAll`…`lsQNext` and `listenVals` (`data/src/app.jsx:1382–1562`); markup `data/src/template.html:10692–10812` plus the home card at `9676–9684`.
**Status:** proposals only. Nothing here is implemented. Assumes the structure decided in `docs/ux-structure-plan.md` — this section becomes **شنیدن و گفتن › شنیدن و بازگویی**, hub at `listen`, runner at `ltext`.
**Written in English for the implementer; every learner-facing string is given in Persian, ready to paste.**

---

## The data, verified

Loaded `LISTEN_1` + `LISTEN_2` out of the bundle and counted. The data is far more uniform than the UI implies:

| | |
|---|---|
| Texts | **20** |
| Lines per text | **20, every single text** — no variation at all |
| Quiz questions per text | **3, every single text** |
| Fields per text | `id` `lv` `topic` `title` `titleFa` `lines[{en,fa}]` `q[{q,opts,a}]` |
| Levels | A1 **4** · A2 **4** · B1 **4** · B2 **4** · C1 **2** · C2 **2** |
| Topics | 19 distinct, all present in `data/categories.json` / `VOCAB_CATS` — `catLabel` never falls through to `'عمومی'` |

**No level is empty**, so the empty state never fires today (see finding 9 — it is still dead code that cannot fire, which is a different problem). The thin levels are C1 and C2 with **two texts each**: a learner who reaches C1 exhausts the section in two sittings, and the level chip cheerfully advertises `C2 · 2` next to `A1 · 4` with nothing saying that is the end of the road.

Every quiz question has exactly four options and an answer index. **There is no explanation field anywhere in the data** — no `why`, no `ref`, no line pointer. Any fix that explains a wrong answer needs new content written; see finding 6.

---

## Walking it as a first-time learner

**Entry.** From home (`template.html:9676`) or header icon #6. The card says `لیسنینگ و شدوئینگ` and `listenCardDesc`. Two of the four content words on that card are English written in Persian letters. `شدوئینگ` in particular is a word a Persian-speaking beginner has no way to parse — it is not Persian and it is not English they can read. The plan's naming change fixes the label; it does not fix the fact that nothing ever says what the activity *is*.

**Hub (`listen`).** Level chips, then a list of four rows. The screen never says which level is yours — `goListen` hardcodes `'A1'` (see finding 2). No back button exists on this screen at all; the only escape is the global header. There is no aggregate progress: `vocab_listen` knows exactly how many texts you have read and quizzed, and the hub shows none of it.

**Runner (`ltext`).** A wall of controls appears at once: play-all, prev, repeat, next, position, three speed chips, a translation toggle, a shadowing panel with a record button, twenty numbered lines, and a quiz button. Nine interactive affordances before a single word has been heard. The shadowing panel is already telling the learner to repeat *simultaneously with the audio* when no audio has played and none is playing.

**Feedback.** The quiz colours the right option green and your wrong one red, and that is the whole of it. The recording is recorded and played back and compared to nothing.

**Exit.** `ltBack` returns to the hub at the right level — this is one of the few things the section gets right. But the microphone is not stopped on the way out (finding 4).

---

## Findings, ranked by confusion removed per unit of work

### 1. The listening audio does not pick an English voice — the app already has the code that does 🔴 DATA/CODE ALREADY EXISTS

**Now.** `lsSpeak` (`app.jsx:1398–1409`) builds an utterance, sets `u.lang = 'en-US'`, and speaks. It never calls `getVoices()` and never sets `u.voice`. On a Windows machine with a Persian system locale — which is the entire target audience of this app — `lang` alone is a *hint*; the browser is free to hand the string to the default system voice. The learner presses «پخش کل متن» on an A1 text and hears English words pronounced by a Persian voice, or a flat robotic default, and concludes the listening section is broken. This is the single most damaging defect in the section because **every** other capability here — per-line play, continuous play, speed, shadowing — is downstream of it.

**The change.** `speakWord` (`app.jsx:265–274`), four hundred lines earlier in the same file, already does this correctly:

```js
const vs = window.speechSynthesis.getVoices() || [];
const v = vs.find(x => /en-US/i.test(x.lang) && /natural|google|samantha|aria/i.test(x.name))
       || vs.find(x => /^en/i.test(x.lang));
if (v) u.voice = v;
```

Lift those four lines into `lsSpeak` between `u.rate = …` and `u.onend = …`. Better: extract them once as `pickEnVoice()` and call it from both. The constructor already primes the voice list at `app.jsx:254`, so the list is warm by the time `ltext` opens.

**Also:** if `vs.filter(x => /^en/i.test(x.lang)).length === 0`, no English voice is installed and nothing this section does will work. Show a one-line notice at the top of `ltext` instead of letting the learner press play into silence:

> «مرورگر شما صدای انگلیسی ندارد. متن و ترجمه را می‌توانی بخوانی، ولی پخش صدا کار نمی‌کند.»

**Data needed.** None. One existing block of code, copied.
**Cost.** Trivial (voice pick) + trivial (the notice).

---

### 2. The section always opens at A1, unlike every other levelled section 🔴 CODE ALREADY EXISTS

**Now.** `goListen(lv)` at `app.jsx:1388`:

```js
lsLv: lv || this.state.lsLv || 'A1'
```

Compare its three siblings, which all fall back to the learner's actual vocabulary level:

- `goSent`  `app.jsx:643`  → `this.levelOf((this.load().round) || 1)`
- `goGram`  `app.jsx:1047` → `this.levelOf((this.load().round) || 1)`
- `goDisc`  `app.jsx:1570` → `this.levelOf((this.load().round) || 1)`

Listening is the **only** one of the four that ignores it. A B1 learner who has ground through hundreds of words lands on «My Day» — twenty A1 sentences about brushing teeth — and reasonably concludes the app is not paying attention. Note for the architect: `docs/ux-structure-plan.md` §6 states that `goListen` at line 1388 already falls back to `levelOf`. It does not. That is the one factual correction this report has for the plan, and it happens to make change 6 cheaper, not harder.

**The change.** One expression:

```js
lsLv: lv || this.state.lsLv || this.levelOf((this.load().round) || 1)
```

**Data needed.** None.
**Cost.** Trivial. One line.

---

### 3. The shadowing recording is compared to nothing — and the comparison engine is already in the file 🔴 CODE ALREADY EXISTS

**Now.** `lsRecToggle` (`app.jsx:1432–1447`) opens the mic, records until you tap stop, and drops an `<audio controls>` under the panel (`template.html:10761–10763`). That is the whole feature. The learner records themselves, hears themselves, and is told nothing. There is no score, no transcript, no comparison, not even a prompt to judge themselves. A learner who does this once has no reason to ever do it again, which is presumably why the section's headline capability feels inert.

**The app already scores spoken English.** `exRecord` (`app.jsx:414–435`) in the category-drill section does all of it:

- uses `window.SpeechRecognition || window.webkitSpeechRecognition` with `lang='en-US'`, `maxAlternatives:5`
- normalises with `norm` (`app.jsx:25`) and fuzzy-matches any alternative against the target
- reports back with `exHeard` — `'شنیده شد: «' + ex.heard + '»'` (`app.jsx:590`)
- falls back to `exRecordAudio` (`app.jsx:435–450`) when recognition is refused, which **auto-stops after 4 seconds** and offers a self-grade via `exSelf` (`app.jsx:451–454`)
- degrades honestly: `error` reads `'میکروفون در دسترس نیست — خودت نمره بده'` (`app.jsx:588`) and still lets you continue

The shadowing panel has none of the five. **The fix is to make `lsRecToggle` the same shape as `exRecord`, with `t.lines[k].en` as the target.**

**The change.** In `ltext`'s shadowing panel (`template.html:10753–10764`):

1. `lsRecToggle` tries `SpeechRecognition` first with `rec.lang='en-US'`; on result, compare `norm(transcript)` to `norm(t.lines[k].en)` exactly as `exRecord` does.
2. New val `ltHeard` = `'شنیده شد: «' + heard + '»'`, rendered under the record button in the same place `exHeard` occupies in the drill.
3. New val `ltHeardMark` — green «درست» / amber «نزدیک بود، دوباره» — using the same three-way match already written.
4. Keep the MediaRecorder path as the fallback (it is already written); when it fires, render the existing `<audio>` **plus** a «شنیدم، درست بود» / «دوباره» self-grade pair calling a `lsSelf` twin of `exSelf`.
5. Borrow the 4-second auto-stop from `exRecordAudio:448` so the mic is not left open by a learner who does not know to tap again.

**Data needed.** None — the target sentence is `t.lines[k].en`, which is already on screen.
**Cost.** Moderate. It is a port of an existing 20-line method, not new invention.

---

### 4. Three concrete bugs in the shadowing panel

All three are small, all three are the kind of thing that makes a learner distrust the screen.

**(a) The recording is orphaned from its line.** `lsUrl` is set by `lsRecToggle` and cleared only by `openText` (`app.jsx:1391`). `lsPlayLine` (`1410`) changes `lsLine` without touching `lsUrl`. So: record yourself on line 3, tap line 9 — your line-3 recording is still sitting in the panel directly beneath line 9's English text, labelled as that line's shadowing. **Fix:** add `lsUrl: '', lsRec: 'idle'` to the `setState` in `lsPlayLine` and `lsNextLine`. Cost: trivial.

**(b) The microphone is never released on exit.** `lsStop` (`app.jsx:1393–1397`) cancels `speechSynthesis` and nothing else. `ltBack` calls `lsStop` then `goListen`. `componentWillUnmount` (`app.jsx:256`) aborts `this.rec` but has no idea `this.lsMr` exists. Leave a text mid-recording and the mic indicator stays lit. **Fix:** in `lsStop`, `if (this.lsMr && this.lsMr.state !== 'inactive') this.lsMr.stop();` and add the same to `componentWillUnmount`. Cost: trivial.

**(c) The mic records the TTS.** The panel instructs the learner to speak *simultaneously* with the audio (`template.html:10755`), and the audio comes out of the device's own speaker. On a phone the playback is in the recording. Nothing warns, and playback of the result is confusing rather than useful. **Fix:** with finding 3 in place, this mostly resolves — recognition will match your voice or not — but the panel should sequence the two explicitly rather than implying they overlap. See finding 5.

---

### 5. A learner is never told what shadowing is, or in what order to do it

**Now.** The only instruction in the whole section is one 10.5px line, `template.html:10755`:

> «شدوئینگ — این خط را هم‌زمان با صدا بلند تکرار کن»

It sits inside the panel, in the smallest type on the screen, and it is present from the instant `ltext` opens — before any audio has played, next to a record button. It states one step of a method whose other steps are nowhere. A learner reading it has to guess whether to press record first or play first, whether to look at the line or not, whether to look at the Persian or not, and how many times to repeat. The hub's description (`template.html:10701`) is a feature list, not a method: *"listen, follow line by line with translation, repeat along with the speaker (shadowing), and take a comprehension quiz at the end."* It describes what the screen contains, not what the learner should do with it.

**The change.** Replace the one line at `10755` with a numbered three-step strip at the **top** of the shadowing panel, and put the same three steps on the hub above the text list. This is the same method stated in two places rather than a feature list in one:

```
۱. بشنو — «پخش کل متن» را بزن و فقط گوش کن. به ترجمه نگاه نکن.
۲. بازگو کن — روی یک خط بزن، «تکرار این خط» را بزن و هم‌زمان با صدا بلند بگو.
۳. بسنج — «ضبط صدای خودم» را بزن، همان خط را بگو و ببین درست شنیده شد یا نه.
```

Then, on the hub, one sentence replacing the feature list at `10701`:

> «بازگویی یعنی هم‌زمان با گوینده، با همان سرعت و همان آهنگ، بلند تکرار کنی. مثل سایه‌ی صدای او. برای درست‌شدن لهجه از هر روش دیگری مؤثرتر است و فقط چند دقیقه در روز لازم دارد.»

**Data needed.** Four short Persian sentences, written above verbatim. That is all the new content this proposal requires.
**Cost.** Trivial to implement; the copy is drafted here.

---

### 6. Wrong quiz answers explain nothing, and the quiz is accidentally open-book

**Now.** `lsQPick` (`app.jsx:1453–1457`) records the pick; the option styling (`app.jsx:12547-ish` / `1541–1546`) paints the correct option green and the learner's wrong one red. Then «سؤال بعدی». The learner is told *that* they were wrong and never *why* — the canonical failure this app is being reviewed for.

**The data cannot fix this on its own.** I checked every question object: the keys are exactly `q`, `opts`, `a`. There is no explanation field to render. Unlike several other sections, there is **no unrendered gold here** — an explanation for all 60 questions (20 texts × 3) would have to be written, roughly 60 short Persian sentences.

**But there is a cheaper 80% fix that needs no new content.** The quiz block (`template.html:10783–10810`) renders *below* the twenty lines, and `lsStartQuiz` (`app.jsx:1448–1452`) does not hide them. So the text — with its Persian translation — is sitting on screen while the learner answers. The quiz is not a comprehension test, it is a find-the-sentence exercise, and nobody told the learner that either way. Turn the accident into the explanation:

1. Wrap the lines block (`template.html:10766–10779`) in `<sc-if value="{{ ltNoQuiz }}">`. `ltNoQuiz` **already exists** (`app.jsx:1540`) and is already used for the quiz button. The lines vanish when the quiz starts — the quiz becomes a real comprehension check.
2. On answer (`q.picked != null`), render the lines block again, with the translation forced on. The learner who got it wrong is returned to the text they misheard. New val `ltShowLinesAfterPick = q && q.picked != null`.
3. Add a caption above the re-revealed text: «جواب در متن است — دوباره بخوان».

This gives the learner the *source* of the right answer rather than an explanation of it, at zero content cost, and makes the difference between a right and a wrong answer mean something.

**Data needed.** None for the above; 60 new sentences if a real explanation is wanted later.
**Cost.** Moderate for the reveal flow (two `sc-if` wrappers, one new boolean). Large for written explanations.

---

### 7. Progress is stored and never shown 🔴 DATA ALREADY EXISTS

**Now.** `vocab_listen` holds `{ r: {id:1}, q: {id:pct} }` — read-flags and best quiz percentage per text, written by `lsMarkRead` (`app.jsx:1387`) and `lsMark` (`1386`). It is read in exactly one place: the per-row `meta` and tick icon in `lsTexts` (`app.jsx:1484–1493`). Nothing aggregates it. The hub headline reads `lsCount` = `'۲۰ متن در ۶ سطح'` — a fact about the app, not about the learner. The level chips read `'A1 · 4'` — the total, not what is left. After finishing three texts a learner sees a screen identical to their first visit except for three small ticks.

**The change.** All from data already in `localStorage`, computed in `listenVals`:

- `lsCount` (`app.jsx:1495`) becomes progress-bearing: `'۷ از ۲۰ متن — آزمون ۴ متن را داده‌ای'`, falling back to the current string when nothing is done.
- `lsLvChips` labels (`app.jsx:1477–1480`) become `done/total`: `'A1 · ۳/۴'` instead of `'A1 · 4'`. One extra `filter` inside the existing `map`.
- In the `ltext` runner, a `'متن ۳ از ۴ در سطح A2'` line beside `ltMeta` (`app.jsx:1500`) — both values are already in hand (`all.filter(t => t.lv === lv)` and `indexOf`).

**Data needed.** None. Three string builders over data already loaded three lines above.
**Cost.** Trivial.

---

### 8. «پخش کل متن» does not play the whole text

**Now.** `lsPlayAll` (`app.jsx:1416–1425`) ends with `step(this.state.lsLine || 0)` — it resumes from the *current* line. Tap line 14 to hear it, then press the button labelled «پخش کل متن» («play the whole text») and you get lines 14 to 20. The label and the behaviour disagree, which is worse than either behaviour alone.

Two related gaps in the same control cluster:

- There is no way to return to line 1 short of scrolling down and tapping it.
- Continuous play advances `lsLine` and re-styles the highlighted row (`app.jsx:1513–1520`), but the page does not scroll. On a phone, by line 6 the highlighted line is off-screen. The current-line panel at the top does track it, which is what saves this from being a finding of its own — but the twenty-line list below is decorative during playback.

**The change.**

- Either make the button honest — `step(0)` and label «پخش از اول» — or split it: a primary «پخش کل متن» that starts at 0, and let «تکرار این خط» (`ltRepeat`, already present) own the resume case. I prefer the former: one button, one meaning, and the existing prev/repeat/next trio already covers per-line control.
- Add `scrollIntoView({block:'center'})` on the active row inside `lsPlayLine`'s `setState` callback.

**Data needed.** None.
**Cost.** Trivial for the label/behaviour; trivial for the scroll.

---

### 9. Two preferences reset on every text, and the translation default undoes the exercise

**Now.** `openText` (`app.jsx:1389–1392`) resets `lsRate: 0.9` and `lsShowFa: true` for every text opened. A learner who needs «آهسته» re-picks it twenty times. More seriously: **the Persian translation of every line is displayed by default**, on a listening screen, before any audio plays. A learner opening a text reads it in Persian and never has to listen to anything. `ltFaBtnLabel` («نمایش/پنهان کردن ترجمه») exists and works — the default is simply backwards for the activity.

**The change.**

1. Carry `lsRate` and `lsShowFa` across texts — remove both from the `openText` reset and let them live for the session, or persist them into `vocab_listen` as `{ rate, showFa }`. Two keys, additive, no migration (consistent with the plan's storage rule).
2. Default `lsShowFa` to **false** on first entry to a text, with the toggle right where it is now, and a caption on the toggle: «اول بدون ترجمه گوش کن». The learner who wants Persian is one tap away; the learner who does not want it currently has no way to avoid seeing it first.

**Data needed.** None.
**Cost.** Trivial.

---

### 10. The empty-level state is written and cannot render 🔴 DEAD CODE

**Now.** `app.jsx:1483` computes `lsEmptyNote = 'برای این سطح فعلاً متنی نیست — سطح دیگری را انتخاب کن.'` — a good, correct, learner-facing string. It is referenced **nowhere** in `template.html`. And the guard that should show it is inverted: `template.html:10722` reads

```html
<sc-if value="{{ lsHasTexts }}" hint-placeholder-val="{{ true }}"><span></span></sc-if>
```

— a second `sc-if` on the *same positive* condition, wrapping an empty `<span>`. It was clearly meant to be `lsNoTexts` wrapping `{{ lsEmptyNote }}`. With today's data all six levels are non-empty so this never fires, which is exactly why it was never caught: the failure is invisible until someone adds a level or filters differently, at which point the learner gets a level chip, a heading, and a blank void.

**The change.** Add `out.lsNoTexts = list.length === 0;` beside line 1482, and replace `10722` with:

```html
<sc-if value="{{ lsNoTexts }}" hint-placeholder-val="{{ false }}">
  <div style="padding:14px;font-size:12px;color:rgba(233,233,237,.5);text-align:center">{{ lsEmptyNote }}</div>
</sc-if>
```

**Data needed.** None — the string is already written and already correct.
**Cost.** Trivial.

---

### 11. C1 and C2 hold two texts each, and nothing says so

**Now.** Verified counts: A1 4, A2 4, B1 4, B2 4, **C1 2, C2 2**. The chips render `'C1 · 2'` in the same shape and colour as `'A1 · 4'`, and `listenCardDesc` promises *«۲۰ متن سطح‌بندی‌شده (A1 تا C2)»*, which is true and misleading — it implies six equal shelves. A learner arriving at C1 finishes the level in one sitting and gets no signal about whether that is the end, a bug, or content coming later.

**The change.** Cheap and honest: after the last text of a level, and on the empty-ish upper levels, one line under the list:

> «همه‌ی متن‌های این سطح تمام شد. سطح‌های C1 و C2 هر کدام ۲ متن دارند — می‌توانی سطح پایین‌تر را با ترجمه‌ی پنهان دوباره کار کنی.»

Both halves of that sentence point at something real: re-listening with `lsShowFa` off is a genuinely different exercise from the first pass, and finding 9 makes it available.

**Data needed.** One Persian sentence, drafted above. Filling C1/C2 out to four texts each would need 4 new texts × (20 line pairs + 3 questions) — that is real curriculum work and belongs in the section below.
**Cost.** Trivial for the message; large for the content.

---

### 12. The `listen` hub has no exit, and finishing a text leads nowhere

**Now.** The `isListen` block (`template.html:10692–10724`) contains no back button — unlike `ltext`, which has one at `10736`. The only way off the hub is a global header icon. And at the end of the runner, after the quiz result («X از ۳ درست» + «بستن آزمون», `template.html:10803–10806`), the learner is dropped back onto the same text with the quiz button restored. Nothing offers the next text, nothing marks the text as finished, nothing suggests re-listening without the translation.

**The change.** Structural half is the architect's — `docs/ux-structure-plan.md` §4 puts a uniform «بستن» strip on all 17 non-home screens and that covers the hub. The runner-tail half is this section's:

replace the lone «بستن آزمون» with three buttons, all of which call handlers that already exist:

| label | handler |
|---|---|
| «متن بعدی» | `openText(nextInLevel)` — `all.filter(t=>t.lv===lv)[idx+1]`, hidden when last |
| «دوباره گوش کن، بدون ترجمه» | `lsQuiz:null, lsShowFa:false, lsLine:0` then `lsPlayAll()` |
| «بازگشت به فهرست» | existing `ltBack` |

**Data needed.** None.
**Cost.** Trivial to moderate — three buttons, one index lookup.

---

### 13. If the LISTEN globals fail to load, both screens render literally nothing

**Now.** `isListen: s.screen === 'listen' && all.length > 0` (`app.jsx:1470`). If `LISTEN_1`/`LISTEN_2` did not attach — a bundler failure, a blocked blob URL — the `screen` state still becomes `'listen'`, no `sc-if` in the template matches, and the learner gets the header above an empty page with no explanation and no back button (see finding 12). The same shape guards `isLText`.

**The change.** A `lsBroken` boolean (`s.screen === 'listen' && all.length === 0`) rendering one line: «متن‌های شنیداری بارگذاری نشدند. صفحه را دوباره باز کن.» plus a button home. Low probability, zero-cost insurance, and it removes the one state in this section from which there is genuinely no escape.

**Data needed.** None.
**Cost.** Trivial.

---

## Summary table

| # | Finding | New content? | Cost |
|---|---|---|---|
| 1 | `lsSpeak` picks no English voice; `speakWord:270–272` already does | **no — code exists** | trivial |
| 2 | `goListen` hardcodes A1; three sibling sections use `levelOf` | **no — code exists** | trivial |
| 3 | Shadowing recording compared to nothing; `exRecord:414–435` already scores speech | **no — code exists** | moderate |
| 4 | Recording orphaned from its line; mic never released; TTS bleeds into recording | no | trivial |
| 5 | Shadowing never explained; no method, no order | 4 sentences (drafted) | trivial |
| 6 | Wrong answers explain nothing; quiz is open-book; `ltNoQuiz` already exists | no (80% fix) / 60 sentences (full) | moderate / large |
| 7 | `vocab_listen` progress stored, never aggregated | **no — data exists** | trivial |
| 8 | «پخش کل متن» resumes mid-text; no auto-scroll | no | trivial |
| 9 | Rate and translation reset per text; translation on by default | no | trivial |
| 10 | `lsEmptyNote` written, never rendered; guard inverted at `template.html:10722` | **no — string exists** | trivial |
| 11 | C1/C2 have 2 texts each, presented as equal to A1's 4 | 1 sentence (drafted) | trivial |
| 12 | Hub has no exit; quiz result is a cul-de-sac | no | trivial→moderate |
| 13 | Empty render if LISTEN globals fail | no | trivial |

**Ship 1, 2, 7, 10 first.** Four trivial edits, no new content, and between them they fix the section being inaudible, being aimed at the wrong level, being unable to show the learner their own progress, and having a written empty state that cannot appear. Then 5 and 6, which are what make the section *mean* something. Then 3, which is the largest single win and is a port rather than an invention.

---

## Would need new work

Kept separate on purpose. None of this is recommended before the list above.

- **Content for C1 and C2.** Two more texts at each of C1/C2 to bring all six levels to four. 4 × (20 en/fa line pairs + 3 four-option questions) ≈ 80 sentence pairs and 12 questions. Substantial writing.
- **Quiz explanations.** 60 short Persian sentences, one per question, in a new `why` field. This is the only way to give a genuine *why* rather than the source-line reveal in finding 6.
- **Line-level question anchors.** A `ref` index on each question pointing at the line that answers it would let a wrong answer highlight the exact sentence. 60 integers — cheap to add mechanically, but it is still new data and someone has to be sure each is right.
- **A "repeat after me" mode** distinct from simultaneous shadowing — play a line, insert a gap the length of the line, then advance. `lsPlayAll`'s fixed `260` ms gap (`app.jsx:1422`) is the hook, and it would suit beginners better than true shadowing. This is a new activity and therefore, by this review's own rule, almost certainly the wrong thing to build before the twelve findings above are fixed. Noted, not proposed.
