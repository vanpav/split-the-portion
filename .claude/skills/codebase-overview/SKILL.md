---
name: codebase-overview
description: Map of the split-the-portion codebase — layers, key directories, entry points, naming conventions. Use before exploring the project or when unsure where code lives.
---

# Codebase map

Details: `docs/ARCHITECTURE.md` (§3 model, §4 domain, §5 store, §6 UI, §9 server, §10 sync). Here: only where things live.

## Layers (dependencies point down only)
`screens` → `components` → `store` → `domain`; `sync` subscribes to `store`; `worker` is a separate runtime and never imports domain.

| Dir | Contents |
|---|---|
| `src/domain` | pure TS: formulas, rounding, number parsing. Public API `index.ts`, types `types.ts`. Files by topic: `cooking`, `portions`, `split`, `shares`, `weighing`, `reconcile`, `remainder`, `validation`, `numbers` (formatting), `presets`, `menu` |
| `src/store` | Zustand: `createAppStore.ts`/`store.ts`, `migrations.ts` (data), `prefsMigrations.ts`, `idbStorage.ts` (IndexedDB), `backupFile.ts`, `id.ts` (`newId`), `account.ts`, `sync.ts` |
| `src/sync` | pure sync logic: `diff`, `merge`, `outbox`, `engine`, `runner`, `transport`; protocol types in `protocol.ts` |
| `src/screens` | one folder per screen: DishList, DishEditor, Calculator, Settings, Account, Copy, Join |
| `src/components` | shared components (`NumberField` etc.); `ui/` is shadcn only |
| `src/app` | router (`router.tsx`, hash), `paths.ts`, `RootLayout`, screen animations, `useBack` |
| `src/account` | sign-in client (Better Auth) |
| `src/lib` | `utils.ts` (`cn`) and small helpers |
| `worker/` | Cloudflare Worker (Hono): `index.ts` entry, `auth.ts`, `sync.ts`, `invites.ts`, `me.ts`; `migrations/` D1 SQL |
| `docs/` | SPEC, ARCHITECTURE, UX, CLOUDFLARE, `roadmap/NN-*.md` |

## Entry points
- Client: `index.html` → `src/main.tsx` → `src/app/router.tsx`.
- Server: `worker/index.ts` (config `wrangler.jsonc`).
- Tests sit next to code: `<dir>/__tests__/*.test.ts`; SPEC §11 references: `src/domain/__tests__/examples.test.ts`.

## Conventions
- Components `PascalCase.tsx`, one per file; the rest `camelCase.ts`.
- Imports from `src` via `@/`.
- Weights in code: `withTare` / `food` (never net/gross).
- Ids via `newId()`; UI via shadcn; numbers in UI via `NumberField`.
- Identifiers and comments in English, UI text in Russian.

## Where to look
- Formula or rounding → `src/domain` (grep the function name in `index.ts`).
- UI texts → `docs/UX.md` §6.
- Shape of stored data → `src/domain/types.ts` + `src/store/migrations.ts`.
- Route → `src/app/paths.ts`, `router.tsx`.
