import { defaultShareWeight } from './dish'
import type { Id, PortionShare } from './types'
import { MAX_SPLIT_PORTIONS } from './validation'

// ---- «Доли»: a dish in anonymous portions instead of people (docs/SPEC.md §3б, stage 16) ----

/** Portions of a dish never split in «Доли» before: two equal ones. */
export const DEFAULT_PORTIONS = 2

const validShares = (list: readonly PortionShare[]) =>
  list.length >= 1 &&
  list.length <= MAX_SPLIT_PORTIONS &&
  list.every((p) => typeof p.id === 'string' && p.id !== '' && Number.isFinite(p.weight) && p.weight > 0) &&
  new Set(list.map((p) => p.id)).size === list.length

/**
 * The portions of a dish in «Доли»: what was set for it on this device, otherwise DEFAULT_PORTIONS
 * equal ones with the ids given (a broken stored list counts as none). `freshIds` needs at least
 * DEFAULT_PORTIONS ids: the domain does not make ids.
 */
export function dishPortions(stored: readonly PortionShare[] | undefined, freshIds: readonly Id[]): PortionShare[] {
  if (stored && validShares(stored)) return stored.map((p) => ({ id: p.id, weight: p.weight }))
  return freshIds.slice(0, DEFAULT_PORTIONS).map((id) => ({ id, weight: 1 }))
}

/** «+»: one more portion at the end with the average share; no more than MAX_SPLIT_PORTIONS. */
export function addPortion(list: readonly PortionShare[], id: Id): PortionShare[] {
  if (list.length >= MAX_SPLIT_PORTIONS) return [...list]
  return [...list, { id, weight: defaultShareWeight(list.map((p) => p.weight)) }]
}

/** «−»: the last portion goes; one always stays. */
export function removeLastPortion(list: readonly PortionShare[]): PortionShare[] {
  return list.length > 1 ? list.slice(0, -1) : [...list]
}
