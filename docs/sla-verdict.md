# مسیر‌های جدا یا درس واحد؟ — the SLA verdict

**Status:** advice. This document decides one question and changes no code. It overturns part of `docs/learning-path.md` and a smaller part of `docs/methodology.md`; §8 says exactly which parts and why.

**Method.** Every empirical claim below is cited to a source I fetched during this review. Content counts are taken from `docs/feature-map.md` and not re-derived; where my recommendation leans on one, I say which. Anything I could not verify is marked **[judgement]**.

---

## The verdict, in one paragraph

**Separate the *paths*, keep the *session*.** The owner's instinct is right about progression and wrong about delivery, and the current design is right about delivery and wrong about progression. Build **two real tracks, one strand, and two attributes**: vocabulary is a track (10,524 items, a per-item schedule, effectively unbounded — it runs **every day**); grammar-and-structure is a track (183 drill questions + 18 lessons + 72 sentence-building items — a *finite course* of about 144 exercises, which the app should say out loud); listening and speaking together are **one strand, not two tracks** (20 texts + 24 sessions = 44 items, three weeks of content each if run daily, so they must not be run daily); **writing is not a track at all** (42 authored prompts ≈ 12 distinct sessions) — it is the productive tail of the other two, attached to words and to grammar; and **pronunciation is not a track** (0 items, 0 IPA) — it is a property of every card and must never appear on a menu as a path. These four things are delivered as **one daily session with two slots**: slot A is vocabulary, always, ~7 minutes; slot B is *one* activity drawn from a weekly rotation, ~5 minutes, and it is empty on some days. The fatal defect of the current «درس امروز» is not that it interleaves — it is that it interleaves at a **fixed 1:1:1 ratio**, spending bounded content at the same rate as unbounded content, so step 3 is exhausted on day 21 and step 2 on day 73 while step 1 still has 1,400 days left. Moving from 1:1:1 to a budgeted rotation (7 vocabulary : 3 structure : 1.5 skills : 0.5 writing per week) makes every curriculum last roughly a year instead of three weeks, and it costs one scheduling function and one new storage key. The learner still sees one recommendation per day, because 43% of adult self-study learners quit inside three months and a menu of six tracks is how you lose them.

---

## Decision 1 — Separate tracks, one interleaved lesson, or a hybrid?

**A hybrid, and here is the exact cut: separate progression state and separate pacing; shared session and shared recommendation slot.**

### The interleaving literature does not decide this question, and it is important to say why

`docs/methodology.md` and the brief both reach for desirable difficulties. That literature is about the **sequencing of items within a set of confusable categories**, not about the mixing of dissimilar activities, and the mechanism makes the distinction explicit. Carvalho & Goldstone's account is *discriminative contrast*: interleaving forces between-category comparison and helps when categories are **highly similar**; blocking forces within-category comparison and helps when categories are **dissimilar** ([Carvalho & Goldstone, 2014, *Frontiers in Psychology*](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00936/full); [Carvalho & Goldstone, 2013, *Mem. Cogn.*](https://pubmed.ncbi.nlm.nih.gov/24092426/)). Their own summary of the split is that "interleaved study … improve[s] learning of high similarity categories by increasing between-category comparison, while blocked study improves learning of low similarity categories."

A flashcard, a grammar drill and a two-minute monologue are about as low-similarity as two activities in one app can be. **There is no discrimination to be bought by alternating them.** Whatever the current daily lesson is doing well, it is not doing what Rohrer & Taylor's interleaving effect describes ([Taylor & Rohrer, 2010](http://uweb.cas.usf.edu/~drohrer/pdfs/Taylor&Rohrer2010ACP.pdf), interleaving tripled delayed test scores, 63% vs 20% — on four *confusable solid-volume formulas*, not on four skills).

