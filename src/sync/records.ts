import type { Company, Cooking, Dish, Lineup, Tare } from '@/domain'
import type { PersistedState } from '@/store/migrations'
import { recordKey, type RecordType } from './protocol'

/** The one record of settings shared by a group. */
export interface SettingsRecord {
  holdMs: number
}
export const SETTINGS_ID = 'settings'

/**
 * What each record type holds; `lineup` — «Кто ест» of the dish with the same id. `cooking` — only
 * from apps before v11: never sent, skipped when it comes (`migrateChange`); the server still takes them.
 */
export interface RecordData {
  dish: Dish
  cooking: Cooking
  tare: Tare
  company: Company
  lineup: Lineup
  settings: SettingsRecord
}

/** A record change on the device: `data: null` — removed. */
export type Change = { [T in RecordType]: { type: T; id: string; data: RecordData[T] | null; v: number } }[RecordType]

export const changeKey = (c: Pick<Change, 'type' | 'id'>) => recordKey(c.type, c.id)

/** All of a group's data as records: the first upload of data that was on the device before sign-in. */
export function toChanges(state: PersistedState, v: number): Change[] {
  return [
    ...state.dishes.map((data): Change => ({ type: 'dish', id: data.id, data, v })),
    ...state.tares.map((data): Change => ({ type: 'tare', id: data.id, data, v })),
    ...state.companies.map((data): Change => ({ type: 'company', id: data.id, data, v })),
    ...Object.entries(state.lineups).map(([id, data]): Change => ({ type: 'lineup', id, data, v })),
    { type: 'settings', id: SETTINGS_ID, data: { holdMs: state.holdMs }, v },
  ]
}

/** No dishes, tares or companies: nothing worth keeping (settings alone are not data). */
export const isEmptyData = (s: PersistedState) => s.dishes.length === 0 && s.tares.length === 0 && s.companies.length === 0
