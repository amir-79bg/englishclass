# بازی‌ها و تمرین‌های دسته‌ای — UX review

**Section:** games & category drills — screens `game`, `exercise`.
**Logic:** `startEx` / `ex*` / `exVals` (`app.jsx:371–610`), `startGame` / `gameLevel` / `gameTap` (`app.jsx:455–514`), `addXp` (`app.jsx:455`).
**Markup:** `exercise` at `template.html:10043–10121`, `game` at `template.html:10960–11001`, the drill strip at `template.html:9987–9999`, the home game card at `template.html:9706–9713`.

Written in English for the implementer. Every string that ships to the learner is given in Persian, verbatim.
Assumes the structure decided in `docs/ux-structure-plan.md`: both screens land in **واژه‌ها**, `exercise` under **فهرست واژه‌ها › تمرین این دسته**, `game` as **واژه‌ها › بازی جفت‌سازی**.

---

## Verdict in one paragraph

This section contains the app's single best-written activity and the app's single worst discoverability failure, ten lines apart in the same file. The four drill cards on `browse` each carry a one-line Persian description of exactly what the learner will do (`app.jsx:538–541`) — that is better than any other section of this app manages. But the whole strip is hidden behind `hasCatEx` (`app.jsx:535`), which is false on first arrival, false on the default filter, false on the starred list, and never explains itself. A learner can use this app for a month and never see that the drills exist. Everything else below is smaller than that.

Beyond discoverability there are four honest defects: `exfa` is computed and thrown away, wrong answers are never explained, the speech drill reports a network failure as a microphone failure (and this app is offline by design, so that is the *normal* case, not the edge case), and XP is accumulated by ten call sites across every section of the app and displayed in exactly one place — a card about a game.

---

## 1. The drills do not exist until you guess they do

**What the learner experiences now.** They open فهرست واژه‌ها. They see a search box, a row of category chips, and a list of words. That is all. `hasCatEx` (`app.jsx:535`) is `s.catFilter !== 'all' && …length >= 4`, and `catFilter` starts as `'all'` (`app.jsx:51`), so on arrival — and on every arrival, since the filter is not persisted — the four drills are simply not in the DOM. Nothing anywhere in the app mentions اسپیکینگ, لیسنینگ or رایتینگ. There is no route to `startEx` other than tapping a category chip you had no reason to tap and then noticing that a panel appeared above the list.

Worse: the panel appears *between* the chips and the word list, so the list jumps down. On a phone the learner's eye is on the list; the thing that just appeared above it reads as a layout shift, not as an offer.

**The change.** Render the strip unconditionally in the same slot (`template.html:9987`). It has three states, driven by one new value:

- `catFilter === 'all'` → strip is present, the four cards are dimmed and non-tapping, and the header line reads:
  **«یک دسته را از بالا انتخاب کن تا با لغت‌های همان دسته تمرین کنی»**
- a category with ≥4 translated words → today's behaviour, unchanged.
- a category with <4 → dimmed, header reads **«این دسته کمتر از ۴ لغت دارد — برای تمرین حداقل ۴ لغت لازم است»**.

Replace the single boolean `hasCatEx` with `catExState` (`'pick' | 'ready' | 'thin'`) plus `catExMsg`, computed in the same expression at `app.jsx:535`. Reuse the existing `btnCard`/`iconSq` styles with `opacity:.45;pointer-events:none` for the two disabled states.

**Data.** Already there. The word counts per category are already computed for the chips (`app.jsx:1859`, `c.count`). No new content.

**Cost.** Trivial. One boolean becomes a three-way string, one `sc-if` becomes always-on, two Persian strings.

**Why it is first.** Every other finding in this document is about an activity most learners never reach.

---

## 2. GOLD — `exfa` is built and dropped on the floor

**What the learner experiences now.** They finish a لیسنینگ or اسپیکینگ item. The answer card (`template.html:10097–10103`) shows the English word, the Persian meaning, and the English example sentence — `{{ exSentEn }}`. Not the sentence's translation. So an A1 learner who just failed to recognise a single word is handed a full English sentence with no help.

