# Openly-licensed English→Persian dictionary data

Everything below was measured from files downloaded to the scratchpad on 2026-08-10, not read off
project descriptions. Sample paths are at the bottom.

---

## The recommendation

| Field | Source | Coverage |
|---|---|---|
| `fa` (Persian gloss) | **English Wiktionary translation tables** (via wiktextract/kaikki), filled in by **Persian WordNet** (OMW) where Wiktionary is silent | 10,109 new headwords |
| `ipa` | English Wiktionary `sounds` | 84.2% of the existing 10,524; 79% of the new ones |
| `syn` | English Wiktionary sense- and entry-level `synonyms` | 60.9% of existing; 60% of new |
| `ex` (English example) | English Wiktionary sense `examples` | 79.2% of existing; 75% of new — but only ~20% are usable as written |
| `exfa` (Persian example) | **Nothing.** Tatoeba covers 9% of new headwords and nothing else open exists | 91% gap |

**Shape:** 10,524 existing + 10,109 new = **20,633 entries**, 3.82 MB raw (194 B/entry),
1.57 MB as a gzip+base64 bundle asset → **projected HTML file 6.73 MB** (today: 5.60 MB).
Well inside the 12 MB ceiling. Size is not the binding constraint here — data availability is.

**Licence obligations, one sentence each:**

- *English Wiktionary / wiktextract* — content is **CC BY-SA 4.0** (dual-licensed GFDL) under the
  Wikimedia Terms of Use, so the app must carry a visible credit to "English Wiktionary contributors"
  with a link to the CC BY-SA 4.0 deed, and **the word data as shipped becomes CC BY-SA 4.0 itself** —
  the owner must be willing to license the vocabulary file share-alike.
- *Persian WordNet (OMW `fas`)* — released by its author Mortaza Montazery with the written grant
  "It's free and you can use it everywhere you want"; a credit line naming Persian WordNet
  (`pwn.ir`) and its author discharges it, but see the risk note — this is a permission email, not a
  standard licence.
- *Princeton WordNet 3.0* (used only to map lemmas to synsets, nothing from it is shipped) —
  WordNet 3.0 licence, permissive, requires the copyright notice be reproduced if any of it ships.
- *Tatoeba* (optional, for `ex`/`exfa` pairs) — **CC BY 2.0 FR**, requires crediting Tatoeba and its
  contributors; attribution only, no share-alike.

CC BY-SA is the real cost here. If the owner will not share-alike the word data, the Wiktionary
half of this plan is unusable and only Persian WordNet remains — which halves the yield and
roughly triples the error rate.

---

## Candidates examined

