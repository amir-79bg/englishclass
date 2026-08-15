# روش آموزش — the teaching method

**Status:** decided, not implemented. Written for whoever edits `data/src/app.jsx` and re-runs `tools/rebuild.js`.
**Written in English on purpose** — the reader is the implementer. Every string that ships to the learner is given in Persian, verbatim.

Constrains `docs/learning-path.md`. Where I disagree with that document I say so in §12, with the reason.

---

## The method in one paragraph

This is a **deliberate vocabulary course built on successive relearning**, and it teaches the words the rest of the app actually uses, in that order. Every word starts as a card you only have to recognise, and then — on later days, never the same day — comes back in harder forms until you have had to produce it from memory. A word is not counted as yours because you got it right once; it is counted when you have got it right **three times, on three different days, at least once by writing it yourself**. Until then it keeps coming back on a fixed ladder of 1, 3, 7, 21 and 60 days. Because of that rule the app can finally say a true sentence — «۳۱۲ واژه بلدی» — instead of the one it says now, which counts a lucky guess between four options as knowledge. The word list is re-ordered so the first words you meet are the ones you will hit an hour later in the grammar drill and the listening text, not `cast, chef, cure, desk`. And the app stops labelling those words A1–C2, because that label was never true: the levels are real in the grammar, sentence, listening and discussion curricula, where a human wrote them, and they are fiction in the word list, where they were derived from word length.

---

## 0. What I measured, and how

Everything numeric below was measured from the shipped bundle (`لغتنامه (ورژن ۱۱).html`), not from the summaries in the agent briefs. Scripts read the manifest with `tools/bundle.js`.

| Claim | Measured |
|---|---|
| `VOCAB_ORDER` length | 10,524 — a full permutation; `ORDER[k] === k` for **0** positions, so it is a real reordering |
| Average word length per band, A1→C2 | **5.49 · 6.31 · 5.05 · 6.28 · 7.12 · 9.74** characters |
| Consecutive steps non-decreasing in length | **67.3%** |
| First 12 "A1" words | `cast, chef, cure, desk, diet, hire, meal, oven, past, rude, surf, tire` |
| First "C2" words | `ampland, fastest, payroll, cookbook, courier, collapse, americas` |
| Category runs in `VOCAB_ORDER` | 5,418 runs across 10,524 positions — category is **not** the sort key either |
| Distinct example-sentence templates | **20 templates cover 10,508 of 10,524 words (99.8%)** |
| Words with a genuinely distinguishing example | **16** |
| Words sharing a Persian gloss with another word | 1,194 globally; 883 within the same category |
| Capitalised entries never used anywhere in the course | **745** |
| Closed-class / single-letter entries (`a`, `the`, `b`, `shall`…) | **90** |
| Multiword entries | 260 |
| Category `noun` | 6,496 of 10,524 = **61.7%** |

**The brief's finding is confirmed and is worse than stated.** The ordering is roughly length-ordered (the B1 dip to 5.05 is the one exception, caused by a run of multiword entries), and the example-sentence problem is not "47% from three templates" — it is **99.8% from twenty templates**. That second number changes two design decisions on its own.

### The one measurement the brief did not have

I built a corpus out of the app's own six curricula assets — `GRAM`, `SENT`, `LISTEN_1`, `LISTEN_2`, `DISC`, `COLLOC2` — stripping JSON keys so field names do not pollute it. **18,246 English tokens, 2,858 distinct types.** Then I asked which headwords actually appear in it:

| In-course occurrences | Headwords |
|---|---|
| ≥ 1 | 1,814 (17.2%) |
| ≥ 3 | 742 (660 after removing function words) |
| ≥ 10 | 218 |
| ≥ 20 | 110 |

And the damning one: **of the 200 headwords the app's own material uses most, only 48 sit in the current "A1" band.** 103 are in "A2", 49 are in B1 and above. The current A1 span of 842 words contains **162** of the 742 course-core words. A learner doing the app's own first grammar lesson and first listening text is meeting words the app has filed under B2.

---

## 1. Decision: the A1–C2 ladder is removed from the word list, and kept everywhere else

This is the highest-value decision here, so it gets the most space.

### Why the ladder cannot stay