**This is the loudest finding in the report.** `app.jsx:546`:

```js
const sent = w.ex ? { s: w.ex, fa: w.exfa || '' } : null;
```

`sent.fa` is constructed and then **never read anywhere in `exVals`**. `out.exSentEn = sent ? sent.s : ''` (line 600) is the only consumer of `sent` in the answer card. Every word in `data/words.json` carries `exfa`. The field is in the data, in the state object, and one line short of the screen.

**The change.** In `exVals`, next to line 600:

```js
out.exSentFa = sent ? sent.fa : '';
out.exHasSentFa = !!(sent && sent.fa) && !!ex.checked && ex.type !== 'write';
```

and in `template.html:10101`, immediately after the existing `exSentEn` div, one more div in the same muted style (`font-size:12.5px;color:rgba(233,233,237,.5);line-height:1.7`, RTL, no `direction:ltr`).

**Also fix the exclusion.** `exHasSent` is gated on `ex.type !== 'write'` (line 599). In رایتینگ the sentence *is* the prompt with a blank in it, so hiding the sentence afterwards is defensible — but hiding its **translation** is not. In write mode the learner should see, after checking, the complete sentence with the word filled in *and* `exfa`. That is the single moment where the translation is worth most, and it is the one moment it is explicitly suppressed.

**Data.** Already there, for every word. Zero new content.

**Cost.** Trivial. Two values, one div, one condition loosened.

---

## 3. Wrong answers say only *that* you were wrong

**What the learner experiences now.**

- **لیسنینگ.** Four Persian meanings, they pick the wrong one. The correct option turns green, theirs turns red (`optS`, `app.jsx:522–529`). They are never told what the word *they chose* actually was. They heard a sound, picked a meaning, and learn only that the sound was not that meaning — the confusion that caused the error is left intact and will recur.
- **رایتینگ.** `exFeedback = 'درستش: ' + w.en` (`app.jsx:580`). A learner who typed `recieve` for `receive` gets the correct spelling with no indication of where they went wrong. A learner who typed something completely different gets the same message.
- **اسپیکینگ.** `exHeard` shows «شنیده شد: «…»» (line 590) — this one is genuinely good, the learner sees what the machine heard and can tell a pronunciation failure from a recognition failure. It is the only place in this section that explains a mistake, and the rest should copy it.

**The change, in ascending cost:**

**(a) لیسنینگ — name the distractor you picked.** The option objects at `app.jsx:389` are built from full word records but keep only `{ label, correct }`. Add one field:

```js
opts = shuffled(dis.concat([w]), w.i + 17).map(x => ({ label: x.fa, en: x.en, correct: x.en === w.en }));
```

Then in the answer card, when `ex.picked != null && !ex.correct`:

> **«تو «{انتخاب}» را انتخاب کردی، که معنی *{distractor.en}* است.»**

Data already there — the distractors are drawn from `this.W`, complete word records, and the `en` is discarded one line later.

**(b) رایتینگ — show where the spelling diverged.** `norm(ex.typed) === norm(w.en)` is the whole comparison (line 404). Keep the comparison; change only the message. When the typed answer is non-empty and within an edit distance of ~2, say **«نزدیک بود — املا: {en}»** and render the two strings on adjacent lines in `Inter` so the eye finds the difference. When it is far off, keep **«درستش: {en}»**. No new content, ~10 lines of a diff helper.

**Cost.** (a) trivial. (b) moderate.

---

## 4. The speaking drill blames the microphone for a network problem

The browse card promises **«بگو؛ دستگاه می‌شنود و می‌سنجد»** (`app.jsx:538`). Here is what actually happens, traced through `exRecord` (`app.jsx:413–433`) and the label map at `app.jsx:588`.

