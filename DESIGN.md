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
  lid-teal: "oklch(0.78 0.11 196)"
  lid-rose: "oklch(0.79 0.12 10)"
  lid-pistachio: "oklch(0.78 0.12 118)"
  lid-lavender: "oklch(0.87 0.06 276)"
  lid-peony: "oklch(0.87 0.09 342)"
  caret-sky: "oklch(0.6 0.12 246.3)"
  caret-sunflower: "oklch(0.66 0.13 85)"
  caret-mint: "oklch(0.62 0.12 164.5)"
  caret-lilac: "oklch(0.6 0.13 301.4)"
  caret-apricot: "oklch(0.64 0.14 58.2)"
  caret-teal: "oklch(0.6 0.1 196)"
  caret-rose: "oklch(0.62 0.13 10)"
  caret-pistachio: "oklch(0.6 0.12 118)"
  caret-lavender: "oklch(0.6 0.12 276)"
  caret-peony: "oklch(0.62 0.13 342)"
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
    fontSize: "1.875rem"
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
    height: "48px"
  button-primary-dark:
    backgroundColor: "{colors.cornflower-cobalt}"
    textColor: "{colors.cornflower-text}"
    rounded: "{rounded.lg}"
    height: "48px"
  dish-chip:
    backgroundColor: "{colors.frost-step}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  dish-chip-current:
    backgroundColor: "{colors.lid-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 14px"
    height: "36px"
  round-icon-button:
    backgroundColor: "{colors.frost-step}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.full}"
    size: "44px"
  readout-tile-active:
    backgroundColor: "{colors.lid-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  readout-tile-idle:
    backgroundColor: "{colors.frost-muted}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.display}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
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

Every eater is a lid color. The calculator reads as lunchboxes laid out on a frosted counter: a cool, slightly blue polypropylene ground, navy ink for every number, one cobalt action, and a row of pastel lids (sky, sunflower, mint, lilac, apricot, then teal, rose, pistachio, lavender, peony) that belong to people, not to the interface. The user chose this world out of three proposals («Ланчбокс», «Калькулятор», «Табло»).

The surface is a working tool for a phone at the stove: large tabular numerals typed with the phone's own number keyboard, and almost no decoration. Depth comes from tonal steps (frosted ground, white lidded box, a frost-grey chip), not from shadows. Color is quarantined: the lids appear only where a person owns the mark, so a glance at a color is a glance at a name. The tone avoids sterile medical coldness and the default shadcn look without letting anything compete with the grams.

Light and dark follow the phone's setting (next-themes, `defaultTheme="system"`, `.dark` on `<html>`). Dark is "night" polypropylene: navy ground, a lifted navy box, the same lids slightly deepened, and a lighter cornflower cobalt so the main action still reads.

**Key Characteristics:**
- Frosted cool-white ground, navy ink, a single plain cobalt primary.
- Ten lid colors assigned by a person's place in today's lineup, repeating after ten.
- Numbers first: tabular Rubik in medium weight, 30 px for readouts and answers.
- Flat, tonal layering; the active field is a white lidded box with a 1 px seam, idle tiles sit a frosted step below.
- Generous radii (0.875rem base, ~1.2rem on boxes and the share bar).
- A caret that cycles through today's lids.

## Colors

A cool frosted neutral set with one saturated cobalt for action and ten soft pastel lids reserved for people.

### Primary
- **Cobalt** (`cobalt`): the primary «Создать / Сохранить» in the dish editor, focus rings (at 50% opacity), text selection, native input carets, and the calculator caret with no people or with reduced motion. Plain fill, white text. The calculator has no save action: the dish remembers what is typed, so the calculator carries no cobalt button.
- **Cornflower Cobalt** (`cornflower-cobalt`, dark theme): the dark theme's primary, deliberately lighter than light-theme cobalt with navy text (`cornflower-text`) so the main action reads on the night ground. It is the same «кобальт» role adapted, not a second accent.

