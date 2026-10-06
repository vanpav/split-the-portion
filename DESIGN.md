---
name: Split the Portion
description: Raw ↔ cooked weights and per-person portions, read at the stove in a glance — styled as «Ланчбокс».
colors:
  frosted-ground: "oklch(0.969 0.006 255.5)"
  navy-ink: "oklch(0.267 0.054 269.1)"
  lid-white: "oklch(1 0 0)"
  cobalt: "oklch(0.514 0.192 265)"
  frost-step: "oklch(0.929 0.013 255.5)"
  frost-muted: "oklch(0.944 0.01 252.8)"
  slate-muted-ink: "oklch(0.526 0.045 262.7)"
  frost-accent: "oklch(0.938 0.018 261.3)"
  seam: "oklch(0.898 0.016 257.2)"
  input-stroke: "oklch(0.873 0.019 255.5)"
  tomato: "oklch(0.556 0.183 29.1)"
  amber-warning: "oklch(0.531 0.119 65.1)"
  lid-sky: "oklch(0.815 0.073 246.3)"
  lid-sunflower: "oklch(0.871 0.14 91.6)"
  lid-mint: "oklch(0.847 0.076 164.5)"
  lid-lilac: "oklch(0.81 0.075 301.4)"
  lid-apricot: "oklch(0.832 0.095 58.2)"
  caret-sky: "oklch(0.6 0.12 246.3)"
  caret-sunflower: "oklch(0.66 0.13 85)"
  caret-mint: "oklch(0.62 0.12 164.5)"
  caret-lilac: "oklch(0.6 0.13 301.4)"
  caret-apricot: "oklch(0.64 0.14 58.2)"
  night-ground: "oklch(0.212 0.035 268.5)"
  night-box: "oklch(0.255 0.04 266.9)"
  night-ink: "oklch(0.96 0.009 258.3)"
  cornflower-cobalt: "oklch(0.722 0.143 268.2)"
  cornflower-text: "oklch(0.21 0.052 270.1)"
  night-step: "oklch(0.312 0.047 267)"
  night-muted: "oklch(0.288 0.044 267.3)"
  night-muted-ink: "oklch(0.724 0.039 265)"
  night-seam: "oklch(0.34 0.048 267.7)"
typography:
  display:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.25
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.25
    fontFeature: "\"tnum\""
  title:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
  keypad:
    fontFamily: "Rubik Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "\"tnum\""
rounded:
  sm: "0.525rem"
  md: "0.7rem"
  lg: "0.875rem"
  xl: "1.225rem"
  lid-mark: "5px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.lid-white}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "44px"
  button-primary-dark:
    backgroundColor: "{colors.cornflower-cobalt}"
    textColor: "{colors.cornflower-text}"
    rounded: "{rounded.lg}"
    height: "44px"
  keypad-digit:
    backgroundColor: "{colors.frost-step}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.keypad}"
    rounded: "{rounded.lg}"
    height: "56px"
  keypad-operation:
    backgroundColor: "{colors.frost-muted}"
    textColor: "{colors.slate-muted-ink}"
    rounded: "{rounded.lg}"
    height: "56px"
  display-row-active:
    backgroundColor: "{colors.lid-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  display-row-idle:
    textColor: "{colors.navy-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.xl}"
    padding: "8px 16px"
  share-segment:
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.xl}"
    height: "48px"
  lid-mark:
    rounded: "{rounded.lid-mark}"
    size: "14px"
  input:
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "44px"
---

# Design System: Split the Portion

## Overview

**Creative North Star: "Ланчбокс"**

Every eater is a lid color. The calculator reads as lunchboxes laid out on a frosted counter: a cool, slightly blue polypropylene ground, navy ink for every number, one cobalt action, and a row of pastel lids (sky, sunflower, mint, lilac, apricot) that belong to people, not to the interface. The user chose this world out of three proposals («Ланчбокс», «Калькулятор», «Табло»).

The surface is a working tool for a phone at the stove: large tabular numerals, big thumb-reach keys, and almost no decoration. Depth comes from tonal steps (frosted ground, white lidded box, a frost-grey key), not from shadows. Color is quarantined: the lids appear only where a person owns the mark, so a glance at a color is a glance at a name. The tone avoids sterile medical coldness and the default shadcn look without letting anything compete with the grams.

Light and dark follow the phone's setting (next-themes, `defaultTheme="system"`, `.dark` on `<html>`). Dark is "night" polypropylene: navy ground, a lifted navy box, the same lids slightly deepened, and a lighter cornflower cobalt so the main action still reads.

**Key Characteristics:**
- Frosted cool-white ground, navy ink, a single plain cobalt primary.
- Five lid colors assigned by a person's place in today's lineup, repeating after five.
- Numbers first: tabular Rubik in medium weight, 30–36 px for answers.
- Flat, tonal layering; the active field is a white lidded box with a 1 px seam.
- Generous radii (0.875rem base, ~1.2rem on boxes and the share bar).
- A blinking caret that cycles through today's lids.

