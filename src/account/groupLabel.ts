import type { AccountGroup } from './types'

/**
 * How a group is named in lists. Everyone's own group is «Личная», so someone else's is told
 * apart by its owner: «Личная · vanya» (the part of the email before @).
 */
export function groupLabel(group: AccountGroup): string {
  if (group.role === 'owner') return group.name
  const owner = group.members.find((m) => m.role === 'owner')
  return owner ? `${group.name} · ${owner.email.split('@')[0]}` : group.name
}