### Secondary (person lids)
- **Sky, Sunflower, Mint, Lilac, Apricot** (`lid-sky`, `lid-sunflower`, `lid-mint`, `lid-lilac`, `lid-apricot`; `--chart-1..5`): one per person by place in today's lineup. Light enough to carry navy text (`--chart-foreground`) in both themes.
- **Teal, Rose, Pistachio, Lavender, Peony** (`lid-teal` … `lid-peony`; `--chart-6..10`): the sixth to tenth, so a meal prep on ten days has ten different lids. Their hues sit between the first five (196, 10, 118, 276, 342), and they are as far from those and from each other (≥ 0.066 in oklab) as the first five are among themselves; teal and rose are a little deeper, lavender and peony a little lighter, so neighbours on the bar differ in lightness too. Navy text on them is ≥ 7:1. In dark they are deepened like the first five (about −0.055 L, +0.01 C). Mixed 45% into the ground a lid marks a person's own fixed portion on the share bar (`--chart-N-pale`). In dark that pale lid went muddy (apricot turned brown), so there the own portion is the lid as an outline instead: the ground tinted 20% toward the lid, the number and the dashed edge in the lid itself (`--chart-N-pale-foreground`).
- **Caret lids** (`caret-sky` … `caret-peony`; `--caret-1..10`): each lid's hue deepened to at least 3:1 against white, for the caret on the white box. In dark, the carets are the lids mixed 30% toward the ink in oklab (`color-mix(in oklab, var(--chart-N) 70%, var(--foreground))`); oklch mixing swung sunflower toward green.

### Tertiary (status)
- **Tomato** (`tomato`): validation errors and destructive actions only.
- **Amber Warning** (`amber-warning`): non-blocking warnings.

### Neutral
- **Frosted Ground** (`frosted-ground`): page and sticky shelf background.
- **Lid White** (`lid-white`): cards, popovers, the active readout tile, and the current dish chip.
- **Navy Ink** (`navy-ink`): all text and numbers; also the text on lids.
- **Frost Step** (`frost-step`): dish chips, and the round search / «Все блюда» / «⋯» buttons (shadcn secondary).
- **Frost Muted** (`frost-muted`): idle readout tiles (at 60%; 20% in dark, so they sink toward the night ground), segmented-control track, unit chips.
- **Slate Muted Ink** (`slate-muted-ink`): labels, units («г»), sublines, placeholders.
- **Seam** (`seam`) and **Input Stroke** (`input-stroke`): 1 px borders, dividers, the active box's edge.
- Night counterparts: `night-ground`, `night-box`, `night-ink`, `night-step`, `night-muted`, `night-muted-ink`, `night-seam`.

### Named Rules
**The Color Quarantine Rule.** Lid colors appear only on person-owned marks: share-bar segments, the lid mark beside a name, and the caret. Chrome stays ink and cobalt.

**The Ring, Not Flood Rule.** Selection is a ring (`ring-2` in ink, inset), never a fill that would hide the person's color. The current dish chip on the shelf takes the same mark.

**The Plain Cobalt Rule.** Primary buttons are a flat cobalt fill with white (or, in dark, navy) text. The user declined decorated primary buttons.

## Typography

**Display Font:** Rubik Variable (with sans-serif)
**Body Font:** Rubik Variable (with sans-serif)

**Character:** One soft, rounded grotesk for everything; its friendly geometry keeps the tool homely rather than clinical, and its tabular figures keep grams aligned while typing.

### Hierarchy
- **Display** (500, 1.875rem, 1.25): calculator readout tiles («Сухой» or «Сырой», «Готовый»); 1.5rem below 360 px. Digits are grouped like every gram («3 160»); while the field has focus, they show as typed («3160»).
- **Headline** (500, 1.875rem, 1.25): each person's answer; 1.5rem below 360 px.
- **Title** (600, 1.125rem): screen header titles.
- **Body** (400, 1rem): names, inputs, units next to readouts. Gram inputs stay ≥ 16 px.
- **Label** (400, 0.875rem, 1.25): tile labels above the number (500 and ink on the active tile, muted on idle ones; «Готовый · 17:19» when the cooked weight was remembered today), dish chips (500; 600 when current), sublines («81 г сухого»), share-bar names (0.875rem, 600).

