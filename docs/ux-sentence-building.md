# جمله‌سازی — sentence building, reviewed as a first-time learner

**Scope:** screens `sent` (hub) and `sbrun` (runner); `sb*` methods and `sentVals()` in `data/src/app.jsx:634–1031`; markup at `data/src/template.html:10123–10436`; data = the `SENT` global, asset `34d1c5c1-…`.

**Assumes** `docs/ux-structure-plan.md`. In that model `sent` is **ساختار › جمله‌سازی** (hub, depth 2) and `sbrun` is its runner (depth 3); the runner's `خروج` at `template.html:10166` becomes the shared **بستن** strip with crumb `ساختار · جمله‌سازی · <mode>`. Nothing below re-litigates that.

**One note for whoever implements the shared location strip:** change 4 of the plan says "reuse `sbPos`". `sbPos` only exists in **chunk** mode (`app.jsx:928`). The other five modes use differently-named values — `spatPos` (898), `sexPos` (955), `scmPos` (986) — and **free and game have no position value at all**. Budget for that.

---

## What the data actually contains

Uniform across all six levels — there is no thin level and no missing level, but every mode is much smaller than the hub implies:

| level | intro | patterns | chunks | expand | combine |
|---|---|---|---|---|---|
| A1…C2 (all six) | 1 paragraph, 129–187 chars | **3** (all 3 carry a `note`) | **6** | **3** (6–8 steps total) | **4** |

- `chunks[].tip` exists on only **15 of 36** items overall (A1: 2 of 6, B1: 1 of 6).
- `combine[].answers` holds **1 or 2** strings; `combine[].hint` is present on all 24.
- A full chunk round is 6 sentences (~2 min). A full combine round is 4 items. Nothing on any screen tells the learner this.

---

## The findings, ranked by confusion removed per unit of work

Items 1–4 need **no new content whatsoever** — the text is already computed and simply never reaches the screen. Those are the ones to do first.

---

### 1. 🚨 The free-writing screen renders two empty boxes, and the only sentence that explains the mistake is thrown away

**Now.** The learner writes a sentence, taps **«ساختار جمله‌ام را بررسی کن»**, and gets a green panel containing: a score chip («ساختار: ۷۰ / ۱۰۰»), **an empty line with a speaker button next to it**, **a second empty line**, then three generic tips. Tapping the speaker button reads nothing. There is no statement of what was wrong.

**Why.** `sbFreeCheck` (`app.jsx:774`) sets `ai: { score, fb, tips }`. `sentVals` reads a different shape:

```js
out.sfrFixed = r ? r.fixed : '';   // app.jsx:1023 — r.fixed does not exist
out.sfrWhy   = r ? r.why   : '';   // app.jsx:1025 — r.why does not exist
out.sfrSayFixed = () => r && this.speakWord(r.fixed);  // app.jsx:1024 — speaks undefined
```

Both are rendered as visible rows at `template.html:10370` and `10373`. Meanwhile `fb` — which is built at `app.jsx:774` as `'اصلاح کن: ' + <the two failed checks> ` or `'ساختار جمله‌ات سالم است.'` — **is never read by anything.**

And `fb`'s contents are not trivia. It carries the output of `gradeSentence` (`app.jsx:115–156`), which includes nine Persian pitfall corrections written specifically for Persian speakers (`app.jsx:133–143`): «به جای «I am agree» بگو «I agree».», «با he/she/it فعل s می‌گیرد»، «قبل از صدای مصوت از an استفاده کن»، and six more. **The app diagnoses the learner's exact mistake, in Persian, and then discards the diagnosis.**

**The change.** In `sentVals`, `sb.mode === 'free'` branch:
- replace `out.sfrWhy = r ? r.why : ''` with `out.sfrWhy = r ? r.fb : ''`;
- delete `sfrFixed` and `sfrSayFixed`, and delete the row at `template.html:10369–10372` (there is no corrected sentence to show — the grader never produces one, and inventing one is out of scope).

Better, and still no new content: have `sbFreeCheck` keep the full `g.checks` array and render the failed ones as a list under the score, styled like `sfrTips` at `10374–10378`. Every label is already a complete Persian sentence.

**Data supports it:** yes, entirely. **Cost: trivial** (one field rename + one deleted row) to **small** (rendering the checks list).

---

### 2. 🚨 The chunk screen's only instruction is computed and never rendered — and the template has a broken else-branch where it was meant to go

