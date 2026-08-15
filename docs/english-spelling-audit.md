# English spelling audit

Date: 2026-08-10

## Scope

- Audited all 10,524 entries in `data/words.json`.
- Checked all 10,629 unique English tokens occurring in `en` and `ex` with the locally installed Microsoft Word English spellchecker.
- Independently checked headwords for leading/trailing whitespace, repeated whitespace, unexpected characters, and case-insensitive duplicates.
- Verified that every example contains its complete headword (case-insensitive).
- Preserved array order and every `i` value.

## Corrected spellchecker result

The first version of the PowerShell audit used unsafe property projection on a
hashtable enumerator. As a result, Word never received the complete token list
and the reported zero was invalid. With explicit Enumerator traversal, the
audit checks all **10,629 unique English tokens** and Word flags **1,331
spelling suspects**. This is a candidate count, not an error count: it includes
proper names, abbreviations, technical terms, fragments, and valid British
spellings that the installed US-English dictionary does not recognise.

After the approved corrections were applied, the same audit found **10,628
unique tokens** and **1,320 spelling suspects**. The remaining candidates are
the reviewed long tail described below; they are not automatically rewritten.

Manual review plus an independent second pass confirmed these twelve spelling
corrections, staged in `data/patches/zzz-agent-proofread-english.json`:

| `i` | Before | Correct spelling |
|---:|---|---|
| 4953 | `dont` | `don't` |
| 5105 | `womens` | `women` |
| 5142 | `beastiality` | `bestiality` |
| 6082 | `trembl` | `tremble` |
| 7080 | `thats` | `that's` |
| 8046 | `childrens` | `children` |
| 9623 | `filme` | `film` |
| 9637 | `alot` | `a lot` |
| 9868 | `sparc` | `spark` |
| 10003 | `sbjct` | `subject` |
| 10290 | `voyuer` | `voyeur` |
| 10376 | `beastality` | `bestiality` |

The patch also replaces the affected template examples with natural English
sentences and matching Persian translations. Array order and every `i` remain
unchanged. Correcting the headwords creates duplicate canonical spellings for
`women`, `children`, `film`, `subject`, and `bestiality` (the last now occurs at
5142, 5361, and 10376). This is intentional: preserving a misspelling merely to
keep a headword unique would teach false English, while deleting or moving an
entry would shift index-based progress. The three `bestiality` glosses are
aligned and their examples are distinct so they cannot produce conflicting
Persian answer labels.

Entry 9173, `whats`, remains unresolved. Both `what` and `what's` fit parts of
the surviving evidence, so changing it without the missing source would be a
guess rather than proofreading.

## Confirmed corrupt records

| `i` | Stored `en` | Evidence | Reconstruction verdict |
|---:|---|---|---|
| 1353 | `b` | `fa` contains three `(a)/(b)/(c)` answer choices | The source prompt is missing. `b` suggests an answer key, but does not prove which English word was being tested. |
| 1354 | `a` | `fa` contains three `(a)/(b)/(c)` answer choices | The source prompt is missing. Choosing “craving” merely because it is option a would be an unsupported invention; `craving` already exists at 663. |
| 2113 | `ght` | Mid-word fragment; `fa` is contaminated English (`during adjusted are Weights`) | Probably derived from *weight*, already present at 2756, but the original record/sense cannot be recovered. |
| 5727 | `tion` | Productive suffix stored as a standalone noun | The Persian gloss identifies “suffix,” but it does not establish whether the intended headword was `suffix` or a truncated `-tion` word. |
| 6628 | `val` | Truncated-looking form; gloss says “value / abbreviation val”; adjective category and example are invalid | Could be *value*, *valuable*, or a technical abbreviation; `value` and `valuable` already exist at 609 and 1092. |

These five records are certainly corrupt, but their original headwords cannot
be determined from any remaining field. They are therefore documented rather
than silently replaced. The older
`data/patches/english-spelling-audit.json` remains intentionally empty: a
guessed `en` would create a new identity and teach an invented mapping.

Additional high-confidence contamination found during the second pass includes
`enb` (9848, explicitly glossed “unknown text”), and likely fragments or
foreign/function-word noise such as `dat` (10351), `soa` (10353), `cho`
(10406), `ind` (10424), and `qui` (10436). Numerous lowercase initialisms and
proper-name fragments occur in the long tail. Some (for example `VPN`, `DUI`,
or `PVC`) may be useful, while others are not suitable for a general-English
course; that distinction requires a product-level inclusion policy rather than
an automatic spelling replacement.

The broad heuristic pass found 1,718 lowercase headwords of two to four
letters, including 76 vowelless forms. This candidate pool contains both clear
noise (`ght`) and legitimate vocabulary/initialisms (`gym`, `BBC`, `VPN`), so
length or vowel rules cannot safely rewrite it. Every one of the 10,524 records
was covered by the structural pass; the unresolved long tail should be handled
by an explicit allowlist/quarantine review, not by guessed replacements.

Before the approved correction patch, structural checks found:

- 0 duplicate headwords (case-insensitive)
- 0 headwords with surrounding/repeated whitespace or unexpected characters
- 0 examples missing their complete headword

The duplicate/character checks cannot identify semantic fragments. Many
headwords and examples are also grammatically, semantically, or pedagogically
unsuitable; those require source recovery or a separately approved quarantine
mechanism. Since deletion, insertion, and reordering are prohibited, there is
no honest automatic repair for records whose source word has been lost.

## Reproduction

Run:

```powershell
& .\tools\audit-spelling.ps1
node tools\apply.js --dry
node tools\validate.js
```

The PowerShell audit launches the installed Word spellchecker invisibly and
does not modify Office documents or the dataset.