1. **It is not difficulty.** It is length, at 67.3% monotonicity, with `LEVEL_SHARE = [.08, .11, .15, .19, .22, .25]` cutting an arbitrary permutation into six arbitrary slices. `levelOf(round)` (`app.jsx:293`) then derives a CEFR label from a counter that starts at 1.
2. **It contradicts the app's own content.** The four curricula that *do* have real levels — `GRAM`, `SENT`, `LISTEN`, `DISC`, all hand-authored per band — use vocabulary the word ladder calls B2 and C1.
3. **The size claims are not meaningful.** Milton & Alexiou (2009) put a C2 learner at roughly **4,500–5,000 words**. The app's C2 band alone is 2,630 *additional* entries on top of 7,894, i.e. it claims a finished learner knows 10,524 — twice a C2 vocabulary. Of those 10,524, 745 are capitalised junk never used anywhere (`ampland`, `Qin`, `Lady of Pacopampa`), 1,194 duplicate another entry's gloss, and 90 are function words or single letters. The list is not 10,524 teachable items.
4. **"You know 842 A1 words" would be false in two ways at once** — false about "A1", and (see §3) false about "know".

### What replaces it

**Three stages, named for what they measurably are, with no proficiency claim attached.**

| # | Persian name | Definition | Size |
|---|---|---|---|
| ۱ | **«هسته‌ی دوره»** | appears ≥3 times in the app's own grammar, sentence, listening, discussion and collocation material | **660** |
| ۲ | **«واژه‌های دوره»** | appears 1–2 times in that material | **1,066** |
| ۳ | **«گنجینه»** | the remaining list, ordered by measurable teachability | **8,708** |
| — | *parked* | 90 function words and single letters — never dealt as cards | 90 |