**Now.** The learner picks «چیدن بلوک‌ها», and gets: a Persian sentence, an empty dashed box, a row of English fragments, and a greyed-out **بررسی** button. Nothing says the dashed box is a tray, that the fragments go into it, or that the check button unlocks only when every fragment is placed. The greyed button never explains why it is grey.

**Why.** `out.sbEmptyHint = 'بلوک‌ها را به ترتیب بزن تا جمله ساخته شود'` (`app.jsx:917`) — **grep it in `template.html`: it appears nowhere in the markup.** The hole it was written for is still visible at `template.html:10211–10216`:

```html
<sc-if value="{{ sbHasPicked }}"> … the picked chunks … </sc-if>
<sc-if value="{{ sbHasPicked }}"><span></span></sc-if>   <!-- 10216: same condition, empty body -->
```

The second `sc-if` is the "else" branch, left with a duplicated condition and an empty `<span>`.

**The change.** Add `out.sbNoPicked = !out.sbHasPicked;` next to line 916, make `10216` read `<sc-if value="{{ sbNoPicked }}">` and put the existing `{{ sbEmptyHint }}` string inside it, in the muted 12px grey already used elsewhere. Same fix applies to the game tray at `template.html:10399–10403`, which has no empty-state branch at all.

**Data supports it:** yes — the string exists. **Cost: trivial.**

---

### 3. 🚨 Expand mode shows the learner the answer before they answer

**Now.** On the last step of every expand item the learner sees, *below the two options and before choosing*, a green panel headed **«جمله‌ی کامل‌شده»** containing the finished sentence. For A1 item 1 the options are `The little girl sings beautifully in the garden.` vs `The little girl in the garden sings beautifully.` and the panel below reads `The little girl sings beautifully in the garden every evening.` The correct option is printed underneath it. The last step of all 18 expand items is unanswerable-wrong.

**Why.** `out.sexIsLast = sb.step + 1 === it.steps.length` (`app.jsx:972`) does not consider `sb.picked`, and `template.html:10274` gates the panel on `sexIsLast` alone.

**Second, smaller problem in the same panel:** `it.final` is not the sentence the learner built. A1 item 1 ends at `…in the garden.` but `final` is `…in the garden every evening.`; item 2 ends at `…with my family.` and `final` adds `every day`. The learner is shown a sentence with words that were never offered, with no label saying so.

**The change.** Gate the panel: `template.html:10274` becomes `<sc-if value="{{ sexShowFinal }}">` with `out.sexShowFinal = out.sexIsLast && sb.picked != null`. Change the panel's caption from «جمله‌ی کامل‌شده» to **«یک پله جلوتر — همین جمله با یک بلوک بیشتر»** so the extra words read as the point rather than as an error.

**Data supports it:** yes for the gating; the caption is 7 words of new Persian. **Cost: trivial.**

---

### 4. 🚨 The «آزمایشگاه الگو» builds ungrammatical English, prints it as **«جمله‌ی ساخته‌شده»**, and reads it aloud

**Now.** Pattern mode is a slot machine: pick one option per column, and whatever falls out is displayed at 17px under the heading «جمله‌ی ساخته‌شده» with a speaker button. There is no check. **Many combinations are wrong English.**

A1 pattern 1 (`فاعل + فعل`), subjects `Birds / My brother / The children / She` × verbs `sing / sleeps / are running / laughed`: **6 of the 16 combinations are ungrammatical** — `Birds sleeps.`, `My brother sing.`, `My brother are running.`, `She sing.`, `She are running.`, `The children sleeps.`

A1 pattern 3 (`S + be + C`), 4 subjects × `is / are` × 4 complements: **half of the 32 combinations have the wrong be-form** (`My room are cold today.`, `They is my friends.`), and several of the rest are semantically nonsense (`This book is my friends.`).

**«ترکیب تصادفی»** (`spatShuffle`, `app.jsx:896`) picks each column uniformly at random, so it produces one of these more often than not. `spatSay` then pronounces it. The pattern's own `note` — «با he/she/it فعل s می‌گیرد.» — is printed on the same screen, contradicted by the sentence above it.

**The change**, in ascending cost:

