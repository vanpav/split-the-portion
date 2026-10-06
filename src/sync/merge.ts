import type { Id } from '@/domain'
import type { PersistedState } from '@/store/migrations'
import { changeKey, type Change } from './records'

/**
 * Records from the server applied to the device's data. A record with a change still waiting
 * to be sent (`pending`) is left as it is: that change goes out next and wins on the server.
 * Tares and companies are kept in createdAt order, so every device of a group lists them alike
 * (the first company is a dish's default lineup).
 */
export function applyChanges(state: PersistedState, changes: readonly Change[], pending: ReadonlySet<string>): PersistedState {
  let next = state
  for (const change of changes) {
    if (pending.has(changeKey(change))) continue
    next = applyOne(next, change)
  }
  if (next.tares !== state.tares) next = { ...next, tares: byCreatedAt(next.tares) }
  if (next.companies !== state.companies) next = { ...next, companies: byCreatedAt(next.companies) }
  return next
}

function applyOne(state: PersistedState, change: Change): PersistedState {
  switch (change.type) {
    case 'dish':
      return { ...state, dishes: upsert(state.dishes, change.id, change.data) }
    case 'cooking':
      // Only apps before v11 write cookings; `migrateChange` drops them before they get here.
      return state
    case 'tare':
      return { ...state, tares: upsert(state.tares, change.id, change.data) }
    case 'company':
      return { ...state, companies: upsert(state.companies, change.id, change.data) }
    case 'lineup': {
      const { [change.id]: _old, ...lineups } = state.lineups
      return { ...state, lineups: change.data ? { ...lineups, [change.id]: change.data } : lineups }
    }
    case 'settings':
      return change.data ? { ...state, holdMs: change.data.holdMs } : state
  }
}

/** Replaces the item in place, appends a new one, or removes it (`null`). */
function upsert<T extends { id: Id }>(items: T[], id: Id, item: T | null): T[] {
  const at = items.findIndex((i) => i.id === id)
  if (item === null) return at < 0 ? items : items.filter((i) => i.id !== id)
  if (at < 0) return [...items, item]
  return items.map((i, n) => (n === at ? item : i))
}

const byCreatedAt = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

/**
 * Data that was on the device before sign-in added to a group's data: only records the group
 * does not have (ids are nanoids, so nothing collides). The group's settings stay.
 */
export function mergeLocal(group: PersistedState, local: PersistedState): PersistedState {
  const add = <T extends { id: Id }>(mine: T[], theirs: T[]) => {
    const ids = new Set(mine.map((i) => i.id))
    return [...mine, ...theirs.filter((i) => !ids.has(i.id))]
  }
  return {
    ...group,
    dishes: add(group.dishes, local.dishes),
    tares: byCreatedAt(add(group.tares, local.tares)),
    companies: byCreatedAt(add(group.companies, local.companies)),
    lineups: { ...local.lineups, ...group.lineups },
  }
}
