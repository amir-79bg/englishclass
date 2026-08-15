# نقشه‌ی فعالیت‌ها — the feature map

**Status:** report only. Nothing here is a recommendation. This document answers one question — *what learning activities does this app contain, and how do they group by skill?* — so that the method agent and the comparison agent argue over the same facts.

**Scope note.** I do not say whether independent tracks are a good idea. Where a fact obviously bears on that decision (a track that would be empty, a dependency that would break) I state the fact and the number, and stop.

Sources: `data/src/app.jsx` (2,648 lines), `data/src/template.html` (13,689 lines), and the seven data assets inside `لغتنامه (ورژن ۱۱).html`. Design intent read from `docs/ux-structure-plan.md`, `docs/methodology.md`, `docs/learning-path.md` — this map describes what is **in the source as shipped**, which in several places is ahead of those documents (the three-step «درس امروز», `vocab_sr_v1` and the per-word mode ladder are all implemented in `app.jsx` now, though both documents are still marked "decided, not implemented").

---

## 0. How every number here was measured

All content counts come from the bundle, not from the docs. Each one-liner below assumes this prelude, run from the repo root — it decodes the seven content assets into `W`:

```bash
PRE='const {readBundle,readAsset}=require("./tools/bundle.js"),vm=require("vm");
const b=readBundle(),s={window:{}};vm.createContext(s);
Object.values({V:"3350f0d9-3377-4f1f-8ad4-94ed2bec7ad7",G:"dca9788e-44f6-4c35-8178-a7a6297cb03f",
S:"34d1c5c1-b9f4-4615-8a79-553cb010b907",C:"456306af-9ddf-4578-8ecd-ae8659b7d079",
L1:"9a1062d3-94c3-4ade-abb6-b74ad47612ef",L2:"919e7d4d-7e19-450d-85f0-d7cfe6c243b4",
D:"0592dc99-726f-4190-aa79-f892c95cbf80"}).forEach(u=>vm.runInContext(readAsset(b,u),s));
const W=s.window;const LS=W.LISTEN_1.concat(W.LISTEN_2);const LV=["A1","A2","B1","B2","C1","C2"];'
```

