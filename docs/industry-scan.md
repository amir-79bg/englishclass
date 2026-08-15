# اسکن صنعت — how the professionals structure a learning path

**Status:** survey and recommendation. Nothing here is implemented, and this document changes no other file.
**Method:** every product claim below was checked against a live page in August 2026 via `WebSearch`/`WebFetch`, not from memory. Where a current design was not documented publicly, it is marked **[inference]** in §7 and nowhere else.

Companion to `docs/methodology.md` (which answers *how to teach* from the research literature) and `docs/learning-path.md` (which answers *what to do today*). This document answers the same question those two answer — should skills sit on separate tracks? — **from practice**: what shipped products and published syllabi actually do.

Numbers for this app are taken from `docs/feature-map.md` and are not re-measured here.

---

## 1. The pattern that recurs

**There is a real consensus, and it is the opposite of separate skill tracks.** Every serious product surveyed runs **one ordered spine plus exactly one review lane**, and the ones that used to offer parallel skill tracks have removed them. Duolingo replaced its branching "tree" — where a learner chose which skill to level up next — with a single linear path, and said in its own announcement that it removed the choice specifically so it could interleave and space concepts rather than let learners grind one skill to completion. Memrise's 2025–26 rebuild merged vocabulary, pronunciation, native-speaker video and AI conversation into **one** session type and kept exactly one thing separate: "My Words", a personal dictionary. Babbel and Busuu both ship one themed unit sequence and one spaced-review tool beside it (Review Manager; Smart Review). Anki ships **only** the review lane and explicitly refuses the spine — its own manual tells you shared decks are "a supplement to external material, not as a replacement for it."

So the industry's separation is **1 spine + 1 review lane**, never *n* skill tracks. And the second half of the consensus is just as consistent: **the spine is finite and countable, the vocabulary lane is not.** A coursebook level is 12 units; the wordlist at the back of that same book is thousands of entries and is never a sequence. Nobody, anywhere, sequences vocabulary and grammar as two curricula of comparable weight — because they never are comparable, in any product or any published syllabus.

