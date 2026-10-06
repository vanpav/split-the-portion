---
version: 1
slug: "src-index-css"
primary_target: "src/index.css"
related_targets: ["src/screens/Calculator"]
---

# App UI — visual style «Ланчбокс»

Scope: the whole app UI (shadcn/ui radix-nova, Tailwind v4), styled through shadcn theme tokens in `src/index.css` (`:root` light, `.dark` dark; dark follows the system via next-themes). Mode: Operate. Task: at the stove, two numbers in, each person's cooked and raw grams out, glanceable at arm's length. User anti-goals: sterile medical, decor competing with numbers, another default shadcn look. The user chose «Ланчбокс» out of three proposals (Ланчбокс, Калькулятор, Табло) and declined fancier primary buttons: keep them plain cobalt.

## Direction contract

THESIS: every eater is a lid color; the calculator reads as lunchboxes laid out on a frosted counter, not as a stock neutral dashboard.

OWN-WORLD: frosted polypropylene ground (cool white #F2F5F9 / night #121829), navy ink, cobalt primary; lids sky, sunflower, mint, lilac, apricot as `--chart-1..5` with navy `--chart-foreground`; Rubik; radius 0.875rem; keypad keys are borderless color fields; the active calculator field is a white lidded box with a 1px border. Color quarantine: lid colors only on person-owned marks (share bar segments, the lid mark by a name, the caret); chrome stays ink and cobalt. Selection is a ring, never a flood that hides the person's color.

STORY: the person at the stove sees the active field, types the cooked weight, reads each person's portion by name and lid color, saves.

FIRST VIEWPORT: calculator `/d/:id` at 375 px: readouts top (active one boxed), company picker and share bar of lids in the middle, person rows with lid marks, keypad bottom with cobalt «Сохранить».

SIGNATURE INTERACTION: the calculator caret blinks (step, 1.06 s) and each time it reappears takes the next lid of today's lineup (`animate-caret-N`, colors pulled 30% toward the ink for contrast); reduced motion — steady cobalt caret.

FORM: assigned direction, seed key eef51d0f, index 7 of the grounded list (meal-prep containers with colored lids). Code-led; no comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