### Named Rules
**The Tabular Grams Rule.** Every number a person reads or types uses tabular figures (`tabular-nums`, and all `inputmode="decimal"` inputs), so digits don't jump while typing.

**The Quiet Unit Rule.** Units and explanations sit one step down in size and in `slate-muted-ink`; the number carries the weight.

## Layout

Single column, phone-first. The calculator is the home screen; there is no tab bar. Its header is the dish shelf: sticky, frosted ground at 95% with backdrop blur and a bottom seam, across the whole width like every screen header — search at the left edge where «←» stands elsewhere, «⋯» at the right edge, the chips between (on a desktop, all of them in sight). Other screens use a sticky header with back, title, and «⋯», and keep their main action in a bottom bar under the thumb (static from `lg`). One exception: the «Популярные блюда» picker, a long list where people tick and type, gives the bar's height to the list and carries its single action as a text button at the header's right (see Popular Dishes Picker).

The calculator column is capped at 28rem (42rem from `lg`, 1024 px) and centered, with 12 px side padding and 16 px between sections (readouts, «Кто ест»). Readouts are a two-column grid of tiles with 8 px gaps («Сухой | Готовый»); a quiet line under them carries the tare, the weight without it and k. Readouts and answers are plain fields: a tap opens the phone's number keyboard, and nothing is pinned to the bottom (the column ends with safe-area padding). At `lg` a muted hint line («Enter или ↓ — следующее поле.») sits under the people. Below 360 px controls tighten (smaller gaps and paddings, numbers drop a size). No horizontal scroll at 375 px. Touch targets are at least 44 px; small visual marks (dish chips, unit chip, «своя ×») reach 44 px through padding.

## Elevation & Depth

Flat by default, with tonal layering: frosted ground → white lidded box → frost-grey chips. Borders are 1 px seams. Shadows exist only on things that physically move or float: the round grip knobs on the share bar (`0 2px 6px rgb(0 0 0 / 0.18)`, lifting to `0 4px 12px rgb(0 0 0 / 0.22)` while dragged), the selected tab of the segmented control (`shadow-sm`), and floating menus and dialogs (the «⋯» menu, search). The sticky shelf separates from content with a seam and blur, not a shadow.

### Named Rules
**The Drag-Only Shadow Rule.** Only draggable or floating controls cast a shadow; boxes, tiles, and chips are separated by tone.

## Shapes

Generously rounded, like molded plastic. Base radius 0.875rem (buttons, inputs); readout tiles, the answer field, and the share bar use ~1.2rem (`rounded-xl`). Lid marks are 14 px squares with 5 px corners, a small lid seen from above. Grips, dish chips, and the round header buttons are fully round. Share-bar segments butt together, separated by a 2 px inset line of the ground color; only the bar's outer ends are rounded.

## Components

### Buttons
- **Shape:** gently rounded (0.875rem), 44 px tall; large 48 px.
- **Primary:** flat cobalt, white text, 500 weight; hover fades to 80%; press nudges down 1 px; disabled at 50% opacity. Dark: cornflower cobalt with navy text. It lives in the dish editor's bottom bar («Создать» / «Сохранить», large, beside an outline «Отмена»).
- **Round icon buttons:** 44 px frost-step circles for search, «Все блюда», and «⋯» in headers.
- **Focus:** 3 px ring in cobalt at 50%.
- **Outline / Ghost:** outline is ground fill with a seam border (± buttons); ghost is text-only with a muted hover («Поровну»).
- **Header text action:** a ghost button at the header's right edge, 44 px, 1rem. Idle it is a way out in `slate-muted-ink`, 500 («Пропустить»); once there is something to commit it becomes the action in cobalt, 600 («Добавить»), with a cobalt wash at 12% on hover. Only on the «Популярные блюда» picker.

