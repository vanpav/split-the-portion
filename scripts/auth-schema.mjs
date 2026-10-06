// SQL for Better Auth's tables as configured in worker/auth.ts, as a D1 migration (docs/CLOUDFLARE.md §5).
// Compared with the local D1, so apply what exists first (`pnpm db:migrate:local`); only what is
// missing is printed: `pnpm -s db:auth-schema > worker/migrations/NNNN_auth.sql`.
import { getMigrations } from 'better-auth/db/migration'
import { runnerImport } from 'vite'
import { getPlatformProxy } from 'wrangler'

const { env, dispose } = await getPlatformProxy({ persist: true })
try {
  const { module } = await runnerImport('./worker/auth.ts', { configFile: false, logLevel: 'error' })
  const { compileMigrations } = await getMigrations({ ...module.authOptions('http://localhost'), database: env.DB })
  process.stdout.write(await compileMigrations())
} finally {
  await dispose()
}
