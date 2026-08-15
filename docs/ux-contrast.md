# Colour contrast & invisible text — audit

Scope: the whole app. Sources read: `data/src/template.html` (markup, 1,145 elements
parsed, 368 text nodes), `data/src/app.jsx` (2,357 lines, ~60 runtime style strings).

**Method.** Every background layer was composited down to the base `#12141f` before
measuring — a tag-stack walk over the markup carried the background stack, the font
size and the weight down to each text node, so the effective background is the real
one, not the literal value in the element's own `style`. Ratios use the WCAG
relative-luminance formula. Every ternary in `app.jsx` was evaluated in **both**
branches. Nothing below was eyeballed; every number is computed.

**Thresholds.** 4.5:1 body text · 3:1 for ≥24px, ≥18.66px bold, and for icons and
borders that carry state. The app's largest secondary text is 13px, so effectively
everything here is held to 4.5:1.

---

## Summary

| Severity | Findings | Occurrences |
|---|---|---|
| **S1 — invisible text** | 1 | 12 |
| **S2 — content a learner must read, below 4.5:1** | 8 | ~145 |
| **S3 — state-carrying icons and borders below 3:1** | 6 | ~25 |
| **Total** | **15** | **~180** |

### Did the global rule close the invisible-text class?

**Almost — one hole is left, and it is the same failure mode.**

The rule is present and correct:

```css
button,input,textarea,select{color:inherit;font-family:inherit}   /* template.html:9591 */
```

Verified against the whole source:

- All 35 distinct `color:` values in the app are light. **There is not a single dark
  colour literal anywhere in a `color:` declaration**, so nothing overrides the new
  rule back to black. The `color`-less-control bug is genuinely dead for the four tags.
- No `<select>`, `<option>`, `<progress>` or `<meter>` exists, so no other native
  element is exposed.
- Every `<i>` icon and `<span>` inside a control inherits from the control, which now
  inherits from `body`. Checked; none re-declares a dark colour.

**What it does not cover: `::placeholder`.** `color:inherit` sets the field's own text.
The placeholder pseudo-element takes its colour from the UA stylesheet, and the page
never declares `color-scheme`. Engines that resolve the placeholder from the
*light* scheme branch paint `rgba(0,0,0,.54)` — near-black — on the dark field.
This is finding **S1-1** below, and it is the only surviving member of the class.

---

## S1 — Invisible text

### S1-1 · Input placeholders resolve to near-black · **1.15:1**

**Where** — 12 fields across the app: `template.html` lines with `placeholder=` on the
study typing input, cloze input, the three add-word fields, the browse search box, the
new-category box, the sentence-building free/combine textareas, the collocation input,
and the listening shadowing box. Screens: **study, add word, browse, sentence
building, collocations, listening**.

**The pair** — placeholder `#0d0e15` (UA `rgba(0,0,0,.54)` composited) on field
background `#1b1d27` (`rgba(233,233,237,.04)` over base).

**Measured 1.15:1**, needs 4.5:1. Every one of these placeholders is an instruction —
*"املای انگلیسی را بنویس…"*, *"Write your own sentence…"* — and on the affected
engines it is the blank field that greets the learner.

Both branches measured, because the outcome is engine-dependent:

| UA resolution | Placeholder colour | Ratio |
|---|---|---|
| light-scheme branch (no `color-scheme` declared) | `rgba(0,0,0,.54)` | **1.15:1** ✗ |
| `currentColor` branch (newer Chromium) | `rgba(233,233,237,.54)` | 4.96:1 ✓ |
| `GrayText` branch | `#6d6d6d` | **3.26:1** ✗ |

**Replacement — one rule, closes all 12 and removes the engine dependency.** Add
beside the existing fix in `template.html`:

```css
:root{color-scheme:dark}
input::placeholder,textarea::placeholder{color:rgba(233,233,237,.55);opacity:1}
```

New ratio **5.09:1**. `opacity:1` is needed because Firefox applies its own opacity on
top. `color-scheme:dark` additionally fixes the file-picker button on the settings
screen and the scrollbars.