| Situation | Code path | What the learner sees | Correct? |
|---|---|---|---|
| Chromium, mic granted, **online** | `SR` → `onresult` | «دارم گوش می‌دهم…» then a verdict + «شنیده شد: …» | Yes — this is the good path |
| Chromium, mic granted, **offline** | `onerror` `'network'` → `else` branch → `recState:'error'` | **«میکروفون در دسترس نیست — خودت نمره بده»** | **No.** The mic is fine. The app ships as an offline HTML file; Chrome's `SpeechRecognition` sends audio to a Google server. **Offline is the app's designed-for state, so this is the default outcome, not an edge case.** |
| Mic permission denied | `onerror` `'not-allowed'` → `exRecordAudio()` → `getUserMedia` also denied → `.catch` → `recState:'error'` | Same «میکروفون در دسترس نیست» + self-grade buttons | Correct message, but the learner is asked to grade a recording that does not exist |
| Learner says nothing / too quietly | `onerror` `'no-speech'` → `recState:'error'` | Same mic message | **No.** Nothing is wrong; they just need to say it again |
| Recogniser ends with no result | `onend` → `recState:'idle'` (line 431) | Label silently reverts to **«برای ضبط بزن»** | **No.** They spoke, the pulsing ring stopped, and no message of any kind appeared. Total silence is the worst possible feedback |
| No `SpeechRecognition` (Firefox, Safari, most non-Chromium) | `exRecordAudio()` → records 4s → `recState:'review'` | «صدای خودت را گوش کن و نمره بده» + `<audio>` + دو دکمه‌ی خودارزیابی | Works, and is a reasonable fallback — but the learner was promised a machine would judge them, and was never told the deal changed |

**The change.** `exRecord`'s `onerror` already receives `ev.error`. Store it and key the label off it. Replace the single `'error'` state with the error code:

```js
rec.onerror = ev => {
  if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') return this.exRecordAudio();
  this.exSet({ recState: 'err_' + ev.error });
};
rec.onend = () => { const e = this.state.ex; if (e && e.recState === 'listening') this.exSet({ recState: 'nothing' }); };
```

and extend the label map at `app.jsx:588`:

| state | Persian |
|---|---|
| `nothing`, `err_no-speech` | **«چیزی نشنیدم — دوباره بزن و بلندتر بگو»** |
| `err_network` | **«تشخیص گفتار به اینترنت نیاز دارد و الان آفلاین هستی — صدایت را ضبط می‌کنیم تا خودت بشنوی و نمره بدهی»** — and then *call `exRecordAudio()`*, exactly like the permission case, instead of dead-ending |
| `err_audio-capture` | **«میکروفون پیدا نشد»** |
| everything else | today's message |

**Also fix the promise.** When `SpeechRecognition` is absent, `exBtns[0].desc` should read **«بگو و صدای خودت را بشنو؛ خودت نمره می‌دهی»** rather than «دستگاه می‌شنود و می‌سنجد». One ternary on `window.SpeechRecognition || window.webkitSpeechRecognition` at `app.jsx:538`.

**Data.** No new content — five Persian strings and one branch reused.

**Cost.** Trivial to moderate. The `err_network → exRecordAudio()` redirect is the highest-value line in this finding: it converts the offline default from a dead end into the working fallback that already exists.

---

## 5. XP is earned everywhere and shown in one place — a game card

**What the learner experiences now.** They finish a drill. `exScoreDesc` (`app.jsx:606`) tells them **«۱۵ امتیاز تجربه گرفتی.»** They have never seen the phrase «امتیاز تجربه» before, they are not told what it does, and there is no visible total anywhere on that screen or the one they return to.

The total exists. `addXp` (`app.jsx:455`) is called from **ten** places spanning six sections — flashcards (163), category drills (411), the matching game (498), sentence-building (701, 718, 752, 773, 822), grammar/collocations (1083, 1148), listening (1462), discussion (1642). It is a genuine app-wide currency. It is rendered exactly once, at `template.html:9710`:

> `لغت انگلیسی را با معنی فارسی جفت کن · رکورد: {{ gameBest }} · امتیاز تجربه: {{ gameXp }}`

— a subtitle on the **matching game** card, next to that game's high score. A learner reading that line concludes XP is the game's currency. It is not; the game contributes 10 of it per level, while a listening quiz contributes up to 60. It is also stored inside `vocab_game` (line 455), which is why it ended up on that card.

