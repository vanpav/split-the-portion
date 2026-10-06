# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the authors — a couple (Ваня и Ксюша) who cook at home and log what they eat in a calorie tracker. Later, if the hypothesis holds, other people with the same job: they cook for themselves or a household and want to log their portion in raw weight.

The job: at the stove, after weighing the finished dish, find out in a couple of seconds how much cooked food goes on each plate and what that is in raw weight for the tracker.

## Product Purpose

Split the Portion converts food weight between raw and cooked, accounting for the container it was weighed in, and splits a cooked dish into portions by shares. The output is what each person puts on their plate (cooked grams) and what they log (raw grams).

Hypothesis under test: if the numbers are there in seconds at the stove, people weigh and log more accurately and stop giving up because of mental arithmetic.

Success: the calculator is opened for every cooking, two numbers are typed, the plates are filled from the screen, and the raw weight is copied into the tracker without recalculating.

## Positioning

A unit converter for one cooking, not a food database or a calorie counter. The mechanism neighbouring products do not have: the yield coefficient k of today's pot (cooked ÷ raw), tare subtraction from a container library, and a split by arbitrary shares across a household («Ваня 70 : Ксюша 60»), with leftovers re-weighed the next day.

## Operating Context

- Phone at the stove: kitchen scale, pot or container on it, often wet or busy hands, a glance of a few seconds. Kitchen light, day and evening; dark theme follows the system setting.
- Desktop is secondary (planning, settings, history).
- Daily loop: tap a dish → type the cooked weight on the in-app keypad → read each person's portion → copy the raw weight into the tracker. Setup (dishes, containers, companies) is rare.
- Works offline in the browser; opened over local Wi-Fi on the phone during development (no clipboard over http — fallback dialog).

## Capabilities and Constraints

- Simple dishes (one product) and composite dishes (several ingredients, some «не учитывать»); calculator, saved cookings, history, re-weighing leftovers, «Разделить на N», companies with shares, tare library, backup to a JSON file.
- No backend, accounts, sync, product database or calorie counting. Data in IndexedDB.
- Interface in Russian. Numbers accept comma and dot. Grams fields open the decimal keyboard, font ≥ 16 px, height ≥ 44 px.
- UI is built only from shadcn/ui primitives (radix-nova style) themed through CSS variables; Tailwind v4; lucide icons.
- Terminology: «вес с тарой» / «вес без тары», never «нетто/брутто»; «сухой» for simple dishes, «сырой» for composite; k shown as «k = 2,4».

## Brand Commitments

- Name: Split the Portion; browser title «Порции».
- Voice: plain, short, kitchen-practical Russian; numbers first, explanations quiet.

## Evidence on Hand

- Reference examples with exact numbers: docs/SPEC.md §11 (гречка, суп, остаток гречки) — usable as demonstration data.
- No real usage data yet: docs/roadmap/mvp-notes.md is an empty log. No logo, imagery, testimonials or user counts exist; do not fabricate them.

## Product Principles

1. Numbers first: grams are read in a glance from arm's length; everything else steps back.
2. Nothing is saved until the user says so; calculation never depends on saving.
3. Honest arithmetic: full precision inside, rounding only on display, and the screen always reconciles (distributed vs. in the pot).
4. Setup once, then two numbers a day.
5. Not a medical or diet-shaming tool: it helps share food at home, without judgement or clinical coldness.

## Accessibility & Inclusion

Large touch targets (≥ 44 px) and legible numerals for use with busy hands at arm's length; no horizontal scroll at 375 px; active state never by color alone.