**Repeated pattern**, 12 occurrences, shared source: the missing stylesheet rule.

---

## S2 — Content a learner must read

These all trace to one source: the app has no floor on its secondary-text opacity.
`rgba(233,233,237,α)` is used as `color` at α = .3, .35, .38, .4, .42, .45 and .5, and
**every value at or below .45 fails 4.5:1 on every background in the app**.

The ladder, measured (foreground `rgba(233,233,237,α)` over each background):

| α | on base `#12141f` | on `.03` card `#181a25` | on `.05` card `#1d1f29` | on violet `.12` `#212135` |
|---|---|---|---|---|
| .30 | 2.43 | 2.45 | 2.45 | 2.43 |
| .35 | 2.87 | 2.87 | 2.86 | 2.83 |
| .40 | 3.37 | 3.35 | 3.32 | 3.27 |
| .45 | 3.93 | 3.89 | 3.84 | 3.76 |
| .50 | 4.57 | 4.49 | 4.41 | 4.31 |
| **.55** | **5.27** | **5.15** | **5.04** | **4.91** |
| .60 | 6.05 | 5.88 | 5.73 | 5.57 |

**`.55` is the lowest value that passes everywhere.** That single fact resolves S2-1
through S2-6.

---

### S2-1 · Disabled "check" / "next" button label · **2.43:1** — worst readable-text failure

**Where** — `app.jsx:735` (`exNextStyle`), `1058` (`sbCheckStyle`), `1118`
(`sexNextStyle`), `1146` (`scmNextStyle`), `1536` (`csNextStyle`), `1734`
(`lqrNextStyle`). Screens: **exercise, sentence building (all four modes), grammar &
collocation drills, listening quiz** — i.e. every runner in the app.

**The pair** — `#52545d` (`rgba(233,233,237,.3)`) on `#12141f`.

**Measured 2.43:1**, needs 4.5:1 (and 3:1 even read as a disabled control).

This is the button the learner is *waiting* to become usable. In the un-answered state
it is the least legible text on the screen, so the primary affordance of every drill
reads as absent rather than as not-yet-available.

Both branches:

| Branch | Colour | Background | Ratio |
|---|---|---|---|
| enabled | `#b3a9e6` | `rgba(145,132,217,.14)` → `#242439` | 7.04:1 ✓ |
| **disabled** | `rgba(233,233,237,.3)` | `#12141f` | **2.43:1** ✗ |

**Replacement** — in all six strings, `'rgba(233,233,237,.3)'` → `'rgba(233,233,237,.55)'`.
New ratio **5.27:1**. The enabled state stays visually far ahead on hue and background,
so the state distinction survives.

**Repeated pattern**, 6 occurrences. The six strings are copies of one another; the
real fix is to hoist them into a single `nextBtn(enabled, accent)` helper in `app.jsx`
so this cannot drift back.

---

### S2-2 · `α = .35` hints and empty states · **2.85–2.87:1**

**Where** — 8 occurrences. Named ones:

| Line | Screen | Content |
|---|---|---|
| `template.html:10212` | sentence building | `{{ sbEmptyHint }}` — the empty-state instruction |
| `template.html:10639` | collocations | *"تکه‌ها را از پایین انتخاب کن — برای برداشتن، روی تکه بزن"* |
| `template.html:9840–9841` | study | `{{ hintLine }}`, *"آزمون بعدی: N لغت دیگر"* |
| `template.html:10149` | sentence building | `{{ m.badge }}` mode badge |
| `template.html:9742` | study | `{{ card.cat }}` category tag |

**The pair** — `#65666e` on `#1e202a` (2.85:1) and `#5d5f67` on `#12141f` (2.87:1),
needs 4.5:1.

The two chunk-picking hints are the only text that explains how the interaction works —
if you cannot read them, the screen is a row of unexplained buttons. They are not
decoration.

**Replacement** — `rgba(233,233,237,.35)` → `rgba(233,233,237,.55)`.
New ratio **5.09–5.27:1**.

**Repeated pattern**, 8 occurrences of the same literal.

---

### S2-3 · `α = .4` sub-labels, counters and prompts · **3.16–3.37:1**

