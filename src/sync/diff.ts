import type { Id } from '@/domain'
import type { PersistedState } from '@/store/migrations'
import type { RecordType } from './protocol'
import { SETTINGS_ID, type Change, type RecordData } from './records'

/**
 * Which records changed between two states of the store. Updates are immutable, so an unchanged
 * record is the same object: comparing references is enough and cheap.
 */
export function diffState(prev: PersistedState, next: PersistedState, v: number): Change[] {
  const changes: Change[] = [
    ...diffRecords('dish', prev.dishes, next.dishes, byId, v),
    ...diffRecords('cooking', prev.cookings, next.cookings, byId, v),
    ...diffRecords('tare', prev.tares, next.tares, byId, v),
    ...diffRecords('company', prev.companies, next.companies, byId, v),
    ...diffRecords('lineup', prev.lineups, next.lineups, (l) => new Map(Object.entries(l)), v),
  ]
  if (prev.holdMs !== next.holdMs) changes.push({ type: 'settings', id: SETTINGS_ID, data: { holdMs: next.holdMs }, v })
  return changes
}

const byId = <T extends { id: Id }>(items: T[]) => new Map(items.map((i) => [i.id, i]))

function diffRecords<T extends Exclude<RecordType, 'settings'>, C>(
  type: T,
  prev: C,
  next: C,
  toMap: (collection: C) => Map<Id, RecordData[T]>,
  v: number,
): Change[] {
  if (prev === next) return []
  const before = toMap(prev)
  const changes: Change[] = []
  for (const [id, data] of toMap(next)) {
    if (before.get(id) !== data) changes.push({ type, id, data, v } as Change)
    before.delete(id)
  }
  for (const id of before.keys()) changes.push({ type, id, data: null, v } as Change)
  return changes
}