- **(a, trivial)** Rename the built-sentence caption from **«جمله‌ی ساخته‌شده»** to **«ترکیب تو — خودت بررسی کن درست است یا نه»** and move the pattern `note` (currently at `template.html:10194–10196`, below) to directly under the built sentence. This turns the screen from "here is a sentence the app made" into "here is a combination, check it against the rule" — which is a defensible exercise and needs no data change. ~10 words of new Persian.
- **(b, moderate)** Add a subject–verb agreement check for the two patterns per level that have a subject and a verb column: tag each slot option `sg`/`pl`/`any` in `SENT`, and colour the built sentence red with the `note` when the tags disagree. Requires tagging 18 patterns × 2–4 columns in the data — real content work, roughly 200 small edits.
- **(c, trivial, and worth doing regardless)** Make `spatShuffle` not the primary button. It currently has the filled/coloured treatment (`template.html:10198`) while «الگوی بعدی» is the ghost button — the loudest button on the screen is the one that most reliably generates wrong English.

**Data supports it:** (a) and (c) yes. (b) needs new data. **Cost: trivial for (a)+(c), large for (b).**

---

### 5. Six modes, no stated order, no numbering, and two of them can never be completed

**Now.** The hub shows six equal-weight cards in a 2-column grid. A learner arriving for the first time sees «آزمایشگاه الگو», «چیدن بلوک‌ها», «گسترش جمله», «ترکیب جمله‌ها», «جمله‌ی خودت», «بازی مسابقه‌ی جمله» — six things they have never heard of, each with one line of description, in no marked order, all with the badge **«شروع نکرده‌ای»**. Nothing says whether these are a sequence, alternatives, or difficulty tiers. (They *are* a sequence: easiest → hardest, in the order listed.)

Above them sits a 5-item list headed «روش کار — پنج قدمِ ساختن هر جمله» (`sbSteps`, `app.jsx:865–871`). It is good writing and it is **not** the six modes — steps 4 and 5 («شروع جمله را عوض کن», «بلندش را با یک جمله‌ی کوتاه جواب بده») correspond to no mode at all, and steps 1–3 are not labelled with the mode that practises them. So the learner reads a five-step method and then meets six unnumbered buttons that do not match it.

**Two of the six never finish.** `sbMark` is called with `_chunk` (701), `_expand` (718), `_combine` (752), `_free` (772) — **never `_pattern`**. So the pattern card's badge reads «شروع نکرده‌ای» permanently, no matter how much the learner uses it. Pattern mode also has no end state: `spatNextP` (`app.jsx:897`) just increments, `pk = sb.k % pats.length` wraps through the same 3 patterns forever, with no result screen and no «تمام شد». Free mode is the same — `sbFreeNew` increments `k` and `sbFreeTask` cycles `k % 3` patterns, so **«تمرین دیگر» gives you a new task exactly twice before repeating**, and nothing marks the mode done.

**The change.**
- Number the six cards **۱–۶** in the badge slot that already exists (`template.html:10153`), and change the section caption above the grid from nothing to **«به همین ترتیب جلو برو — از بالا به پایین سخت‌تر می‌شود.»**
- Attach each of the five method steps to its mode by appending the mode name in the step text (`app.jsx:865–871`): step 1 → «(در آزمایشگاه الگو)», step 2 → «(در گسترش جمله)», step 3 → «(در ترکیب جمله‌ها)». Steps 4–5 keep no mode and should say **«— این دو را در «جمله‌ی خودت» تمرین کن.»**
- Give pattern mode an end: after the third pattern, `spatNextP` calls `sbMark(lv + '_pattern', 100)` and shows the same result panel the other modes use. Give free mode a stated length: **«۳ تمرین در این سطح»** with a `k+1 / 3` counter, ending after the third.
- Put the item count on each hub card's description: **«۶ جمله»**, **«۳ جمله»**, **«۴ تمرین»**, **«۳ الگو»**, **«۳ تمرین»**. All five numbers are `SENT[lv].<key>.length` — no new data.

**Data supports it:** the counts and the numbering, yes. The four caption edits are ~40 words of new Persian. **Cost: small** for numbering and counts, **moderate** for the two end states.

---

### 6. Combine mode marks correct sentences wrong, and hides the thing that would accept them

**Now.** The learner is given 2–3 short English sentences and a hint, and writes one combined sentence. `sbCombineCheck` (`app.jsx:721–728`) compares it to `it.answers` by **exact string equality** after lowercasing and stripping punctuation. `answers` holds **one** string at A1 and one-or-two elsewhere. Any other correct combination — a different connector, a different clause order, a contraction — produces the orange **«جمله‌ی الگو:»** state, is counted in `right` as a miss, and lands in the result as **«۱ از ۴ مطابق الگو»**. A learner who wrote four good sentences is told they got one.