**Where** — 14 occurrences. The ones carrying real content:

| Line | Screen | Content |
|---|---|---|
| `template.html:9749` | study (MCQ/cloze) | `{{ promptHint }}` — *"کدام لغت جای خالی می‌نشیند؟"*, the question itself |
| `template.html:9856` | quiz | `{{ qHint }}` — *"معنی فارسی کدام است؟"* |
| `template.html:10956` | game | *"نکته‌های این سطح"* tips heading |
| `template.html:9640,9645` | home | streak line, `{{ accuracySub }}` |
| `template.html:9618` | location strip | `{{ crumbPos }}` position counter |
| `template.html:9995` | browse | `{{ browseCount }}` |
| `template.html:10745,10883` | listening, discussion | `{{ ltMeta }}`, `{{ dMeta }}` |

**The pair** — `#686971` on `#12141f` (3.37:1) down to `#64656d` (3.16:1), needs 4.5:1.

`promptHint` and `qHint` are the instruction that tells the learner what they are being
asked. They are the most under-weighted strings in the app relative to their importance.

**Replacement** — `rgba(233,233,237,.4)` → `rgba(233,233,237,.55)`.
New ratio **5.04–5.27:1**. For `promptHint` and `qHint` specifically, `.6` (5.57–6.05:1)
is better matched to their role.

**Repeated pattern**, 14 occurrences.

---

### S2-4 · `α = .45` — the app's most common secondary colour · **3.86–3.93:1**

**Where** — **47 occurrences**, the single most repeated failure. Concentrated in the
newest markup:

| Line | Screen | Content |
|---|---|---|
| `template.html:9608` | header (every screen) | *"سطح {{ levelLabel }}"* |
| `template.html:9617` | location strip | `{{ crumb }}` — the whole breadcrumb path |
| `template.html:9631` | home | `{{ posLabel }}` / `{{ pctLabel }}` under the progress bar |
| `template.html:9638,9643` | home | *"امروز"*, *"دقت کلی"* stat-tile captions |
| `template.html:9649` | home | *"سه بخش این دوره"* section heading |
| `template.html:9671,9673` | home | method desc + badge |
| `template.html:9763` | study | card meta `<button>` — the one control with an explicit low-alpha colour |
| `template.html:9989` | browse | `{{ b.desc }}` |

**The pair** — `#73747c` on `#12141f` = **3.93:1**; `#777880` on `#1a1b26` = **3.88:1**;
`#76777f` on `#181a25` = **3.89:1**. Needs 4.5:1.

The breadcrumb (`9617`) is the app's only "where am I" signal after the nine icon-only
header buttons were removed, and it is below the floor on every screen that has one.

**Replacement** — `rgba(233,233,237,.45)` → `rgba(233,233,237,.55)`.
New ratio **5.13–5.27:1**.

**Repeated pattern**, 47 occurrences of one literal.

---

### S2-5 · `α = .5` fails on any tinted card · **4.31–4.49:1**

**Where** — 31 occurrences. `.5` passes on the bare base (4.57:1) but every use that
sits on a card does not. Newest markup affected:

| Line | Screen | Content | Ratio |
|---|---|---|---|
| `template.html:9711` | **settings** | backup explanation — *"پیشرفت تو فقط در همین مرورگر ذخیره می‌شود…"* | **4.49:1** |
| `template.html:9720` | **settings** | reset warning — *"این کار برگشت‌پذیر نیست"* | **4.48:1** |
| `template.html:9656` | **home** | section-card descriptions (all three) | **4.49:1** |
| `template.html:9695` | **hub** | hub-card descriptions | **4.49:1** |
| `template.html:9626` | **home** | `{{ leadKicker }}` on the violet lead card | **4.37:1** |
| `app.jsx:1692` | listening | line numbers | **4.27:1** |

The two settings strings are the only warning the app gives before destroying all
progress. A destructive-action warning is not de-emphasised content.

**Replacement** — for `color` uses of `rgba(233,233,237,.5)` that sit on a card or a
tint, raise to `rgba(233,233,237,.6)` → **5.57–5.88:1**. Simplest source-level form:
raise all 31 to `.6` and stop tracking which sit on a tint.

