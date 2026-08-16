# تعیین سطح — placement test methodology and v2 spec

**Status:** research + specification. Nothing here is implemented. Someone else builds from §8 and §9.

**Question asked:** is the shipped v1 placement test (vocabulary-recognition MCQ, 5 items per CEFR level, stop at the first level below 60%) a defensible way to place a learner in an app that also teaches grammar, sentence construction, listening and speaking — and what should v2 be, given no server, no ML, no adaptive item bank beyond `data/words.json` and `data/curricula/*.js`?

**Short answer.** The *format* is defensible; the *item source* is not, and the *decision rule* is too leaky to carry the weight currently placed on it. Vocabulary recognition is a genuinely good, cheap proxy for overall proficiency — that is well established — but in this app the "CEFR level" of a word is a positional band in a list sorted mostly by word length, so the test is currently measuring something closer to orthographic length and proper-noun familiarity than to CEFR level. Fixing the item source is worth more than every other change combined. After that, mix in the grammar and sentence items that *are* CEFR-authored, replace the pass/fail ladder with a small ability estimate, and stop letting one lexical number set the level of five sections at once.

---

## 0. How the facts below were established

Content counts come from the shipped bundle, not from documentation. `docs/feature-map.md` §0 gives the decoding prelude; I reused it and re-derived only the numbers this document leans on.

| # | Claim | Method | Result |
|---|---|---|---|
| P1 | word entries, and none carries a CEFR tag | `Object.keys` over `data/words.json` | **10,524**; keys are `i, en, fa, cat, ex, exfa` (+ `syn` on 272). **No CEFR field, no frequency field.** |
| P2 | what a "CEFR level" means for a word | `levelWordIndices(L)` (`app.jsx:1201`) slices `VOCAB_ORDER` by `LEVEL_SHARE = [.08,.11,.15,.19,.22,.25]` (`app.jsx:350`) | A1 **842** · A2 **1,158** · B1 **1,579** · B2 **2,000** · C1 **2,315** · C2 **2,630** words |
| P3 | how `VOCAB_ORDER` was built | `tools/reorder.js` — score = `3000+cf` if the word appears ≥3× in the app's own curricula, `2000+cf` if 1–2×, else **1000**; then `−4 × length` | only **777** words have cf≥3 and **1,866** have cf≥1. Everything past rank 1,866 — i.e. **all of B1, B2, C1, C2** — is tied at 1000 and therefore **sorted purely by word length** |
| P4 | what that produces | printed the head and mid of each band | B1 opens `eng, ace, sue, chi, rfc, seo, isp, ins, ssl, opt, flu, mlb`; C1 mid `mongolia, crawford, thinkpad, sapphire`; C2 mid `preston, elliott, deborah, gabriel` |
| P5 | the five A1 items every learner actually sees | re-ran `placementQs('A1')` with its shipped seed `LEVELS.indexOf(L)*733+11` | `theory`, `help`, `stayed`, `tank`, `iran` |
| P6 | the five C2 items | same, seed `5*733+11` | `ampland` ("نام سایت"), `daily routine`, `Qin`, `judicious`, `preston` ("نام خاص") |
| P7 | seeding is fixed | `placementQs` seeds from the level index and `wi*17+k` only — no attempt counter, no date | **every learner sees identical items, on every retake, forever** |
| P8 | items with an unusable gloss | regex over `fa` for proper-name labels | **326** entries glossed "نام خاص / نام زن / نام سایت …"; **1,244** entries share a Persian gloss with at least one other entry; **625** headwords are ≤3 letters |
| P9 | CEFR-authored MCQ stock that already exists | counted `GRAM[L].choose` | A1 **14** · A2 **13** · B1 **13** · B2 **12** · C1 **15** · C2 **15** = **82** four-option items, each with an `a` index and a Persian `why` rationale |
| P10 | CEFR-authored order-the-chunks stock | counted `SENT[L].chunks` | **6 per level**, 36 total; no typing required |
| P11 | CEFR-authored leveled prose | de-duplicated `LISTEN_1 ∪ LISTEN_2` by `id` | **24 texts, 4 per level**, 532–696 English words per level, 12 comprehension MCQs per level |
| P12 | applying a placement permanently skips lower bands | `chunkOrder` (`app.jsx:1149`) draws new words only from the current band's slice; `srDue` (`app.jsx:714`) returns `false` for any word with no SR record | placing a learner at C1 removes ~**6,000** never-introduced lower-band words from the schedule with no path back except manually lowering the level |

> **Note on P11.** `docs/feature-map.md` M13/M14 reports 20 listening texts with 2/2 at C1/C2. The bundle as it stands today contains 24 unique text `id`s, 4 per level. The feature map was written against an earlier bundle; I used the current one.

---

## 1. What v1 does, stated precisely

`app.jsx:1519–1594`. For `L` in `A1…C2`: take that level's word band, take 5 words under a fixed seed, show the English headword, offer 4 Persian glosses drawn from the same band, score. If the level score is ≥ 60% (3/5) go up a level; otherwise stop. The placement is the highest level that cleared 60%, defaulting to A1.

Applying it (`applyPlacement`, `:1572`) sets `d.round = levelIndex * 5 + 1`, resets `d.pos`, regenerates `d.order`, and overwrites `gLv`, `sbLv`, `lsLv`, `dLv`, `jobLevel`, `practiceLv`. One lexical recognition score therefore repositions the vocabulary spaced-repetition queue **and** sets the entry level of grammar, sentence-building, listening, discussion and the jobs section.

Nothing about the result is stored. `placement: null` afterwards; only `d.round` survives, and it is indistinguishable from a round reached by study.

---

## 2. Q1 — is a vocabulary-recognition MCQ a defensible proxy for CEFR level?

### 2.1 The case for it is real and should not be dismissed

