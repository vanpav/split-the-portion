import { nanoid } from 'nanoid'
import { PERSONAL_GROUP_NAME } from '../src/account/types'

/**
 * «Сбросить аккаунт» and «Удалить аккаунт» (docs/SPEC.md §13.2). Each is one D1 batch — a
 * transaction: it either happens whole or not at all, never half a wipe.
 */

// ?1 — the user. The groups where nobody else is left once the user goes: they go too.
const SOLO = `(select m.organizationId from member m where m.userId = ?1
  and not exists (select 1 from member o where o.organizationId = m.organizationId and o.userId != ?1))`

/**
 * Everything the account holds besides the sign-in: its own groups with their data, its place in
 * shared groups (whose data stays with the others), its codes, its profile and photo. A group the
 * user owns and others are in passes to the member who joined it first after them.
 */
function wipe(db: D1Database, userId: string): D1PreparedStatement[] {
  const s = (sql: string) => db.prepare(sql).bind(userId)
  return [
    s(`update member set role = 'owner' where id in (
         select (select o.id from member o where o.organizationId = m.organizationId and o.userId != ?1
                 order by o.createdAt, o.id limit 1)
         from member m where m.userId = ?1 and m.role = 'owner')`),
    // The foreign keys cascade too; said out loud so that nothing depends on it.
    s(`delete from record where group_id in ${SOLO}`),
    s(`delete from group_clock where group_id in ${SOLO}`),
    s(`delete from group_invite where group_id in ${SOLO}`),
    s(`delete from invitation where organizationId in ${SOLO}`),
    s(`delete from organization where id in ${SOLO}`),
    s('delete from member where userId = ?1'),
    s('delete from group_invite where created_by = ?1'),
    s('delete from invitation where inviterId = ?1'),
    s('delete from avatar where user_id = ?1'),
    s('update session set activeOrganizationId = null where userId = ?1'),
    s(`update user set firstName = null, lastName = null, nickname = null, image = null, defaultGroupId = null
       where id = ?1`),
  ]
}

/**
 * «Сбросить аккаунт»: the account is as if just created — an empty group of its own, no profile —
 * and signs in as before: the password, passkeys and sessions stay. Returns the new group's id.
 */
export async function resetAccount(db: D1Database, userId: string, now: Date) {
  const groupId = nanoid()
  const at = now.toISOString()
  await db.batch([
    ...wipe(db, userId),
    db
      .prepare('insert into organization (id, name, slug, createdAt) values (?, ?, ?, ?)')
      .bind(groupId, PERSONAL_GROUP_NAME, nanoid(), at),
    db
      .prepare(`insert into member (id, organizationId, userId, role, createdAt) values (?, ?, ?, 'owner', ?)`)
      .bind(nanoid(), groupId, userId, at),
  ])
  return groupId
}

/** «Удалить аккаунт»: the wipe, then the user with every way to sign in — password, passkeys, sessions. */
export async function deleteAccount(db: D1Database, userId: string) {
  const s = (sql: string) => db.prepare(sql).bind(userId)
  await db.batch([
    ...wipe(db, userId),
    s('delete from session where userId = ?1'),
    s('delete from account where userId = ?1'),
    s('delete from passkey where userId = ?1'),
    s(`delete from verification where identifier like 'reset-password:%' and value = ?1`),
    s('delete from user where id = ?1'),
  ])
}