Nothing reads `xp` back. There are no levels, no thresholds, nothing to spend it on.

**The change — pick one, do not do both:**

- **Cheap and honest.** Move the number out of the game card into «امروز» next to the two existing stat tiles (`template.html:9638–9647`) as a third tile: **«امتیاز تجربه»** / the number / one caption line **«از هر تمرینی که انجام می‌دهی جمع می‌شود»**. `gameXp` already exists as a val (`app.jsx:534`) and «امروز» already renders `exVals()`'s output, so this is a move, not a new computation. *(This tile lives on the home screen, which is `ux-architect`'s surface — flagging, not claiming.)*
- **Cheaper still.** Delete «۱۵ امتیاز تجربه گرفتی.» from `exScoreDesc` and the `· امتیاز تجربه: {{ gameXp }}` fragment from `template.html:9710`. A number nobody can find and nothing consumes is worse than no number.

Do not invent a level ladder for XP — the app already has a level ladder (A1→C2) and a second one would be exactly the kind of parallel unexplained system the owner is complaining about.

**Cost.** Trivial either way.

---

## 6. The matching game: how many are there really?

The architect flagged "three matching games with three high scores" as the app's one real duplication. From inside this section, the count is wrong in both directions, and the actual defect is different — and smaller, and cheaper to fix.

**There is exactly one matching game.** `screen:'game'` has two entry points that call **the same function with one different argument**:

- `goGame` (`app.jsx:533`) → `startGame('all')` — home card
- `exBtns[3].go` (`app.jsx:542`) → `startGame(this.state.catFilter)` — browse drill strip

Same screen, same `gameLevel`, same `gameTap`, same tiles, same `vocab_game.best`. This is not duplication; it is one game with a content-scope parameter, which is precisely what the architect proposed consolidating *to*. Nothing needs merging.

**The other two "games" are not matching games.** `csrun` `mode:'game'` (`app.jsx:1168`, `1221`) sets `csIsChoose` (`app.jsx:1316`) and prompts **«گزینه‌ی درست را انتخاب کن»** (`app.jsx:1322`) on a 45-second clock — a timed four-choice quiz. `sbrun` `mode:'game'` (`app.jsx:793`) is a 30-second sentence race. Neither pairs tiles. They share a word — بازی — and nothing else.

**So the real problem is naming and scoring, not duplication.**

**(a) Five things are called بازی and none of them says what kind.** «بازی لغات — جفت‌سازی» (home), «بازی این دسته» (browse), «بازی مسابقه‌ی جمله» (`app.jsx:854`), «بازی گرامر» (`app.jsx:1168`), «بازی کالوکیشن — مسابقه‌ی سرعت» (`app.jsx:1221`). Only the first says its mechanic. Make each name carry its verb: **جفت‌سازی** for the tile game, **مسابقه** for the two timed quizzes. Then «بازی این دسته» becomes **«همین بازی، با لغت‌های این دسته»** — which also stops it reading as a second, separate game. Trivial; ~5 strings; fits the architect's naming rule.

**(b) One record for two very different difficulties — this is a real defect.** `gameSaveBest` (`app.jsx:457`) writes a single `g.best`. Six pairs drawn from a 14-word category (`weather`) and six pairs drawn from all 10,524 words are not the same task, and today they compete for one number. A learner who plays their small category once will set a record they can never beat in the all-words game, and the home card will show it forever.

Fix: key the record by scope. `g.best` keeps its meaning (all-words) so no migration is needed; add `g.bestCat = { [cat]: n }`. `gBest` (`app.jsx:615`) reads `gm.cat === 'all' ? g.best : (g.bestCat||{})[gm.cat]`, and the label gains its scope: **«رکورد در این دسته: ۸۰»**. Trivial, additive, no storage migration.

---

## 7. The matching game plays with words the learner has never met