Where practice and the research literature diverge: the literature (Nation's four strands) says deliberate vocabulary study should be about **25%** of a balanced course, and every product's *marketing* agrees while its *engine* does the reverse — the SRS lane is the only part of Babbel, Busuu and Memrise with real per-item state, exactly as `vocab_sr_v1` is the only per-item state in this app (`feature-map.md` §3). This app is not unusual in being vocabulary-heavy. It is unusual in being **honest** about it, because it has no meaning-focused-input content to hide behind.

---

## 2. Comparison table

| Product | Path structure | Session unit | Gating | Progress display | Separated vs merged |
|---|---|---|---|---|---|
| **Anki + FSRS** | **No path at all.** A deck is an unordered bag; order is due-date only | "Today's due cards" — a queue, not a lesson. Length = whatever is due, bounded by a per-deck new-card limit | None. Nothing is a prerequisite for anything | Due counts + retention/stability graphs. **No completion, ever** — a deck is never "finished" | Separates *scheduling* from *content* absolutely. Merges nothing. Deliberately supplies no curriculum, no ordering, no explanation |
| **Duolingo** | **One linear path**, sections (CEFR-aligned) → units (~10 nodes) → nodes. The old branching tree was deleted in 2022 | One lesson ≈ up to 17 mixed items (translate, listen, speak, read) | **Sequential**, but skippable by a unit/section test. Not a hard lock | Path position, XP, streak, leaderboard; a per-unit guidebook | **Merged everything**: stories, listening, video call and grammar tips all became nodes on the one path. Separated only "Practice" (the review lane) |
| **Babbel** | Themed unit sequence per level (travel, food, work…) | One 10–15 min lesson: new vocab → drills → dialogue → grammar note *inside the lesson* | Sequential by default, freely browsable | Lesson/unit completion + review-item counts | **Merges grammar into the vocabulary lesson** — grammar appears as an explanation at the point of need, not as its own curriculum. Separates the Review Manager |
| **Busuu** | CEFR ladder A1→C1, unit = one logical flow | One unit: new vocabulary → grammar explanation → practice → review | Sequential; placement test at entry; Study Plan sets a target, not a lock | % of level, Study Plan streak, Smart Review weak-spot list | Same merge as Babbel. Separates Smart Review and human "Conversations" (community correction) |
| **Memrise (2025–26 rebuild)** | **One loop**: Learn → Immerse → Communicate | One mixed session: vocabulary + pronunciation + native-speaker video + AI chat, "tailored to your level and progress" | Goal/wordlist-driven rather than gated | **"My Journey": words *recognised* / *understood in context* / *used in conversation***. Progress is depth-per-item, not track-per-skill | Merged four former modes into one session. Separated "My Words" (a personal dictionary) — the review/reference lane again |
| **CEFR coursebook** (e.g. *English File*, 12 units/level; Cambridge *Empower*, Busuu/Duolingo's own reference point) | Grammar/function/topic is the spine; **12 units is a level**, finishable in a term | One double-page lesson: a text, a grammar point, a vocabulary set, a pronunciation strip, a speaking task | Sequential in practice; teacher may reorder | Unit number. Finishing the book *is* the achievement | **Vocabulary appears twice, in two different roles**: a small topic set inside the unit, and a large **Wordlist / Vocabulary Bank at the back** that is reference and self-study, explicitly not part of the sequence |
| **English Profile** (the published CEFR description) | Not a course — the reference both coursebooks and apps cite | — | — | — | **English Vocabulary Profile ≈ 6,750 headwords across A1–C2. English Grammar Profile ≈ 1,200+ criterial grammar features.** Even at description scale, vocabulary outnumbers grammar ~5.5 : 1 — and a *taught* level is ~10–12 grammar points against 500–1,000 words, i.e. **50–80 : 1** |

---

## 3. How the professionals handle the vocabulary-vs-grammar ratio

This is the transferable finding, so it gets its own section.

**The ratio is normal; only its size here is extreme.** A published coursebook level teaches roughly a dozen grammar points and several hundred words: **50–80 : 1**. English Profile's reference description sits at ~5.5 : 1 only because it is describing structures, not teaching them. This app is at **10,524 : 18 = 585 : 1** — and against all six other curricula combined (1,268 items) it is **8.3 : 1** (`feature-map.md` §2). So the app is 7–12× more lopsided than a coursebook, but pointing in the same direction every professional product points.

**And every professional resolves it the same way, with a role split rather than a size fight:**

1. **The finite thing is the spine, and it is countable, and it ends.** 12 units. 3 sections. A term. The learner can see the last page.
2. **The unbounded thing is a lane, and it never ends, and nobody pretends it does.** The back-of-book wordlist, Babbel's Review Manager, Busuu's Smart Review, Memrise's My Words, all of Anki. None of these has a completion state. None of them is presented as a curriculum with a finish line.
3. **Vocabulary is never sequenced against grammar.** In a coursebook the unit's word set is chosen because it fits the unit's *topic*, not because it is the next 20 words in a list. The list at the back is alphabetical or unit-indexed — i.e. explicitly not an order.

**What that says about this app, bluntly.** `methodology.md` makes vocabulary the spine and everything else a support. The coursebook tradition makes grammar the spine and vocabulary the lane. **Neither maps cleanly, and the reason is a number:** 18 grammar lessons is 3 per CEFR level. That is not a spine, it is a pamphlet — a coursebook level alone has 12 units. So the app cannot copy the coursebook shape, because it does not have a coursebook's worth of spine.

But it does not have to choose. **The industry's actual answer is that these are two different kinds of object, and the app already has one of each:**

- an **engine** — unbounded, per-item scheduled, never complete, run daily forever (`vocab_sr_v1`, 10,524 slots); and
- a **course** — finite, countable, completable, run once (everything else: 72 grammar drill keys + 24 sentence-building keys + 20 listening texts + 24 discussion sessions = **140 completable items**).

At one course item per day that is **140 days ≈ 20 weeks**, which is almost exactly a coursebook's term-per-level pacing across all six levels. That number is the single most valuable thing this survey produces, and §6 is built on it.

**Pronunciation, the same argument.** Its zero-item track is not an anomaly to be fixed; it is what every professional syllabus already does. In *English File* pronunciation is a **strip inside every unit**, never a chapter. Duolingo, Babbel and Busuu all attach pronunciation to items via speech recognition rather than giving it a section. `feature-map.md` §5 reached the same conclusion from the code ("pronunciation is a feature of every track and the content of none"); the industry agrees unanimously. A pronunciation track would be the one design decision here with no precedent anywhere.

---

## 4. What to copy

Five things, each with the reason and the cost here.

### 4.1 One spine, one review lane — and *nothing else* separated

**Copy:** Duolingo's 2022 decision and Memrise's 2025 rebuild, both of which deleted parallel skill tracks. Ship one ordered daily sequence and one reference/review lane beside it.

**Reason:** it is the only structural claim in this survey with unanimous agreement across five products, and the two that changed both changed *toward* it, not away. Duolingo's stated reason — that learner-chosen skill order lets people grind one skill and destroys interleaving — applies here word for word: five independent tracks would let a learner do vocabulary for six months and never open a listening text, which is exactly the failure `learning-path.md` §2 was written to prevent.

**Cost here: zero.** `learning-path.md`'s «درس امروز» already *is* this shape. This survey's contribution is to say the existing three-step day is the industry-standard answer and the track split is the deprecated one — so the cost is a decision, not code.

### 4.2 The finite course must be counted and stated

**Copy:** the coursebook's "12 units is a level, and you can see the last page."

**Reason:** every product that keeps people has one finishable unit larger than a day. Duolingo has the unit and section; a coursebook has the book. This app has 140 completable non-vocabulary items and has never told anyone. `learning-path.md` §7 gets close with four checkpoints per level, but stops at the level and never states the total.

**Cost: small.** One computed number on «امروز», beside the existing level checkpoints:

> «دوره‌ی ساختار و مهارت‌ها: ۳۷ از ۱۴۰ تمرین انجام شده. با روزی یکی، حدود پنج ماه.»

This is one count over five storage keys that `learning-path.md` §6 already reads. It costs nothing and it is the first sentence in the app's history that describes a finish.

### 4.3 Memrise's "My Journey" — report depth per item, not progress per skill

**Copy:** Memrise reports *words recognised / words understood in context / words used in conversation*. Three numbers over **one** item set, not three tracks.

**Reason:** this is the strongest single idea in the survey, and it dissolves the track question rather than answering it. The app already has the data: `vocab_sr_v1`'s `modeMask` records exactly which retrieval formats a word has passed (1 = mcq, 2 = type, 4 = listen), and `srKnown` already requires a production mode. Splitting "listening" and "writing" off as tracks (`feature-map.md` §6.4 — the seam that swings the arithmetic by 500×) is unnecessary if depth is reported as an axis of the vocabulary lane instead of as separate tracks.

**Cost: small.** Three counts off one existing key:

> «۸۴۰ واژه را می‌شناسی · ۴۱۲ را از روی صدا نوشته‌ای · ۳۱۲ را از فارسی ساخته‌ای»

This is strictly better than «۳۱۲ واژه بلدی» alone, and it is true today under `methodology.md` §3's rule without changing that rule.

### 4.4 Grammar explained *at the point of need*, inside the activity

**Copy:** Babbel and Busuu both put the grammar explanation inside the lesson at the moment it is needed, rather than as a separate curriculum the learner is expected to visit.

**Reason:** with 18 lessons, 80 rules and 43 pitfalls, this app's grammar prose is too small to be a destination and too good to waste — it is the only explanatory text in the app and the only place a Persian speaker's specific errors are named. `learning-path.md` rule 4 already shows the pitfall note above a drill; the industry says go further and surface the relevant `pit` line **on a wrong answer** in the sentence-building and combine drills too, which are drill-only today.

**Cost: moderate.** Needs a lesson↔drill mapping that does not exist for `SENT`. Do it only where `GRAM` and `SENT` share a level.

### 4.5 Anki's honesty about what a queue is

**Copy:** Anki has no completion state for a deck and never implies one. Its manual refuses to supply curriculum and says so.

**Reason:** `methodology.md` §1 already fought this fight (the CEFR labels on the word list are false). The industry position is stronger: the vocabulary lane should carry **no completion claim at all** beyond the stage counts. Not «۱۰٬۵۲۴ واژه» as a destination, not a percentage, not a progress bar with an end.

**Cost: trivial**, and it is mostly already decided in `methodology.md` §7.

---

## 5. What to reject

This list matters as much as the copy list, because most of what makes these products work is unavailable here.

### 5.1 Separate skill tracks — rejected, and note *who* rejected it first

Not merely inapplicable: **abandoned by the industry**. Duolingo shipped exactly this (the tree, where you chose which skill to advance) and killed it. Memrise shipped separate vocabulary / video / chat modes and merged them in 2025. No surveyed product currently ships parallel skill tracks. Combined with `feature-map.md` §7's arithmetic — writing 42 items, listening 20 texts, speaking 24 sessions, pronunciation 0 — a track split here would produce four tracks that a learner exhausts in under a month and one that never ends. The industry rejected this shape at 100× the content.

### 5.2 Streaks, XP, leaderboards, hearts, "Legendary"

Duolingo's engagement layer exists because Duolingo has a growth team, daily notifications, and a business that monetises retention. `learning-path.md` §11 already declined to build on `d.streak` and `vocab_game.xp`, and this survey supports that decision rather than softening it: **none of the engagement mechanics survive the constraint list**, because every one of them assumes a notification, a peer, or a reason to open the app that is not the lesson. Note also that Duolingo's own path-redesign announcement offers **no** learning-outcome data for the change — it is argued from spacing theory, not measured.

### 5.3 FSRS, and adaptive scheduling generally

The FSRS benchmark is real and large (~10,000 users, hundreds of millions of reviews) and FSRS wins it. It also needs a per-card review history with grades and timestamps, and an optimizer run over that history. This app stores four integers per word and ships as one offline file. `methodology.md` §4 reached this conclusion and it is correct; the benchmark repo itself reports differences in log-loss and RMSE, not in cards-per-day, so at a 20-card day the practical gap is small. **Revisit only above ~100 cards/day.**

### 5.4 Placement tests

Busuu opens with one, and it is the right design when you have accounts and a server. Here it would burn a new learner's first session on assessment, and `learning-path.md` §3 already gives the cheaper equivalent: start at A1, never lock, let the level chips move.

### 5.5 AI conversation partners and speech scoring

Memrise's MemBot, Babbel Speak, Busuu's human "Conversations", and every product's speech recognition all require a network. `app.jsx:749–753` already documents that `SpeechRecognition` fails offline by default. **Do not design the speaking track around assessment**; `feature-map.md` §6.5 is right that it is a rehearsal room. The industry has no offline answer to this and neither does this app.

### 5.6 Efficacy numbers as design evidence

Worth stating plainly because the marketing is loud and the evidence is thin. The widely-quoted "one college semester in 15 hours" figures for Babbel and Busuu come from Vesselinov & Grego studies **commissioned by the vendors and published as white papers on vendor sites**, using WebCAPE placement-point gain per study hour — a methodology that has been criticised in the peer-reviewed literature for unwarranted claims. The strongest independent work is Jiang et al. (2021, *Foreign Language Annals*, peer-reviewed) on beginner Duolingo courses, which found reading and listening gains — and even that was Duolingo-funded. **There is no published efficacy evidence for a track-split versus a single-path design anywhere.** Nobody has measured the question this app is asking. Design it from structure and from the research in `methodology.md`, not from product outcomes.

### 5.7 Anything sized for a content pipeline

Duolingo's path has hundreds of nodes per section; Memrise has 72,000+ native-speaker videos. Every "just add more units" recommendation is out by the no-new-content rule. This is why §6 counts what exists rather than proposing a shape that needs more.

---

## 6. The one design that fits: **the engine-and-course split** (Anki's lane + a coursebook's spine, stated separately)

Named plainly: **one unbounded daily engine, one finite numbered course, one shared day.** It is Anki's review lane and a coursebook's finishable term, run as the two halves of the same fifteen minutes — which is exactly the 1-spine-plus-1-lane consensus of §1, with the roles assigned by size rather than by skill.

**The three claims it makes:**

1. **واژه‌ها is the engine.** Unbounded, per-item scheduled, no completion state, no CEFR label, run every single day forever. This is Anki, and the app already has it (`vocab_sr_v1`). Its progress is reported as **depth per word** in Memrise's three-number form (§4.3), never as a percentage of 10,524.
2. **Everything else is one course, not five tracks.** 140 completable items — 72 grammar drill keys, 24 sentence-building keys, 20 listening texts, 24 discussion sessions — presented as **one numbered ladder** through the six CEFR levels, in `learning-path.md` §2's existing order. One number, one finish, one place. Writing (42 prompts) and pronunciation (0 items) are **rungs on that ladder, not tracks**, because at their size that is the only honest presentation and it is what every coursebook does.
3. **The day is one of each.** Engine first, course second. This is `learning-path.md`'s «درس امروز» with steps 2 and 3 merged into one course step — and merging them is what the survey argues for, since separating "structure" from "listening/speaking" is a two-track split of a 140-item course, which is precisely the shape Duolingo and Memrise abandoned.

**The adaptation it needs — three changes, all small:**

- **Merge steps 2 and 3 into one "course" step, and let the ladder alternate them.** The day becomes two steps, not three: «۲۰ کارت، بعد یک تمرین از دوره». Alternation between ساختار and شنیدن-و-گفتن moves from being a fixed daily structure to being the ladder's own order. This costs `learning-path.md` §1's third tick and buys the app a single course number. It also fixes the failure that document already predicted in §10: شنیدن و گفتن has 8 items per level against ~20 sessions, so a fixed daily step 3 runs dry while step 2 still has content. Under one ladder, it simply does not.
- **Count and display the 140.** §4.2. One line on «امروز».
- **Report the engine by depth, not by size.** §4.3. Three counts off `modeMask`.

**What it deliberately does not do:** it does not gate, does not lock, does not add a track, does not add content, does not add state beyond a count, and does not touch the vocabulary side at all — `methodology.md` stands unchanged.

**Where this disagrees with the parallel literature agent:** if the research answer favours skill-separated practice on acquisition grounds, note that the practice answer is not merely different but *reversed by evidence of abandonment* — two products shipped skill separation at scale and both removed it. That is weak evidence about learning and strong evidence about structure, and structure is what is being decided here.

---

## 7. What I could not verify

Marked as inference, and not relied on above except where noted.

1. **Babbel's and Busuu's internal gating rules.** Both describe unit sequences and review tools on their own marketing pages; neither publishes whether a unit is *blocked* until the previous one is complete. The table's "sequential by default, freely browsable" is **[inference]** from third-party reviews, not from the vendors. If they do hard-lock, my §5.4/§6 argument is unaffected — this app's no-lock stance is argued from `learning-path.md` §3, not from them.
2. **Memrise's current session composition and gating.** Taken from Memrise's own August-2026-accessible team-update post, which describes "Learn → Immerse → Communicate" and "My Journey" but does not state whether anything is prerequisite. Gating column is **[inference]**.
3. **The exact Duolingo node count per unit.** "~10 nodes" comes from a third-party tracker (duoplanet), not from Duolingo. Duolingo does not publish path dimensions and they vary by course. Nothing in §4–§6 depends on the number.
4. **English Vocabulary Profile and English Grammar Profile counts** (~6,750 headwords; 1,200+ grammar features) are reported by Cambridge and by secondary summaries; I did not access the EVP/EGP databases directly, which are gated. The **direction** of the ratio is solid and independently corroborated by the coursebook figures; the precise figures are **[approximate]**.
5. **The 50–80 : 1 taught ratio per coursebook level** is my arithmetic — 12 units, ~1 grammar point per unit spread, against a level wordlist of several hundred to a thousand entries. It is **[inference]** from *English File*'s published 12-unit structure and its Grammar Bank / Vocabulary Bank / Wordlist architecture, not a figure any publisher states. Treat it as an order of magnitude.
6. **The 140-item count** is derived from `docs/feature-map.md` (72 grammar scored keys + 24 sentence-building keys + 20 listening texts + 24 discussion sessions). I did not re-run the bundle measurements. If `feature-map.md`'s M17 or its §3 slot counts are wrong, the number moves; the design does not.
7. **No product publishes a comparison of single-path versus skill-split designs**, and no efficacy study addresses it. §6 is argued from convergent design decisions and from what two companies removed, which is weaker than a trial and stronger than a preference. Stated so it can be weighed correctly.

---

## Sources

- [Duolingo — new home screen design (the tree → path change, in Duolingo's own words)](https://blog.duolingo.com/new-duolingo-home-screen-design)
- [duoplanet — The Duolingo Learning Path: what it is, how it works](https://duoplanet.com/duolingo-learning-path/)
- [duoplanet — honest review of the new learning path (the linearity complaints)](https://duoplanet.com/duolingo-new-learning-path-review/)
- [Memrise — Team Update: a full look at the new experience (Learn → Immerse → Communicate; My Journey; My Words)](https://www.memrise.com/blog/team-update-full-walkthrough)
- [Memrise — Changes to the app (community courses moved out, wordlists returned)](https://www.memrise.com/blog/changes-to-the-memrise-app)
- [Anki manual — Getting Started ("a supplement to external material, not as a replacement for it")](https://docs.ankiweb.net/getting-started.html)
- [open-spaced-repetition/srs-benchmark — FSRS benchmark, ~10k users / ~727M reviews, log loss + RMSE + AUC](https://github.com/open-spaced-repetition/srs-benchmark)
- [fsrs4anki tutorial — what FSRS schedules and what it explicitly does not do](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md)
- [Busuu — how the courses work (CEFR ladder, Study Plan, Smart Review)](https://www.busuu.com/en/it-works/courses)
- [Babbel — why Babbel works / efficacy claims](https://uk.babbel.com/why-babbel-works/)
- [The Babbel Efficacy Study (Vesselinov & Grego) — vendor-published white paper](https://assets.ctfassets.net/zuzqvf4m2o58/5eYRgCslJnJBF9yhZKgX01/78b93f75ca40fca6c7b927b6e2e82bf8/Babbel-Efficacy-Study.pdf)
- [The busuu Efficacy Study (Vesselinov & Grego) — vendor-published white paper](https://comparelanguageapps.com/documentation/The_busuu_Study2016.pdf)
- [Jiang et al. (2021), *Evaluating the reading and listening outcomes of beginning-level Duolingo courses*, Foreign Language Annals](https://onlinelibrary.wiley.com/doi/full/10.1111/flan.12600)
- [Efficacy Analysis of Mobile Language Learning Apps (2023) — the critique of WebCAPE-per-hour methodology](https://dl.acm.org/doi/10.1145/3606150.3606152)
- [Cambridge English — Understanding (and using) CEFR criterial features for grammar instruction (English Grammar Profile)](https://www.cambridge.org/elt/blog/2021/06/23/using-cefr-criterial-features-for-grammar-instruction/)
- [NLP-powered quantitative verification of the English Grammar Profile's structure-level assignment, ARAL](https://www.cambridge.org/core/journals/annual-review-of-applied-linguistics/article/nlppowered-quantitative-verification-of-the-english-grammar-profiles-structurelevel-assignment/8323F1AD466EF982EA47DEFBB0D740D5)
- [Text Inspector — English Vocabulary Profile CEFR levels and headword counts](https://textinspector.com/help/lexis-evp/)
- [Oxford University Press — English File wordlists (the back-of-book vocabulary lane)](https://elt.oup.com/student/englishfile/wordlists)
- [The Architecture of ELT Coursebooks: the internal organization of coursebook units](https://www.researchgate.net/publication/357354296_The_Architecture_of_ELT_Coursebooks_The_Internal_Organization_of_Coursebook_Units)
- [ELT Concourse — syllabus design (structural vs lexical vs functional syllabi)](https://www.eltconcourse.com/training/inservice/background/syllabus_design.html)
- [Nation, *The Four Strands* — 25% per strand in a balanced course](https://files.eric.ed.gov/fulltext/EJ887869.pdf)
