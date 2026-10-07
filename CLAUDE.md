# Split the Portion

Web prototype: convert food weight raw ↔ cooked (accounting for tare) and split a cooked dish into portions for a calorie tracker. No backend; data lives in the browser (IndexedDB). Goal: validate the hypothesis fast, so don't overengineer — but the calculation core must be reliable.

## Docs (read before working)

- [docs/SPEC.md](docs/SPEC.md) — glossary, scenarios, formulas, rounding, validation, MVP/backlog, reference examples.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model, domain, store, storage, folder layout.
- [docs/UX.md](docs/UX.md) — screens, flows, wireframes, UI texts.
- [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) — server and D1: setup, migrations, secrets, deploy, backups, pricing.
- [docs/issue-loop.md](docs/issue-loop.md) — GitHub issues loop (`/loop 10m /poll-issues`).
- [docs/roadmap/](docs/roadmap/) — stages `NN-*.md` and `backlog.md`. One stage at a time; tick its checklist when done.

If code and a doc disagree, update the doc (or ask) first, then the code.

## Commands

```bash
pnpm dev          # Vite dev server
pnpm dev --host   # reach it from a phone on the same network
pnpm build        # tsc -b && vite build — must pass
pnpm lint         # oxlint
pnpm test         # vitest run
pnpm test:watch   # vitest watch mode
pnpm icons        # PWA icons from public/favicon.svg (after editing the drawing)
```

Server commands (D1, deploy): skill `server-sync`.

Before calling a task done: `pnpm lint && pnpm test && pnpm build`.

## Rules

### Calculations — only in `src/domain`, always with tests
- Every formula, rounding, number parsing or formatting lives in `src/domain`. Components and store compute nothing.
- `src/domain` is pure TypeScript: no React, DOM, `localStorage`, `Date.now()`, `Math.random()`.
- New or changed domain function = test in `src/domain/__tests__`. SPEC §11 reference examples live in `examples.test.ts`; don't change them without changing the spec.
- Compute at full precision, round only on output (`formatGrams`, `formatK`).

### Data
- Store and storage (IndexedDB) hold user input only. Derived values (k, shares, remainders, reconciliation) are never persisted.
- Changed the shape of stored data → bump `CURRENT_VERSION`, add a migration in `src/store/migrations.ts` and a test on an old-version fixture.
- Generate ids only via `newId()` (nanoid), never `crypto.randomUUID()` (absent over http on phones).

### Terminology
- No «нетто/брутто» or `net/gross` in UI, docs or code. UI says «вес с тарой» / «вес без тары»; code uses `withTare` / `food`.
- Other terms follow the SPEC §2 glossary; UI texts follow the UX §6 dictionary.
- «Группа» (shared account bookkeeping) and «Компания» (who eats, in what shares) are different things — don't mix.
- UI addresses the user as «ты» (singular imperative: «Введи», «Войди»; «твои блюда»), never «вы». This overrides the `ru-ui-copy` skill's default.
- «Ингредиент» everywhere in UI (not «продукт»). The letter `k` stays as it is.
- «Убрать» — a part from a set (person, portion, ingredient, group member); «Удалить» — a whole entity (dish, tare, company).
- Errors: one text per cause, never a catch-all like «Не получилось». Offline, no answer from the server, server 5xx and each known 4xx code get their own text that says what happened and what to do (table in `docs/UX.md` §6).
- Visible text and tooltips of a button next to the element it acts on never repeat the element's name: «Убрать», not «Убрать: Ваня». `aria-label` does name it, as «Убрать: Ваня» (colon, because a user-typed name can't be declined). A toast after the element is gone may name it too.

### Code
- For shadcn (search, examples, install) use the `shadcn` MCP server from `.mcp.json`.
- Strict TypeScript, no `any`. Model types come from `src/domain/types.ts`.
- **UI — shadcn/ui only.** Add primitives with `pnpm dlx shadcn@latest add <component>` into `src/components/ui`; own components compose them. "UI place → component" map: ARCHITECTURE §6.
- **State — Zustand** (`src/store`), persistence via its `persist` middleware.
- **Router — React Router v8**, hash mode (`createHashRouter`, `src/app/router.tsx`). **Ids — `newId()`** from `src/store/id.ts`.
- Styles: Tailwind classes in JSX, `cn()` from `@/lib/utils`. Colors only via shadcn theme variables, no hardcoded colors.
- Gram fields only via `components/NumberField` (`inputMode="decimal"`, comma and dot, font ≥ 16 px, height ≥ 44 px).
- **Screens, not overlays** (UX §3а). Anything with a lot of content (input, search, scrolling list) opens as its own full-screen route: own address, "←" and system back return to the exact previous state. From a `Select` or menu: close the list first, then open the screen. Over a screen only: `AlertDialog` confirmations, menus, `Select` without search, hints, toasts.
- Components are functions, one per file. Imports from `src` via the `@/` alias.

### Don't reinvent wheels
- If a ready library or shadcn component solves it, use it.
- If you think you must hand-write something (router, hook, utility, UI primitive), **ask the user first** with options and a recommendation. Never silently roll your own.
- Exception: `src/domain` calculation logic is ours and tested.
- New dependencies only after agreement, recorded in ARCHITECTURE §2. Open dependency questions: ARCHITECTURE §8.
- UI is in Russian; identifiers and code comments in English.

### Git
- The project has its own `git init` in this folder (it sits inside a foreign repo `~/Projects`; commit nothing there).
- Commits and PR titles: short `type: what was done` (`feat`, `fix`, `design`, `refactor`, `docs`, `chore`), no assistant mentions, no `Co-Authored-By` lines.

## Skills (loaded on demand)

- `codebase-overview` — directory map, entry points, where to look. Use instead of exploring.
- `server-sync` — `worker/`, D1, secrets, deploy, `src/sync`. Use for any server or sync change.
- `ui-verify` — verifying UI in the browser (375 px, PWA, two "devices"). After screen changes.
- `issue-workflow` — GitHub issues rules: who may assign, labels, branches, PRs.
- `ru-ui-copy` — any Russian UI string, in code or in docs/UX.md. **Everyone who touches UI text runs it and follows it**; the rules in Terminology above and UX §6 win over it.

## Working rules

- Read only files the task needs; use grep/glob, not whole directories.
- Read large files in fragments (offset/limit).
- Don't re-read files already read.
- Run tests narrowly: `pnpm vitest run <file>` or `-t "<name>"`. Full `pnpm lint && pnpm test && pnpm build` only before handing off.
- Test runs and broad code searches go through subagents `test-runner` and `code-searcher` to keep output out of the main context.
- Answer briefly: no code retelling, no closing summaries.
- If the task is unclear, ask one question instead of exploring the project.

## Compact instructions

When compacting, keep: changed files, decisions made (and why), current errors, unfinished steps. Drop: command output, logs, contents of files already read, search results.