Vocabulary breadth is the best single cheap predictor of overall L2 proficiency that exists. Milton's review for EUROSLA/SLATE assembles the evidence: vocabulary-size estimates correlate with reading, writing, listening and oral fluency "usually quite good and… typically between 0.6 and 0.8"; Stæhr (2008) reports Spearman correlations of **.69 (listening), .83 (reading), .73 (writing)** against Vocabulary Levels Test scores; and orthographic vocabulary size explains roughly **58% of variance in overall IELTS scores** ([Milton 2010, *The development of vocabulary breadth across the CEFR levels*](https://www.eurosla.org/monographs/EM01/211-232Milton.pdf)).

The link to CEFR specifically is also documented. Meara & Milton's XLex figures against Cambridge exam candidates give roughly: A1 <1,500 · A2 1,500–2,500 · B1 2,750–3,250 · B2 3,250–3,750 · C1 3,750–4,500 · C2 4,500–5,000 words of the most frequent 5,000. Milton & Alexiou's 500-learner multi-language study found the between-level differences statistically significant and "some 60 to 70% of variance in CEFR levels can be explained by differences in vocabulary size" (both in Milton 2010, Tables 5 and 6).

So: a vocabulary test is not a known-bad proxy. It is a known-decent one, and it is by a wide margin the cheapest thing an offline app can administer.

### 2.2 The case against it, for *this* use

Four independent problems, each of which the current design walks into.

**(a) 60–70% of variance is not enough for a six-way classification.** Milton & Alexiou's own Table 6 reports standard deviations of 400–840 words against band widths of 500–750 words. The distributions overlap heavily. Milton is explicit: "There is individual variation and overlap between the scores that learners attain within the CEFR levels." Aggregate prediction ≠ individual classification.