| # | Claim | One-liner (after `PRE`) | Result |
|---|---|---|---|
| M1 | word entries | `node -e "$PRE console.log(W.VOCAB_WORDS.length)"` | **10,524** |
| M2 | every word has a gloss and an example | `node -e "$PRE const V=W.VOCAB_WORDS;console.log(V.filter(x=>x.fa).length,V.filter(x=>x.ex).length,V.filter(x=>x.exfa).length)"` | **10,524 / 10,524 / 10,524** |
| M3 | no word carries IPA or synonyms | `node -e "$PRE const V=W.VOCAB_WORDS;console.log(V.filter(x=>x.ipa).length,V.filter(x=>x.syn&&x.syn.length).length)"` | **0 / 0** |
| M4 | categories, and the smallest one | `node -e "$PRE const c={};W.VOCAB_WORDS.forEach(x=>c[x.cat]=(c[x.cat]||0)+1);const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);console.log(e.length,e[0],e[e.length-1])"` | **29**; `noun` **6,496** (61.7%); `weather` **14** |
| M5 | distinct example-sentence templates | `node -e "$PRE const t={};W.VOCAB_WORDS.forEach(w=>{const k=w.ex.toLowerCase().split(w.en.toLowerCase()).join('~');t[k]=(t[k]||0)+1});const e=Object.entries(t).sort((a,b)=>b[1]-a[1]);console.log(e.length,e.slice(0,20).reduce((a,c)=>a+c[1],0),W.VOCAB_WORDS.filter(w=>t[w.ex.toLowerCase().split(w.en.toLowerCase()).join('~')]<=20).length)"` | **36 templates**; top 20 cover **10,508 of 10,524**; only **16** words have a template shared by ≤20 words |
| M6 | words sharing a Persian gloss | `node -e "$PRE const f={};W.VOCAB_WORDS.forEach(w=>f[w.fa]=(f[w.fa]||0)+1);console.log(W.VOCAB_WORDS.filter(w=>f[w.fa]>1).length)"` | **1,194** (883 within the same category) |
| M7 | grammar lessons and drill questions | `node -e "$PRE let l=0,q={choose:0,fill:0,err:0,order:0};LV.forEach(L=>W.GRAM[L].forEach(x=>{l++;Object.keys(q).forEach(m=>q[m]+=(x[m]||[]).length)}));console.log(l,q)"` | **18 lessons**; choose **74**, fill **52**, err **34**, order **23** = **183** |
| M8 | grammar explanatory prose | `node -e "$PRE let r=0,p=0,e=0;LV.forEach(L=>W.GRAM[L].forEach(x=>{r+=(x.rules||[]).length;p+=(x.pit||[]).length;e+=(x.ex||[]).length}));console.log(r,p,e)"` | **80 rules · 43 pitfalls · 70 examples** |
| M9 | sentence-building stock | `node -e "$PRE let o={patterns:0,chunks:0,expand:0,steps:0,combine:0};LV.forEach(L=>{const D=W.SENT[L];o.patterns+=D.patterns.length;o.chunks+=D.chunks.length;o.expand+=D.expand.length;o.steps+=D.expand.reduce((a,c)=>a+c.steps.length,0);o.combine+=D.combine.length});console.log(o)"` | **18 patterns · 36 chunks · 18 expand (40 steps) · 24 combine** |
| M10 | pattern-lab slot combinations | `node -e "$PRE let n=0;LV.forEach(L=>W.SENT[L].patterns.forEach(p=>n+=p.slots.reduce((a,c)=>a*c.length,1)));console.log(n)"` | **674** |
| M11 | collocations | `node -e "$PRE console.log(W.COLLOC2.length,W.COLLOC2.reduce((a,g)=>a+g.items.length,0))"` | **22 groups · 349 phrases** |
| M12 | collocation groups keyed on a core verb | `node -e "$PRE const CV=['make','do','take','have','get','go','come','keep','put','set','give','bring'];console.log(W.COLLOC2.filter(g=>g.items.every(i=>CV.includes(i.en.split(' ')[0]))).length)"` | **9 of 22** |
| M13 | listening texts, lines, questions | `node -e "$PRE console.log(LS.length,LS.reduce((a,t)=>a+t.lines.length,0),LS.reduce((a,t)=>a+t.q.length,0))"` | **20 texts · 400 lines · 60 questions** |
| M14 | listening texts per level | `node -e "$PRE console.log(LV.map(L=>L+':'+LS.filter(t=>t.lv===L).length).join(' '))"` | A1 **4** · A2 **4** · B1 **4** · B2 **4** · C1 **2** · C2 **2** |
| M15 | total English words of listening audio | `node -e "$PRE console.log(LS.reduce((a,t)=>a+t.lines.reduce((x,l)=>x+l.en.split(/\s+/).length,0),0))"` | **2,999** ≈ 23 min at 130 wpm |
| M16 | discussion stock | `node -e "$PRE const D=W.DISC;console.log(D.sessions.length,Object.keys(D.methods).length,D.sessions.reduce((a,s)=>a+Object.values(s.ladder).reduce((x,q)=>x+q.length,0),0),D.sessions.reduce((a,s)=>a+s.phrases.length,0),D.sessions.reduce((a,s)=>a+s.check.length,0),D.sessions.reduce((a,s)=>a+s.target,0))"` | **24 sessions · 10 methods · 192 questions · 120 phrases · 72 self-checks · 3,270 s** |
| M17 | scored grammar drill keys | `node -e "$PRE let n=0;LV.forEach(L=>W.GRAM[L].forEach(x=>['choose','fill','err','order'].forEach(m=>{if((x[m]||[]).length)n++})));console.log(n)"` | **72** |
| M18 | word-list stages the app displays | `node -e "console.log(require('./data/stages.json'))"` | core **777** · periphery **1,866** · total **10,524** |

Behaviour claims are cited to `data/src/app.jsx` line numbers throughout and were read, not inferred.

---

## 1. The inventory — 34 activities

"Activity" here means *a distinct thing the learner does*, not a screen. The app has 20 `<sc-if>` screen blocks (`grep -o 'sc-if value="{{ is[A-Za-z]*' data/src/template.html | sort -u`) and 11 runner screens (`RUNNERS`, `app.jsx:54`), but several runners host more than one task: `study` hosts four different tasks selected per word, `csrun` hosts nine drills across two curricula, `sbrun` hosts six.

Columns: **does** = the physical action; **trains** = the standard term; **stock** = authored content backing it; **state** = what progress survives the session.

### واژه‌ها — the word section