Where the literature *does* apply is **inside** each track, and there it is decisive and the app currently ignores it. Nakata & Suzuki (2019, *MLJ*) taught 115 Japanese learners five English grammatical structures under blocked, interleaved, and increasing schedules: interleaving produced **more errors during practice and better one-week retention (d = 0.64)**, and — the finding that matters most here — **lower-prior-knowledge learners benefited *more* from interleaving, not less** ([ERIC EJ1225042](https://eric.ed.gov/?id=EJ1225042); [author copy](https://yuichisuzuki.net/wp-content/uploads/2023/04/Nakata-Suzuki-2019-MLJ.pdf)).

**Where the evidence genuinely disagrees:** Hwang (2025, *Language Learning*) found the opposite for low-achieving adolescents — interleaving was an *undesirable* difficulty and initial blocked practice was needed to establish declarative knowledge before interleaving helped ([Hwang, 2025](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659); I could not fetch the full text — paywalled — and am relying on the abstract and the search summary, **[partially unverified]**). **I side with Nakata & Suzuki for this app**, for a population reason: the app's learner is a self-selecting adult who chose to install a vocabulary trainer, not a low-achieving conscripted adolescent, and Nakata & Suzuki's participants are the closer match. The practical consequence is small either way and I take the conservative route: **block within a lesson, interleave across lessons** — the "increasing" condition — which is exactly the shape of «یک درس، بعد تمرین‌های همان درس» the app already has, followed by cumulative mixed review, which it does not.

### The literature that *does* decide it: integrated vs segregated skills

This is the owner's question with the correct label on it, and the ESL consensus is against a segregated-skill syllabus. Oxford's ERIC Digest is the standard statement: the segregated-skill approach treats a language skill as an end in itself rather than a means, and "does not prepare students for the communicative acts they will face"; integration through content-based or task-based work exposes learners to authentic language and treats receptive and productive skills as interrelated ([Oxford, 2001, ERIC Digest ED456670](https://www.ericdigests.org/2002-2/esl.htm); [Ilyas, *Skills Teaching in ESL Classroom: Discrete vs. Integrated*](https://eajournals.org/wp-content/uploads/Skills-Teaching-in-ESL-Classroom-Discrete-vs-Integrated.pdf)).

**But read what that literature is actually claiming.** It argues for integration **at the level of the task and the content** — a lesson in which reading feeds writing about the same topic, a task that cannot be completed with one skill. It says nothing about the **calendar**. It is not an argument that every skill must appear every day; it is an argument that skills must not be *insulated from each other's content*. Those are different claims and the current app conflates them: it achieves calendar integration (three sections a day) while its three steps have **no content relationship at all** — day one is `to be`, `My Day`, and twenty unrelated words. That is a segregated-skill syllabus wearing an integrated schedule.

So the hybrid:

| Layer | Decision |
|---|---|
| **Progression state** | **Separate.** Each curriculum has its own path, its own position, its own completion. This is the owner's instinct and it is correct. |
| **Pacing** | **Separate and unequal.** Each track has its own *rate*, budgeted to its content size (Decision 2). |
| **Content** | **Joined wherever the data allows.** The listening text and the discussion session at the same level share a topic; the writing prompt uses this week's grammar; the collocation group opens when its core verb is بلد. This is the integration the literature actually asks for, and the app has almost none of it. |
| **Session and recommendation** | **One.** One session per day, one primary action on screen. Six tracks on a home screen is six decisions a day (Decision 5). |

**Third-party evidence for splitting delivery from progression:** Nation's four strands — the framework `docs/methodology.md` §1 leans on — are balanced **across a course, not within a lesson**. Each strand gets roughly 25% of *course* time, and practitioners applying the framework explicitly note that "rather than trying to address all four strands in a single lesson, educators can achieve a balanced approach by integrating these components across a series of lessons," with one implementation "allocat[ing] specific strands to different days" ([TESL Ontario *Contact*, Applying the Four Strands Framework in LINC classrooms](http://contact.teslontario.org/applying-the-four-strands-framework-in-linc-classrooms/); [Hacking Chinese on Nation's four strands](https://www.hackingchinese.com/analyse-and-balance-your-chinese-learning-with-paul-nations-four-strands/): "he doesn't say that each lesson should be balanced in terms of the four strands"). **I could not extract Nation's 2007 paper directly — the PDFs at wgtn.ac.nz and files.eric.ed.gov did not render — so this rests on two secondary readings that agree with each other. [partially unverified]**

**This matters because `docs/learning-path.md` §1's whole justification for three steps a day is a within-session balance claim, and the framework it borrows from does not make that claim.**

---

## Decision 2 — The pacing relationship between tracks

**Decoupled rates. Vocabulary gates nothing and is gated by nothing. Vocabulary *informs* selection. Everything else runs on a weekly budget sized to its content.**

### Why not gating

`docs/learning-path.md` §3 already argues for zero hard locks and I endorse it without reservation, on adherence grounds that are stronger than the ones it gives. In the largest longitudinal study of adult self-study app use I could find — 3,319 Mango Languages learners tracked over 14 years — **~43% discontinued active engagement within the first three months and 31–37% quit after a single month**; what predicted persistence was session frequency and the ability to *resume after a pause*, not thoroughness ([Cambridge, *SSLA*, survival analysis of MALL engagement](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/acceptance-and-engagement-patterns-of-mobileassisted-language-learning-among-nonconventional-adult-l2-learners-a-survival-analysis/C1186B329F808A11DDF2C748E77FD1EE)). A gate is a mechanism for converting a pause into a dropout. There are no gates.

### The budget, which is the actual answer

`docs/feature-map.md` §7 gives days-of-content at one activity per day: grammar **72**, listening **20**, speaking **24**, writing **12**. Those numbers are only catastrophic because the current design consumes at one-per-day. Change the rate and the same content stops being a crisis:

**A seven-day week: 7 vocabulary sessions, 5 slot-B activities.**

| Slot B share | Per week | Stock (first pass) | Weeks of content | ≈ |
|---|---:|---:|---:|---|
| **Structure** (grammar drills 183 in 72 keys + 18 lessons + 72 non-typed sentence items) | **3.0** | ~144 exercise sessions | **48** | ~11 months |
| **Skills** (listening texts + discussion sessions) | **1.5** | 44 | **29** | ~7 months, ~14 with one repeat pass |
| **Writing** (combine 24 + free 18) | **0.5** | 42 | **84** | ~19 months |

The arithmetic is the argument. **The same content that dies in three weeks under 1:1:1 lasts between seven months and two years under a budget.** No new content is required to get there; it is a division.

Two consequences worth stating plainly:

1. **Repetition of listening and speaking items is legitimate content, not a fudge.** `learning-path.md` §6 already proposed re-shadowing when a level's texts run out and half-apologised for it. It should not apologise: task repetition is one of the better-supported findings in L2 speaking research — Bygate (1996, 2001) and Ahmadian & Tavakoli (2011) both report gains in fluency and complexity from repeating the *same* task, on the mechanism that familiar content frees processing capacity for form ([ELT Journal, *Task repetition in ELT*](https://academic.oup.com/eltj/article/66/3/380/439513); [review of task-repetition findings](https://files.eric.ed.gov/fulltext/EJ1128830.pdf)). With **20 texts and 24 sessions and no automatic assessment anywhere in the track** (feature map §3, §6.5), planned second and third passes are the correct design, and the app should present them as such: «این متن را قبلاً خوانده‌ای — این بار بدون ترجمه.»
2. **Vocabulary informs selection.** The one dependency that is real runs one way: feature map §4 shows every non-vocabulary activity is a use of words, and nothing is a use of grammar. So the *choice* of which listening text or discussion session to offer should prefer the one whose vocabulary is best covered by the learner's بلد set — computable today from `vocab_sr_v1` and `VOCAB_ORDER`, no new content. `methodology.md` §6's collocation hand-off (core verb reaches بلد → its group is offered) is exactly this shape, and it should be generalised rather than kept as a special case. **Informs, never gates.**

---

## Decision 3 — What happens to «درس امروز»

**Reshaped, and one of its two central claims is withdrawn. It keeps its name, its once-a-day shape, and its single recommendation. It loses the fixed three steps.**

### What the previous design got wrong, plainly

**(a) The 1:1:1 ratio is a scheduling error, and `learning-path.md` §10 measured it without treating it as one.** That section reports that step 3 has new content for 8 of ~20 sessions per level, and that the word spine is "400× the size of everything else combined," and then keeps the ratio and patches the symptom with re-shadowing. The ratio *is* the bug. A design that pairs an unbounded track with a 20-item one at 1:1 has decided that the 20-item one will be over in 20 days; no amount of completion-screen copy changes that.

**(b) The order argument — «واژه‌ها gives the units, ساختار teaches assembly, شنیدن و گفتن makes you produce them», in that order, within one sitting — is rhetorically excellent and empirically unsupported at that grain.** It is a real ordering claim about a *course*; it is not a claim anyone has tested about a *fifteen-minute session*. Nation's strands are balanced across a course (Decision 1), and the four-strands framework does not say a word met on a card at 09:00 must be assembled at 09:07 to be useful. Worse, the app does not actually implement the claim: the twenty cards, the `to be` drill and the `My Day` text on day one share no vocabulary by design — `planToday` picks first-unfinished per section, not related items. **The app claims content integration in its copy and delivers calendar integration in its code.** That is the gap I am closing, in the opposite direction to the one the document intended: fewer sections per day, more relationship between the ones that appear.

**(c) The three-tick day is an adherence liability [judgement].** A design where the day is only "done" at three ticks means a learner with seven spare minutes has an unfinishable day. The retention evidence favours a small guaranteed core plus optional extension: persistence in the Mango cohort tracked session *frequency*, and Duolingo's own reporting is that binge patterns predict abandonment while consistent short sessions predict reaching intermediate ([Duolingo blog on streaks](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) — vendor-published, treat as weak evidence, **[unverified]**). I am not claiming a measured effect size; I am claiming the failure mode is asymmetric.

### The replacement

```
«درس امروز» =  slot A  (always)   20 کارت واژه           ~7 min
             + slot B  (usually)  ONE activity, budgeted  ~5 min
```

- **Slot A never rotates.** Vocabulary is the one track with a per-item schedule, and a spacing schedule that is skipped is a schedule that is wrong: `vocab_sr_v1`'s 1/3/7/21/60 ladder assumes daily opportunity. This is the strongest reason vocabulary and everything else cannot be symmetric tracks — it is the only one with dated per-item state (feature map §3).
- **Slot B rotates on the budget in Decision 2**, and is *empty roughly two days a week*. An empty slot B is a feature: «امروز فقط کارت‌ها. کافی است.» — a day the learner finishes in seven minutes is a day they do not skip.
- **Day is complete at slot A + slot B**, i.e. two ticks, not three, and one tick on rotation-rest days.

Everything else in `learning-path.md` §4 — the thirteen completion rules, «بازگشت» never in the primary slot, one primary action per screen — I adopt **unchanged**. That table is the best thing in either document and none of it depends on the three-step shape.

---

## Decision 4 — How the content imbalance is handled

**By refusing to give five things the same name.** A track with 42 items is not a small track; it is a different kind of object, and calling it a track is the dishonesty that produces the empty-lane problem. Four categories:

### (1) Track — vocabulary
10,524 items, per-item schedule, own completion criterion (بلد), own stage names. It runs daily and it is never "finished". Everything `docs/methodology.md` says about it, I endorse; see §8.

### (2) Finite course — grammar and structure
183 drill questions in 72 scored keys, 18 lessons, 80 rules, 43 pitfalls, plus 72 non-typed sentence-building items. **Present it as a course with an end, and show the end**: «دوره‌ی دستور زبان — ۱۸ درس · ۵ درس تمام شده». 144 exercise sessions at 3/week is about eleven months. A finite thing the learner can finish is worth more than a fake infinity, and this app currently has nothing finishable at all above the level of a day.

### (3) Strand — listening and speaking, **merged**
44 items between them, no per-item assessment in either (feature map §3: `dcFinish` stores ticks and seconds; the shadow recorder stores nothing; `lsStartQuiz` is answerable without pressing play, §6.3). Two tracks of 20 and 24 items with no correctness signal are not two tracks. Merge them into one rotating strand — **«بشنو و بگو»** — pair each text with the same-level discussion session, and run each pairing at least twice with the second pass translation-off / recording-on. That is 20–22 pairings ≈ 40 sessions ≈ seven months at 1.5/week, and the pairing is the content integration the skills literature asks for and the app currently lacks.

### (4) Not a path at all — writing and pronunciation

- **Writing: 42 authored prompts, 12 distinct exercise sessions in the entire app, and one 41-line heuristic grader that `learning-path.md` §11 correctly says "cannot fail a serious attempt and cannot pass a bad one reliably."** A writing track would be, in the feature map's own phrase, a grader in search of a curriculum. **Writing becomes the productive tail of the other two**: «جمله‌ی من» stays inside the word card (which is where transfer-appropriate processing wants it — see below), `combine` and `free` stay as the last rungs of the structure ladder, and slot B serves a dedicated writing session about every other week. **Writing is never a checkpoint and never a level gate**, which `learning-path.md` §11 already decided and I am reinforcing.
- **Pronunciation: zero items, zero IPA on 10,524 words, zero stored results from two recorders.** It must not appear as a path — an empty lane on a home screen is worse than no lane. It is an **attribute**: TTS on every card (already there, 20+ call sites), IPA rendered on the card once the `pronunciation` agent has run, and the recorder as an affordance inside listening and speaking rather than a destination. Populating `ipa` for the first ~1,700 words is a cheap, high-visibility change; building a pronunciation track is not.

### The counter-evidence I owe this decision

Demoting writing to a tail is in tension with transfer-appropriate processing, and I want it on the record. TAP predicts that knowledge encoded one way retrieves poorly under mismatched conditions: "if learners study vocabulary via isolated word lists but are later assessed through oral interaction, there is likely to be a mismatch between encoding and retrieval conditions, resulting in poor transfer" ([Conti, *The Language Gym* on TAP](https://gianfrancoconti.com/2025/06/02/one-of-the-least-known-yet-most-consequential-principles-in-language-learning-transfer-appropriate-processing-tap/), a practitioner synthesis; the underlying claim that exposure-acquired knowledge "did not manifest as productive knowledge" is from the TAP-in-SLA literature). The receptive/productive asymmetry is well established independently ([Webb, 2009](https://www.researchgate.net/publication/249769008_The_Effects_of_Receptive_and_Productive_Learning_of_Word_Pairs_on_Vocabulary_Knowledge)).

**Two things save the decision.** First, isolated deliberate learning is not the null it is often assumed to be: Elgort (2011) showed that 48 pseudowords learned from word cards **with no context at all** produced form-priming, repetition-priming and *automatic semantic priming* — i.e. genuine integrated lexical representations, not inert pairs ([Elgort, 2011, *Language Learning*](https://onlinelibrary.wiley.com/doi/10.1111/j.1467-9922.2010.00613.x); [full text](https://www.lextutor.ca/freq/lists_download/elgort_2011.pdf)). Second, and decisively for this app: the productive requirement is already *inside* the vocabulary track. `srKnown` will not count a word as بلد without a success in `type` or `listen` — the learner must have written the English themselves. **The app's productive practice is not in the writing track; it is 10,524 items deep inside the vocabulary track**, which is precisely feature map §6.4's finding. Moving those modes out to satisfy a track diagram would break the definition of بلد and buy nothing.

---

## Decision 5 — What this means for the learner's day

**One session. Two slots. Variable length, 7–15 minutes. The app chooses; the learner may override from a short list, never a menu.**

| | |
|---|---|
| **How many sessions** | One. Not one per track. Six entry points is six decisions before any learning happens. |
| **Length** | 7 minutes on rest days, ~12–15 on full days. The *floor* is guaranteed and the ceiling is optional. |
| **Who chooses** | **The app proposes, the learner may swap.** One primary and **two** alternates, never more. |
| **Can the learner run a track on its own?** | Yes, always — every section stays reachable from the hubs, exactly as today. Slot B rotation governs what is *recommended*, and feature map §8.5 is right that nothing in this app is currently forbidden and nothing should become so. |

**Why "two alternates" and not "all of them."** Autonomy support genuinely predicts persistence — this is core self-determination theory and it is well attested in SLA ([selfdeterminationtheory.org, language learning](https://selfdeterminationtheory.org/topics/language-learning/); [SDT and MALL engagement, *Educ. Inf. Technol.* 2025](https://link.springer.com/article/10.1007/s10639-025-13834-9)) — but perceived autonomy is not the same as option count, and option count has a cost. The instructional-design guidance converges on **two to four options** as the range that supports autonomy without choice overload ([Novak Education on choice overload](https://www.novakeducation.com/blog/offering-too-many-choices-can-limit-student-potential-the-solution)), and the clearest applied case is Coursera: completion fell as the catalogue grew, and the 2014 "Specializations" fix was to **pre-sequence 4–6 courses into one pathway**, which lifted completion (this figure comes from a secondary summary and I could not reach a primary source — **[unverified]**). A pre-sequenced pathway with a small escape hatch is the shape that survives contact with an unsupervised adult.

**The day, concretely:**

> **درس امروز — حدود ۱۲ دقیقه**
> ① ۲۰ کارت واژه · ۷ دقیقه
> ② دستور زبان A1 — «to be» · ۵ دقیقه
> **[ شروع ]**   [ به جایش: متن «My Day» ]   [ به جایش: جمله‌سازی ]

and on a rest day:

> **درس امروز — ۷ دقیقه**
> ① ۲۰ کارت واژه
> «امروز فقط کارت‌ها. همین کافی است.»
> **[ شروع ]**   [ یک تمرین اضافه ]

---

## The precondition nobody can design around

`docs/feature-map.md` §3 states it and it is the hard constraint on all of the above: **10,524 scheduled slots on one side, 248 high-water percentages on the other.** A budgeted rotation needs to know *which grammar drill is due*, not just which scored 70% once. Independent pacing for structure and skills is impossible on high-water scores alone.

The fix is one key, not five:

```json
// skill_sr_v1 — { "<kind>:<id>": [successes, firstDay, lastDay] }
{ "g:a1_1_choose": [2, 20310, 20317], "l:l_a1_time": [1, 20315, 20315], "d:d_a1_1": [1, 20316, 20316] }
```

Same shape as `vocab_sr_v1`, same day-integers, one namespace for all four non-vocabulary curricula, ~30 bytes per touched item against a few hundred items total. It is what makes "run each listening text twice, the second time without the translation" and "re-mix a grammar drill from three weeks ago" expressible at all. **It should be built before the rotation, not after**, and it is the single highest-value engineering item in this document.

Cumulative mixed review is the pedagogical payoff, and it is where the interleaving evidence finally bites (Decision 1): once structure items have dates, slot B can occasionally serve a **mixed drill over previously-passed grammar lessons** rather than the next new one. That is the Nakata & Suzuki "increasing" schedule — block within a lesson, interleave across lessons — and it is currently impossible because nothing records when a drill was last done.

---

## Where I disagree with the existing documents

### With `docs/learning-path.md`

**A. §1 and §2 — the fixed three-step day is overturned.** Reasons in Decision 3: the 1:1:1 ratio guarantees the empty-lane problem that §10 of that same document measures, and the within-session ordering rationale in §2 is not supported by the framework it borrows from. What survives: one session a day, in the same shape, with the same name, with one recommendation.

**B. §7 — the four level checkpoints are overturned in part.** Three of the four are fine. The شنیدن و گفتن checkpoint ("2 listening quizzes ≥70% and 1 discussion") makes level completion depend on the thinnest content in the app, and at C1/C2 that is **two texts and six comprehension questions for an entire level**. Worse, feature map §6.3 shows the listening quiz is a reading check on a bilingual transcript — reachable without playing audio, with the Persian translation on screen by default. **A quarter of level completion currently rests on an unproctored reading comprehension test of a visible translation.** Replace that checkpoint with an *activity* count, not a score: «۲ متن شنیده‌ای و ۱ جلسه گفت‌وگو ثبت کرده‌ای» — true, achievable, and it does not pretend to measure comprehension it cannot measure.

**C. §11 — "the five-mode rotation is left open" was already overturned by `methodology.md` §5, and I agree with methodology.** Recorded here only so the three documents do not contradict each other.

**D. I adopt §3 (zero locks), §4 (all thirteen completion rules), §8 (no new key for the daily plan) and §10 (the content findings) without change.** §4 in particular is the part of that document that should ship first regardless of which structure wins.

### With `docs/methodology.md`

**Almost nothing, and I want that on the record: §1 (drop the fake CEFR ladder from the word list), §3 (the four-part بلد criterion), §4 (`vocab_sr_v1`, 1/3/7/21/60), §5 (the per-word stage ladder, `cloze` benched on the template measurement) are all correct, well-sourced, and I am building on them rather than around them.** Two disagreements:

**A. §1's four-strands citation is used to support within-session feeding, and the framework does not support that reading.** The sentence "deliberate study should feed meaning-focused input, not run beside it" is deployed to justify same-day integration. Nation's balance is a course-level proportion (Decision 1). **The word-selection argument that this citation is attached to — teach the 660 words the app's own curricula actually use — is excellent and survives completely; it just does not need the same-day claim, and the same-day claim does not survive.**

**B. §6's table assigns گرامر/جمله‌سازی to "Daily step 2" and متن شنیداری/گفت‌وگو to "Daily step 3."** That is the 1:1:1 ratio inherited from `learning-path.md`. Replace those two rows with the weekly budget in Decision 2. Everything else in §6 — especially the collocation hand-off keyed on a core verb reaching بلد — is the best piece of cross-curriculum design in either document and should be generalised, not narrowed.

---

## What this costs the learner if I am wrong

**The failure mode is a learner with 3,000 words and no voice.** Under my design, vocabulary runs 7 days a week and speaking runs about 0.75 days a week. If the integrated-skills literature is right in the strong form — that skills genuinely have to be practised together and frequently, and that receptive vocabulary knowledge does not become usable without regular productive use — then in a year this learner recognises thousands of words, passes the milestone quiz, and still cannot hold a two-minute conversation. That is the textbook decontextualized-vocabulary outcome, and TAP predicts it precisely.

**The aggravating factor is in the data and I cannot design it away.** With **99.8% of 10,524 example sentences drawn from twenty templates**, the app cannot teach words in context to compensate. A design that leans this hard on the vocabulary track is leaning on a track whose contextual layer is decorative. `methodology.md` §11 named the examples rewrite the highest-value content commission in the app; **my verdict makes it the highest-value commission by a wider margin than that document claimed**, because I am increasing vocabulary's share of the learner's time, not decreasing it.

Second, smaller failure mode: a rotating slot B is **less legible** than "three steps, every day." «هر روز: بیست کارت، یک تمرین ساختار، یک کار شنیدن یا گفتن» is a sentence a person can hold in their head, and «هفته‌ای سه ساختار، یکی‌ونیم مهارت» is not. If adherence turns out to depend more on a memorable ritual than on content longevity, I have traded the wrong thing. Mitigation: never show the learner the budget. Show them one card with today's two steps and let the scheduler be invisible.

---

## The strongest argument against this verdict

**It is that I have written a rationale for a vocabulary app with garnish, and dressed a content shortage as a pedagogical decision.**

Stated fairly: the integrated-skills literature is close to unanimous that language skills should not be taught in isolation, and Nation's balance principle says each strand should get roughly a quarter of course time. My design gives language-focused learning — deliberate vocabulary study plus grammar drills — something like **75–85% of the learner's minutes**, meaning-focused input and output maybe 15%, and fluency development almost none. Measured against the framework `methodology.md` invokes, **this course is badly out of balance, and my verdict makes it more so, not less.** A critic could reasonably say: the honest response to "listening has 20 items" is to *ration vocabulary down* to 10 cards a day so the ratio approaches something Nation would recognise, not to run vocabulary daily and skills twice a week because vocabulary happens to be the thing you already have 10,524 of. Designing the pedagogy around the inventory is how you end up justifying whatever you already built.

**Why I still hold the verdict.** Three reasons.

1. **Rationing vocabulary does not create listening.** Cutting slot A to 10 cards buys the learner nothing they can do instead; the 20 texts do not multiply. It would improve the ratio by making one side worse, and Nation's balance principle is a target for a *well-designed course*, not a licence to degrade the one strand that is adequately resourced.
2. **The imbalance is a content fact, and the right response to a content fact is to name it and commission content.** `learning-path.md` §10 and feature map §7 both name it. My design at least makes the shortage *survivable* for a year instead of three weeks, and it makes the size of the commission explicit: **24 more listening texts and ~24 more discussion sessions would move skills from 1.5 slots a week to 3, and that single commission is what moves this course toward four-strand balance.** No scheduling decision can substitute for it.
3. **The integration the literature actually asks for is task-level, and my design increases it while the current one has none.** Pairing each text with its same-level discussion, choosing skill items by بلد-coverage, keeping «جمله‌ی من» inside the word card, opening a collocation group when its verb is known — those are four content links that do not exist in the app today. The current three-step day has calendar integration and zero content integration. **I am trading the appearance of integration for the substance of it, at the cost of frequency**, and if I have to choose one, the literature is about substance.

---

## What evidence would change my mind

1. **A content commission.** If 24 listening texts and 24 discussion sessions are authored, listening-and-speaking stops being a strand and becomes a genuine track at ~3 slots a week, and the merge in Decision 4(3) should be undone. **This is the cheapest way to make me wrong and it is worth doing for that reason alone.**
2. **Real usage logs.** If learners routinely skip slot A and go straight to the listening section, my "vocabulary is the spine because it is the only scheduled track" argument is an argument about the data model, not about the learner, and the rotation should be re-weighted toward what people actually open.
3. **Rewritten example sentences.** If the `examples` agent rewrites the first ~1,700 words, contextual vocabulary learning becomes real, `cloze` unbenches (methodology §5), and the case for vocabulary carrying so much of the load gets *stronger*, not weaker — but the case for a separate reading/context strand also becomes arguable for the first time.
4. **A within-app A/B on session shape [judgement].** Fixed three steps vs slot A + budgeted slot B, measured on 30-day return rate rather than on items completed. I have argued the adherence case from an external cohort study and from asymmetric failure modes; that is weaker than measuring this app's own learners, and I would defer to the measurement.
5. **Evidence that Hwang (2025) generalises to self-selecting adults.** If initial blocked practice turns out to matter for this population too, the "interleave across lessons" recommendation in the mixed-review section should be delayed until a learner has passed a lesson's own drills — which is close to what the increasing schedule already does, so the practical revision is small.

## Marked as judgement, not evidence

- The specific budget **7 : 3 : 1.5 : 0.5**. The *shape* — rates proportional to content longevity — follows from the counts. The integers are calibration chosen to make every curriculum last roughly a year, and they should be re-tuned, not defended.
- **Two alternates rather than three.** The 2–4 range is sourced; picking 2 is taste.
- **The adherence argument for a variable-length day.** The attrition figures are real; the inference that a shorter guaranteed floor helps *this* app is mine.
- **The Coursera completion figure and the Duolingo streak/binge figures** are from secondary and vendor sources and I could not reach primaries. They corroborate; nothing here rests on them.
- **Nation's own wording on course-level vs lesson-level balance.** Two independent secondary readings agree; the primary PDFs would not render for me. If Nation turns out to argue for within-lesson balance, Decision 1's supporting argument weakens — though Decision 2's arithmetic does not.