**What the learner experiences now.** They have studied 40 words. They tap شروع بازی. `gameLevel` (`app.jsx:466`) builds its pool as `this.W.filter(w => w.fa && (cat === 'all' || …))` — the entire 10,524-word list, of which 6,496 (62%) are in `noun` and most are far above their level. Six random pairs. They recognise none of them. The game is a coin flip dressed as practice, and losing feels arbitrary rather than instructive.

**The change.** One filter. `d.mastered` (`app.jsx:196`, written at `app.jsx:305` on every correct answer and by the browse tick at `app.jsx:1881`) is already the set of words the learner has met:

```js
const d = this.load(), met = Object.keys(d.mastered || {}).map(Number);
let pool = this.W.filter(w => w.fa && (gm.cat === 'all' || w.cat === gm.cat));
const known = pool.filter(w => d.mastered[w.i]);
if (known.length >= 6) pool = known;
```

Fall back to the full pool when fewer than six are known, so a brand-new learner still gets a playable game. Then say so once, in the existing instruction line at `template.html:10979`: **«با لغت‌هایی بازی می‌کنی که قبلاً یاد گرفته‌ای»**.

**Data.** Already there. `d.mastered` is written by three existing call sites and read only for a count (`app.jsx:1885`).

**Cost.** Trivial. Turns the game from a lottery into review, which is the thing it was presumably always meant to be.

---

## 8. «مرحله ۲» is «مرحله ۱» with a different random seed

**What the learner experiences now.** They clear six pairs. «مرحله تمام شد! می‌رویم مرحله‌ی بعد…», the header now says مرحله ۲, and the board is… six pairs, same size, no timer, same difficulty. `gameLevel` (`app.jsx:467`) uses `level` only as part of the shuffle seed. Lives are never restored (`gameLevel(g2.level+1, g2.score, g2.lives)`, line 499). There is no win condition — `done` is only ever `matchedN === 6` per board, and the loop is infinite. **The only way a session ends is by losing.**

A counter labelled مرحله promises a ladder. This one is a page number.

**The change — either is fine, pick one:**

- **Make it mean something.** Grow the board: `pairs = shuffled(pool, seed).slice(0, Math.min(9, 5 + level))` and let the grid at `template.html:10980` stay `repeat(3,1fr)` (18 tiles still fits). Restore one life every third level, capped at 3. Cost: moderate — two lines plus a heart-cap guard, and the level-completion bonus at `app.jsx:495` should scale with pair count.
- **Stop promising.** Rename `gLevel` from `'مرحله ' + gm.level` to **`'دور ' + gm.level`** and add a target so the session can be *won*: after 5 rounds show **«۵ دور تمام شد — امتیاز نهایی X»** with the same trophy card as `gOver`. Cost: trivial.

The second is closer to this document's remit (make the existing thing legible rather than build a new one) and I would ship that.

---

## 9. BUG — a 4- or 5-word category makes an unwinnable game

**What the learner experiences now.** They create a category with «دسته‌ی جدید» (`template.html:9979`), move 4 words into it, tap «بازی این دسته». Eight tiles. They match all four pairs correctly. **Nothing happens.** No completion banner, no XP, no next round, no record. All tiles are green and inert; `gameTap` returns early on every tap (`app.jsx:477`). The only escape is the ✕.

`hasCatEx` admits any category with ≥4 translated words (`app.jsx:535`), but `gameTap` hard-codes the win condition as `const done = matchedN === 6` (`app.jsx:494`), while `gameLevel` takes `slice(0, 6)` of whatever the pool has (`app.jsx:467`). With 4 or 5 pairs the board is completable and the game is not.

All 28 built-in categories have ≥14 translated words (smallest: `weather`, 14), so this only bites user-created categories — but adding one is a first-class button on the word list, and moving a handful of words into it is the obvious first thing to do with it.

**The change.** `app.jsx:494`:

```js
const done = matchedN === (gm.tiles.length / 2);
```

and scale the speed bonus at line 495 by pair count so a 4-pair board does not out-score a 6-pair one. Additionally, raise the drill gate to 6 for the game tile specifically, or leave the gate and let 4-pair boards work — either is fine once the win condition is honest.