| # | Activity | Learner does | Trains | Stock | State kept |
|---|---|---|---|---|---|
| 1 | **کارت واژه** `flash` (`app.jsx:542–550`) | reads the word, hears TTS, flips, self-rates | introduction — **scores nothing** (`advance`, `:607`) | 10,524 | advances `pos` only |
| 2 | **چهارگزینه‌ای** `mcq` | picks the Persian gloss from 4 | receptive vocabulary | 10,524 | `vocab_sr_v1` mask bit 1 |
| 3 | **شنیداری** `listen` | hears TTS only, **types** the English | productive vocabulary + form-from-sound (dictation) | 10,524 | mask bit 4 |
| 4 | **نوشتاری** `type` | reads the Persian, types the English | productive vocabulary (spelling) | 10,524 | mask bit 2 |
| 5 | **در جمله** `cloze` | picks the word that fills a blank | receptive vocabulary in context | 10,524 nominal / **16 usable** (M5) | — **unreachable**: `modeFor` (`:542`) returns only flash/mcq/listen/type; `cloze` is advertised in `MODES` (`:8`) and named in the round-end copy (`:2280`) but no code path selects it |
| 6 | **جمله‌ی من** (`checkMy`, `:410`; `gradeSentence`, `:368`) | types an original sentence using the current word, offline grader replies | **writing** | 0 authored; grader = 5 structural checks + 9 pitfall regexes | `vocab_mysent[en]` — last sentence, verdict, score |
| 7 | **آزمون دوره** (`startQuiz`, `:641`) | 20 MCQs, alternating EN→FA / FA→EN, fires every 300 positions | receptive + receptive-recall vocabulary | drawn from the last 300 dealt | `vocab_app_v1.quizzes['round:mile']` = best % |
| 8 | **فهرست واژه‌ها** (`browse`) | searches, hears, stars, edits a gloss, re-categorises | reference, not a drill | 10,524 / 29 categories | `starred`, `vocab_overrides`, `vocab_catover` |
| 9 | **افزودن واژه** (`addWord`, `:420`) | types a new word + gloss + example | own-content authoring | user-supplied | `vocab_custom` |
| 10 | **تمرین دسته · گفتن** (`startEx('speak')`, `:687`) | says the word aloud; `SpeechRecognition` judges, else records 4 s and the learner self-rates | pronunciation (weakly) | 8 items drawn from one category; every one of 29 categories qualifies (min 14 ≥ the 4-word floor, M4) | **none** — XP only (`addXp`, `:729`) |
| 11 | **تمرین دسته · شنیدن** | hears the word, picks the Persian from 4 | receptive vocabulary through audio | same pool | none |
| 12 | **تمرین دسته · نوشتن** | fills the word's blank in its own example sentence, or types EN from FA | productive vocabulary (spelling) | same pool; prompt quality bounded by **36 templates** (M5) | none |
| 13 | **بازی جفت‌سازی** (`startGame`, `:786`) | matches 6 EN tiles to 6 FA tiles against 3 lives, timed bonus | fluency over known form–meaning pairs | 10,524 pool, 6 pairs per board | `vocab_game.best` + `xp` |

### ساختار — the structure section

| # | Activity | Learner does | Trains | Stock | State kept |
|---|---|---|---|---|---|
| 14 | **آزمایشگاه الگو** `pattern` (`:1228`) | swaps options in 2–4 slots and hears the sentence | grammar knowledge (exploration) | 18 patterns → **674** distinct sentences (M10) | **none** — no `sbMark` call in the pattern branch |
| 15 | **چیدن بلوک‌ها** `chunk` (`:1032`) | taps chunks into the right order from a Persian prompt | grammar production (word order) | 36 items | `vocab_sent.s['<lv>_chunk']` = best % |
| 16 | **گسترش جمله** `expand` (`:1047`) | picks the correct expansion at each step of a growing sentence | grammar knowledge | 18 items / **40 steps** | `..._expand` |
| 17 | **ترکیب جمله‌ها** `combine` (`:1064`) | **types** one sentence combining 2–3 short ones | writing (sentence combining) | 24 items, each with model `answers[]` | `..._combine` |
| 18 | **جمله‌ی خودت** `free` (`:1098`) | **types** a free sentence to a pattern prompt; heuristic grader | writing | 18 prompts (recycles the 18 patterns via `sbFreeTask`, `:1122`) | `..._free` = heuristic score |
| 19 | **بازی مسابقه‌ی جمله** (`sbGameStart`, `:1133`) | chunk ordering, 30 s per sentence, 3 lives | grammar production, speeded | cumulative chunk pool ≤ 36 | `vocab_sent.gameBest` |
| 20 | **درس دستور زبان** (`glesson`) | reads `why` + rules + examples + pitfalls | grammar knowledge (the only explanatory prose in the app) | 18 lessons · **80 rules · 43 pitfalls · 70 examples** (M8) | none (only its drills score) |
| 21 | **گرامر · چهارگزینه‌ای** | picks the right form from 4 | grammar knowledge | **74** | `vocab_course.s['g_<id>_choose']` |
| 22 | **گرامر · جای خالی** | **types** the inflected form | grammar production | **52** | `..._fill` |
| 23 | **گرامر · پیدا کردن غلط** | **types** the corrected sentence | grammar production | **34** | `..._err` |
| 24 | **گرامر · مرتب‌کردن جمله** | orders chunks from a Persian prompt | grammar production | **23** | `..._order` |
| 25 | **بازی دستور زبان** (`gramGame`, `:1525`) | `choose` items against a 45 s clock | grammar knowledge, speeded | ≤ 74 cumulative | `vocab_course.b['g_game_<lv>']` |
| 26 | **ترکیب · کدام کلمه** (`cVerbDrill(g,false)`) | picks the verb/opener that collocates | vocabulary (chunk knowledge) | 349 phrases, 10 per run | `vocab_course.s['c_<key>_choose']` |
| 27 | **ترکیب · تایپ کن** (`cVerbDrill(g,true)`) | **types** the missing verb | productive vocabulary | 349 | `..._fill` |
| 28 | **ترکیب · معنی را بشناس** (`cMeaningDrill`) | EN chunk → pick the Persian | receptive vocabulary | 349 | `..._mean` |
| 29 | **ترکیب · از فارسی بساز** (`cProduceDrill`) | Persian → **type** the whole English chunk | productive vocabulary | 349, 8 per run | `..._prod` |
| 30 | **بازی ترکیب‌ها** (`cGame`) | 60 collocation items against a clock | vocabulary, speeded | 60 of 349 per run | `vocab_course.b['c_game']` |