**Repeated pattern**, 31 occurrences; the ~12 on tinted backgrounds are the failures.

---

### S2-6 · Hub card `{{ c.meta }}` at `α = .38` · **3.15:1**

**Where** — `template.html:9696`. Screens: **all three section hubs** (واژه‌ها,
ساختار, شنیدن و گفتن).

**The pair** — `#686971` on `#181a25`. **3.15:1**, needs 4.5:1.

This line carries each section's progress (*"۳ از ۱۲"*-style). It is the only per-card
progress signal on a hub, and it is the faintest text on the screen. A one-off alpha
(`.38` appears exactly once in the app) that undershoots even the `.45` used beside it.

**Replacement** — `rgba(233,233,237,.38)` → `rgba(233,233,237,.55)` → **5.15:1**.

**One occurrence.**

---

### S2-7 · Correction arrow between wrong and right answer · **2.44:1**

**Where** — `template.html:10665`, screen: **collocation / grammar drill results**.

**The pair** — `#605f64` (`rgba(233,233,237,.3)`) on `#252429`. **2.44:1**, needs 4.5:1.

The line reads `<s>wrong</s> → correct`. The arrow is the only thing distinguishing
"what you wrote" from "what it should be"; the strikethrough carries the rest. At
2.44:1 the two phrases run together.

**Replacement** — `rgba(233,233,237,.3)` → `rgba(233,233,237,.6)` → **5.73:1**.

**One occurrence.**

---

### S2-8 · Study card "جمله‌ی نمونه" label · **4.49:1**

**Where** — `template.html:9798`, screen: **study (flashcard back)**.

**The pair** — `#857ac8` (`rgba(145,132,217,.9)`) on `#1b1c2c`. **4.49:1**, needs 4.5:1.

Fails by 0.01 — but it is the only use of this value in the app, and the palette
already contains a colour that clears it comfortably.

**Replacement** — `rgba(145,132,217,.9)` → `#b3a9e6` (already the app's standard
violet-on-dark) → **7.80:1**. No new hue.

**One occurrence.**

---

## S3 — State-carrying icons and borders below 3:1

These fail WCAG 1.4.11. In each case the non-colour cue is present and correct — the
problem is purely that the faint branch is too faint to see at all.

### S3-1 · Inactive filter-chip border · **1.27:1**

**Where** — `app.jsx:978`, `1379`, `1652`, `1849` (four identical `chip` helpers) and
`2050` (`chipS`). Screens: **sentence building, grammar, listening, discussion, browse** —
the level pickers on every section.

**The pair** — `#282934` (`rgba(233,233,237,.1)`) on `#12141f`. **1.27:1**, needs 3:1.

Both branches:

| Branch | Border | Ratio |
|---|---|---|
| on | `c + '77'` (accent @ 47%) | 3.2–4.1:1 ✓ |
| **off** | `rgba(233,233,237,.1)` | **1.27:1** ✗ |

The chip's own label passes (5.88:1), so the chip is readable — but its boundary is
not, and a row of six level chips reads as loose floating text rather than as a
segmented control.

**Replacement** — `rgba(233,233,237,.1)` → `rgba(233,233,237,.42)` → **3.59:1**.

**Repeated pattern**, 5 occurrences — but the five `chip` helpers are byte-identical
copies. Hoist one `chip(on, c)` to module scope beside `cardBtn`/`iconSq` (`app.jsx:34`)
and all five fix at once.

### S3-2 · Disabled next/check button border · **1.35:1**

**Where** — the same six lines as S2-1. **The pair** — `#2c2e38`
(`rgba(233,233,237,.12)`) on `#12141f`. **1.35:1**, needs 3:1.
Enabled branch (`#9184d9`) measures 5.68:1 ✓.

**Replacement** — `rgba(233,233,237,.12)` → `rgba(233,233,237,.42)` → **3.59:1**.
**Repeated pattern**, 6 occurrences, same shared source as S2-1.

### S3-3 · Spent heart (lives remaining) · **1.74:1**