### Dish Shelf (signature)
The calculator's header. Round search and «Все блюда» buttons sit at the start, outside the scroll, always in reach; then a sideways-scrolling row of dish chips ordered by last use (fixed while the shelf is open, so a chip never jumps under the finger); «⋯» at the end. Chips are 36 px frost-step pills, 0.875rem text, on a 44 px hit area, each starting with the 16 px category icon (muted; ink on the current chip). The current dish is a white chip ringed in ink (`ring-2`, inset, 600 weight), never filled with cobalt. The scroll's edges fade with a mask so a chip running under them reads as «more this way». Search and «Все блюда» show a tooltip; search's tooltip carries ⌘K and «/» as key caps.

### «⋯» Menu
A round 44 px frost-step trigger at the right of every header. It opens a dropdown of 44 px items with 1rem text and an icon: the screen's rare actions («Изменить «…»», «Добавить блюдо»), a separator, then «Настройки». When the user has to act, an amber-warning dot ringed in the ground color sits on «⋯» and beside «Настройки».

### Dish Search
A full-screen list (`#/dishes`, and the same list in the dish editor's «Из блюда»), no filters and no sort: a 16 px field («Гречка, суп…») and sections under it — «Часто готовишь», «Остальные · по алфавиту», «Добавить из популярных»; typed, «Твои блюда» and the popular ones. One row everywhere, 48 px and more: the title left (1rem, one line), an optional second line (0.75rem, muted, one line — the products of a composite dish, or the product the dish was found by), the usual weight right (0.875rem, muted, tabular), then a round 32 px `secondary` «+» when a tap adds something. The query is marked with `bg-primary/15` `<mark>`. While something is typed the last row is «Создать «…»»: primary text, a dashed round «+». The header has a round 44 px `secondary` «+» («Добавить блюдо») before «⋯». Opens from the shelf, ⌘K / Ctrl+K, or «/».

In the dish menu's field, at the end: ✕ (only while something is typed), then a round 40 px «По категориям» toggle with the `ListTree` icon (tooltip and `aria-label` «По категориям», `aria-pressed`). Off: transparent, muted icon, a muted background on hover. On: `secondary` fill, `ring-2` in ink (inset), ink icon, the same mark as the current chip. It never takes the focus from the field. Grouped, the section headings are the category names (0.75rem, muted) with the count right (muted, tabular), no icons beside the names. Every dish row starts with the category icon in an 18 px muted slot; lucide line icons, one per category — Soup (first courses), Drumstick (mains), Wheat (sides), Salad, EggFried (breakfast), CakeSlice (baking and sweets), CupSoda (drinks), Utensils (other); `DishCategoryIcon` holds the only map. The create row has no icon.

### Popular Dishes Picker
`#/popular`: the whole catalogue of popular dishes to tick, with the weight editable in the row, added all at once. Header: «←», the title, and the header text action at the right («Пропустить» muted while nothing is ticked, «Добавить» in cobalt after) — no bottom bar. Under it a muted 0.875rem lead, the 16 px search field and a row of filter chips styled as dish chips (36 px frost-step pills with the category icon and a muted tabular count; the chosen one white and ringed in ink): «Все», «✓ Отмечено» once something is ticked, then the categories. Sections are the category names (0.75rem, muted, count) with a cobalt «Отметить все» at the right. A row is 56 px and up: the 18 px category icon (muted; ink when ticked), the title (1rem, up to two lines; 500 when ticked), the products of a composite dish below (0.75rem muted, one line), the weight field, and a 32 px round mark — `secondary` «+», or an ink fill with «✓» when ticked (the same mark as «+» in Dish Search turned on). The weight is a `NumberField` 88 × 44 px with a muted «г»: unticked it has no border or fill and reads muted (still 1rem, like every gram input), so the list stays quiet; ticked it is a white box with the input stroke, 1rem 500 tabular — the field shape itself says «this is yours to change». Focus is the cobalt ring; an invalid number turns the edge tomato. No lid colors anywhere: dishes are not people.

### Readout Tiles (signature)
A calculator readout as a tile: the label above, a 30 px number below with a small muted «г». «Сухой | Готовый» sit side by side. Idle tiles are borderless frost-muted fields at 60% (20% in dark) that pick up white on hover; the one being typed into is the white lidded box with a 1 px seam and an ink label. An error («вес меньше тары») turns the edge tomato. A composite dish with several counted ingredients shows «Сырой | Готовый» the same way, never folding: the «Сырой» tile carries the summed raw weight and a 0.75rem muted two-line note («5 ингредиентов,» / «не в счёт: Вода, Соль»). Its body selects the raw view (the white lidded box, «Готовый» goes idle); a round 36 px secondary knob with «›» in its top-right corner (44 px hit area, a sibling of the body button) opens the «Ингредиенты» screen.

### Caret (signature)
The field's own text caret; the system blinks it. Its color steps through the lids of today's lineup, one per 1.06 s (`animate-caret-N` on `caret-color`). With no people, or with reduced motion, it is primary.

### Share Bar (signature)
A 48 px bar split into person segments in their lid colors, one title each, never grams: the name (0.875rem, 600), in «Доли» the portion's number; a narrow segment drops a name first, a number stays down to a 1rem segment, so ten portions on a phone still read 1…10. The width alone says the share; the grams live once, in the person's row or the portion's container (the segment's `aria-label` still carries them). The selected person (the one ± adjusts) is ringed in ink, inset. 12 px of air separates it from the controls row: − and + (outline, 44 px) hug the chosen one's lid, with no name and no grams: a 22 px square with 7 px corners in their lid color (in «Доли» a 28 px lid with 8 px corners and the portion's number, like the containers' lids enlarged); «Поровну» (ghost) at the right. No percent anywhere: a part is the segment's width. The chosen one is also marked below: in the row or container (see Person Row, Portion Grid). A person's own fixed portion is the pale lid (45%) with a dashed ink-25% border (in dark: the lid as an outline — a barely tinted ground, lid-colored number and dashed edge at 60%); what stays in the pot is hatched (muted/ground diagonal stripes, 135°). Round 32 px grip knobs on the borders, 44 px hit area. A grip shows only where both segments beside it are at least 4rem wide (a container query on the bar picks the width at which it no longer fits); the chosen segment's two borders, and the one being dragged, always keep theirs. The width at which a grip no longer fits is picked in 2rem steps with a hair of slack, so equal portions get their grips all together or not at all. So two to four people look as before, while seven portions on a phone are a clean row of lids with grips only around the chosen one — the first until another is tapped, so there are always grips to pull. Nobody yet: the bar's place is held by an empty bar, 48 px, dashed seam, «+ Добавьте людей» in muted 0.875rem, so the first person and a switch to «Доли» move nothing. It is the label of «+ Имя»: a tap puts the cursor there (and opens the phone's keyboard); on hover the seam darkens and a frost-muted wash comes up.