The one thing that can recognise a valid variant is the **«جمله‌ی من هم درست است؟ (بررسی هوشمند)»** button (`sbCombineAI`, `app.jsx:729–747`) — which is rendered **only after** `scmAnswered` (`template.html:10318`), i.e. only after the exact-match verdict has already been delivered.

**The change.** Two edits, no new data:
- Reword the verdict so it stops claiming the learner is wrong. `out.scmOkMsg` (`app.jsx:996`) for the non-match case becomes **«جمله‌ی تو با الگو یکی نیست — ممکن است باز هم درست باشد. الگو:»**, and `out.scmResTitle` (1007) becomes **«۱ از ۴ دقیقاً مثل الگو»** with a second line: **«بقیه ممکن است درست باشند — با دکمه‌ی بررسی جمله را چک کن.»**
- Show the بررسی button *before* checking, next to «بررسی», not after.

**Data supports it:** yes. **Cost: trivial.** (Widening `answers` to accept more variants is the real fix and is content work: 24 items × 2–4 extra accepted answers.)

---

### 7. A wrong chunk answer explains nothing for 21 of 36 items

**Now.** Get the block order wrong and the panel says **«ترتیب درست:»** followed by the correct sentence, and — only if `it.tip` is non-empty — one orange line. `sbHasTip` requires `!!it.tip` (`app.jsx:905`), and **21 of the 36 chunk items ship `tip: ""`** (A1 has 2 of 6 filled, B1 has 1 of 6). So most wrong answers give the learner the right sentence and no reason.

The section already knows the reason. The A1 tip that *is* present — «ترتیب طلایی: چه‌کار → چه‌چیز → کِی» — is the rule for the whole level, not that one sentence; the same sentence appears in `sbResDesc` (`app.jsx:935`) as a consolation line at the end of the round, where it is too late to be useful.

**The change (no new data).** When `it.tip` is empty, fall back to the level's own rule rather than showing nothing: `out.sbTip = it.tip || SB_RULE[sb.lv]`, where `SB_RULE` is a 6-entry map you write once — A1 «چه‌کار → چه‌چیز → کجا → کِی», and one line each for A2…C2 lifted from that level's `intro`, which is already a one-paragraph statement of exactly this. Set `out.sbHasTip = !!sb.checked` (drop the `it.tip` condition). Also render `{{ sbTip }}` in the **game** block — it is computed for game mode too (`app.jsx:901`, the `chunk || game` branch) and the game markup at `template.html:10409–10414` never prints it.

**Data supports it:** the fallback text is a 6-line condensation of `SENT[lv].intro`, which exists. Writing it is ~60 words. **Cost: small.**

---

### 8. Leaving the runner silently destroys everything, and coming back starts over

**Now.** `sbQuit` (`app.jsx:836`) is `setState({ screen:'sent', sb:null })` — no confirmation, no save. Mid-round in chunk (say 4 of 6 right) the round is gone. In combine and free, the text the learner is typing is gone. The only persisted thing is a best-percentage per `lv_mode` (`sbMark`), written **only on completing the last item** — quit at item 5 of 6 and nothing at all is recorded. Returning to the hub, every card shows the same badge it showed before.

The runner's exit is labelled **«خروج»** at `template.html:10166` and **«بازگشت»** on the four result panels (10249, 10294, 10347, 10429) — two words for one destination.

**The change.** Within the plan's change 4 this is mostly free: one **بستن** in the strip, one destination. Beyond that, two cheap additions:
- If `sb.typed` is non-empty (combine, free), confirm before discarding: **«جمله‌ات ذخیره نمی‌شود. بیرون بروم؟»**
- Write partial progress: call `sbMark` in `sbQuit` with the partial percentage when `sb.items` and `sb.k > 0`, so quitting at 4-of-6 is not the same as never having started.

**Data supports it:** yes, `sbMark` already keeps the max. **Cost: small.**

---

### 9. The app promises AI it does not have, and never says how the free-writing score is produced

**Now.** The home card (`template.html:9654`) advertises **«نوشتن آزاد با بررسی هوشمند»**; the hub card for free mode says **«آزاد بنویس؛ هوش مصنوعی ساختارش را اصلاح می‌کند»** (`app.jsx:853`); the combine button says **«بررسی هوشمند»**; both buttons have a sparkle icon and a `busy` label «در حال بررسی…». The app is offline and there is no model. The grading is a regex pass (`gradeSentence`, `app.jsx:115–156`) plus a length/connector/adverb arithmetic (`app.jsx:771`):