**(b) Vocabulary tests discriminate the bottom of the scale much better than the top.** Lam's five-level university placement study (200-item yes/no test) found significant separation between the lowest levels and everything above, but the test "was unable to distinguish between SPAN 211 and SPAN 212, nor between SPAN 212 and SPAN 300" — the upper adjacent pairs — and only worked when the five levels were collapsed to three ([Lam, *Yes/no tests for foreign language placement at the post-secondary level*](https://files.eric.ed.gov/fulltext/EJ944127.pdf)). This matches Shiotsu & Weir's finding that lexical breadth dominates prediction at low and intermediate proficiency while **syntactic knowledge takes over as the stronger predictor at high proficiency** ([summarised here](https://link.springer.com/article/10.1007/s42321-020-00065-z)). A vocabulary-only test is weakest exactly where this app's word list is also weakest (P4).

**(c) Four-option MCQ inflates scores through guessing.** "Four-option, multiple-choice items are subject to a guessing effect, which may lead to the overestimation of test scores" — the reason Nation's Vocabulary Levels Test uses a 3-of-6 matching format rather than 4-option MCQ (Stewart 2014; Stewart & White 2011; [Gyllstad, Vilkaitė & Schmitt 2015](https://benjamins.com/catalog/itl.166.2.04gyl)). With `c = .25`, the app's 60% bar corresponds to knowing only **47%** of the level's words. Meaning-recognition formats are also known to overstate what a learner can actually do with a word compared with meaning-recall (Gyllstad et al. 2015; Kremmel & Schmitt 2016).

**(d) Sampling rate.** Nation's Vocabulary Size Test samples **10 items per 1,000-word band**; the Vocabulary Levels Test samples **30 words per level** ([Beglar 2010 Rasch validation](https://journals.sagepub.com/doi/10.1177/0265532209340194); [VST specifications](https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/vocabulary-tests/the-vocabulary-size-test/Vocabulary-Size-Test-information-and-specifications.pdf)). v1 samples **5 items to represent bands of 842 to 2,630 words** — between 0.6% and 0.2% of the band, an order of magnitude below the sparsest published practice, and reports it as a CEFR level.

### 2.3 What the real tests actually do — none of them is vocabulary-only

- **Duolingo English Test.** Adaptive, built on five item formats — **C-test, text yes/no vocabulary, audio yes/no vocabulary, dictation, elicited imitation** — over a bank of 25,000+ items, with 15–18 yes/no vocabulary items at the *start* only ([DET scoring overview](https://duolingo-papers.s3.us-east-1.amazonaws.com/reports/Duolingo_whitepaper_test_scoring_current.pdf); [vocabulary whitepaper](https://duolingo-papers.s3.amazonaws.com/other/vocab_whitepaper_final.pdf)). The yes/no vocabulary section is the *router*, not the score.
- **Cambridge English Placement Test.** Adaptive, ~30 minutes, covers **Reading, Use of English and Listening**, reports Pre-A1 to C2. Its stopping criteria are explicitly "target precision of the ability estimate, number of questions, and time limit" ([CEPT FAQ](https://support.cambridgeenglish.org/hc/en-gb/articles/210044206-Cambridge-English-Placement-Test-CEPT-FAQs)).
- **Oxford Online Placement Test.** Adaptive, two sections: **Use of English** (grammatical form + vocabulary) and **Listening** ([OUP](https://elt.oup.com/feature/global/oxford-online-placement/)).
- **Nation's VLT / VST.** These are vocabulary-*size* instruments, not placement tests, and their authors do not present them as CEFR classifiers.

The universal pattern: vocabulary is used to route quickly, and something syntactic or comprehension-based is used to decide. Nobody classifies on vocabulary alone.

### 2.4 The app-specific finding that dominates all of the above

Everything in §2.1–2.3 assumes the test is sampling from a defensibly leveled word list. It is not.

`tools/reorder.js` scores each word by how often it appears in the app's own curricula: `3000 + cf` for cf≥3, `2000 + cf` for cf 1–2, and a flat `1000` otherwise, then subtracts `4 × length` (P3). Only **777** words reach cf≥3 and **1,866** reach cf≥1. Everything from rank 1,867 to 10,524 — the whole of B1, B2, C1 and C2, **8,658 words, 82% of the list** — sits on the same base score of 1000 and is therefore **ordered by word length, shortest first**.

The consequence is visible without any statistics (P4):

| band | first twelve words |
|---|---|
| A1 | day, two, work, last, one, there, take, every, make, years, come, time |
| B1 | eng, ace, sue, chi, rfc, seo, isp, ins, ssl, opt, flu, mlb |
| C1 | trigger, beaches, folders, routers, pendant, dresses, baptist, females |
| C2 | configured, analytical, executives, supporters, withdrawal, veterinary |

A1 is genuinely A1-ish, because the top 777 words really were frequency-ranked. B1 is three-letter acronyms. C1/C2 are long words and proper nouns. The actual items the test asks (P5, P6) follow: A1 asks `theory` and `iran`; B1 asks `april` and `hash` against distractors `suse`, `essex`, `sic`, `bool`; B2 asks `contact`, `delete` and `stays` against `packard` and `holmes`; C2 asks `ampland` — glossed "نام سایت (نامشخص)" — and `preston`, glossed "نام خاص".

`docs/feature-map.md` already states that "the word list has no defensible difficulty ordering". The placement test is the one place in the app where that fact is fatal rather than merely untidy, because everywhere else the ordering only decides *what you study next*, and here it decides *what the app tells you your level is* and then repositions five sections on the strength of it.

### 2.5 Verdict on Q1

**Vocabulary recognition is a defensible component and an excellent router. It is not defensible as the sole determinant of a six-way CEFR classification, and in this app it is not currently defensible at all above A2, because the items above A2 are not leveled.** The single highest-value change is to stop drawing placement items from `levelWordIndices()` and draw them from a small hand-checked, externally-leveled list instead.

---

## 3. Q2 — should the test mix item types?

**Yes, and the mix should be small and specific.**

The evidence is §2.2(b) and §2.3: lexical breadth predicts best at the bottom of the scale, syntactic knowledge predicts best at the top, and every published placement test pairs a lexical measure with a use-of-English measure. Adding grammar items is not a hedge; it is what makes the upper decisions possible.

The app already owns the item bank for this and it costs nothing to author:

| source | what it is | stock (P9–P11) | why it qualifies |
|---|---|---|---|
| `GRAM[L].choose` | 4-option gap MCQ, e.g. `My father ___ to work by bus.` with `a: 1` and a Persian `why` | 82 across six levels, 12–15 per level | **CEFR-authored by the curriculum author**, unlike the word bands. Same interaction as the existing vocabulary item — no new UI. |
| `SENT[L].chunks` | tap 3–5 chunks into order from a Persian prompt | 6 per level, 36 total | tests word order without typing; mobile-friendly; measures the syntactic dimension Shiotsu & Weir identify as decisive at higher levels |
| `LISTEN[L].q` | comprehension MCQ over a leveled text | 12 per level, 24 texts | the only listening-shaped evidence available offline |

**Minimum viable mix — recommended.** Per probed level, a pool of **9**: 4 vocabulary MCQ + 3 grammar MCQ + 2 chunk-ordering. Under the adaptive rule in §5 a typical learner is probed at 2–3 levels, so the whole test is **20–24 items** across two measured dimensions.

**What to leave out, and why.**

- **C-test / cloze with typing.** The C-test is the strongest candidate on evidence — Eckes & Grotjahn's Rasch/CFA work found a C-test to be "a highly reliable, unidimensional instrument, which measured the same general dimension as the four TestDaF sections: reading, listening, writing and speaking" ([Eckes & Grotjahn 2006](https://journals.sagepub.com/doi/10.1191/0265532206lt330oa); Klein-Braley's reduced-redundancy work found the C-test "the most economical and reliable procedure" of the family). The 24 leveled listening texts (P11) would supply passages for free. **I still say no for v2**, on two grounds: it requires typing 20+ English fragments on a phone keyboard, which confounds spelling and motor cost with proficiency for a Persian-L1 audience; and it is a much larger build than everything else here. Revisit it in v3 as a *single* optional 8-gap boundary item, not as the backbone.
- **Listening items in the placement path.** Worth having eventually, but a placement test that plays audio cannot be completed in a quiet room, on a bus, or with a broken TTS voice, and TTS quality varies wildly across the Android/iOS installs this app runs on. Keep listening out of the scored test; place listening conservatively (§6.3).
- **Cloze from `words.json` example sentences.** Absolutely not. `docs/feature-map.md` M5 shows the top 20 templates cover 10,508 of 10,524 examples, and the real data is worse than that suggests — `data/words.json` index 500 is `The weather was very selfish yesterday.` A cloze built on these tests nothing.

**Evidence against mixing, stated fairly.** Mixing item types makes the test multidimensional, and a single θ over a multidimensional construct is psychometrically sloppy — this is exactly why the DET reports eight subscores rather than one. The mitigation in §5 is to keep **two** separate estimates (lexical, structural) rather than pooling into one number.

---

## 4. Q4 — item count and pass bar (taken before Q3, because Q3 depends on it)

### 4.1 The current bar is leaky in both directions

With a 4-option MCQ the observed success rate is `p = k + (1−k)·0.25` where `k` is the proportion of the band actually known. Binomial probability of clearing each design's bar:

| design | knows 0% | 20% | 40% | 60% | 80% | knowledge-equivalent bar |
|---|---|---|---|---|---|---|
| **5 items, cut 3 (v1)** | **0.104** | **0.317** | 0.593 | 0.837 | 0.973 | **47%** |
| 8 items, cut 5 | 0.027 | 0.174 | 0.477 | 0.806 | 0.979 | 50% |
| 9 items, cut 5 | 0.049 | 0.267 | 0.621 | 0.901 | 0.994 | 41% |
| **9 items, cut 6** | 0.010 | 0.099 | 0.361 | 0.730 | 0.966 | **56%** |
| 12 items, cut 8 | 0.003 | 0.057 | 0.304 | 0.724 | 0.976 | 56% |

Read the v1 row: a learner who knows **nothing** of a level clears it 10.4% of the time, and a learner who knows **20%** of it clears it 32% of the time. The standard error of a 5-item proportion at p=.6 is **0.219** — a 95% interval of roughly ±43 percentage points. A 5-item probe cannot support a level decision.

The failure runs the other way too. A genuine B2 who knows 85/80/75/65% of the four bands below has a `0.988 × 0.973 × 0.951 × 0.883 = 0.808` chance of reaching B2 — i.e. **a 19% chance the sequential rule stops them early** and places them at B1 or below, purely from sampling noise.

### 4.2 What to do instead

Two options, in preference order.

**Preferred — drop pass bars entirely and estimate ability (§5).** A threshold per level throws away information: `3/5` and `5/5` are the same decision. An ability estimate uses every response.

**Fallback if the ability model is too much to build — 9 items per probed level, cut at 6.** This roughly triples the separation between a 20%-knower and a 60%-knower compared with 5/3, and costs nothing at the boundary because the adaptive rule in §5 probes only 2–3 levels rather than all six.

Either way, **do not just make the ladder longer**. Testing all six levels at 9 items is 54 items and will not be finished. `docs/industry-scan.md` §5.4 is right that a placement test which burns a new learner's first session is a bad trade; Cambridge's own placement product is ~30 minutes only because an institution requires the learner to sit it. Target **3–4 minutes, 20–24 items** and accept ±1 level accuracy, mitigated by §6.

---

## 5. Q3 — routing and stopping rule

### 5.1 Starting at A1 for everyone is wrong

It is wrong on efficiency grounds — standard CAT practice is to begin near the centre of the ability scale or from prior information, and adaptivity "can achieve the same measurement precision as a fixed-form test with 50–70% fewer items" precisely by not administering items that are far from the learner's level. It is also wrong on user-experience grounds: an advanced learner answering five trivially easy items before the test begins to be informative is the most common reason a placement test gets abandoned.

### 5.2 Use self-assessment as the router, never as the result

The CEFR self-assessment grid exists, is free, is published by the Council of Europe in many languages, and needs no items ([Council of Europe self-assessment grid](https://www.coe.int/en/web/portfolio/self-assessment-grid)). Its accuracy is moderate and contested: Ross's meta-analysis of 60 correlations found an average **r = .63** (speaking .55) ([Ross 1998](https://journals.sagepub.com/doi/10.1177/026553229801500101)); Li & Zhang's larger, more recent meta-analysis of 214 correlations across 67 studies found **r = .466** ([Li & Zhang 2021](https://journals.sagepub.com/doi/abs/10.1177/0265532220932481)). Self-assessment is also culturally skewed toward mid-scale responses.

**Where the evidence disagrees, I side with Li & Zhang's lower figure** — it is the larger and more recent synthesis and its moderator analysis explains Ross's higher value (short, criterion-anchored instruments correlate better than general ones). An r of ~.47 explains ~22% of variance: hopeless as a placement, entirely adequate as a starting point for an adaptive test, which is what "prior information (e.g. self-reported education level) to select a more appropriate starting point" means in the CAT literature.

**Concretely:** three Persian can-do statements on one screen, derived from the CEFR grid, answered با بله/تقریباً/نه. They set the starting level only, they are never shown in the result, and a wrong self-report costs at most 3–6 extra items.

### 5.3 The stopping rule

Reject "stop at the first failed level." It has three defects: it is a single-point decision with no recovery (§4.1: 19% early stop for a true B2), it discards the information in *how badly* a level failed, and it makes the test's length inversely proportional to the learner's level, which is backwards.

Three candidate replacements:

1. **Test every level and take a weighted signal.** Most reliable, 54+ items, will not be completed. Reject.
2. **Binary search over the six levels.** ~3 probes, log₂6 ≈ 2.6, cheap to build. But a single mis-routed probe has no recovery path, and with a 9-item probe that happens often enough to matter. Acceptable as a fallback.
3. **Rasch-lite ability estimate with SE-based stopping.** Recommended. This is what CEPT does in substance — "target precision of the ability estimate, number of questions, and time limit" — with the calibration replaced by an assumption.

The assumption that makes (3) buildable offline: **an item's difficulty is the CEFR level it was authored at.** For grammar and chunk items that assumption is honest (P9, P10) because a human wrote them at that level. For vocabulary it becomes honest only after the curated list in §8.1 exists. That is the whole reason §9 puts the word list first.

For sequential *classification* specifically there is a more efficient tool than an ability estimate — the Sequential Probability Ratio Test, which "evaluates data as it is collected and may reach a decision earlier" and has been shown to need fewer items than sequential Bayes at matched error rates ([Spray & Reckase 1996](https://journals.sagepub.com/doi/10.3102/10769986021004405)). I do not recommend SPRT here: it decides between **two** categories, and stacking it across six boundaries reintroduces the error-compounding of the ladder. Noted so the option is on the record rather than overlooked.

---

## 6. Q5 and the structural recommendations

### 6.1 One test, several results

The CEFR Companion Volume treats an uneven profile as the normal case, not the exception — competence is "an uneven and changing competence, in which the user/learner's resources in one language or variety may be very different in nature from their resources in another" ([Council of Europe 2020](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4)). The DET reports eight subscores for the same reason. `applyPlacement` currently writes one number into six places.

**Recommendation:** the test produces **two** estimates — θ_lex from vocabulary items and θ_str from grammar + chunk items — and maps them separately (§8.5). Listening and discussion get no direct evidence and are therefore placed conservatively at `min(θ_lex, θ_str)`, and the result screen says so in plain Persian rather than implying a measurement that was not made.

### 6.2 Place low, not high

Placement error is asymmetric in this app. Under-placement costs a few easy sessions and is self-correcting: `docs/learning-path.md` §3 already guarantees the level chips move freely and nothing is locked. Over-placement in a self-study app with no teacher hands a learner material they cannot do, and — because of P12 — **silently deletes up to ~6,000 words from their vocabulary schedule**, since `chunkOrder` draws new cards only from the current band and `srDue` ignores words that were never introduced. There is no automatic way back.

Two consequences: bias the reported level down by half a step when SE is large (§8.4), and fix the backfill (§9, item 6) so that placing high borrows rather than discards.

### 6.3 Keep it skippable, and let the result be provisional

`docs/industry-scan.md` §5.4 argued against having a placement test at all. That argument lost — one shipped — but its substance survives: the test must stay optional, must stay short, must be re-offerable, and must never lock anything. Add one thing it did not anticipate: after the placement, **store the result** (`vocab_place_v1`) and offer a re-test after ~14 days of study. Right now nothing is stored at all, so the app cannot tell a placed learner from a studied one, cannot avoid re-showing the same items, and cannot show the learner what their level was.

### 6.4 The test is also a teaching moment — use it

Showing the correct answer with the existing Persian `why` rationale after each grammar item costs nothing and is supported by the pretesting effect: unsuccessful retrieval attempts before instruction improve later learning of the same material, in all five experiments of [Richland, Kornell & Kao (2009)](https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf), analysed over items the learner got *wrong*. This also disposes of the objection that placement items "waste" curriculum content: a missed placement item is a better first encounter with that content than a cold one.

---

## 7. Where I disagree with what is already written

- **`docs/industry-scan.md` §5.4** — "Here it would burn a new learner's first session on assessment." Half right. The cost is real but it is a function of length, not of existence, and the alternative it proposes (start at A1, move the chips) fails a specific, common user: a B1/B2 adult who opens the app, sees `day / two / work` and concludes the app is for children. A 3-minute optional test is the cheapest fix for that, and §6.2/§6.3 preserve everything the industry scan wanted to protect.
- **`docs/learning-path.md` §395** — "No placement test. An existing learner keeps their level; a new one starts at A1." Superseded by what shipped. The document should be updated rather than left to contradict the code.
- **`docs/feature-map.md` M13/M14** — listening counts are stale against the current bundle (P11). Minor, but the spec below depends on 4 texts per level.

---

## 8. The v2 specification

Everything below runs client-side against existing data plus one new small data file. No server, no ML, no network.

### 8.1 Data — the one new asset: `data/placement.json`

The only thing v2 genuinely cannot build from existing data is a leveled word list. Required shape:

```json
{
  "v": 1,
  "words": {
    "A1": [{ "i": 41, "en": "work", "fa": "کار" }, ...],
    "A2": [...], "B1": [...], "B2": [...], "C1": [...], "C2": [...]
  }
}
```

**Size:** 12 words per level, 72 total. This is the minimum that lets an adaptive run of 4 vocabulary items per probed level avoid repeats across a retest, and it is still four times sparser than Nation's VST sampling rate — a compromise made knowingly for test length (§4.2).

**Sourcing.** Do not invent levels. Take them from a published CEFR-tagged list — [The Oxford 3000 by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf) and [The Oxford 5000 by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf) are published as free PDFs by OUP and cover A1–C1; the English Vocabulary Profile covers A1–C2. **Check the licence before copying a list wholesale** — this is a redistribution question, not a linguistic one, and I have not verified it (see §12). The safe route is to use the published list as a *reference* for assigning a level to words the app already owns: pick `i` values out of `data/words.json` whose headword appears at that level in the reference list, and ship only the indices. That ships no third-party list at all.

**Hard exclusion rules when picking the 72 (all measured in P8):**
- reject any entry whose `fa` matches `/نام خاص|نام زن|نام مرد|نام سایت|نام شهر|نام کشور|\(نام\)/` — **326** candidates
- reject any entry whose `fa` is shared with another entry in `words.json` — **1,244** candidates; a distractor with the same gloss as the key makes the item unanswerable
- reject headwords of ≤3 letters and any acronym — **625** candidates
- reject inflected duplicates (`stays`, `heads`, `cards` — all currently in the item pool)
- reject anything whose meaning is culture-bound in a way a Persian learner cannot infer

**Distractors** are generated at runtime from `data/placement.json` itself: three other words from the **same** level, whose `fa` differs from the key's `fa` by simple string inequality. Same-level distractors keep the semantic distance uniform; v1 drew them from the same *band*, which at C2 meant choosing between four proper nouns.

### 8.2 Data — reused, no authoring

- **Grammar items:** `GRAM[L]` → for each lesson, `choose[]`. Each has `q`, `opts` (4), `a`, `why`. 82 available (P9). Reserve at most **6 per level** for placement, chosen by a per-attempt seed, leaving the rest for teaching.
- **Chunk items:** `SENT[L].chunks` → `fa`, `chunks[]`, `tip`. 6 per level (P10). Reserve **3 per level**.

Overlap with taught content is acceptable and mildly beneficial (§6.4). Record which item ids were used in `vocab_place_v1.seen` and avoid them on a retest.

### 8.3 Flow

```
home → [تعیین سطح]
  ↓
Screen 0 — router (one screen, ~15 s)
  Three CEFR-derived can-do statements in Persian, e.g.
    «می‌توانم دربارهٔ کار و زندگی روزمره‌ام چند جمله بگویم.»            → A1/A2 boundary
    «می‌توانم دربارهٔ یک موضوع آشنا بحث کنم و دلیل بیاورم.»            → B1/B2 boundary
    «می‌توانم متن‌های تخصصی یا ادبی را بدون کمک بخوانم.»               → C1/C2 boundary
  Each: بله / تقریباً / نه.  Score → starting level index θ₀ ∈ {0…5}.
  A «نمی‌دانم / رد کن» button sets θ₀ = 2 (B1) and moves on.
  ↓
Screen 1..n — items, one per screen, no timer, no back button
  Item selection: §8.4. Feedback shown immediately, with `why` where it exists.
  Progress shown as a bar with an approximate remaining count, never "question 3 of 24".
  ↓
Result screen
  Two levels (واژگان / ساختار), a plain-Persian confidence statement,
  «شروع از این سطح» and «سطح دیگری را انتخاب می‌کنم» (a manual override, always present).
```

### 8.4 The estimator

A 3PL model with fixed discrimination and fixed guessing, difficulties taken from the authored CEFR level.

```
LEVEL_B = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }
c(item)  = 0.25 for 4-option MCQ (vocab, grammar)
         = 0.05 for chunk-ordering (guessing a 4-chunk order at random ≈ 1/24)

P(correct | θ, b, c) = c + (1 - c) / (1 + exp(-1.7 * (θ - b)))
```

Two independent estimates are maintained, θ_lex (vocabulary items) and θ_str (grammar + chunk items), each by MAP over a grid:

```
estimate(responses, prior_mu):
  best = -inf; θ* = prior_mu
  for θ = -1.5 to 6.5 step 0.05:
     ll = Σ_items [ x·ln P + (1-x)·ln(1-P) ]  -  (θ - prior_mu)² / (2 · 1.5²)
     if ll > best: best = ll; θ* = θ
  SE = 1 / sqrt( Σ_items  I(θ*) ),  I = (1.7²)·(1-c)·(P-c)²·(1-P) / (P·(1-c)²)  ... clamp SE ≤ 2.0
  return θ*, SE
```

The Gaussian prior (μ = router level, σ = 1.5) is what keeps the estimate finite when a learner answers everything right or everything wrong, and is why a wrong self-report is recoverable rather than fatal.

**Item selection.** Alternate dimensions (lex, str, lex, str, …). Within a dimension pick the unused item whose `b` is closest to the current θ for that dimension, breaking ties by the per-attempt seed. Never show two items from the same grammar lesson consecutively.

**Stopping.** Stop when **all** of:
- ≥ 8 lexical items **and** ≥ 8 structural items administered, **and**
- `SE_lex < 0.5` and `SE_str < 0.5`, **or** 24 items total have been shown.

Hard ceiling 24 items; hard floor 16. Expected length for a learner whose router guess was right: 16–18 items, ~3 minutes.

**Reporting.**

```
level_index(θ, SE) = clamp( floor(θ - (SE > 0.6 ? 0.5 : 0)), 0, 5 )
```

The `SE > 0.6` term is the "place low" rule from §6.2: when the test is unsure, it rounds down. `floor(θ)` already means "the highest level whose items you are consistently above", which is the conservative reading.

Report to the learner as a level plus a range, not a point: «سطح تخمینی شما B1 است؛ ممکن است A2 یا B2 باشد» when `SE > 0.5`.

### 8.5 Applying the result

Replace `applyPlacement` (`app.jsx:1572`) with:

| target | driven by | note |
|---|---|---|
| `d.round` (vocabulary) | `level_index(θ_lex)` | plus the backfill fix below |
| `gLv`, `sbLv` | `level_index(θ_str)` | grammar and sentence-building are the structural dimension |
| `lsLv`, `dLv`, `jobLevel`, `practiceLv` | `min(level_index(θ_lex), level_index(θ_str))` | no listening or speaking evidence was collected; place low and say so |

**Backfill (fixes P12).** Setting `d.round` high must not orphan the lower bands. In `chunkOrder`, when `band(d.round) > 0`, draw `MAX_NEW` new cards as **4 from the current band + 1 from the highest band below that still has un-introduced words**. Five per session, so a learner placed at C1 still meets skipped material at ~1 card/day, and the level they were placed at still dominates. This is a 3-line change in `chunkOrder` and it is what makes an aggressive placement safe.

### 8.6 Storage

New key `vocab_place_v1`, added to `BACKUP_KEYS` (`app.jsx:2`):

```json
{
  "v": 1,
  "at": "2026-08-16",
  "router": 2,
  "lex":  { "theta": 2.35, "se": 0.44, "n": 10 },
  "str":  { "theta": 1.80, "se": 0.51, "n": 10 },
  "applied": { "round": 11, "gLv": "A2", "lsLv": "A2" },
  "seen": { "w": [41, 903, ...], "g": ["A1:2:0", ...], "c": ["B1:3", ...] }
}
```

`seen` prevents item repetition on a retest. Its presence lets the home screen offer «سطح‌ات را دوباره بسنج» after 14 days, and lets the result be shown again without re-running the test.

### 8.7 Seeding

Replace the fixed seeds in `placementQs` (P7). Seed every draw from `attemptSeed = Date.now() ^ (existing vocab_place_v1.attempts || 0)`, stored on the attempt so a reload mid-test is stable. Without this, the test is the same 30 items for every learner on earth, forever, and a retest measures memory of the test.

---

## 9. Prioritized change list

Ordered by (impact ÷ cost). Each is independently shippable; nothing below depends on anything above it except where stated.

| # | Change | Impact | Cost | Why here |
|---|---|---|---|---|
| **1** | **Build `data/placement.json` — 72 externally-leveled words with the §8.1 exclusion filters, and draw vocabulary items from it instead of `levelWordIndices()`** | **Decisive.** Without it the test measures word length (§2.4). Every other improvement is a refinement of a broken measurement. | ~3–4 h of content work + ~20 lines | Nothing else matters until the items are leveled. |
| **2** | **Randomise the seed per attempt** (§8.7) | High. Removes fixed 30-item exposure and makes retests meaningful. | ~5 lines | Trivially cheap; do it in the same commit as #1. |
| **3** | **Raise the probe to 9 items / cut 6 per level** (§4.2 fallback), even before the estimator exists | High. Cuts the false-pass rate at 20% knowledge from 0.32 to 0.10. | ~2 constants | Buys most of the reliability gain for two character changes. |
| **4** | **Mix in `GRAM[L].choose` items** — 3 per probed level, with the `why` shown as feedback (§3, §6.4) | High. Adds the syntactic dimension that decides the upper levels, from content that already exists. | ~40 lines, reuses the MCQ renderer | No authoring at all. |
| **5** | **Stop letting one number set six sections** — split into θ_lex / θ_str and apply per §8.5 | High. Aligns with the CEFR's own uneven-profile position and stops the app claiming a listening level it never measured. | ~30 lines | Depends on #4 existing. |
| **6** | **Backfill in `chunkOrder`** so a high placement borrows from lower bands instead of discarding ~6,000 words (§8.5, P12) | High, and it is a latent data-loss bug independent of the test. | ~3 lines | Should arguably ship first as a bug fix. |
| **7** | **Store `vocab_place_v1`** and add it to `BACKUP_KEYS` (§8.6) | Medium. Enables retest, item non-repetition, and showing the learner their own result. | ~20 lines | Prerequisite for #9. |
| **8** | **Router screen — 3 can-do statements setting the start level** (§5.2) | Medium-high for advanced learners, zero for beginners. Cuts 6–10 wasted items. | ~60 lines, one new screen | Cheap and independent. |
| **9** | **Replace the ladder with the MAP estimator + SE stopping** (§8.4) | Medium. Better use of the same responses, honest confidence reporting, shorter tests. | ~120 lines of pure logic, no UI change | The right end state, but items #1–#4 deliver more per hour. Do not build this before #1: an estimator over unleveled items is precise nonsense. |
| **10** | **Report a range, not a point, and add a visible manual override on the result screen** (§8.4, §6.2) | Medium. Honest about ±1-level accuracy; costs the learner nothing when the test is wrong. | ~15 lines | Pairs with #9. |
| **11** | **Add 2 `SENT[L].chunks` items per probed level** (§3) | Low-medium. A third dimension, no typing. | ~50 lines, reuses the chunk runner | Diminishing returns past #4. |
| **12** | **Offer a retest after 14 days of study** (§6.3) | Low. Corrects placement errors over time. | ~15 lines, needs #7 | Nice-to-have. |
| **13** | **C-test boundary item built from the leveled listening texts** (§3) | Low for effort. Strongest evidence of any format, worst fit for a phone keyboard. | Large | v3 candidate only. Re-evaluate if the app ever gains a desktop/tablet layout. |

---

## 10. What this costs if I am wrong

The recommendation biases toward **short and conservative**: 20–24 items, place low, never lock. If that is the wrong call, the failure mode is a competent B2 being placed at B1, opening the app to material slightly below them, and — because the app no longer requires them to grind through the lower band (change #6 caps backfill at 1 card in 5) — deciding within two sessions that the app is beneath them and leaving. That is a real risk and it is the *opposite* of the risk v1 has. I accept it because it is visible and recoverable (change #10 puts a manual override on the result screen) whereas over-placement is invisible: nothing tells a learner that 6,000 words were skipped.

The second thing I could be wrong about is **excluding listening from the scored test**. If a substantial share of this app's learners are strong readers with weak ears — very plausible for the Iranian classroom-English profile — then placing listening at `min(θ_lex, θ_str)` will still be too high for them, and the discussion sessions in particular will be unusable. The mitigation is that listening and discussion level chips move freely; the honest statement is that this test does not measure listening and should not pretend to.

## 11. The strongest argument against this spec

**"You are over-engineering a button."** The placement test is one optional control on a home screen of a free offline app. A learner who is misplaced can move a level chip in two taps — `docs/learning-path.md` §3 guarantees it. Under that view, the correct amount of psychometrics is *none*: keep 5 items per level, keep the ladder, fix nothing but the word list, and spend the remaining effort on the 99.8%-template example sentences, which damage every session rather than one screen.

That argument is largely right about priority and I have encoded it: change #1 is the word list, and changes #9–#13 are explicitly ranked below cheap fixes. Where it fails is the claim that misplacement is cheap. It is not, for two reasons this document established: over-placement silently drops ~6,000 words from the schedule with no notification and no automatic recovery (P12), and the result the test prints is the app's only statement to the learner about who they are. Printing "C2" because someone recognised `preston` and `ampland` is not a small error in a small feature; it is the app being confidently wrong about the one thing the learner asked it.

---

## 12. What I could not verify, and what would change my mind

**Not verified — relying on judgement:**
- **Licensing of the Oxford 3000/5000 and English Vocabulary Profile lists for redistribution inside a shipped HTML file.** I confirmed the PDFs are publicly downloadable from OUP; I did **not** confirm redistribution terms. §8.1's fallback (ship only `words.json` indices, use the external list as an unshipped reference during authoring) is designed to sidestep this, but someone should read the terms before choosing the direct route.
- **The exact Duolingo English Test adaptive parameters.** The whitepapers I could reach were image-encoded PDFs that would not yield text. Item formats (five: C-test, text and audio yes/no vocabulary, dictation, elicited imitation), the 15–18 opening yes/no items, and the >25,000-item bank come from search-surfaced summaries of those whitepapers, not from a page I read directly. Treat the exact numbers as approximate; the structural claim — vocabulary routes, other formats decide — is corroborated independently by CEPT and OOPT.
- **The 1.7 scaling constant and σ = 1.5 prior in §8.4** are conventional defaults, not values fitted to this app's data. There is no calibration sample and there cannot be one offline. They are stated as assumptions, not findings.
- **Whether 12 words per level is enough.** It is four times sparser than Nation's VST rate. I chose it to hold the test under four minutes. It is the weakest number in the spec.

**What would change my mind:**
- **Evidence that `VOCAB_ORDER` above rank 1,866 is not length-sorted** — i.e. if `tools/reorder.js` is superseded or the bundle's order came from somewhere else. Recommendation #1 rests entirely on P3/P4. Re-run those two one-liners before building.
- **Real completion data.** If telemetry (or the owner's own use) showed that learners finish a 30-item test at the same rate as a 20-item one, §4.2's length ceiling should rise immediately — length is the only reason this spec accepts ±1 level accuracy.
- **A published study finding that vocabulary-only placement discriminates adjacent CEFR levels reliably at B2+.** Lam's result and Shiotsu & Weir's proficiency-moderated pattern are the load-bearing evidence for adding grammar items (change #4). A contrary finding on a larger sample would make change #4 optional rather than high-priority.
- **A CEFR-tagged Persian-glossed word list appearing in the repository.** That would collapse changes #1 and #9 into a single afternoon and move the estimator up the priority list.

---

## Sources

- [Milton, J. (2010). *The development of vocabulary breadth across the CEFR levels*. EUROSLA Monographs 1, 211–232](https://www.eurosla.org/monographs/EM01/211-232Milton.pdf) — vocabulary/proficiency correlations of .6–.8; Stæhr's .69/.83/.73; Meara & Milton XLex-to-CEFR table; Milton & Alexiou 60–70% of CEFR variance, with SDs showing heavy overlap.
- [Lam, Y. *Yes/no tests for foreign language placement at the post-secondary level*. CJAL/RCLA](https://files.eric.ed.gov/fulltext/EJ944127.pdf) — 200 items in 10 minutes; discriminates lower adjacent levels but not upper ones; ~30% false-alarm rates on pseudowords.
- [Gyllstad, Vilkaitė & Schmitt (2015). *Assessing vocabulary size through multiple-choice formats: issues with guessing and sampling rates*. ITL 166(2)](https://benjamins.com/catalog/itl.166.2.04gyl) — 4-option MCQ guessing inflation; recognition vs recall.
- [Beglar, D. (2010). *A Rasch-based validation of the Vocabulary Size Test*. Language Testing 27(1)](https://journals.sagepub.com/doi/10.1177/0265532209340194) and [VST specifications (Nation)](https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/vocabulary-tests/the-vocabulary-size-test/Vocabulary-Size-Test-information-and-specifications.pdf) — 10 items per 1,000-word band; Rasch reliability > .96 at 70–140 items.
- [Eckes, T. & Grotjahn, R. (2006). *A closer look at the construct validity of C-tests*. Language Testing 23(3)](https://journals.sagepub.com/doi/10.1191/0265532206lt330oa) — C-test as a highly reliable unidimensional measure loading with all four TestDaF sections.
- [Klein-Braley, C. (1997). *C-tests in the context of reduced redundancy testing: an appraisal*. Language Testing 14(1)](https://journals.sagepub.com/doi/abs/10.1177/026553229701400104) — C-test as the most economical of the reduced-redundancy family.
- [Shiotsu & Weir line of work, as synthesised in *The contribution of lexical breadth, lexical depth, and syntactic knowledge to L2 reading comprehension*](https://link.springer.com/article/10.1007/s42321-020-00065-z) — lexical breadth dominates at low/intermediate proficiency, syntactic knowledge at high.
- [Duolingo English Test — administration and scoring whitepaper](https://duolingo-papers.s3.us-east-1.amazonaws.com/reports/Duolingo_whitepaper_test_scoring_current.pdf) and [vocabulary whitepaper](https://duolingo-papers.s3.amazonaws.com/other/vocab_whitepaper_final.pdf) — five adaptive item formats; opening yes/no vocabulary block; item bank scale.
- [Cambridge English Placement Test FAQs](https://support.cambridgeenglish.org/hc/en-gb/articles/210044206-Cambridge-English-Placement-Test-CEPT-FAQs) — adaptive, ~30 min, Reading + Use of English + Listening, stopping on target precision of the ability estimate.
- [Oxford Online Placement Test](https://elt.oup.com/feature/global/oxford-online-placement/) — adaptive, Use of English + Listening, Pre-A1 to C2.
- [Ross, S. (1998). *Self-assessment in second language testing: a meta-analysis*. Language Testing 15(1)](https://journals.sagepub.com/doi/10.1177/026553229801500101) — 60 correlations, mean r = .63.
- [Li, M. & Zhang, X. (2021). *A meta-analysis of self-assessment and language performance*. Language Testing 38(2)](https://journals.sagepub.com/doi/abs/10.1177/0265532220932481) — 214 correlations, overall r = .466, with moderators.
- [Council of Europe — CEFR self-assessment grid](https://www.coe.int/en/web/portfolio/self-assessment-grid) and [CEFR Companion Volume (2020)](https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4) — free can-do statements; competence as an uneven profile.
- [Spray, J. & Reckase, M. (1996). *Comparison of SPRT and sequential Bayes procedures for classifying examinees*. JEBS 21(4)](https://journals.sagepub.com/doi/10.3102/10769986021004405) — SPRT needs fewer items than sequential Bayes at matched classification error.
- [Richland, Kornell & Kao (2009). *The pretesting effect: do unsuccessful retrieval attempts enhance learning?* JEP:Applied](https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf) — failed pre-test attempts improve later learning of the same material.
- [The Oxford 3000 by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf) · [The Oxford 5000 by CEFR level](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000_by_CEFR_level.pdf) — candidate reference lists for §8.1 (licence unverified).