| Source | Licence | Entries measured | Covers our list | ex | syn | IPA | Verdict |
|---|---|---|---|---|---|---|---|
| **English Wiktionary via kaikki/wiktextract** | CC BY-SA 4.0 + GFDL | 1,487,641 lines / 311,693 useful headwords; **13,837 with a Persian translation** | 100% present as entries; **29.8%** get a Persian gloss; 84.2% IPA; 60.9% syn; 79.2% English example | yes (English only) | yes | yes | **Take.** The only substantial open en→fa lexical source. |
| **Persian WordNet (OMW `fas`)** | "Free to use" grant from the author | 30,461 lemma rows over 17,760 synsets | **44.3%** of our headwords get a Persian gloss (21.7% of the top-50k words we don't yet have) | no | via English WordNet | no | **Take, filtered.** Fills exactly the everyday words Wiktionary misses, but auto-built and noisy. |
| **Tatoeba** (`eng-pes`) | CC BY 2.0 FR | 8,449 usable English+Persian sentence pairs (2,033,133 English and 31,774 Persian sentences, joined through `eng-pes_links`) | 37.7% of existing headwords appear in some pair; **9.0%** of new ones | **yes, with Persian** | no | no | **Take for what it covers.** The only open source of `exfa` at all. |
| **Princeton WordNet 3.0** | WordNet 3.0 licence (permissive) | 206,941 sense keys | 72.4% of our headwords are in WordNet | no | yes | no | Take as glue (lemma→synset) and as a synonym fallback. |
| **FreeDict** | GPL / CC BY-SA per dictionary | 306 dictionaries in the catalogue | — | — | — | — | **Does not exist.** `freedict-database.json` lists no `eng-pes`/`eng-fas` pair at all. The brief's suggestion is a dead end. |
| **DBnary** | CC BY-SA 3.0 | 27 Wiktionary editions | — | — | — | — | **No Persian edition.** Excluded. |
| **kaikki non-English Wiktionary editions** | CC BY-SA 4.0 | 20 editions (cs, de, el, es, fr, id, it, ja, ko, ku, ms, nl, pl, pt, ru, simple, th, tr, vi, zh) | — | — | — | — | **No `fawiktionary`.** Excluded. |
| **PanLex** | **CC BY-NC-SA 4.0** (panlex.org/license) | not downloaded | — | — | — | — | **Excluded — NonCommercial.** It was CC0 historically; it is not now. |
| **Wikidata lexemes** (en↔fa via shared senses) | CC0 | **760** English forms with a Persian sense counterpart (SPARQL count) | negligible | no | no | no | Too small to matter. |
| **MUSE / Facebook bilingual dictionaries** | CC BY-NC | — | — | — | — | — | **Excluded — NonCommercial.** |
| **Apertium `eng-fas`** | GPL | — | — | — | — | — | **Does not exist** (404 on the Apertium org). |
| **OPUS parallel corpora** (OpenSubtitles 61.5M pairs, CCMatrix 24.6M, MIZAN 1.0M, TED2020 305k) | varies; OpenSubtitles legally murky, TED CC BY-NC-ND, CCMatrix CC BY-SA | huge | — | sentence pairs only, no headword index | no | no | Not a dictionary. CCMatrix (CC BY-SA) is the only cleanly-licensed one and its sentences are encyclopedic, not learner-level. Fallback for `exfa` only if Tatoeba's 9% is judged too thin. |
| **Aryanpour and derivatives, commercial app DBs, scraped MT output** | copyrighted | — | — | — | — | — | **Out.** Not evaluated. |

---

## Overlap with the existing 10,524 entries

Asked directly: **how much do the recommended sources duplicate what we already have?**

- Wiktionary has an entry for **all 10,524** of our headwords, but a Persian translation for only
  **3,138 (29.8%)**.
- Of the 13,837 English headwords Wiktionary can gloss into Persian, **3,309 are already in our list**
  and **10,528 are new**.
- Persian WordNet can gloss **4,660 (44.3%)** of our existing headwords.
- The merged new-word pool after dropping proper nouns, non-Latin headwords and 4+ word phrases is
  **26,279** headwords; restricted to the top-50k frequency band and with WordNet-only multiword
  lemmas dropped it is **10,109**.

Practical consequence: the overlapping 3,309 + 4,660 must **merge, not append**. Matching has to be
case-insensitive — our list mixes case (`Tangy`, `Whisk`, `Summit` alongside `journey`) while both
sources are lowercase-headword. There are no duplicate `en` values in the current file (10,524
unique, case-insensitively), so a single lowercase key is a safe join.

The existing entries already have `fa`, so the sources' value for them is **`ipa` (8,856 entries
gain one) and `syn` (6,154 gain one)** — not glosses. Where Wiktionary *does* have a Persian gloss
for one of our words it is worth handing to the `auditor` as a cross-check, not an overwrite.

---

## Sample rows from the recommended sources

Clean ones:

```
{"en":"grief","fa":["غم","سوگ"],"ipa":"/ɡɹiːf/","syn":["difficulty","trouble","anguish"],
 "ex":"The neighbour's teenagers give me grief every time they see me."}
{"en":"sneeze","fa":["عطسه کردن","عطسه"],"ipa":"/sniːz/","syn":["sternutate"],
 "ex":"To avoid passing on your illness, you should sneeze into your sleeve."}
{"en":"trigonometry","fa":["مثلثات"],"ipa":"/ˌtɹɪɡəˈnɒmətɹi/","syn":["trig"],
 "ex":"Historically, trigonometry has been applied in areas such as geodesy, surveying …"}
{"en":"rhombus","fa":["لوزی"],"ipa":"/ˈɹɑːmbəs/","syn":["diamond","rhomb"]}
{"en":"deceive","fa":["فریب دادن","فریفتن"],"ipa":"/dɪˈsiːv/","syn":["abuse","counterfeit"]}
{"en":"avenge","fa":["انتقام گرفتن"],"ipa":"/əˈvɛnd͡ʒ/","ex":"to avenge the murder of his brother"}
landlord   (Persian WordNet)  مالک / صاحب‌خانه / موجر
budget     (Persian WordNet)  بودجه
sunset     (Persian WordNet)  غروب / مغرب
globe artichoke (Persian WordNet) کنگر فرنگی
```

