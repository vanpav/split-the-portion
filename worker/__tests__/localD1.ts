import { readdirSync, readFileSync } from 'node:fs'
import { getPlatformProxy } from 'wrangler'

const MIGRATIONS = 'worker/migrations'

/**
 * A fresh in-memory D1 (miniflare, the same engine as `pnpm dev`) with every migration applied.
 * Real SQL instead of a fake: the sync statements are what is under test.
 */
export async function localD1() {
  process.env.WRANGLER_LOG ??= 'error'
  const proxy = await getPlatformProxy<Env>({ persist: false })
  const db = proxy.env.DB
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = readFileSync(`${MIGRATIONS}/${file}`, 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('--'))
      .join('\n')
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
    await db.batch(statements.map((s) => db.prepare(s)))
  }
  return { db, env: proxy.env, dispose: () => proxy.dispose() }
}

/** A user who belongs to the given groups (created as needed); the first one to join a group owns it. */
export async function addMember(db: D1Database, userId: string, ...groupIds: string[]) {
  const at = '2026-10-06T12:00:00.000Z'
  await addUser(db, userId)
  for (const groupId of groupIds) {
    await db
      .prepare('insert or ignore into organization (id, name, slug, createdAt) values (?, ?, ?, ?)')
      .bind(groupId, groupId, groupId, at)
      .run()
    const owned = await db.prepare('select 1 from member where organizationId = ?').bind(groupId).first()
    await db
      .prepare('insert into member (id, organizationId, userId, role, createdAt) values (?, ?, ?, ?, ?)')
      .bind(`${groupId}-${userId}`, groupId, userId, owned ? 'member' : 'owner', at)
      .run()
  }
}

/** A user without groups. */
export async function addUser(db: D1Database, userId: string) {
  const at = '2026-10-06T12:00:00.000Z'
  await db
    .prepare('insert or ignore into user (id, name, email, emailVerified, createdAt, updatedAt) values (?, ?, ?, 0, ?, ?)')
    .bind(userId, userId, `${userId}@example.test`, at, at)
    .run()
}
