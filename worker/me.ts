import type { AccountGroup, Me } from '../src/account/types'
import type { Auth } from './auth'

/** `GET /api/me`: the signed-in user, their groups (oldest membership first) and the default group. */
export async function getMe(auth: Auth, db: D1Database, headers: Headers): Promise<Me | null> {
  const session = await auth.api.getSession({ headers })
  if (!session) return null
  const { results } = await db
    .prepare(
      `select o.id, o.name, m.role from member m join organization o on o.id = m.organizationId
       where m.userId = ? order by m.createdAt, o.id`,
    )
    .bind(session.user.id)
    .all<AccountGroup>()
  return {
    user: { id: session.user.id, email: session.user.email },
    groups: results,
    defaultGroupId: defaultGroupOf(results, session.user.defaultGroupId),
  }
}

/** The chosen group while the user is still in it, else the first one joined («Личная»); none — null. */
export function defaultGroupOf(groups: readonly AccountGroup[], chosen: string | null | undefined): string | null {
  return groups.some((g) => g.id === chosen) ? (chosen ?? null) : (groups[0]?.id ?? null)
}
