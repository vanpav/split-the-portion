import { shortName } from './profile'
import { PERSONAL_GROUP_NAME, type AccountGroup, type GroupMember } from './types'

/** How many names a label lists before «и ещё N». */
const NAMED = 3

/**
 * The name a group was given, if any. Every account's own group is stored as «Личная»; that is no
 * name at all — once someone joins, it is not personal any more.
 */
export function customName(name: string): string | null {
  const trimmed = name.trim()
  return trimmed && trimmed !== PERSONAL_GROUP_NAME ? trimmed : null
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Who is in a group, from the viewer's side: «Только ты», «Ты и Ксю», «Ваня и ты», «Ваня, ты и Ксю»,
 * «Ваня, ты и ещё 2». The owner first, the viewer as «ты». Names are nominative: nothing to decline.
 */
export function peopleLabel(members: readonly GroupMember[], myId: string | undefined): string {
  const ordered = [...members].sort((a, b) => Number(b.role === 'owner') - Number(a.role === 'owner'))
  const names = ordered.map((m) => (m.userId === myId ? 'ты' : shortName(m)))
  if (names.length === 0) return ''
  if (names.length === 1) return names[0] === 'ты' ? 'Только ты' : capital(names[0])
  if (names.length > NAMED) return capital(`${names.slice(0, NAMED - 1).join(', ')} и ещё ${names.length - (NAMED - 1)}`)
  return capital(`${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`)
}

/** How a group is named everywhere: its own name if it was given one, else its people. */
export const groupLabel = (group: AccountGroup, myId: string | undefined): string =>
  customName(group.name) ?? peopleLabel(group.members, myId)