### شنیدن و گفتن — the listening/speaking section

| # | Activity | Learner does | Trains | Stock | State kept |
|---|---|---|---|---|---|
| 31 | **متن شنیداری** (`ltext`) | plays lines or the whole text at 0.6/0.9/1.15×, reads the Persian line-by-line (`lsShowFa` defaults **on**, `:1911`) | listening comprehension **and** reading — the translation is on screen by default | 20 texts · 400 lines · **2,999 EN words** ≈ 23 min | `vocab_listen.r[id]` = "opened", written on entry (`:1793`), not on completion |
| 32 | **بازگویی / ضبط** (`lsRecToggle`, `:1840`) | records themselves shadowing, plays it back | pronunciation / fluency, **self-assessed** | the same 400 lines | **none** — the blob URL dies with the screen |
| 33 | **آزمون درک مطلب** (`lsStartQuiz`, `:1856`) | 3 MCQs per text, question and options in English | comprehension (see §4.3) | **60 questions total**, 3 per text | `vocab_listen.q[id]` = best % |
| 34 | **گفت‌وگوی آزاد** (`dses`) | 30 s prep, then speaks 60–210 s to a 3-tier question ladder, may record, ticks a self-check list | speaking fluency | **24 sessions · 10 methods · 192 questions · 120 phrases · 72 self-checks · 3,270 s** of target speech | `vocab_disc.s[id]` = `{n, best-checks-ticked, longest-seconds}` + cumulative `total` seconds |

Plus one meta-activity: **«درس امروز»** (`LESSON_STEPS`, `:42`; `planToday`, `:194`) — the daily three-step lesson that picks one item each from واژه‌ها, ساختار and شنیدن و گفتن and stores its choice in `vocab_ui_v1.plan`. It is not a track; it is the current answer to the question the split would re-open.

---

## 2. Content stock, ranked

Every distinct authored item in the app, biggest first:

| Content | Items | Asset |
|---|---:|---|
| Word entries (each with `fa` + `ex` + `exfa`) | **10,524** | `VOCAB_WORDS` |
| Collocation phrases | **349** | `COLLOC2` |
| Discussion prompt questions | **192** | `DISC` |
| Grammar drill questions | **183** | `GRAM` |
| Discussion model phrases | **120** | `DISC` |
| Grammar rules / pitfalls / examples | **80 / 43 / 70** | `GRAM` |
| Sentence-building items (patterns + chunks + expand + combine) | **96** (18+36+18+24) | `SENT` |
| Discussion self-check statements | **72** | `DISC` |
| Listening comprehension questions | **60** | `LISTEN_*` |
| Discussion sessions | **24** | `DISC` |
| Listening texts (400 lines) | **20** | `LISTEN_*` |
| Grammar lessons | **18** | `GRAM` |
| Distinct example-sentence templates behind all 10,524 examples | **36** | `VOCAB_WORDS` |
| IPA transcriptions | **0** | — |

The ratio that governs everything below: **10,524 words against 1,268 authored items in the other six curricula combined** — a factor of **8.3**, and a factor of **57** against the 183 grammar questions, **175** against the 60 listening questions, **439** against the 24 discussion sessions.

---