The argument for stage 1 is not a guess about English at large; it is a fact about **this** app: these are the words the learner will meet in step 2 and step 3 of the very same daily lesson. That is the strongest form of the frequency argument available offline (Nation's four strands: deliberate study should feed meaning-focused input, not run beside it), and it needs no external word list, no new content, and no network.

**A1–C2 stays exactly where it is authored:** the level chips on `gram`, `sent`, `listen`, `disc`, and `ui.lv`. `levelOf(round)` stops driving any label. This is my one substantive disagreement with `docs/learning-path.md` — see §12.

### The new ordering, and the fact that makes it cheap

Score every word from bundle data only:

```
base   = cf >= 3 ? 3000 + min(cf,800)      // in-course frequency
       : cf >= 1 ? 2000 + cf
       :           1000
       - 2500  if closed-class / single letter          (90 words, parked)
       + 60    if its example is not one of the 20 templates   (16 words)
       + 30    if its Persian gloss is unique                  (9,330 words)
       - 400   if capitalised AND never used in the course     (745 words)
       - 20    if multiword                                    (260 words)
       - 4 * min(len, 20)   // Zipf's law of abbreviation, a weak but real proxy
```

Measured output, first forty: `take, have to, learn, bad, day, two, last, one, use, fix, tip, to be, work, make, come, key, like, years, now, first, task, deep, night, time, after, never, wish, job, year, home, city, name, next, old, new, check, brief, tea, said, items`.

Against today's first forty: `cast, chef, cure, desk, diet, hire, meal, oven, past, rude, surf, tire, kind, dish, cave, law, blog, news, boss, fire, deny, drag, earn, rich, wise, door, lamp, room, sofa, wall`.

**This is a rebuild-time change, not a runtime one, and it does not touch anyone's progress.** `i` and `en` stay frozen; only the `VOCAB_ORDER` permutation changes. Verified against the code: `d.order` is *persisted* in `vocab_app_v1` and is only regenerated when `d.wordCount !== n` or the `v6` flag is missing (`app.jsx:321–332`), and `d.mastered` / `d.starred` are keyed by the frozen word index `w.i`. So an existing learner finishes their current round on the old order and picks up the new order at their next `nextRound()`. **No migration, no reset, no `v7` bump.** That is the single cheapest high-value change in this document.

Residual honesty: the scoring still lets some junk through around ranks 1,800+ (`cvs, lcd, vhs, bbc, avg, hiv, jim, joe`) and a few JSON artefacts near the top (`title`, `ing`). Ship a hand-checked stoplist of ~200 entries alongside; that is an afternoon, not a project.

### What the app says instead of a CEFR level

Current, on five screens: «سطح A1».

Replacement, on the word screens only:

> «هسته‌ی دوره — ۳۱۲ از ۶۶۰ واژه»

and on the browse screen:

> «۱۰٬۵۲۴ واژه در فهرست. دوره از ۶۶۰ واژه‌ای شروع می‌کند که در بقیه‌ی همین برنامه به کارشان می‌بری.»

---

## 2. The session: 20 cards, reviews first

**Budget: 20 cards. Reviews are dealt first, up to 13. New words fill the rest, capped at 10 per day. Steady state is 13 + 7 ≈ 7 minutes.**

- The **20** is not mine — it is `docs/learning-path.md`'s, and it is already what `leadDesc` promises (`app.jsx:2136`). I adopt it.
- The **split** is mine, and it is where the evidence points. Nakata & Webb (2016, *SSLA*, "Does Studying Vocabulary in Smaller Sets Increase Learning?") compared 4-, 10- and 20-item sets and found that when spacing was held equal, **set size had little effect and spacing had a large one**. So the right thing to do with a fixed 20-card budget is to spend it on spacing, not on volume: reviews get first claim, new words get the leftovers.
- **Cap new words at 10/day** because every new word is a debt — at 7 new/day the review load stabilises around 13/day under the §4 ladder; at 20 new/day it does not stabilise at all inside a 20-card budget.
- **Day 1 is deliberately short**: 0 due reviews, so 10 cards, ~3 minutes. A first session you finish is worth more than a first session that is representative.

**Honest arithmetic, stated in the app.** 7 new/day clears the 660-word core in **94 days** and core + periphery (1,726 words) in **247 days**. The app should say this rather than imply 10,524 is a destination:

> «با روزی هفت واژه‌ی تازه، هسته‌ی دوره — ۶۶۰ واژه — سه ماه طول می‌کشد.»

---

## 3. What «بلد» means

**The rule.** A word flips from *learning* to **بلد** when all four hold:

1. **three** correct answers, and
2. on **three different calendar days**, and
3. at least one of them in a **production** mode (`type` or `listen` — you wrote the English yourself), and
4. at least **7 days** between the first correct answer and the third.

And the rule that makes it honest:

5. **Only a word's first answer of the day counts.** An in-session re-show after a wrong answer never counts toward the three.

**Source.** Rawson & Dunlosky's successive-relearning work prescribes exactly this shape: retrieve to a criterion of **3 correct recalls**, then relearn across widely spaced sessions; retention a week out was reliably better at 3 correct than at 1. Condition 3 comes from the receptive/productive literature — recall formats produce productive knowledge, recognition formats do not (Webb 2009; Nakata 2016 on retrieval formats) — so a word passed only on multiple choice has not been shown to be known in any sense worth counting.

**What this replaces.** Today: `d.mastered[w.i] = (d.mastered[w.i] || 0) + 1` on any correct answer in any mode (`app.jsx:408`), and `learned = Object.keys(d.mastered).length` (`app.jsx:2088`) — **one** correct answer, threshold zero. In `mcq` mode with four options, a learner who knows nothing scores 25% by guessing, and each of those guesses permanently adds a word to the count. The current number cannot go down and was never earned. It is worse than no number.

**Migration for existing learners.** `d.mastered` is kept, unrenamed and unre-scoped, and reinterpreted rather than reset:

- A word with `mastered[i] >= 1` is seeded at **1 success**, first-success day = today, mode-mask = recognition. It is due tomorrow.
- Words with `mastered[i] >= 3` are seeded at **2 successes** — credit for the history, but they must still pass one production retrieval on a later day before they count as بلد.
- Nobody's count drops to zero, and the number they see changes name, so the change is visible rather than sneaky:

> «شمارش عوض شد: از این به بعد واژه‌ای «بلد» حساب می‌شود که سه بار، در سه روز مختلف، درست جواب داده باشی — یک بارش هم با نوشتن خودت. ۱۴۰ واژه‌ی قبلی‌ات نگه داشته شده و در صف مرور است.»

---

## 4. The review schedule

**One new key, `vocab_sr_v1`, added to the export list at `app.jsx:2170`.**

```json
// vocab_sr_v1 — { wordIndex: [successes, firstDay, lastDay, modeMask] }
{ "412": [2, 20310, 20317, 3] }
```

`firstDay` / `lastDay` are integer day numbers (`Math.floor(Date.now()/864e5)`), 5 digits each. `modeMask` is a bitfield: 1 = mcq, 2 = type, 4 = listen, 8 = flash-self-rated. About 25 bytes per touched word; at 2,000 touched words ≈ 50 KB, against a 5 MB localStorage budget. Untouched words store nothing.

**The ladder.** Due when `today - lastDay >= INTERVAL[successes]`:

| successes | 0 | 1 | 2 | 3 | 4+ |
|---|---|---|---|---|---|
| **days** | same session | **1** | **3** | **7** | **21**, then **60** |

**Why these numbers.** Cepeda et al. (2008, *Psychological Science*, 1,350 participants) found the optimal study gap is a proportion of the target retention interval — about 20% at a one-week horizon falling to 5–10% at a one-year horizon. For a course whose horizon is "still know it next year", that maps to a ladder that starts near a day and ends near two months, which is what 1/3/7/21/60 is. I deliberately do **not** use an aggressively expanding schedule: Karpicke & Roediger (2007) found expanding retrieval helps short-term retention while **equally spaced retrieval is better for long-term retention**, so the ladder expands gently and then flattens.

**Why not FSRS or SM-2.** Both are better algorithms — FSRS needs ~20–30% fewer reviews for the same retention and beat SM-2 for >99% of users in the Anki benchmark. Both also need a per-card review *history* with grades and timestamps, a trained parameter set, and a scheduler. This app has no timestamps at all today, ships as one offline HTML file with no dependencies, and has a learner who studies 20 cards a day. At that volume the gap between a fixed Leitner ladder and FSRS is a few cards a week. **A fixed ladder is the right trade here**; note it plainly as the place to revisit if daily volume ever goes above ~100 cards.

**On failure.** A wrong answer sets `successes = max(0, successes - 1)` and `lastDay = today`, so the word is due **tomorrow**, not in three weeks.

**On the 8-card re-insert — keep it, but demote it.** `advance()` re-inserts a missed word 8 positions later (`app.jsx:411–412`) and the app calls that spaced repetition. It is not: an 8-card lag is roughly 90 seconds, and Karpicke & Roediger's result is that a short initial lag buys short-term performance and not long-term retention. But it is a genuinely useful **correction** — you get a second look at the thing you just got wrong, in the same sitting, while the feedback is live. So: **keep the mechanism exactly as written, and make the in-session repeat not count** (§3 rule 5). One `if`. The real interval is the cross-day one.

---

## 5. Mode ordering per word

**Replace the round-global rotation with a per-word stage ladder.** Today `mode()` returns `MODES[(round-1) % 5]` (`app.jsx:353`) — every word in round 3 is a `type` item whether the learner has ever seen it or not. That is backwards: receptive knowledge precedes productive knowledge, so the format should follow the word, not the round.

| stage | mode | what it asks | counts as |
|---|---|---|---|
| 0 | `flash` | see word + audio + gloss, self-rate | nothing (introduction) |
| 1 | `mcq` | English → pick the Persian | recognition |
| 2 | `listen` | hear it, write the English | production (form recall from sound) |
| 3 | `type` | Persian → write the English | production (full) |
| 4+ | `type`, then `mcq` alternating | maintenance | either |

Stage = `successes`. **On failure at any stage: drop one stage (floor 1), re-show after 8 cards without scoring, due tomorrow.** A learner who fails `type` gets `listen` next time, not `type` again — the ladder is the desirable difficulty, and repeating a difficulty you just failed is not desirable, it is discouraging.

**`cloze` is retired from the spine.** This is forced by the measurement, not by taste. 99.8% of words carry one of twenty template sentences, and `buildOptions()` in cloze mode shows four *English* options against a sentence like `This ~ is very important to me.` — where `desk`, `oven`, `meal` and `chef` are all grammatical and all true. **The item has no correct answer**; a learner can only pass it by remembering which word was on the previous card. Keep the mode in the codebase, gate it on `tmplShared(w) <= 20`, and note that this currently qualifies **16 words**. If the `examples` agent ever rewrites the sentence stock, cloze becomes the best mode in the app and slots in at stage 3.

**Why not `type` earlier.** Webb (2009) and the retrieval-format work: recall formats build productive knowledge, recognition formats build receptive knowledge, and learners acquire receptive knowledge more easily. Asking for a spelling on first contact produces a failure, not a retrieval.

**A caveat I must state.** Stage 1 depends on distractors being distinguishable, and `buildOptions()` draws them from the same category. **61.7% of the list is `cat: "noun"`**, so for most words "same category" is a 6,496-item pool — effectively random, which makes the MCQ *easier* than intended and therefore weaker evidence of knowing. Combined with 1,194 words sharing a gloss, stage 1 is the weakest rung. That is exactly why §3 requires a production success and does not accept three MCQ passes.

---

## 6. Where the other six curricula attach

| Curriculum | Relationship | Trigger |
|---|---|---|
| **ترکیب‌های رایج** (collocations) | **Hangs off the spine — this separation is wrong today** | When any of the 12 `CORE_VERBS` (`make/do/take/have/get/go/come/keep/put/set/give/bring`) reaches بلد, its collocation group becomes the recommended ساختار exercise |
| **دستور زبان** | Parallel, on the **real** CEFR axis (`ui.lv`) | Daily step 2 |
| **جمله‌سازی** | Parallel, on `ui.lv` | Daily step 2, after grammar |
| **متن شنیداری** | Parallel, on `ui.lv` | Daily step 3 |
| **گفت‌وگو** | Parallel, on `ui.lv` | Daily step 3, after a listening text of the same level |
| **بازی‌ها** | Off the spine, fluency strand | Available whenever ≥50 words are at stage ≥2; deals only from those |

**The collocation decision is the one worth arguing.** 349 phrases sit in a section with no connection to the words, and Boers & Lindstromberg's line of work — and the fluency findings behind it — is that chunks are the unit that buys fluent production, and that learners will not spot them unaided. `COLLOC2` is literally *which word goes next to which word*, keyed by twelve verbs that are all in the word list. Verified: `make` (frequency 27 in the course corpus), `take` (37), `get` (39) are all in the proposed stage 1. So the attachment is available: **the moment you know `take`, the app offers you what `take` goes with.** That is a real hand-off, triggered by word state, and it costs one lookup.

**The game deals only from stage ≥2 words.** Nation's fourth strand is fluency development — speeded work with *already known* material. A matching game over unseen words is not fluency practice, it is noise.

---

## 7. What the learner is told

Every string below is derivable from the state defined in §3 and §4 and is true under it.

**On «امروز»:**
> «۳۱۲ واژه بلدی.»
> «۱۳ واژه برای مرور امروز · ۷ واژه‌ی تازه»

**Under the card, replacing the `0 / 842` counter as sole context:**
> «هسته‌ی دوره — ۳۱۲ از ۶۶۰» و «هدف امروز: ۸ از ۲۰ کارت»

**The moment a word passes the criterion** — a one-line note under the card, not a screen:
> «‏«work» بلد شد — سه بار، در سه روز، یک بار هم با نوشتن خودت. ۳۱۳ واژه.»

**When the core stage completes:**
> **هسته‌ی دوره تمام شد — ۶۶۰ واژه**
> «این همان ۶۶۰ واژه‌ای است که در درس‌های دستور زبان، متن‌های شنیداری و جلسه‌های گفت‌وگوی همین برنامه به کار می‌روند. از این به بعد واژه‌های تازه کم‌کاربردترند، اما فهرست کامل ۱۰٬۵۲۴ واژه همیشه در دسترس است.»

**What the app must stop saying:**
- «سطح A1» on any word screen. Replaced by «هسته‌ی دوره».
- «۸۴۲ لغت» as a level size. It is a slice of a length-sorted list.
- «۳۱۲ لغت تیک‌خورده» (`browseCount`, `app.jsx:2309`) for one correct answer. Replaced by «۳۱۲ واژه بلد · ۴۸۰ واژه در حال یادگیری».

---

## 8. A worked example: `work` (index found via `en === "work"`, `cat: work`, in-course frequency **37**)

Under the proposed ordering `work` is word **#14**. Under the current ordering it is not in the first forty.

| Day | Stage | Mode | Task | Result | State after |
|---|---|---|---|---|---|
| 1 | 0 | `flash` | Card shows **work**, audio plays, learner flips to «کار». Self-rates «بلد بودم». | — | `successes 0`, due day 2. Self-rating never counts. |
| 2 | 1 | `mcq` | «work» → کار / خانه / مدرسه / پول | ✅ | `[1, 20310, 20310, mask 1]`, due day 3 |
| 3 | 2 | `listen` | Audio only, type the English | ❌ typed `werk` | `successes → 0`, re-shown 8 cards later as `flash` (**not counted**), due day 4 |
| 4 | 1 | `mcq` | recognition again | ✅ | `[1, 20310, 20313, 1]`, due day 5 |
| 5 | 2 | `listen` | audio → `work` | ✅ | `[2, 20310, 20314, 5]`, due day 8 |
| 8 | 3 | `type` | «کار» → write `work` | ✅ | `[3, 20310, 20317, 7]` — three successes, three distinct days, production mode present, day 8 − day 1 = **7 ≥ 7** → **بلد** |
| — | — | — | Card shows the note in §7. Counter 312 → 313. | | |
| 29 | 4 | `type` | maintenance | ✅ | due day 89 |

**The failure branch that matters.** Had the day-8 `type` failed, `successes` drops to 1, the word is due day 9 at stage 1, and it is **not** counted — the number the app shows does not move. That is the whole point: the count only goes up when something was actually retrieved.

**And the branch that shows why `work` is the right first word.** `work` appears 37 times across `GRAM`, `SENT`, `LISTEN` and `DISC`. On day 2 the learner meets it on a card; on the same day, in step 2 of «درس امروز», they meet it inside a grammar drill sentence. Under today's ordering `work` is filed at C1 and the learner would not see the card for two years.

---

## 9. What the current app gets right — keep it

Honestly assessed, not padded:

1. **The 8-card re-insert.** Keep it verbatim. It is a good in-session correction; it was only ever mislabelled as the spacing mechanism (§4).
2. **The five modes themselves.** `flash / mcq / type / listen / cloze` is the right *set* — recognition, form recall from sound, full production. Four of the five survive unchanged. Only the *scheduling* of them changes, and only `cloze` is benched, and that is a data problem, not a design problem.
3. **`d.quizzes` recording every attempt, not just passes** (`app.jsx:466`), with the comment explaining why. Correct, and the comment is right.
4. **The re-insert of missed quiz words 5 positions later** (`app.jsx:467`). Same rationale as the 8-card rule.
5. **`buildOptions()` deduping distractors by the text *shown* rather than by index** (`app.jsx:384–390`). That is exactly the right fix for the 883 shared-gloss problem and it is already there.
6. **`removeWord()` shifting `mastered` and `starred` with `d.order`** (`app.jsx:272–284`). Careful, correct, and easy to have got wrong.
7. **`starred` as a manual "I don't know this" flag.** A learner-controlled override on top of any algorithm is worth keeping; wire it to force stage 1 on the next deal.
8. **The milestone quiz at 300 words, 20 questions, 70%.** Keep the shape. It is a spaced cumulative test, and the testing effect makes it a learning event and not only a measurement. One change: score it against **بلد** words rather than the last 300 dealt positions, so it measures the claim the app makes.

---

## 10. What changes in the code, ordered

Ranked by honesty-and-effect per unit of work.

### 1. Re-order `VOCAB_ORDER` — **trivial to ship, largest single effect**
Rebuild-time only. Score words as §1, write the new permutation into the asset with `writeAsset`, run `tools/validate.js`, `tools/rebuild.js`. No app code changes, no migration — `d.order` is persisted and `i` is frozen (verified, §1). Ship the ~200-entry junk stoplist with it.
**Cost: trivial** (a script and an afternoon of hand-checking).

### 2. `vocab_sr_v1` + the interval ladder — **moderate**
New key, new `srLoad()/srSave()`, add to the export list at `app.jsx:2170`. Replace the deal in `chunkOrder()`/`prepare()` with: due reviews first (up to 13), then new words from the new order (up to 10). Seed from `d.mastered` per §3.
**Lives in:** new methods beside `load()`; `chunkOrder` (`294`), `advance` (`404`), `prepare` (`394`).

### 3. The `بلد` criterion and the honest counter — **moderate**
In `advance()`: stop unconditional `d.mastered[w.i]++`; write `vocab_sr_v1` instead, first-answer-of-day only, and apply the four-part test. Replace `learned = Object.keys(d.mastered).length` (`2088`) and `browseCount` (`2309`).
**Depends on:** 2.

### 4. Per-word mode ladder replacing `mode()` — **moderate**
`mode()` (`353`) and `modeInfo()` (`354`) take the current word and read `successes`, instead of reading `d.round`. Gate `cloze` on template uniqueness. The `methods` strip on the words hub (`2156`) stops showing "round 3 of 5 = typing" and starts showing the word's own stage.
**Depends on:** 2. **Note:** this is the change that makes `d.round` mostly decorative — leave `round` in storage untouched so nothing breaks.

### 5. Drop CEFR labels from the five word screens; collocation hand-off — **moderate**
Replace `levelOf(d.round)` at `118`, `2127`, `2136`, `2140–2143` with the stage name. Keep `levelOf` itself (other code reads it). Add the `CORE_VERBS`-to-`COLLOC2` trigger of §6.
**Depends on:** 1, 3.

Beyond the top five, in order: seed-migration copy (§3, trivial); milestone quiz drawn from بلد words (small); game gated to stage ≥2 (trivial); `starred` forcing stage 1 (trivial).

---

## 11. Content the method needs and the data cannot supply

Per the no-new-content constraint, these are stated, not designed around.

1. **Example sentences are the blocking gap.** 20 templates for 10,524 words. This benches an entire mode and makes the `ex`/`exfa` block under every card decorative. The `examples` agent exists and takes index ranges — **the first 1,726 words of the new order (core + periphery) are the range worth doing**, and that is the highest-value content commission in the app, ahead of the 24 listening texts named in `docs/learning-path.md` §10.
2. **745 capitalised, never-used entries** (`ampland`, `Qin`, `Lady of Pacopampa`, `evanescence`) should be deleted, not re-ordered — but `i` is frozen and deletion corrupts saved progress. They can only be *parked* (excluded from `VOCAB_ORDER`, still browsable). The list size claim should drop accordingly: «۱۰٬۵۲۴ واژه» is honest as a fetch-list, not as a curriculum.
3. **1,194 duplicate glosses** cap how good stage-1 distractors can be. The `translator` agent's range work is the fix.
4. **61.7% of words are `cat: "noun"`**, so category is not a usable difficulty or distractor signal. Any future ordering that leans on `cat` will be leaning on nothing.
5. **No word-family or part-of-speech data**, so `work` (noun) and `work` (verb) cannot be distinguished, and `run/running/ran` are separate unrelated cards. This bounds the count's meaning: 660 *entries*, not 660 word families.

---

## 12. Where I disagree with `docs/learning-path.md`

I adopt that document's spine, its 20-card day, its three-step lesson, its zero-hard-locks stance, and its `ui.lv` field. Three disagreements, stated as required.

**A. `ui.lv` must not own the word section.** §4 of that document makes A1–C2 "the shared axis: every section opens at the same level", including واژه‌ها. It cannot, because the word bands are not levels (§1 here). **The fix is small and preserves the rest of their design intact:** `ui.lv` continues to own `gram`, `sent`, `listen` and `disc` — four sections, four call sites, exactly as their change 4 specifies — and واژه‌ها reports its stage instead. Their §7 level-completion card keeps three of its four checkpoints; the واژه‌ها checkpoint becomes «۱۵۰ واژه‌ی تازه بلد شدی» rather than «آزمون ۳۰۰ لغت», which is both true and easier to reach.

**B. Their §11 leaves the five-mode rotation alone as "a decision that was already made well".** I am overruling that, and it is inside my remit rather than theirs. The rotation is a *sequence* decision at the round level and a *method* decision at the word level, and at the word level it is wrong: it gives a first-contact word a typing task because the round happens to be round 3. §5 replaces it. Their daily lesson is unaffected — it still "rides whichever mode the card is in", the mode is just chosen per word now.

**C. Their §7 checkpoint «any milestone quiz ≥70%» is measured against the wrong pool.** `startQuiz` draws from the last 300 *dealt positions* (`app.jsx:434`), which under a review-first deal is a mix of new and old. Draw it from بلد words instead, so passing it means something.

Everything else in that document I take as given, including their §10 content findings, which my §11 extends rather than contradicts.

---

## 13. The evidence that would change my mind

Ordered by how cheaply it could be gathered.

1. **A real frequency list.** My in-course corpus is 18,246 tokens and ranks only 1,814 of 10,524 words. If a GSL/NGSL/BNC-derived rank could be baked in at rebuild time — it is a static list, so it costs bundle size and nothing else — **it should replace my stage-1/2/3 scoring entirely**, and the honest CEFR question could be re-opened, because CEFR-band word lists do exist and could be joined against `en`. I could not do this offline; my ordering is the best available *from data the app already ships*, which is a weaker claim than "the best ordering".
2. **If the example sentences get rewritten**, `cloze` stops being benched and becomes stage 3, displacing `type` to stage 4 — a sentence-context production task is stronger evidence of knowing a word than isolated spelling.
3. **If measured daily volume turns out to be well above 20 cards** (say a learner doing 100+/day), the fixed 1/3/7/21/60 ladder starts costing real time and FSRS-style scheduling becomes worth its complexity. Below ~50 cards/day it is not.
4. **If the `mastered` maps of real users show most words at count 1**, my seed rule (§3) is roughly a no-op and the migration copy can be softened. If they show many at 5+, those learners have genuinely done the work and seeding them at 2 successes is too harsh — seed at 2 but skip the 7-day condition for them.
5. **Marked as judgement, not evidence:** the 13/7 review/new split, the exact 1/3/7/21/60 day values, and the choice of ≥3 in-course occurrences as the core cutoff. The *shapes* are sourced (reviews first, gently-then-flatly expanding, frequency-first); the specific integers are calibration I picked to make a 20-card day stabilise, and they should be re-tuned against real review-load data rather than defended.

---

## Sources

- [Cepeda, Vul, Rohrer, Wixted & Pashler (2008), *Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention*, Psychological Science](https://laplab.ucsd.edu/articles/Cepeda%20et%20al%202008_psychsci.pdf) — optimal gap as a proportion of the retention interval
- [Karpicke & Roediger (2007), *Expanding Retrieval Practice Promotes Short-Term Retention, but Equally Spaced Retrieval Enhances Long-Term Retention*](https://learninglab.psych.purdue.edu/downloads/2007/2007_Karpicke_Roediger_JEPLMC.pdf) — why the ladder flattens rather than expands
- [Rawson & Dunlosky (2022), *Successive Relearning: An Underexplored but Potent Technique*, Current Directions in Psychological Science](https://journals.sagepub.com/doi/full/10.1177/09637214221100484) — the 3-correct criterion plus relearning across days
- [Nakata & Webb (2016), *Does Studying Vocabulary in Smaller Sets Increase Learning?*, SSLA](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/does-studying-vocabulary-in-smaller-sets-increase-learning/E17B75ABAE1300734AF014C363D59FBC) — 4 vs 10 vs 20 item sets; spacing dominates set size
- [Nakata (2016), *Effects of Retrieval Formats on Second Language Vocabulary Learning*](https://www.researchgate.net/publication/294443124_Effects_of_retrieval_formats_on_second_language_vocabulary_learning) — recall vs recognition formats
- [Webb (2009), *The Effects of Receptive and Productive Learning of Word Pairs on Vocabulary Knowledge*](https://www.researchgate.net/publication/249769008_The_Effects_of_Receptive_and_Productive_Learning_of_Word_Pairs_on_Vocabulary_Knowledge) — receptive precedes productive
- [Nation (2006), *How Large a Vocabulary Is Needed for Reading and Listening?*](https://www.scienceguide.nl/wp-content/uploads/2017/11/nation-2006-vocabulary.pdf) — 2,000–3,000 for everyday communication; 8,000–9,000 for unassisted reading
- [Nation & Waring (1997), *Vocabulary Size, Text Coverage and Word Lists*](https://www.lextutor.ca/research/nation_waring_97.html) — first 1,000 families cover 78–81% of text
- [Milton (2010), *The Development of Vocabulary Breadth Across the CEFR Levels*](http://www.eurosla.org/monographs/EM01/211-232Milton.pdf) — CEFR vocabulary-size estimates, A1 <1,500 to C2 4,500–5,000
- [Boers et al. (2006), *Formulaic Sequences and Perceived Oral Proficiency: Putting a Lexical Approach to the Test*, Language Teaching Research](https://journals.sagepub.com/doi/10.1191/1362168806lr195oa) — chunks and fluency
- [Nation, *The Four Strands*](https://files.eric.ed.gov/fulltext/EJ887869.pdf) — deliberate study, meaning-focused input/output, fluency development
- [FSRS vs SM-2 benchmark discussion](https://memstride.com/blog/fsrs-vs-sm2-algorithm-comparison/) — 20–30% fewer reviews, >99% of users; the reason a fixed ladder is nonetheless the right trade here
