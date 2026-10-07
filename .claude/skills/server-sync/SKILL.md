---
name: server-sync
description: Rules for server code (worker/, D1, auth) and sync (src/sync). Use when touching worker/, wrangler config, migrations, secrets, deploy, or synchronization logic.
---

# Server and sync (stage 12+)

Details: `docs/CLOUDFLARE.md`, `docs/ARCHITECTURE.md` §9–10.

## Commands
```bash
pnpm db:migrate:local    # D1 migrations, local DB
pnpm db:migrate:remote   # production DB — BEFORE deploying code that needs them
pnpm -s db:auth-schema   # SQL for missing Better Auth tables (after editing worker/auth.ts) → new migration
pnpm wrangler types      # worker env types after editing wrangler.jsonc or .dev.vars
pnpm run deploy          # build + wrangler deploy (`pnpm deploy` is a built-in pnpm command)
```

## Rules
- Server code only in `worker/`; it never imports domain or parses dishes. Protocol types: `src/sync/protocol.ts`.
- The store knows nothing about the server: sync is a subscriber in `src/sync`. Logic = pure functions with tests in `src/sync/__tests__`.
- Secrets only in `.dev.vars` (gitignored) and `wrangler secret`. No keys in code or `wrangler.jsonc`.
- Changing the shape of stored data affects the server too: records carry version `v`; old versions are migrated on the client with the same `migrations`.
- D1 schema changes only via a new migration in `worker/migrations/`; never edit applied ones.
- Sign-in and Face ID work over HTTPS only: test on a phone via a preview deploy, not `pnpm dev --host`.
- After `pnpm db:migrate:local`, restart `pnpm dev`.
