import type { AccountGroup, GroupMember, Me, Profile } from '../src/account/types'
import type { Auth } from './auth'

/** Profile columns as stored (null for empty) → the profile the app reads. */
type ProfileRow = { firstName: string | null; lastName: string | null; nickname: string | null; image: string | null }
const profileOf = (r: ProfileRow): Profile => ({
  firstName: r.firstName ?? '',
  lastName: r.lastName ?? '',
  nickname: r.nickname ?? '',
  image: r.image,
})

/**
 * `GET /api/me`: the signed-in user with their profile, their groups (oldest membership first) with
 * members and their profiles, the default group.
 */
export async function getMe(auth: Auth, db: D1Database, headers: Headers): Promise<Me | null> {
  const session = await auth.api.getSession({ headers })
  if (!session) return null
  const [groups, members, me] = await db.batch<Omit<AccountGroup, 'members'> & GroupMember & ProfileRow & { groupId: string }>([
    db
      .prepare(
        `select o.id, o.name, m.role from member m join organization o on o.id = m.organizationId
         where m.userId = ? order by m.createdAt, o.id`,
      )
      .bind(session.user.id),
    db
      .prepare(
        `select m.organizationId as groupId, m.id as memberId, m.userId, u.email, m.role,
           u.firstName, u.lastName, u.nickname, u.image
         from member m join user u on u.id = m.userId
         where m.organizationId in (select organizationId from member where userId = ?)
         order by m.createdAt, m.id`,
      )
      .bind(session.user.id),
    db.prepare('select firstName, lastName, nickname, image from user where id = ?').bind(session.user.id),
  ])
  const list = groups.results.map(({ id, name, role }) => ({
    id,
    name,
    role,
    members: members.results
      .filter((m) => m.groupId === id)
      .map((m) => ({ memberId: m.memberId, userId: m.userId, email: m.email, role: m.role, ...profileOf(m) })),
  }))
  return {
    user: { id: session.user.id, email: session.user.email, ...profileOf(me.results[0] ?? { firstName: null, lastName: null, nickname: null, image: null }) },
    groups: list,
    defaultGroupId: defaultGroupOf(list, session.user.defaultGroupId),
  }
}

/** The chosen group while the user is still in it, else the first one joined («Личная»); none — null. */
export function defaultGroupOf(groups: readonly Pick<AccountGroup, 'id'>[], chosen: string | null | undefined): string | null {
  return groups.some((g) => g.id === chosen) ? (chosen ?? null) : (groups[0]?.id ?? null)
}

/** «Открывать при запуске». */
export async function setDefaultGroup(db: D1Database, userId: string, groupId: string) {
  await db.prepare('update user set defaultGroupId = ? where id = ?').bind(groupId, userId).run()
}