## 3. Progress state — what could carry an independent path

| Key | Shape | Slots today | Can it schedule an item? |
|---|---|---:|---|
| `vocab_sr_v1` (`:250–311`) | `{wordIndex: [successes, firstDay, lastDay, modeMask]}`; due when `today - lastDay >= [0,1,3,7,21,60][successes]` | up to **10,524** | **Yes — the only per-item schedule in the app.** It also drives the per-word task ladder (`modeFor`, `:542`) and the «بلد» criterion (`srKnown`, `:283`: 3 successes, 3 days, ≥1 production mode, ≥7 days span) |
| `vocab_course.s` | best % per `g_<lesson>_<mode>` and `c_<group>_<drill>` | **72** grammar (M17) + **88** collocation | No — a high-water score, no dates |
| `vocab_sent.s` | best % per `<lv>_<mode>` for chunk/expand/combine/free | **24** (`pattern` never writes) | No |
| `vocab_listen` | `.r[id]` opened flag, `.q[id]` best % | **20 + 20** | No |
| `vocab_disc.s` | `{n, best, secs}` per session | **24** | No |
| `vocab_game`, `vocab_sent.gameBest`, `vocab_course.b` | high scores + XP | **~5** | No |
| `vocab_mysent` | last sentence + verdict per word | up to 10,524 | No — no date, no repetition |
| `vocab_ui_v1` | `seen`, `last`, `lv`, `day`, `plan` | 1 | It is the daily-lesson bookkeeping, not per-item |

**The asymmetry is total: 10,524 scheduled items on one side, 248 high-water marks on the other.** One track already has a spaced-repetition engine; the other five have a report card. Any independent path for grammar, writing, listening or speaking would need per-item state that does not exist today — not as a nicety, as a precondition.

Second-order fact: `dcFinish` (`:2069`) records only *how many boxes the learner ticked* and *how many seconds they spoke*. Nothing in the speaking activity produces a correctness signal at all. Same for #32 (shadow recording) and #10 when speech recognition fails, which `app.jsx:749–753` documents as the **default** outcome offline.

---

## 4. Dependency — can a learner do this on day one?

The word list was re-ordered by `tools/reorder.js` so the words taught first are the ones the app's own other curricula use. I measured how well that holds, per curriculum, by tokenising each asset, dropping function words, lemmatising crudely, and looking each type up in `VOCAB_ORDER`:

| Curriculum | Distinct content words | In the word list at all | In the first **777** (`stages.core`) | In the first **1,866** (`periphery`) |
|---|---:|---:|---:|---:|
| `SENT` A1 chunks | 20 | 20 (100%) | **19 (95%)** | 20 (100%) |
| `SENT` A1 (all modes) | 70 | 69 (99%) | **65 (93%)** | 69 (99%) |
| `SENT` all levels | 399 | 374 (94%) | 304 (76%) | 369 (92%) |
| `GRAM` A1 | 142 | 127 (89%) | **102 (72%)** | 126 (89%) |
| `GRAM` all levels | 570 | 504 (88%) | 369 (65%) | 496 (87%) |
| `DISC` A1 questions | 59 | 57 (97%) | **47 (80%)** | 57 (97%) |
| `DISC` all levels | 428 | 396 (93%) | 250 (58%) | 390 (91%) |
| `LISTEN` A1 lines | 207 | 203 (98%) | **160 (77%)** | 199 (96%) |
| `LISTEN` all levels | 1,046 | 966 (92%) | 503 (48%) | 947 (91%) |
| `LISTEN` quiz Q+options | 443 | 413 (93%) | 285 (64%) | 409 (92%) |
| `COLLOC2` phrases | 388 | 349 (90%) | 193 (**50%**) | 343 (88%) |

(one-liner: the script form of this table is `docs`-external; it tokenises `W.<ASSET>`, strips a 60-word stoplist, and tests membership in `W.VOCAB_ORDER.slice(0,N)`.)

Reading:

- **At A1 the dependency is satisfied.** 93–95% of the A1 sentence-building vocabulary and 72–80% of A1 grammar/discussion vocabulary is inside the first 777 words. A learner starting today can do step 2 and step 3 of day one.
- **Above A1 it degrades fast.** Across all levels only 48% of listening vocabulary and 50% of collocation vocabulary is in the core 777. The two skill curricula out-run the word spine by level 3.
- **Collocations are the weakest link and the most interesting one**: 90% of their tokens are somewhere in the list, but only half in the core. `methodology.md` §6 proposes hanging each group off its core verb reaching «بلد»; measured, all 12 `CORE_VERBS` are present in the list, and 9 of 22 groups are built on one (M12).
- The reverse dependency is the real one: **every non-vocabulary activity is a use of words; no activity is a use of grammar or of listening.** Nothing in the app reads `vocab_course` or `vocab_listen` to decide what to show — only `planToday` (`:194`) reads them, and only to pick today's single item.

