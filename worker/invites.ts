import { customAlphabet, nanoid } from 'nanoid'
import { INVITE_ALPHABET, INVITE_DAYS, INVITE_LENGTH } from '../src/account/inviteCode'
import { type Invite, type InvitePreview, MAX_GROUPS } from '../src/account/types'
import type { Auth } from './auth'
import { isMember } from './sync'

const newCode = customAlphabet(INVITE_ALPHABET, INVITE_LENGTH)
const DAY_MS = 24 * 60 * 60 * 1000

/** The group's working code, or a new one for 7 days: one code a group, not one per tap. */
export async function inviteCode(db: D1Database, groupId: string, userId: string, now: Date): Promise<Invite> {
  const active = await db
    .prepare('select code, expires_at from group_invite where group_id = ? and revoked = 0 and expires_at > ? order by created_at desc')
    .bind(groupId, now.toISOString())
    .first<{ code: string; expires_at: string }>()
  if (active) return { code: active.code, expiresAt: active.expires_at }
  const invite = { code: newCode(), expiresAt: new Date(now.getTime() + INVITE_DAYS * DAY_MS).toISOString() }
  await db
    .prepare('insert into group_invite (code, group_id, created_by, created_at, expires_at) values (?, ?, ?, ?, ?)')
    .bind(invite.code, groupId, userId, now.toISOString(), invite.expiresAt)
    .run()
  return invite
}

/** What a working code leads to; null — unknown, expired or revoked. */
export async function previewInvite(db: D1Database, code: string, now: Date): Promise<InvitePreview | null> {
  const row = await db
    .prepare(
      `select i.group_id as groupId, o.name as groupName, u.email as invitedBy
       from group_invite i join organization o on o.id = i.group_id join user u on u.id = i.created_by
       where i.code = ? and i.revoked = 0 and i.expires_at > ?`,
    )
    .bind(code, now.toISOString())
    .first<{ groupId: string; groupName: string; invitedBy: string }>()
  return row && { groupId: row.groupId, groupName: row.groupName, invitedBy: row.invitedBy.split('@')[0] }
}

/** How many groups the user is in. */
export async function groupCount(db: D1Database, userId: string) {
  const row = await db.prepare('select count(*) as n from member where userId = ?').bind(userId).first<{ n: number }>()
  return row?.n ?? 0
}

/**
 * Joins the group of a working code; already in it — nothing to do. Returns the group id,
 * null for a code that does not work, 'limit' when the user is already in `MAX_GROUPS` groups.
 */
export async function acceptInvite(auth: Auth, db: D1Database, code: string, userId: string, now: Date) {
  const invite = await previewInvite(db, code, now)
  if (!invite) return null
  if (!(await isMember(db, invite.groupId, userId))) {
    if ((await groupCount(db, userId)) >= MAX_GROUPS) return 'limit'
    // Server-only Better Auth call (no HTTP route): this code is the permission check.
    await auth.api.addMember({ body: { userId, organizationId: invite.groupId, role: 'member' } })
  }
  return invite.groupId
}

/** Only the owner revokes; true — there was such a code of this group. */
export async function revokeInvite(db: D1Database, groupId: string, code: string) {
  const { meta } = await db.prepare('update group_invite set revoked = 1 where code = ? and group_id = ?').bind(code, groupId).run()
  return meta.changes > 0
}

/** The user's role in the group; null — not in it. */
export async function roleIn(db: D1Database, groupId: string, userId: string) {
  const row = await db
    .prepare('select role from member where organizationId = ? and userId = ?')
    .bind(groupId, userId)
    .first<{ role: string }>()
  return row?.role ?? null
}

/** A new group owned by the user; 'limit' when they are already in `MAX_GROUPS` groups. */
export async function createGroup(auth: Auth, db: D1Database, userId: string, name: string) {
  if ((await groupCount(db, userId)) >= MAX_GROUPS) return 'limit'
  const group = await auth.api.createOrganization({ body: { name, slug: nanoid(), userId } })
  return group.id
}