Messy ones, quoted exactly as the data has them:

```
{"en":"synonym","fa":["هممعنی","مترادف"]}          ← ZWNJ stripped: should be هم‌معنی
{"en":"pacifist","fa":["صلحجو","صلحطلب"]}          ← should be صلح‌جو / صلح‌طلب
{"en":"contempt","syn":["contempt","despect","despiciency"]}  ← syn repeats the headword; validator rejects this
{"en":"impartial","fa":["حقگو"]}                    ← a poor gloss; بی‌طرف is the word a learner needs
{"en":"saucer","ipa":"/ˈsoːsə/"}                    ← RP, non-rhotic; the app wants General American
{"en":"bribe","ex":"c. 1613-1625, Henry Hobart, Yardly v. Ellill\nUndue reward for anything against justice is a bribe."}
{"en":"salvo","ex":"1649, Charles I of England (attributed), Eikon Basilike\nThey admit […] salvos, cautions, and reservations."}
{"en":"contempt","ex":"Justice Merchan has yet to issue a ruling on whether to find Mr. Trump in contempt."}
he         (Persian WordNet)  گاز هلیوم        ← WordNet lemma "He" = helium. Catastrophic if unfiltered.
website    (Persian WordNet)  مکان             ← "place". Wrong.
language   (Persian WordNet)  غزلی / واژگان    ← "ghazal-like". Wrong.
special    (Persian WordNet)  یدکی             ← "spare". Wrong sense.
one-quarter (Persian WordNet) یک چهارم پوند    ← "a quarter of a pound"
in         (Persian WordNet)  24 comma-separable glosses: تا / در / اندر / درون / اندرون / تو / از …
```

---

## What this cannot give us

**`exfa` is the hole, and it is large.** No open source pairs an English example sentence with a
Persian translation at dictionary scale. Tatoeba is the only one that does at all, and it yields
**8,449 pairs total**, which touch **9.0%** of the 10,109 new headwords (13.3% of the frequent
subset) and **37.7%** of the existing 10,524 — and most of those "hits" are function words matching
incidentally, not sentences that teach the headword. Concretely, **about 9,200 of the 10,109 new
entries need a Persian example written from scratch**, which is the `examples` agent's workload at
roughly 46 runs of 200.

**English examples are not free either.** 75% of the new headwords have a Wiktionary example, and
38.8% survive a mechanical filter (length, ends in a stop, contains the headword, no date prefix, no
`[…]`). Reading those by eye, roughly half are literary or archaic citations — Dickens, 17th-century
spellings, song lyrics, dated news — so the honest figure for *usable as written* is **around 20%**.
The remaining 80% are `examples`-agent work regardless of the `exfa` problem.

**IPA is British as often as American.** Wiktionary tags a US pronunciation on some entries; where it
does not, the fallback is whatever is listed, which is usually RP (`/ˈsoːsə/` for *saucer*). The
`pronunciation` agent still has to review these rather than accept them.

**`cat` cannot be derived properly.** Wiktionary POS maps onto only 6 of the 29 category keys —
measured on the candidate set: noun 6,028, adj 797, verb 534, adv 65, and ~110 across
prep/intj/num/phrase which would all collapse to `phrase` or `general`. Wiktionary's `topics` tags
cover **41.8%** of candidates but the vocabulary is academic (`natural-sciences` 1,981,
`physical-sciences` 1,124, `mathematics` 645) rather than the app's everyday buckets; only
`medicine→health`, `sports→sport`, `computing→tech`, `music→music`, `transport→travel`,
`anatomy→body`, `business→work` map cleanly. Expect **roughly 30% of new entries to get a topical
category and 70% to land in `noun`/`verb`/`adj`/`adv`/`general`.**