**Cost.** Trivial. One expression.

---

## 10. The starred list — the one list the learner curated — has no drills

**What the learner experiences now.** They star words while studying. They tap the star in the header (`goStars`, `app.jsx:195`) and land on `browse` with `catFilter:'__star'`. The word list filters correctly (`app.jsx:1844` special-cases `'__star'`). The drill strip does not appear, because `hasCatEx` counts `this.W.filter(w => w.cat === s.catFilter)` — and no word has `cat === '__star'`, so the count is always 0.

The deliberately curated list of the words a learner finds hardest is the one list they cannot practise. Nothing explains the absence; the panel they saw a moment ago on `food` is simply gone.

**The change.** Three places need the same special case that `app.jsx:1844` already contains:

- `hasCatEx` / `catExState` (`app.jsx:535`) — count `d.starred` instead when `catFilter === '__star'`
- `startEx` (`app.jsx:373`) — same pool substitution
- `startGame`'s pool in `gameLevel` (`app.jsx:466`) — same
- `catLabel` already returns «عمومی» for `'__star'`; `catExTitle` (line 536) and `gCatLabel` (line 613) need **«ستاره‌دارها»** hard-coded for that key.

**Data.** `d.starred` already exists and is already used by the browse filter. No new content.

**Cost.** Moderate — four small call sites, one shared `poolFor(catFilter)` helper would do all of them at once and is the version I would write.

---

## 11. The listening drill is unplayable and unrecoverable without a voice

**What the learner experiences now.** On a browser with no English TTS voice — some Android WebViews, some Linux builds, and any browser where `getVoices()` is still empty on first paint — `speakWord` returns silently at `app.jsx:266`. In the لیسنینگ drill the prompt is `'• • • • •'` until the answer is checked (`app.jsx:556`), and both تلفظ and آهسته do nothing. The learner faces five dots, four Persian meanings, and no sound. There is no way to reveal the word, no error, no exit but خروج.

**The change.** One computed value, used in two places:

```js
const canSpeak = !!window.speechSynthesis && (window.speechSynthesis.getVoices() || []).some(v => /^en/i.test(v.lang));
```

- When false, the لیسنینگ card in `exBtns` (`app.jsx:539`) is dimmed with **«مرورگر تو صدای انگلیسی ندارد»** — the same disabled treatment as change 1, so there is one visual language for "not available and here is why".
- Inside the drill, if `canSpeak` is false, show the English word instead of `• • • • •` and set the hint to **«صدا در این مرورگر کار نمی‌کند — از روی نوشته انتخاب کن»**. Degraded, but finishable.

Note `getVoices()` is empty until `voiceschanged` fires in Chromium; compute `canSpeak` on that event as well or it will report false on first load and true after.

**Cost.** Moderate — the `voiceschanged` timing is the only fiddly part.

---

## 12. «تمرین دوباره» does not repeat the words you got wrong

**What the learner experiences now.** The result card says **«۳ از ۸ درست»** and offers **تمرین دوباره** (`app.jsx:608`). That calls `startEx(ex.type)`, which re-rolls a fresh random 8 from the whole category (`app.jsx:375`, seeded on `Date.now()`). The five words they failed are five words among a hundred; they will likely never see them again in this session. The button they press to fix their mistakes is the button that discards them.

There is also no record of *which* items were wrong — `ex` keeps only a `right` counter (`app.jsx:376`), so the result screen cannot list them even if it wanted to.

**The change.** One array. In `ex` state add `wrong: []`, push `ex.items[ex.k].i` in the three places that already record correctness — `exPick` (`app.jsx:398`), `exCheckTyped` (`app.jsx:405`), the `onresult` handler (`app.jsx:427`) and `exSelf` (`app.jsx:453`). Then:

- The result card lists the missed words as `en — fa` rows, reusing the answer-card style at `template.html:10098`. **This is the single most useful thing the result screen could show and today it shows a percentage instead.**
- Add a second button beside تمرین دوباره: **«فقط اشتباه‌ها»**, which calls `startEx(type)` with `items` set to the recorded misses.

