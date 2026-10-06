import { roundHalfUp } from './numbers'
import { roundPreservingSum } from './split'
import type { Id, PhaseResult, PortionResult } from './types'

/** Nobody drops out by dragging: a person keeps at least 1 %. Remove them with × instead. */
export const MIN_PERCENT = 1

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

/** n whole percents as equal as possible, summing to 100. */
export function equalPercents(n: number): number[] {
  return n > 0 ? roundPreservingSum(Array.from({ length: n }, () => 100 / n)) : []
}

/** Lifts anyone under the minimum, taking the difference from the largest shares. */
function withMinimum(percents: number[]): number[] {
  const result = [...percents]
  for (let i = 0; i < result.length; i++) {
    while (result[i] < MIN_PERCENT) {
      const donor = result.indexOf(Math.max(...result))
      if (donor === i || result[donor] <= MIN_PERCENT) return result
      result[donor] -= 1
      result[i] += 1
    }
  }
  return result
}

/**
 * Share weights (any positive numbers, «70 : 60») as whole percents summing to 100 —
 * the units the share slider works in (docs/SPEC.md §3б).
 */
export function toPercents(weights: number[]): number[] {
  const positive = weights.map((w) => Math.max(w, 0))
  const total = sum(positive)
  if (total <= 0) return equalPercents(weights.length)
  return withMinimum(roundPreservingSum(positive.map((w) => (w / total) * 100)))
}

/**
 * Share weights as parts of the whole (0..1), in the whole percents the share slider shows —
 * the bar of a company in the settings, where there is no dish to split yet.
 */
export function percentShares(weights: number[]): number[] {
  return toPercents(weights).map((p) => p / 100)
}

/**
 * Drags the border between person `index` and the next one to `at` (percent from the left edge
 * of the bar). Only these two change; each keeps at least the minimum.
 */
export function moveBoundary(percents: number[], index: number, at: number): number[] {
  if (index < 0 || index >= percents.length - 1) return percents
  const before = sum(percents.slice(0, index))
  const after = before + percents[index] + percents[index + 1]
  const border = Math.min(Math.max(Math.round(at), before + MIN_PERCENT), after - MIN_PERCENT)
  const result = [...percents]
  result[index] = border - before
  result[index + 1] = after - border
  return result
}

/**
 * ±1 % for one person; the difference comes from (or goes to) everyone else in proportion
 * to what they have, keeping the total at 100 and everyone at the minimum or more.
 */
export function nudgePercent(percents: number[], index: number, delta: number): number[] {
  const n = percents.length
  if (n < 2 || index < 0 || index >= n) return percents
  const target = Math.min(Math.max(percents[index] + delta, MIN_PERCENT), 100 - MIN_PERCENT * (n - 1))
  const change = target - percents[index]
  if (change === 0) return percents

  const others = percents.map((_, i) => i).filter((i) => i !== index)
  // Taking: in proportion to what each can give above the minimum. Giving: to what each has.
  const basis = others.map((i) => (change > 0 ? percents[i] - MIN_PERCENT : percents[i]))
  const total = sum(basis)
  const parts = roundPreservingSum(basis.map((b) => (total > 0 ? (b / total) * Math.abs(change) : Math.abs(change) / basis.length)))

  const result = [...percents]
  result[index] = target
  others.forEach((i, k) => {
    result[i] += change > 0 ? -parts[k] : parts[k]
  })
  return result
}

/**
 * The same portion in another unit, for switching «г ⇄ %» while typing an own portion:
 * whole cooked grams, or percent of the dish with one decimal. Null when it is not computable
 * (no cooked weight for grams, or no portion yet).
 */
export function portionIn(computed: Pick<PortionResult, 'share' | 'cookedGrams'>, unit: 'g' | '%'): number | null {
  if (computed.share === null) return null
  if (unit === '%') return roundHalfUp(computed.share * 100, 1)
  return computed.cookedGrams !== null ? roundHalfUp(computed.cookedGrams) : null
}

/**
 * «На завтра»: the most that can be set aside, in whole percents of the dish. `phase` is computed
 * with nothing set aside, so the sharing people (`sharingIds`) hold all that is free; each keeps
 * the minimum. 0 — nothing to cut (no one shares, or own portions took everything).
 */
export function keepLimit(phase: Pick<PhaseResult, 'portions'>, sharingIds: Id[]): number {
  const free = phase.portions
    .filter((p) => sharingIds.includes(p.portionId))
    .reduce((a, p) => a + Math.max(p.share ?? 0, 0), 0)
  if (sharingIds.length === 0) return 0
  return Math.max(0, Math.floor(free * 100 + 1e-9) - MIN_PERCENT * sharingIds.length)
}

/**
 * «На завтра»: the border dragged in from the right edge of the bar to `at` (percent of the dish
 * from the left). What lies right of it is set aside, in whole percents, up to `most` (`keepLimit`).
 */
export function keepAt(at: number, most: number): number {
  return Math.min(Math.max(Math.round(100 - at), 0), Math.max(most, 0))
}

/**
 * Today's split written back as share weights: each person's part of the dish in whole percents,
 * own portions included, so the next time the same people get the same parts by share
 * (docs/SPEC.md §3б). Null while someone's part is not computable or nobody gets anything.
 */
export function lineupPercents<T extends { id: Id; weight: number }>(
  members: T[],
  portions: Pick<PortionResult, 'portionId' | 'share'>[],
): T[] | null {
  const shares = members.map((m) => portions.find((p) => p.portionId === m.id)?.share ?? null)
  if (members.length === 0 || shares.some((s) => s === null)) return null
  const parts = shares.map((s) => Math.max(s ?? 0, 0))
  if (parts.every((s) => s === 0)) return null
  const percents = toPercents(parts)
  return members.map((m, i) => ({ ...m, weight: percents[i] }))
}