**Where** — `app.jsx:748` (word game), `1083` (sentence game), `1551` (collocation game).
**The pair** — `#3d3f48` (`rgba(233,233,237,.2)`) on `#12141f`. **1.74:1**, needs 3:1.
Live branch `#d98f8f` measures 7.22:1 ✓.

The icon does swap (`ph-fill ph-heart` → `ph ph-heart`), so shape carries the state —
but a 1px outline at 1.74:1 is not visible, so three lives and one life look alike.

**Replacement** — `rgba(233,233,237,.2)` → `rgba(233,233,237,.45)` → **3.93:1**.
**Repeated pattern**, 3 occurrences (the `[0,1,2].map` heart builder is copied 3×).

### S3-4 · "Not started" lesson tick · **2.08:1**

**Where** — `app.jsx:1407` (grammar lesson list), `1675` (listening text list).
**The pair** — `#4c4d56` (`rgba(233,233,237,.25)`) on `#171924`. **2.08:1**, needs 3:1.

All three branches measured — the two completed states are fine, only the un-started
one fails:

| Branch | Icon | Colour | Ratio |
|---|---|---|---|
| passed | `ph-fill ph-check-circle` | `#8fd9c1` | 10.68:1 ✓ |
| weak | `ph-fill ph-clock-countdown` | `#e0a458` | 7.98:1 ✓ |
| **not started** | `ph ph-circle-dashed` | `rgba(233,233,237,.25)` | **2.08:1** ✗ |

**Replacement** — `rgba(233,233,237,.25)` → `rgba(233,233,237,.45)` → **3.90:1**.
**Repeated pattern**, 2 occurrences.

### S3-5 · Active tab border in the bottom bar · **1.76:1**

**Where** — `app.jsx:2103` (`navTabs`), rendered by `template.html:11024–11031`.
Screen: **every non-runner screen**.

**The pair** — `#413e65` (`rgba(145,132,217,.35)`) on the bar's opaque `#161826`.
**1.76:1**, needs 3:1.

Both branches, all three cues:

| Cue | Active | Inactive | Verdict |
|---|---|---|---|
| label + icon colour | `#b3a9e6` → 6.92:1 ✓ | `rgba(233,233,237,.5)` → **4.52:1** ✓ | passes |
| icon fill | `ph-fill` | `ph` outline | non-colour cue present ✓ |
| border | `rgba(145,132,217,.35)` → **1.76:1** ✗ | transparent | fails |

The tab bar is otherwise the cleanest new component in the app — the label contrast
clears 4.5:1 with room to spare, and the fill/outline icon swap is a proper non-colour
cue. Only the border under-delivers.

**Replacement** — `rgba(145,132,217,.35)` → `#9184d9` → **5.45:1** against the bar.
Already the app's standard violet border; no new hue.

**One occurrence.**

### S3-6 · Navigation caret on section and hub cards · **2.45:1**

**Where** — `template.html:9658` (**home**, section cards) and `9698` (**all three
hubs**). **The pair** — `#575861` (`rgba(233,233,237,.3)`) on `#181a25`. **2.45:1**,
needs 3:1.

This caret is the sole affordance marking these cards as navigable rather than
informational, on the two newest screens.

**Replacement** — `rgba(233,233,237,.3)` → `rgba(233,233,237,.5)` → **4.49:1**.

**Repeated pattern**, 2 occurrences.

---

## Recommended fix order

Five source-level changes cover roughly 170 of the ~180 occurrences.

1. **One stylesheet rule** (`template.html`, beside line 9591) — closes S1-1, all 12
   placeholders, and removes the engine dependency entirely.
   ```css
   :root{color-scheme:dark}
   input::placeholder,textarea::placeholder{color:rgba(233,233,237,.55);opacity:1}
   ```
2. **Raise the secondary-text floor to `.55`.** Mechanical substitution of
   `color:rgba(233,233,237,α)` for α ∈ {.3, .35, .38, .4, .42, .45} → `.55`, and the
   `color` uses of `.5` → `.6`. Closes S2-2 … S2-7, ~104 occurrences. Nothing below
   `.55` should exist as a text colour in this app.