Note that the word-course quiz already does exactly this — `q.missed` is tracked and re-inserted into the study order at `app.jsx:360`. The pattern exists in the codebase; the drills just do not use it.

**Data.** No new content. The words are already in `ex.items`.

**Cost.** Moderate. ~15 lines plus one template block.

---

## 13. Small things, grouped

- **Two exits, two words, two destinations.** `exQuit` says **خروج** and goes to `browse` (`app.jsx:553`, `template.html:10052`); `gQuit` is an unlabelled ✕ that goes to `home` (`app.jsx:629`, `template.html:10975`) and a button labelled **خانه** on the game-over card. Under the structure plan both become **بستن**, `gQuit` goes to `words`, `exQuit` stays on `browse` and must preserve `catFilter` (it already does — `setState` only clears `ex`). Covered by structure-plan change 4; noting it so it is not missed.
- **Quitting mid-drill is silent and total.** Four items in, tapping خروج discards everything with no confirmation and no resume. A one-line confirm — **«تمرین نیمه‌تمام می‌ماند. بیرون بروم؟»** — is enough; a resume is not worth building for an 8-item drill.
- **Progress is shown twice on `exercise` and not at all on `game`.** The drill has a bar and a `4 / 8` counter (`template.html:10046–10047`) — good. The game has a round counter that means nothing (finding 8) and no sense of how long a session lasts. Finding 8's «۵ دور» target fixes both.
- **`exRetry` and `exBack` both exist; `exBack` and `exQuit` are identical functions** (`app.jsx:553` and `609`). Harmless, but collapse them when touching this file.
- **The recorded-audio blob URL is never revoked** (`app.jsx:443`). Not a UX issue; noting it since a long session leaks one blob per spoken item.
- **The four drill descriptions are good and should not be touched** beyond the architect's naming rule (اسپیکینگ→گفتن, لیسنینگ→شنیدن, رایتینگ→نوشتن). «بشنو و معنی درست را انتخاب کن» is the clearest sentence in this application. The problem is that almost nobody sees it.

---

## Ranked summary

| # | Change | New content? | Cost |
|---|---|---|---|
| 1 | Drill strip always visible, with a reason when disabled | none | trivial |
| 2 | **Render `exfa` in the answer card** — computed at `app.jsx:546`, never read | **none — data exists** | trivial |
| 3a | Listening: name the distractor the learner picked | **none — `en` discarded at `app.jsx:389`** | trivial |
| 4 | Speech-drill error labels; route `err_network` into the existing audio fallback | none | trivial |
| 5 | XP: move it to «امروز» or delete the mentions | none | trivial |
| 9 | **Fix `matchedN === 6`** — 4–5-word categories are unwinnable | none | trivial |
| 7 | Draw game pairs from `d.mastered` first | **none — data exists** | trivial |
| 6a/6b | Game naming per mechanic; per-scope high score | none | trivial |
| 8 | «دور» + a 5-round win state instead of a fake ladder | none | trivial |
| 3b | Writing: near-miss spelling feedback | none | moderate |
| 12 | Track missed items; list them; «فقط اشتباه‌ها» | none | moderate |
| 10 | Drills for the starred list (`poolFor` helper) | none | moderate |
| 11 | `canSpeak` guard for the listening drill | none | moderate |

**Not one fix in this section requires new content.** Every field, every count, every set the proposals need — `exfa`, the distractor `en`, `d.mastered`, `d.starred`, the per-category counts, the XP total — is already in the data or already in state, and in three cases (`sent.fa`, `opts[].en`, `xp`) is computed and then dropped.

---

## Would need new work — kept separate, and I do not recommend it

- **Per-word IPA in the speaking drill.** The README records that `ipa` is supported end to end and no word carries it. When the pronunciation agent has run, the speak prompt is the single best place for it. Content cost: 10,524 entries, agent-generated. Not a UX fix; listed so it is not forgotten when the field lands.
- **A fifth drill type.** No. Four is already more than most learners will find.