## Colors

A cool frosted neutral set with one saturated cobalt for action and five soft pastel lids reserved for people.

### Primary
- **Cobalt** (`cobalt`): the primary action («Сохранить»), focus rings (at 50% opacity), text selection, native input carets, and the caret's reduced-motion fallback. Plain fill, white text.
- **Cornflower Cobalt** (`cornflower-cobalt`, dark theme): the dark theme's primary, deliberately lighter than light-theme cobalt with navy text (`cornflower-text`) so the main action reads on the night ground. It is the same «кобальт» role adapted, not a second accent.

### Secondary (person lids)
- **Sky, Sunflower, Mint, Lilac, Apricot** (`lid-sky`, `lid-sunflower`, `lid-mint`, `lid-lilac`, `lid-apricot`; `--chart-1..5`): one per person by place in today's lineup. Light enough to carry navy text (`--chart-foreground`) in both themes. At 45% opacity a lid marks a person's own fixed portion on the share bar.
- **Caret lids** (`caret-sky` … `caret-apricot`; `--caret-1..5`): each lid's hue deepened to at least 3:1 against white, for the 3 px caret on the white box. In dark, the carets are the lids mixed 30% toward the ink in oklab (`color-mix(in oklab, var(--chart-N) 70%, var(--foreground))`); oklch mixing swung sunflower toward green.

### Tertiary (status)
- **Tomato** (`tomato`): validation errors and destructive actions only.
- **Amber Warning** (`amber-warning`): non-blocking warnings.

### Neutral
- **Frosted Ground** (`frosted-ground`): page and sticky keypad tray background.
- **Lid White** (`lid-white`): cards, popovers, and the active display box.
- **Navy Ink** (`navy-ink`): all text and numbers; also the text on lids.
- **Frost Step** (`frost-step`): digit keys (shadcn secondary).
- **Frost Muted** (`frost-muted`): operation keys, segmented-control track, unit chips.
- **Slate Muted Ink** (`slate-muted-ink`): labels, units («г»), sublines, placeholders.
- **Seam** (`seam`) and **Input Stroke** (`input-stroke`): 1 px borders, dividers, the active box's edge.
- Night counterparts: `night-ground`, `night-box`, `night-ink`, `night-step`, `night-muted`, `night-muted-ink`, `night-seam`.

### Named Rules
**The Color Quarantine Rule.** Lid colors appear only on person-owned marks: share-bar segments, the lid mark beside a name, and the caret. Chrome stays ink and cobalt.

**The Ring, Not Flood Rule.** Selection is a ring (`ring-2` in ink, inset), never a fill that would hide the person's color.

**The Plain Cobalt Rule.** Primary buttons are a flat cobalt fill with white (or, in dark, navy) text. The user declined decorated primary buttons.

## Typography

**Display Font:** Rubik Variable (with sans-serif)
**Body Font:** Rubik Variable (with sans-serif)

**Character:** One soft, rounded grotesk for everything; its friendly geometry keeps the tool homely rather than clinical, and its tabular figures keep grams aligned while typing.

### Hierarchy
- **Display** (500, 2.25rem, 1.25): calculator readouts («Сухой», «Готовый»); 1.5rem in compact mode for composite dishes.
- **Headline** (500, 1.875rem, 1.25): each person's answer; 1.5rem below 360 px.
- **Title** (600, 1.125rem): screen header titles.
- **Body** (400, 1rem): names, inputs, units next to readouts. Gram inputs stay ≥ 16 px.
- **Label** (400, 0.875rem, 1.25): field labels, sublines («53,8 % • 81 г сухого»), share-bar captions (500/600).
- **Keypad** (500, 1.5rem, tabular): digit keys.

### Named Rules
**The Tabular Grams Rule.** Every number a person reads or types uses tabular figures (`tabular-nums`, and all `inputmode="decimal"` inputs), so digits don't jump while typing.

**The Quiet Unit Rule.** Units and explanations sit one step down in size and in `slate-muted-ink`; the number carries the weight.

## Layout

Single column, phone-first. The calculator column is capped at 28rem and centered, with 12 px side padding and 20 px between sections (readouts, «Кто ест», results). The keypad is a 4-column grid with 8 px gaps, pinned in a sticky bottom tray (frosted ground at 95% with backdrop blur, top seam, safe-area padding). At `lg` (1024 px) the tray becomes static, the keypad hides, and a full-width large primary «Сохранить» replaces it; the tab bar moves to a left rail. Below 360 px controls tighten (smaller gaps and paddings, answer drops a size). No horizontal scroll at 375 px. Touch targets are at least 44 px; small visual marks (unit chip, «своя ×») reach 44 px through padding.

