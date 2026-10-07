import { defaultShareWeight } from './dish'
import { roundHalfUp } from './numbers'
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

/** What the portions that split by share get, for «по 80 г × 7» above the grid (docs/UX.md §3). */
export interface SplitSummary {
  /** How many portions split by share. */
  count: number
  /** The amount every one of them gets, when they are all the same as shown; null — they differ. */
  same: number | null
  least: number
  most: number
}

/**
 * The portions that split by share, summed up for one line: their amounts in the calculator's view
 * (cooked or dry grams, or percent), the same when they all round to the same shown value (`digits`:
 * 0 for grams, 1 for percent) — 80, 80, 80 is «по 80 г», 79,6 and 80,2 too. Null with fewer than two
 * or while an amount is not known.
 */
export function splitSummary(values: readonly (number | null)[], digits = 0): SplitSummary | null {
  if (values.length < 2 || values.some((v) => v === null)) return null
  const known = values as number[]
  const shown = known.map((v) => roundHalfUp(v, digits))
  const least = Math.min(...known)
  const most = Math.max(...known)
  return { count: known.length, same: shown.every((v) => v === shown[0]) ? known[0] : null, least, most }
}

/** Tiles per row for `count` portion tiles: at most three, never a lone tile in a row unless there is only one. */
export function tileRows(count: number): number[] {
  if (count <= 0) return []
  if (count <= 3) return [count]
  const rest = count % 3
  const threes = Math.floor(count / 3)
  if (rest === 0) return Array<number>(threes).fill(3)
  if (rest === 2) return [...Array<number>(threes).fill(3), 2]
  return [...Array<number>(threes - 1).fill(3), 2, 2]
}