---

## 5. Candidate tracks

Grouping by the skill each activity trains, not by the section it lives in. Sizes are distinct authored items; an activity appearing in two tracks is marked and argued in §6.

### Track V — Vocabulary · **10,524 + 349 = 10,873 items**

Activities 1, 2, 3, 4, 5†, 7, 8, 9, 11, 12, 13, and (contested) 26–30.

The whole of the word course, the milestone quiz, the word list, the matching game, two of the three category drills, and — on my reading — all five collocation drills. Backed by 10,524 entries, all glossed, all with an example; **plus** 349 multi-word lexical items. The only track with a per-item schedule, a completion criterion («بلد») and a stated size.

### Track G — Grammar · **183 drill questions + 18 lessons (80 rules, 43 pitfalls, 70 examples) + 72 sentence-building items**

Activities 14, 15, 16, 19, 20, 21, 22, 23, 24, 25.

If the non-typed sentence-building modes come here (pattern 18 · chunk 36 · expand 18) the track holds **255 drill items across 72 scored keys**. It is the only track with explanatory prose, and it is the only place a Persian-speaker's specific errors are named (43 pitfalls).

### Track W — Writing · **42 authored prompts**

Activities 6, 17, 18, and arguably 12 and 23.

24 sentence-combining items (with model answers) and 18 free-writing prompts. Plus «جمله‌ی من», which has **10,524 possible prompts and 0 authored content**: it is a grader, not a curriculum — 5 structural checks and 9 regexes (`gradeSentence`, `:368–409`). This is the thinnest track and the number matters: see §7.

### Track L — Listening · **20 texts · 400 lines · 2,999 words (~23 min) · 60 questions**

Activities 31, 33, and (contested) 3 and 11.

Everything is synthesised at runtime by `speechSynthesis` — no audio ships. If the word course's `listen` mode joins this track it also gains **10,524 dictation items**, which would make it the second-largest track in the app; without it, it is the second-smallest.

### Track S — Speaking · **24 sessions · 192 questions · 120 phrases · 72 checks · 3,270 s**

Activities 34, 32, 10.

54.5 minutes of target speaking time in total across six levels. No automatic assessment anywhere in the track (§3). Activity 10 is the only one that tries, and its own code comments record that it fails offline by default.

### Track P — Pronunciation · **0 items**

Nothing is authored for it. **0 of 10,524 words carry `ipa`** (M3), and the README confirms nothing renders it. What exists is TTS playback attached to other activities (`speakWord`, `:558`, called from 20+ sites) and two recorders that store nothing. Pronunciation is a *feature of* every track and the content of none.

### Track C — Chunks/collocations · **349 phrases in 22 groups**

Activities 26–30. Listed separately only because §6 has to argue about it; my position is that it is part of Track V.

---

## 6. The seams — activities that genuinely straddle two tracks

An honest map says where the cuts hurt. These are the five the brief names, plus three it does not, each with a position and the measurement behind it.

### 6.1 Collocations — vocabulary or grammar?

**Position: vocabulary.** Three reasons, all measurable.

1. **The drill shapes are the word course's drill shapes.** `cMeaningDrill` is EN→FA four-option (identical in kind to activity 2); `cProduceDrill` is FA→EN typed (identical to activity 4). Two of the four drills do not test a pattern at all — they test whether you know what a phrase means and can produce it.
2. **13 of 22 groups are not verb-frame groups at all** (M12): `opinion`, `agree`, `emotion_pos`, `emotion_neg`, `smalltalk`, `help`, `sorry_thanks`, `promise`, `work`, `edu`, `meeting`, `business`, `ielts_ac` are topic/function phrase-books — formulaic sequences, i.e. lexis. The code itself distinguishes them: `isVerbGroup` (`:1667`) switches the drill label from «فعل» to «کلمه» exactly because most groups are not asking about a verb.
3. **The only 9 groups with a genuine grammatical claim** (make/do/take/have/get/go/come/keep/put_set = 171 of 349 items) still resolve to *which* word, not *what rule*: there is no rule that predicts `make a decision` over `do a decision`.

**What makes it genuinely ambiguous, and I will not pretend otherwise:** the section is called ساختار, it shares a runner (`csrun`) and a storage key (`vocab_course`) with grammar, and `docs/ux-structure-plan.md` §"three sections" put it there deliberately because all three answer "how do words combine?". A vocabulary track that absorbs it inherits 349 items **with no level axis** — `COLLOC2` has no `lv` field, which `learning-path.md` §10 already flags as a fact about the content that cannot be designed away.