### Portion Grid («Доли»)
A meal prep is containers on the counter, not a list of people. Each portion's grams show exactly once. Above the grid one answer line: «по 80 г» in the 30 px headline, then muted «× 7 · 29 г сухого», with ⧉ at the end when the portions are equal (one tracker text for all); unequal ones show «73–79 г · 7 порций по долям», own ones a muted «своя: 5 — 120 г» under it. The portions that share are equal: their containers carry no grams, only the number large in the lid (34 px with 1.0625rem 600 numerals) in a 64 px idle box, four to a row; the chosen one is the white lidded box with a 1 px seam and the lid ringed (2 px ground, 2 px ink); a tap on the chosen one opens its own-portion field; an own portion among them keeps its grams in a container across the whole row. The containers of the portions that share come first, own ones after them, as on the bar; each keeps its number. Otherwise (the sharing portions differ) the containers sit three to a row (two below 360 px, four from `lg`), 8 px apart: each is an idle readout tile (frost-muted at 60%, 20% in dark; the one being typed into is the white lidded box with a 1 px seam), with the portion's number in its lid (a 22 px lid with 6 px corners, 0.75rem 600 navy) at the top left, the amount in 24 px medium tabular with a small muted unit, and the other view under it (0.75rem muted, «29 г сухого»). The chosen container is the white lidded box with the lid ringed. Before weighing a container holds only its number, large (the lid grows to 40 px with 1.25rem 600 numerals); the answer line is hidden. An own portion is outlined dashed in ink at 25%, the same mark as its segment. ⧉ sits top right only where it is needed: on an own portion, and on every container when the portions differ. With «Состав» on, the recipe sits where ⧉ sits: once under the answer line when the portions are equal; in the tile under a hairline when it is own (the tile then spans the whole row, the others keep their layout) or when the portions differ (two tiles to a row). No swipe and no ×: portions are numbered by place, so «−» beside «Доли» is the remove.

