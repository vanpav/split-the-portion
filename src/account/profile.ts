import { PROFILE_LIMITS, type GroupMember, type Me, type Profile } from './types'

type Named = Pick<Profile, 'firstName' | 'lastName' | 'nickname'> & { email: string }

/** How others see a person in the group: the nickname, else the part of the email before @. */
export const shortName = (p: Named): string => p.nickname.trim() || p.email.split('@')[0]

/** «Иван Павличенко», «Иван», or '' when neither is given. */
export const fullName = (p: Pick<Profile, 'firstName' | 'lastName'>): string =>
  [p.firstName.trim(), p.lastName.trim()].filter(Boolean).join(' ')

/** What goes in a round avatar without a photo: «ИП», «И», else the first letter of the short name. */
export function initials(p: Named): string {
  const letters = [p.firstName, p.lastName].map((s) => s.trim().charAt(0)).join('')
  return (letters || shortName(p).charAt(0)).toUpperCase()
}

export const EMPTY_PROFILE: Profile = { firstName: '', lastName: '', nickname: '', image: null }

/**
 * The profile fields as sent to `PUT /api/me/profile`: trimmed strings within the limits; anything
 * else — null (the server answers 400). Shared by the form and the worker.
 */
export function parseProfile(value: unknown): Omit<Profile, 'image'> | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const field = (key: string, max: number) => {
    const s = typeof v[key] === 'string' ? v[key].trim() : null
    return s !== null && s.length <= max ? s : null
  }
  const firstName = field('firstName', PROFILE_LIMITS.name)
  const lastName = field('lastName', PROFILE_LIMITS.name)
  const nickname = field('nickname', PROFILE_LIMITS.nickname)
  return firstName === null || lastName === null || nickname === null ? null : { firstName, lastName, nickname }
}

/** An account cached before profiles existed: the missing fields become empty. */
export function withProfiles(me: Me): Me {
  const fill = <T extends object>(x: T): T & Profile => ({ ...EMPTY_PROFILE, ...x })
  return {
    ...me,
    user: fill(me.user),
    groups: me.groups.map((g) => ({ ...g, members: g.members.map((m): GroupMember => fill(m)) })),
  }
}
