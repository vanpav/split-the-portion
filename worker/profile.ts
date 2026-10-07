import type { Profile } from '../src/account/types'

/** The name fields as typed; empty ones are kept as null. */
export async function saveProfile(db: D1Database, userId: string, p: Omit<Profile, 'image'>) {
  await db
    .prepare('update user set firstName = ?, lastName = ?, nickname = ? where id = ?')
    .bind(p.firstName || null, p.lastName || null, p.nickname || null, userId)
    .run()
}

/**
 * What the bytes are, by their signature, not by what the client claims: only JPEG, PNG and WebP
 * are kept and served, so nothing else can be passed off as an avatar.
 */
export function imageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b)
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp'
  return null
}

/** The avatar's address; the version changes with every new photo, so it can be cached for good. */
export const avatarUrl = (userId: string, at: string) => `/api/avatars/${userId}?v=${Date.parse(at)}`

export async function saveAvatar(db: D1Database, userId: string, bytes: Uint8Array, type: string, at: string) {
  await db.batch([
    db
      .prepare('insert or replace into avatar (user_id, bytes, type, updated_at) values (?, ?, ?, ?)')
      .bind(userId, bytes, type, at),
    db.prepare('update user set image = ? where id = ?').bind(avatarUrl(userId, at), userId),
  ])
  return avatarUrl(userId, at)
}

export async function removeAvatar(db: D1Database, userId: string) {
  await db.batch([
    db.prepare('delete from avatar where user_id = ?').bind(userId),
    db.prepare('update user set image = null where id = ?').bind(userId),
  ])
}

/** A person's avatar, for themselves and for whoever shares a group with them; null — none or not theirs to see. */
export async function readAvatar(db: D1Database, viewerId: string, userId: string) {
  const row = await db
    .prepare(
      `select bytes, type from avatar where user_id = ?1 and (?1 = ?2 or exists (
         select 1 from member a join member b on a.organizationId = b.organizationId
         where a.userId = ?1 and b.userId = ?2))`,
    )
    .bind(userId, viewerId)
    .first<{ bytes: ArrayBuffer | number[]; type: string }>()
  return row && { bytes: new Uint8Array(row.bytes), type: row.type }
}