**Coverage is patchy in a way that matters.** Wiktionary's Persian tables are volunteer-driven and
skew to the words volunteers happened to fill in. Measured directly: `stubborn` and `honest` have
Persian glosses; `landlord`, `commute`, `refund`, `deadline`, `budget`, `sunset` and `journey` have
none. Persian WordNet covers most of those — which is exactly why the two must be combined — but
`commute` is missing from both. Over the top 50,000 English words that are *not* already in the app,
Wiktionary can gloss 8.7%, Persian WordNet 21.7%, and the union **24.4%**. Three quarters of common
English has no open Persian gloss anywhere.

---

## Ingestion risks

1. **ZWNJ (U+200C) is stripped throughout.** Measured: **0 of 23,416** Persian strings in the
   Wiktionary extract contain a zero-width non-joiner. `هم‌معنی` arrives as `هممعنی`, `صلح‌جو` as
   `صلحجو`, `بی‌حرمتی` as `بی‌حرمتی`→`بیحرمتی`. To an Iranian reader these are misspellings. This is
   the single biggest data-quality defect and it is invisible in a terminal, so it will pass any
   eyeball review that is not looking for it. A repair pass on the common prefixes/suffixes
   (`می`, `نمی`, `بی`, `هم`, `ها`, `تر`, `ترین`) catches most but not all.
