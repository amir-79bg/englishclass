# لغتنامه — English vocabulary app

An offline English-vocabulary trainer for Persian speakers, shipped as **one self-contained HTML file**. No server or build step is required for the core trainer: open `english-vocab-v1.html` in a browser and it runs. Optional Google Drive sync needs internet and a hosted HTTPS origin.

> [!IMPORTANT]
> The Laravel API + native Android rebuild is managed in this same repository as a monorepo. The canonical vision, architecture, task board, decisions, and verified progress live in [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md). AI agents must read [`AGENTS.md`](AGENTS.md) before changing the repository.

For a clean, searchable, offline view of every project document, open [`technical-docs.html`](technical-docs.html) at the repository root. Markdown files under `docs/` remain the source of truth; both `technical-docs.html` and its mirror at `docs/index.html` are regenerated with `node tools/build-docs.js` whenever documentation changes.

## Optional Google Drive sync

The home screen includes local-first Google Drive backup. Progress always stays in browser `localStorage`; when Drive is unavailable the UI reports that the cloud backup is pending, not that local progress was lost. Concurrent updates are stored as immutable snapshots and presented to the learner for an explicit choice.

To activate it:

1. Enable Google Drive API in a Google Cloud project.
2. Configure the OAuth consent screen and create a Web OAuth client.
3. Register the production HTTPS origin (or `http://localhost` for development).
4. Replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `data/src/template.html` with the public client ID.
5. Optionally set the `vocab-online-url` meta tag. From a downloaded `file://` copy, the sync button exports a JSON backup and opens the hosted version; import that backup once from Settings because browser storage cannot move between origins automatically.
6. Run `node tools/repack.js`.

Never put a Google client secret in the HTML. Browser OAuth does not support Drive sync from `file://`; the downloadable file continues to work locally, but cloud sync must run from the hosted HTTPS version.

The “Add to Home Screen” control uses the browser's install prompt when one is available and otherwise shows shortcut instructions. A guaranteed offline-installable PWA would additionally require a manifest, icons, and a same-origin service worker, so that mode is not part of the strict one-file build.

## What is in the bundle

The HTML file is a self-extracting bundle produced by a Claude artifact bundler. Two long lines carry everything:

- `<script type="__bundler/manifest">` — every asset, each gzipped then base64-encoded: React, fonts, icons, and all course data.
- `<script type="__bundler/template">` — the real page, as a JSON string. The whole React app source lives here.

On load, a small script unzips each asset into a Blob URL, substitutes the UUIDs in the template, and rewrites the document. That is the "Unpacking..." message you see for a moment.

| Asset | Global | Contents |
|---|---|---|
| `3350f0d9-…` | `VOCAB_WORDS`, `VOCAB_CATS`, `VOCAB_ORDER` | 10,524 words across 29 categories |
| `dca9788e-…` | `GRAM` | Grammar course, A1→C2 |
| `34d1c5c1-…` | `SENT` | Sentence-building curriculum |
| `9a1062d3-…`, `919e7d4d-…` | `LISTEN_1`, `LISTEN_2` | Listening & shadowing texts |
| `0592dc99-…` | `DISC` | Free-discussion curriculum |
| `456306af-…` | `COLLOC2` | Collocations (make / do / take …) |

## Editing the word data

Never edit the HTML by hand — the data is inside a compressed blob. Use the pipeline:

```bash
node tools/extract.js        # bundle       -> data/words.json
# ...edit data/words.json, or drop patches in data/patches/...
node tools/apply.js          # patches      -> data/words.json
node tools/validate.js       # check without writing anything
node tools/rebuild.js        # data/words.json -> bundle
```

`rebuild.js` refuses to write if validation fails, and keeps a `.backup.html` copy the first time it runs.

### Categories

`data/categories.json` is the single source of truth for category order, Persian labels, icons, colours and allowed keys. `rebuild.js` folds both this metadata and `data/words.json` into the HTML bundle. Category assignments follow the topic-first policy in `docs/vocabulary-categories.md`: use a clear topic when one exists, otherwise the word's real grammatical role, and reserve `phrase` for non-topical multiword entries.