```
score = 40 + (words>=10 ? 20 : 10) + (has -ly adverb ? 10 : 0) + (has and/but/because/… ? 20 : 0) - 10×failed_checks
```

A learner who writes a flawless six-word sentence scores 50; one who pads a clumsy sentence to eleven words with «and» scores 90. The panel shows **«ساختار: ۹۰ / ۱۰۰»** with a medal icon and no statement of what was measured, so the learner cannot tell whether the number means their English is good.

(Related dead code, harmless but symptomatic: `busy` is never set to `true` anywhere in `sb*`, so «در حال بررسی…» at `app.jsx:1017` and `1001` can never appear.)

**The change.** Stop claiming a mind, and label the axis. Replace the three strings:
- home card → **«نوشتن آزاد با بررسی خودکارِ ساختار»**
- free hub card `d` → **«آزاد بنویس؛ برنامه ساختار جمله را بررسی می‌کند — طول، فعل، ربط، نقطه.»**
- combine button `scmAiLabel` → **«ساختار جمله‌ی من را بررسی کن»**

and add one caption under the score chip (`template.html:10368`): **«این نمره فقط ساختار را می‌سنجد: طول جمله، فعل، حرف ربط، قید، حرف بزرگ و نقطه. معنی جمله سنجیده نمی‌شود.»** That sentence is the honest description of `app.jsx:771` and is the single thing most likely to stop a learner mistrusting the whole section.

**Data supports it:** no new data; ~45 words of new Persian. **Cost: trivial.**

---

### 10. Smaller things, worth fixing while you are in the file

- **Level chips are six bare letters.** `sbLvChips` (`app.jsx:846`) renders `A1 … C2` with no caption and no marker for the learner's own level, even though `goSent` (643) has just defaulted to it from `levelOf(round)`. Add the caption **«سطح»** before the row and an underline/dot on the active-by-default chip. Trivial; the value is already known.
- **The hub's intro paragraph has no heading** (`template.html:10136`) and reads as a floating quote. Prefix it with **«چرا این بخش»**. Trivial.
- **`sbCheckChunk` accepts exactly one order** (`app.jsx:693`, `p.i === i`). `every morning I drink coffee` is correct English and is marked wrong. Cheap mitigation: change the failure line from «ترتیب درست:» to **«ترتیب رایج‌تر این است:»**. Trivial.
- **Chunk rounds are re-shuffled from scratch each time** (`shuffled(D.chunks, Date.now() % 7919)`, `app.jsx:651`) over the same 6 items. After two rounds at a level there is nothing new. Say so on the card: **«۶ جمله — هر بار به ترتیبِ تازه»**. Trivial.
- **The game's item pool is cumulative** (`sbGameStart`, `app.jsx:789–790`: all levels up to and including the current one). At A1 that is 6 sentences, cycling `% items.length` forever; at C2 it is 36. Neither the card («۳۰ ثانیه برای هر جمله · جان و امتیاز و رکورد») nor the runner mentions that the game mixes levels. One clause on the card: **«از سطح تو و همه‌ی سطح‌های پایین‌تر»**. Trivial.
- **`isSent` is `s.screen === 'sent' && !!SD`** (`app.jsx:840`). If the `SENT` asset ever fails to load, both `sc-if` blocks are false and the screen renders **completely blank** — no message, no way back except the global header. One `sc-if` with «محتوای این بخش بارگذاری نشد.» would remove the dead end. Trivial.

---

## Would need new work (kept separate, per the brief)

Nothing in this section is missing a feature. The two places where a fix genuinely requires writing content rather than rendering it:

1. **`combine[].answers` is too narrow** (finding 6). Making the exact-match grader fair needs 2–4 additional accepted phrasings for each of the 24 items — 24 items × ~3 strings, plus judgement about which variants are acceptable at each level. Moderate content work, high payoff, entirely optional if the wording fix in finding 6 ships.
2. **Slot tagging for the pattern lab** (finding 4b). Tagging every slot option `sg`/`pl`/`any` across 18 patterns is the only way to stop the lab producing `Birds sleeps.` The wording fix (4a) is a real mitigation and should ship first regardless.

Everything else above is either already in the data or under fifty words of new Persian.