2. **Tatweel and bidi control characters.** 58 Persian strings carry U+0640 tatweel (`ـه`, `ـی`,
   `ـدن` — Wiktionary's way of showing bound suffixes under headwords like *one*, *your*, *to*).
   These are not words and must be dropped, not glossed.
3. **`syn` repeating the headword.** Wiktionary's synonym lists frequently include the word itself
   (`contempt`→`contempt`, `avenge`→`avenge`, `deceive`→`deceive`). `validate.js` errors on this, so
   it must be stripped at ingest.
4. **`syn` containing comma-joined blobs.** e.g. `dittany` → `"fraxinella, gas plant, burning bush"`
   as a single array element. Split or drop.
5. **Persian WordNet picks the wrong sense.** It is automatically constructed from an English
   WordNet alignment, so an English lemma that is also a chemical symbol or a rare homograph gets a
   nonsense gloss (`he`→`گاز هلیوم`). Restricting to WordNet sense #1 and dropping headwords under
   3 characters removes the worst of it; a human still has to read the frequent band.
6. **Gloss-list bloat.** Average 2.1 Persian options per candidate but the tail runs to 24 (`in`).
   `fa` is rendered as a multiple-choice button and `validate.js` caps it at 60 characters — take at
   most two glosses joined with ` / `, as the existing file does.
7. **Proper nouns and non-vocabulary lemmas.** 25% of Wiktionary's Persian-glossed new headwords are
   capitalised (`Manipur`, `Kırklareli`, `Ionian Sea`, `Holodomor`) and WordNet contributes
   pseudo-lemmas (`christmas star`, `theoretical account`, `predatory animal`, `eye blink`). Both
   filtered out in the 10,109 figure above.
8. **Case-insensitive merge required.** Our list has mixed case; both sources are lowercase.
   Appending without folding case would duplicate `Summit`/`summit`.
9. **`i` and `en` are frozen.** New entries must append at `i = 10524…` in a stable order; the merge
   into existing entries must only ever add `ipa`/`syn`, never touch `en` or reorder.
10. **Dari and Tajik contamination is small but present.** Translation `lang` labels across the
    extract: `Persian` 14,948, `Iranian Persian` 53, `Dari` 31, `Mazanderani` 2, `Isfahani` 1, plus
    3 mislabelled (`Persisch`, `Persan`, `Farsi`). Drop `Dari`/`Mazanderani`/`Isfahani`. Arabic
    letterforms are almost absent: only 7 strings use Arabic yeh/kaf instead of Persian ی/ک.

---

## Size arithmetic

Measured, not estimated. `asset` = gzip then base64, which is how the bundler stores it.

| Shape | Entries | Raw JSON | B/entry | Bundle asset | Projected HTML |
|---|---|---|---|---|---|
| today | 10,524 | 1.93 MB | 183 | 0.44 MB | **5.60 MB** |
| enrich existing with `ipa`+`syn` only | 10,524 | 1.77 MB | 177 | 0.63 MB | 5.79 MB |
| **+ 10,109 new (recommended)** | **20,633** | **3.82 MB** | **194** | **1.57 MB** | **6.73 MB** |
| + 13,940 new (top-50k band, unfiltered) | 24,464 | 4.43 MB | 190 | 1.78 MB | 6.94 MB |
| + 26,279 new (everything openly glossable) | 36,803 | 6.66 MB | 190 | 2.68 MB | 7.84 MB |

**Nothing needs to be cut for size.** Even taking every headword the open sources can gloss lands at
7.84 MB against a 12 MB ceiling; the file has room for roughly 160,000 entries before it is a
problem. The reason to stop at 10,109 is quality, not bytes: beyond the top-50k frequency band the
candidates are `aardwolf`, `abiogenesis`, `sedentism`, `putschist` — words with no frequency evidence
that a learner will never search for, and whose glosses nobody will proofread.

---

## Downloaded samples

All under
`C:\Users\toolbox\AppData\Local\Temp\claude\c--Users-toolbox-Desktop-English-class\095ac554-6a3e-42ae-bfd7-e0e33c8e07ac\scratchpad\dict\`

| File | What it is |
|---|---|
| `en-wikt.jsonl.gz` | kaikki English Wiktionary extract, 502 MB gz / 3.21 GB / 1,487,641 lines |
| `en-fa.json` | the extract reduced to 311,693 headwords with fa/ipa/syn/ex |
| `wn-data-fas.tab` | OMW Persian WordNet, 30,461 rows |
| `dict/` | Princeton WordNet 3.0 database (`index.sense` used for lemma→synset) |
| `eng-pes_links.tsv`, `eng_sentences.tsv`, `pes_sentences.tsv`, `tatoeba-pairs.json` | Tatoeba, joined to 8,449 en+fa pairs |
| `en_50k.txt` | subtitle frequency list, used only for ranking — not shipped |
| `fd.json` | the FreeDict catalogue that proves `eng-pes` is absent |
| `candidates.json`, `clean.json`, `novel.txt` | the merged candidate sets the tables above are counted from |
| `extract.js`, `final.js`, `exq.js`, `samples.js` | the measurement scripts |

---

## What I could not verify

- **The Persian WordNet licence is a forwarded email, not a licence document.** The text in
  `omwn.org`'s repository reads "It's free and you can use it everywhere you want", signed by
  Mortaza Montazery. OMW labels it "Free to use". That is a genuine permission grant and I would use
  it, but it names no licence, no version, and no warranty, and `pwn.ir` did not resolve to a
  licence page. If the owner needs certainty, this source should be replaced or the author emailed.
- **Whether the missing ZWNJ is wiktextract's normalisation or Wiktionary's own source text.** I
  measured the absence in the extract; I did not re-fetch a wiki page to confirm the wiki has it.
  If it is a wiktextract artefact, re-extracting from the raw dump would fix it wholesale, which is
  worth an hour before writing a repair heuristic.
- **The "usable as written" figure of ~20% for English examples** is my judgement over ten sampled
  rows either side of a mechanical filter that passes 38.8%. It is not a counted number.
- **The 5.60 MB → 6.73 MB projection** assumes the bundler re-gzips the words asset at the same
  ratio and that nothing else in the file changes. I computed the asset size myself
  (gzip → ×4/3 for base64) rather than running `rebuild.js`, which I deliberately did not do.
- I did not download PanLex. Its licence page states CC BY-NC-SA 4.0, which excludes it before size
  or quality matter; I am inferring that its `eng-pes` data would otherwise have been useful.
- CCMatrix as an `exfa` fallback is unverified — I read its size (24.6M pairs) from the OPUS API but
  did not download or inspect a single sentence.