## Elevation & Depth

Flat by default, with tonal layering: frosted ground → white lidded box → frost-grey keys. Borders are 1 px seams. Shadows exist only on things that physically move or float: the round grip knobs on the share bar (`0 2px 6px rgb(0 0 0 / 0.18)`, lifting to `0 4px 12px rgb(0 0 0 / 0.22)` while dragged), the selected tab of the segmented control (`shadow-sm`), and a soft upward shadow under the mobile tab bar.

### Named Rules
**The Drag-Only Shadow Rule.** Only draggable or floating controls cast a shadow; boxes and keys are separated by tone.

## Shapes

Generously rounded, like molded plastic. Base radius 0.875rem (buttons, inputs, keys); display boxes, the answer field, and the share bar use ~1.2rem (`rounded-xl`). Lid marks are 14 px squares with 5 px corners, a small lid seen from above. Grips, chips, and the caret are fully round. Share-bar segments butt together, separated by a 2 px inset line of the ground color; only the bar's outer ends are rounded.

## Components

### Buttons
- **Shape:** gently rounded (0.875rem), 44 px tall; large 48 px.
- **Primary:** flat cobalt, white text, 500 weight; hover fades to 80%; press nudges down 1 px; disabled at 50% opacity. Dark: cornflower cobalt with navy text.
- **Focus:** 3 px ring in cobalt at 50%.
- **Outline / Ghost:** outline is ground fill with a seam border (± buttons); ghost is text-only with a muted hover («Поровну»).

### Keypad
Borderless color fields in a 4×4 grid, 56 px keys, 1.5rem medium tabular digits. Digits sit on frost step; operations (⌫, C, ↓) a frosted step quieter in muted ink. «Сохранить» spans two columns in plain cobalt with a check icon. Press scales to 0.97.

### Display Row (signature)
A calculator readout: label left, big number right with a small muted «г». The row being typed into is a white lidded box with a 1 px seam on the frosted ground; idle rows are borderless and pick up a faint white on hover. All rows share one height (80 px, 60 px compact) so they stack evenly.

### Caret (signature)
A 3 px rounded bar, 0.9em tall, after the typed number. It blinks (step timing, 1.06 s) and each time it reappears takes the next lid of today's lineup (`animate-caret-N`, one blink per color). With no people, or with reduced motion, it is a steady primary bar. On an inactive answer field it keeps its place transparently so nothing shifts.

### Share Bar (signature)
A 48 px bar split into person segments in their lid colors with navy names and grams. The selected person (the one ± adjusts) is ringed in ink, inset. A person's own fixed portion is the pale lid (45%) with a dashed ink-25% border; what stays in the pot is hatched (muted/ground diagonal stripes, 135°). Round 32 px grip knobs on the borders, 44 px hit area.

### Person Row
Lid mark, editable name (borderless input that shows a stroke on hover/focus), muted subline, then the answer field: a 30 px number that becomes a white lidded box when active, with a «г / %» unit chip that stays in place. Copy and hold-to-remove actions stacked at the end. Rows divided by seams.

### Inputs / Fields
- **Style:** 44 px, transparent fill, 1 px input-stroke border, 0.875rem radius; dark fill is input at 30%.
- **Focus:** border turns cobalt plus a 3 px cobalt ring at 50%.
- **Error:** tomato border with a tomato ring at 20%.

### Segmented Control («г | %»)
Frost-muted track, 0.875rem radius, 2 px inset; the chosen option is a ground-colored tab with `shadow-sm`, the other muted ink.

## Do's and Don'ts

### Do:
- **Do** give each person their lid by place in today's lineup (`--chart-1..5`), repeating after five, and put navy `--chart-foreground` text on it.
- **Do** mark the active field as a white lidded box with a 1 px seam; signal state by shape and border as well as color.
- **Do** keep every gram tabular and every gram input ≥ 16 px and ≥ 44 px tall.
- **Do** show selection as an inset ring that keeps the person's color visible.
- **Do** derive a new caret color by deepening the lid's hue to ≥ 3:1 on white (light) or mixing 30% toward the ink in oklab (dark).
- **Do** quote interface text in Russian and follow docs/SPEC.md §2 terminology («вес с тарой» / «вес без тары»).

### Don't:
- **Don't** use lid colors on chrome: buttons, headers, tabs, borders, and backgrounds stay ink, frost, and cobalt.
- **Don't** decorate the primary button (no gradients, patterns, or lid trims); it stays plain cobalt.
- **Don't** flood a selected segment or row with a new fill that hides the person's color.
- **Don't** mix theme colors in oklch when the hue matters; mix in oklab.
- **Don't** hardcode colors; use the shadcn theme variables.
- **Don't** use «нетто/брутто» anywhere in the interface.