After category work, run both `node tools/repack.js` (app/source changes) and `node tools/rebuild.js` (words/category metadata), then `node tools/audit-categories.js`. The audit checks that the editable data, bundled app source and metadata, duplicate headwords, icons and Listening topics agree.

### Word entry shape

```json
{
  "i": 0,
  "en": "above and beyond",
  "fa": "فراتر از حد انتظار",
  "cat": "phrase",
  "ex": "He said, \"above and beyond\".",
  "exfa": "او گفت: «فراتر از حد انتظار».",
  "ipa": "/əˈbʌv ənd bɪˈjɒnd/",
  "syn": ["exceptional", "outstanding"]
}
```

`ipa` and `syn` are optional and were added by the agents below.

**`i` is frozen. Treat `en` as frozen after release.** Saved progress and
`VOCAB_ORDER` address words by position, so reordering, inserting, or deleting
entries can move a learner's data to the wrong word. Several per-word maps in
`localStorage` use the English headword as their key, so renaming `en` can also
orphan saved overrides and learner-written sentences. Before release the
validator reports spelling corrections to `en` as warnings; after learners
have saved progress, pair any rename with an explicit migration.

### Patches

Agents do not edit `data/words.json` directly — several run at once and would clobber each other. Each writes `data/patches/<name>-<range>.json` keyed by word index:

```json
{ "12": { "ipa": "/ˈæp.əl/" }, "13": { "syn": ["huge", "vast"] } }
```

`node tools/apply.js` merges them all, validates, and writes `words.json`.

## Agents

Defined in `.claude/agents/`. The four content agents take an index range — the list is far too large for one pass — and write patch files:

| Agent | Adds / fixes | Invoke like |
|---|---|---|
| `pronunciation` | `ipa` (General American) | "pronunciation: words 0-199" |
| `translator` | sharper `fa` glosses | "translator: words 0-199" |
| `synonyms` | `syn` arrays | "synonyms: words 0-199" |
| `examples` | `ex` + `exfa` rewrites | "examples: words 0-199" |

`auditor` is different: read-only, takes an area rather than a range, and reports problems without fixing them.

Two more agents work on the experience rather than the content. Both propose only — they write a document under `docs/` and change nothing else:

| Agent | Scope | Invoke like |
|---|---|---|
| `ux-architect` | The whole app's structure: navigation, hierarchy, naming, first-run path | "ux-architect" |
| `ux-feature` | One section, reviewed as a first-time learner would meet it | "ux-feature: the listening section" |

Run `ux-architect` first — it decides the top-level model that `ux-feature` reports assume.

## Unpacking the app source

To read the React app itself (not the word data):

```bash
node tools/unpack.js    # -> data/src/template.html  (the markup)
                        #    data/src/app.jsx        (the app logic)
```

`data/src/` is the editable unpacked source used by `tools/repack.js`: edit `app.jsx` for logic and `template.html` for markup, then repack it into the bundle.

To patch the app:

```js
const { readBundle, readTemplate, writeTemplate, writeBundle } = require('./tools/bundle');
const b = readBundle();
const tpl = readTemplate(b);          // full page HTML + app source
// ...edit tpl...
writeTemplate(b, tpl); writeBundle(b);
```

`writeTemplate` escapes `</` in every closing tag as `<\u002F`, so the JSON payload cannot terminate its own `<script>` element. Do not bypass it.

## Known state

- The `ipa` and `syn` fields are supported end to end by the tools and validator, but **no words carry them yet** and **nothing renders them** — the agents have not been run, and wiring them into the flashcard and browse screens is still to do.
- Global keyboard shortcuts (space to flip a card, 1–4 to pick an option) were removed: they called `preventDefault()` on the whole window while the study screen was open, so the space bar never reached the example-sentence input and the word could not be typed. Per-input Enter handling is unaffected.