### 6.2 Sentence building — grammar or writing?

**Position: it is two activities wearing one name, and the seam runs through the middle of the section.** Measured by input modality:

| Mode | Input | Track | Items |
|---|---|---|---:|
| `pattern` | tap slot options | grammar (exploration) | 18 → 674 sentences |
| `chunk` | tap chunks into order | grammar production | 36 |
| `expand` | pick 1 of 2–3 | grammar knowledge | 18 / 40 steps |
| `game` | tap chunks, timed | grammar production | ≤36 |
| **`combine`** | **free text** | **writing** | **24** |
| **`free`** | **free text** | **writing** | **18 prompts** |

**72 items on the grammar side, 42 on the writing side**, and the split is not a judgement call: `combine` and `free` are the only two modes that call a free-text grader, and `free` calls the *same* `gradeSentence` that «جمله‌ی من» in the word course calls (`sbFreeCheck`, `:1103`). Splitting the app by skill therefore splits «جمله‌سازی» itself — the section would appear in two tracks or lose half its ladder. That is the single most disruptive seam in the app.

### 6.3 The listening comprehension quiz — listening, or something else?

**Position: it is a reading-comprehension check on a bilingual transcript, and calling it listening is not supported by the code.** Three findings:

1. **Nothing requires audio.** `lsStartQuiz` (`:1856`) is reachable from the text page the moment it opens; the only precondition is `t.q.length`. The learner can open a text and take its quiz having never pressed play.
2. **The Persian translation is on screen by default.** `out.ltShowFa = s.lsShowFa !== false` (`:1911`), and `openText` (`:1793`) does not set `lsShowFa`, so it is `undefined` → shown. Every English line sits above its Persian translation while the quiz is taken.
3. **The questions test content, not words.** Sample: `{"q":"What time does the speaker wake up?","opts":["At five","At six","At seven","At eight"],"a":1}`. That is comprehension, in English, of a text the learner can still see.

So it is neither "listening" nor "vocabulary tested through audio" — it is comprehension of a visible bilingual text. **60 questions total**, 3 per text; `learning-path.md` §10 already calls three questions "a formality, not a checkpoint", and `levelStatus` in §7 of that document nonetheless proposes leaning a quarter of level completion on it.

### 6.4 The word course's `listen` and `type` modes — vocabulary, or listening and writing?

**Position: vocabulary, and moving them breaks the app's definition of «بلد».** `srKnown` (`:283`) requires `(mask & 6) !== 0` — bit 2 is `type`, bit 4 is `listen`. **A word cannot be counted as known unless it passed in one of these two modes.** They are not adjunct skills practice; they are the productive half of the vocabulary criterion, and stages 2 and 3 of a four-stage ladder that runs 0 flash → 1 mcq → 2 listen → 3 type.

**What makes it genuinely ambiguous:** by item count they are also, by a wide margin, the largest listening activity and the largest writing-mechanics activity in the app — **10,524 dictation items and 10,524 spelling items**, against 20 listening texts and 42 writing prompts. A listening track built without them holds 20 texts; a listening track built with them holds 10,544 items and is 99.8% vocabulary. Both framings are defensible and they differ by a factor of 500. This is the seam where the arithmetic of a track split is most sensitive to a naming decision.

### 6.5 Free discussion — speaking, or a production test of everything else?

**Position: speaking, but it is a rehearsal room, not a test — because it measures nothing.** `dcFinish` (`:2069`) writes `{n, best: checks-ticked, secs}` and nothing else. There is no transcript, no scoring, no comparison against the 120 model phrases, and the recording is a Blob URL discarded on unmount. The 72 self-check statements are the entire assessment apparatus, and the learner ticks them.

It *is* the only place the app asks for unscripted output, and its prompts are structured (192 questions in a 3-tier ladder, 10 named methods). But an activity that cannot tell whether the learner said anything correct cannot function as the terminal test of the other tracks, whatever the design intends. Call it the speaking track's only activity; do not call it an assessment.

### 6.6 Three more seams the brief did not name