### Settings Hub
`#/settings` on a phone reads what is set up without opening anything. On top, the account card: a white lidded box (signed out — a frost-step circle with a phone icon, «Блюда только на этом устройстве», a large cobalt «Войти»; signed in — a 44 px avatar (photo, else initials on frost-step), the name, the email and the one-line sync status, then the open group's row: its people's photos stacked, its name by people («Ваня и ты»), «Группа: общие блюда, тара и компании». Account people are photos or initials on frost-step circles, never lids). Below, clusters titled in muted 0.875rem 500 («Кухня», «Приложение»), each one white box of rows split by seams; a row is a 20 px muted icon, a 500 title, a muted subline, a glance at the content, and a «›». «Компании» shows each company as its people's lid marks stacked with a 2 px card-colored ring (the same lids, by place, as in the calculator), the name; «Тара» shows tares as frost-step pills «Кастрюля 3 л 850 г». The theme is three thumbnails of the calculator (ground, chips, an idle and a white tile, a two-lid bar), drawn by the theme's own tokens through a `.light` / `.dark` scope; «Как в системе» cuts day and night on the diagonal; the chosen one takes the ink ring with a 2 px ground offset. «Подсказки» is a cobalt `Switch` whose whole row is its label. From `md` the same clusters label the left menu; the open subsection is a white plate ringed in ink.

### Person Row
Lid mark, editable name (borderless input that shows a stroke on hover/focus), muted subline, then the answer field: a 30 px number that becomes a white lidded box when active, in grams only. Before weighing there is no answer: the row is the lid, the name and the actions. Copy and hold-to-remove actions stacked at the end. Rows divided by seams. The chosen row (the one − and + adjust, picked by a tap on the row outside the name field, the number and the buttons, or on the bar) is a frosted plate (muted at 60%, 20% in dark, 1.225rem corners) with a 2 px ink ring round its lid, 2 px of ground between, and a 600 name. With «Состав» on (composite dishes), a recipe sits under the row from the name to the answer, never under the actions.

### Composition Toggle («Состав»)
A 44 px `Toggle` at the end of the picker row. Off: outline. On: card background and an inset 2 px ink ring (the same mark as the current dish chip), `aria-pressed`. The recipe it reveals is «name … grams», 0.875rem, names muted and wrapping up to two lines, grams nowrap, tabular, right-aligned on the first line; two columns while every name of the dish is short, one column everywhere once any is long. It opens with a 220 ms grid-rows reveal (none with reduced motion).

### Inputs / Fields
- **Style:** 44 px, transparent fill, 1 px input-stroke border, 0.875rem radius; dark fill is input at 30%.
- **Focus:** border turns cobalt plus a 3 px cobalt ring at 50%.
- **Error:** tomato border with a tomato ring at 20%.
- **With an icon:** the icon sits inside the field at the start, muted (`InputGroup`): the dish menu's search, «+ Имя» under people (the whole width, 16 px text).

## Do's and Don'ts

### Do:
- **Do** give each person their lid by place in today's lineup (`--chart-1..10`), repeating after ten, and put navy `--chart-foreground` text on it.
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