3. **Hoist the six copied next/check strings** into one `nextBtn(enabled, accent)`
   helper, with `.55` text and `.42` border. Closes S2-1 and S3-2 at one site.
4. **Hoist the five copied `chip` helpers** to module scope beside `cardBtn`/`iconSq`,
   with a `.42` off-border. Closes S3-1 at one site.
5. **Four single-value edits** — active tab border → `#9184d9` (S3-5); carets → `.5`
   (S3-6); hearts → `.45` (S3-3); ticks → `.45` (S3-4); study card label → `#b3a9e6`
   (S2-8).

Every replacement above is a value already in the palette. No new hue is introduced.

---

## Checked and found acceptable

So the next run does not re-audit these from scratch.

**The global control rule.** `button,input,textarea,select{color:inherit;font-family:inherit}`
is present at `template.html:9591` and is not overridden anywhere. All 35 distinct
`color:` values in the app are light — there is no dark colour literal in any `color:`
declaration. No `<select>`, `<option>`, `<progress>` or `<meter>` exists. Every icon and
span inside a control inherits correctly. The `.vbtn` class also sets `color:inherit`
independently. **The "control with no colour" bug is fully closed.** The only surviving
member of the invisible-text class is `::placeholder` (S1-1).

**No light-on-light.** The only opaque light background in the app is `#e0a458`, used
twice as a progress-bar fill. Neither carries text.

**Colour is never the only signal.** Checked every state pair:
- MCQ options in study, quiz, sentence-building, collocations and listening
  (`app.jsx:640`, `1098`, `1494`, `1722`, `1952`) all add `ph-fill ph-check-circle` /
  `ph-fill ph-x-circle` marks alongside the green/red colour.
- Lesson ticks swap icon shape across all three states *and* carry a text badge
  (`app.jsx:1406`, `1674`).
- Hearts swap filled/outline (`app.jsx:748`, `1083`, `1551`).
- Active nav tab swaps `ph` → `ph-fill` and adds a background (`app.jsx:2101`).
- Correction lines add `text-decoration:line-through` on the wrong form.

A red-green colour-blind learner can complete every drill. Only the *contrast* of the
faint branches fails, never the redundancy.

**Accent hues all pass comfortably** on every background they are used on:
`#b3a9e6` 6.82–8.50 · `#8fd9c1` 9.02–11.23 · `#e0a458` 6.74–8.40 · `#84c5d9` 7.69–9.58 ·
`#e0879e` 5.70–7.10 · `#d98f8f` 5.80–7.22 · `#cfeaf5` 11.73–14.61 · `#8fc7a0` 7.60–9.47.
`#9184d9` is the weakest at 4.56–5.68 — still passing, but it is the one accent with no
headroom; do not use it on a tint darker than `rgba(145,132,217,.16)`.

**Primary text.** `#e9e9ed` on base is 15.14:1 and 13.59:1 on the heaviest card. All
headings, card titles, stat numbers, prompts and typed input text clear 4.5:1 by a wide
margin.

**Passing states worth recording** (measured, do not re-check): inactive tab label
4.52:1 · `hubDesc` 4.57:1 · methods toggle 4.57:1 · off-chip *label* 5.88:1 · gear icon
6.05:1 · breadcrumb back button 6.91:1 · settings export/import/reset buttons
8.52 / 7.41 / 6.76:1 · unselected sentence chunk 7.54:1 · unchecked discussion item
7.62:1 · inactive listening line 10.98:1 · `leadDesc` 5.66:1 · enabled next button
7.04:1 · hub icon squares 4.50:1 (tight — do not darken the tint further).

**Non-failures noted, not counted.** The `opacity:.4` applied to not-yet-available mode
cards (`app.jsx:670`) yields 3.29:1 on the label — below 4.5:1 but above the 3:1 floor
for a disabled control, and the card is genuinely inert. The decorative hub-card
borders (`cardBtn`, `app.jsx:34`, 1.44–1.69:1) and the 96px `opacity:.22` watermark icon
on the study card are static decoration carrying no state, so 1.4.11 does not apply.