- **«جمله‌ی من» lives inside the word runner** (activity 6). It is the app's only writing task attached to all 10,524 words, and it is rendered inside the flashcard screen after an answer (`showMyBlock`, `:2527`). A writing track that claims it takes writing's largest surface out of the vocabulary flow; a vocabulary track that keeps it leaves the writing track at 42 items.
- **The category «نوشتن» drill** (activity 12) blanks the word out of its own example sentence — the same task as the benched `cloze` mode, and bounded by the same **36 templates**, of which the top 20 cover 10,508 words. It is spelling practice presented as sentence work.
- **Three separate matching/speed games** (activities 13, 19, 25, 30) sit in three different tracks with three separate high scores (`vocab_game.best`, `vocab_sent.gameBest`, `vocab_course.b`). They are the same interaction over different content. `ux-structure-plan.md` §"One thing I would argue for separately" already flags this; the track question raises it again, because a per-track split would place four near-identical games in four places.

---

## 7. What a track-based structure would leave thin or empty

Stated as numbers, per the brief. Take each candidate track and ask what it holds *if the contested activities go the other way* — the pessimistic case — and what it holds at its most generous.

| Track | Minimum (contested items excluded) | Maximum (contested items included) | Days of content at 1 activity/day |
|---|---|---|---|
| **Vocabulary** | 10,524 words | 10,873 (+349 collocations) | effectively unbounded — 1,503 days at 7 new words/day |
| **Grammar** | 183 drill questions in 72 scored keys, 18 lessons | 255 items (+72 sentence-building) | **72 days**, then repetition only |
| **Listening** | 20 texts · 400 lines · 60 questions · ~23 min audio | +10,524 dictation items | **20 days** at one text/day; **6 questions total** at C1 and at C2 |
| **Speaking** | 24 sessions · 3,270 s (54.5 min) | +400 shadow lines, +10,524 speak drills | **24 days**; 4 sessions per level |
| **Writing** | **42 authored prompts** (24 combine + 18 free) | +10,524 «جمله‌ی من» prompts with 0 authored content | **12 days** — 2 writing modes × 6 levels = **12 distinct exercise sessions** in the entire app (2 of the 4 scored `vocab_sent` modes are writing → 12 of 24 keys) |
| **Pronunciation** | **0 items, 0 IPA, 0 stored results** | 0 | **0** |

**The three facts that the decision turns on:**

1. **Writing as an independent track is 42 authored items and 12 progress keys.** 24 sentence-combining exercises and 18 free-writing prompts, evenly split 4 and 3 per level — that is **7 writing exercises per CEFR level, for the whole level**. Everything else that looks like writing (activity 6, and activity 12) has no authored content: it is one 41-line offline grader (`gradeSentence`, `:368–409`) consisting of 5 structural checks and 9 regexes, which by its own construction "cannot fail a serious attempt and cannot pass a bad one reliably" (`learning-path.md` §11). A writing track would be a grader in search of a curriculum.

2. **Pronunciation as an independent track is empty.** 0 IPA fields on 10,524 words (M3), 0 stored results from either recorder, and the one activity that attempts assessment (#10) falls back to record-and-self-rate because `SpeechRecognition` needs a network the app deliberately does not use (`app.jsx:749–753`). There is nothing to put on the screen except TTS buttons that already exist inside other activities.

3. **Listening and speaking run out in three weeks each.** 20 texts and 24 sessions, against a design (`learning-path.md` §7) that puts a CEFR level at ~20 sessions. Per level that is **4 texts and 4 sessions — 2 texts at C1 and C2** (M14), i.e. **6 comprehension questions in the entire C1 level**. `learning-path.md` §10 already measured this and called 24 more texts "the single highest-value content commission in the app"; independent tracks would make each of those shortfalls a track's entire content rather than one step of a mixed day.

And the counterweight, stated with the same neutrality: **the vocabulary track is 8.3× the size of all six other curricula combined and holds the only per-item schedule.** Whatever structure is chosen, five of the six tracks are the size of a chapter and one is the size of a dictionary.

---

## 8. Facts a reader of this map should carry away

1. **34 activities, 20 screens, 11 runners, 7 data assets, 6 candidate tracks.**
2. **One activity is unreachable**: `cloze` is advertised in `MODES` and named in the round-end copy, but `modeFor` never returns it (§1, activity 5).
3. **One activity scores nothing by design** (`flash`) and **five score nothing by omission** (10, 11, 12, 14, 32).
4. **Only vocabulary has a schedule.** 10,524 scheduled slots vs 248 high-water marks everywhere else.
5. **Nothing in the app is gated on anything.** `planToday` recommends; no runner checks a prerequisite. A track split changes what is *offered*, not what is *permitted*, because nothing is currently forbidden.
6. **The three-section cut that exists was made by what the learner does** (`app.jsx:55–61`), and it cross-cuts skill in exactly three places: collocations (lexis filed under structure), the typed sentence-building modes (writing filed under structure), and the word course's listen/type modes (dictation and spelling filed under vocabulary). Those three are the whole of the disagreement between the current structure and a skill-based one.
