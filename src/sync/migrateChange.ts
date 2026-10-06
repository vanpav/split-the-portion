import { CURRENT_VERSION, DEFAULT_HOLD_MS, migrate, type PersistedState } from '@/store/migrations'
import type { WireChange } from './protocol'
import type { Change } from './records'

/**
 * A record from the server in this version's shape. One written by an older app passes the same
 * migrations as stored data: it is wrapped into a state, migrated and taken out again.
 * `'newer'` — written by a newer app: this one must be updated before it can sync (docs/SPEC.md §13.4).
 * `null` — not readable, or a cooking (none since v11); skipped.
 */
export function migrateChange(change: WireChange): Change | 'newer' | null {
  // Cookings are gone since v11: whatever an older app sends about them is not this app's data.
  if (change.type === 'cooking') return null
  if (change.v > CURRENT_VERSION) return 'newer'
  if (change.v === CURRENT_VERSION || change.data === null) return change as Change
  try {
    return unwrap(migrate(wrap(change), change.v), change)
  } catch {
    return null
  }
}

function wrap({ type, id, data }: WireChange): unknown {
  // `cookings` is there for the steps before v11 that read it.
  const state = { dishes: [], cookings: [], tares: [], companies: [], lineups: {}, holdMs: DEFAULT_HOLD_MS }
  switch (type) {
    case 'dish':
      return { ...state, dishes: [data] }
    case 'cooking':
      return state
    case 'tare':
      return { ...state, tares: [data] }
    case 'company':
      return { ...state, companies: [data] }
    case 'lineup':
      return { ...state, lineups: { [id]: data } }
    case 'settings':
      return { ...state, ...data }
  }
}

function unwrap(state: PersistedState, { type, id }: WireChange): Change | null {
  const one = <T>(items: T[]) => items[0] ?? null
  switch (type) {
    case 'dish':
      return { type, id, data: one(state.dishes), v: CURRENT_VERSION }
    case 'cooking':
      return null
    case 'tare':
      return { type, id, data: one(state.tares), v: CURRENT_VERSION }
    case 'company':
      return { type, id, data: one(state.companies), v: CURRENT_VERSION }
    case 'lineup':
      return { type, id, data: state.lineups[id] ?? null, v: CURRENT_VERSION }
    case 'settings':
      return { type, id, data: { holdMs: state.holdMs }, v: CURRENT_VERSION }
  }
}
