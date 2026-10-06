import { baseRawGrams, computeCooking } from './cooking'
import { roundHalfUp } from './numbers'
import { isValidSplitN, MAX_SPLIT_PORTIONS } from './validation'
import type { Cooking, CookingResult, Id, RawAmount } from './types'

/**
 * Rounds each value to whole grams so that the rounded sum equals the rounded total
 * (largest remainder method; ties go to the lower index).
 */
export function roundPreservingSum(values: number[]): number[] {
  const target = roundHalfUp(values.reduce((sum, v) => sum + v, 0))
  const floors = values.map((v) => Math.floor(v))
  let missing = target - floors.reduce((sum, v) => sum + v, 0)
  const order = values
    .map((v, index) => ({ index, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  const result = [...floors]
  for (const { index } of order) {
    if (missing <= 0) break
    result[index] += 1
    missing -= 1
  }
  return result
}

/** Splits total grams into n equal whole-gram parts that sum to the rounded total. */
export function splitEqual(totalGrams: number, n: number): number[] {
  if (!isValidSplitN(n)) return []
  return roundPreservingSum(Array.from({ length: n }, () => totalGrams / n))
}

export interface EqualSplit {
  /** Whole grams of cooked food per portion. */
  cookedGrams: number[]
  /** Raw content of one portion (full precision, same for every portion). */
  rawPerPortion: RawAmount[]
}

/** «Разделить на N»: splits the leftover of the last phase (the whole dish if nothing was taken). */
export function splitLeftover(result: CookingResult, n: number): EqualSplit | null {
  const phase = result.phases.at(-1)
  if (!phase || phase.remainder.cookedGrams === null || phase.remainder.state !== 'some') return null
  if (!isValidSplitN(n)) return null
  return {
    cookedGrams: splitEqual(phase.remainder.cookedGrams, n),
    rawPerPortion: phase.remainder.raw.map((r) => ({ ingredientId: r.ingredientId, grams: r.grams / n })),
  }
}

// ---- «Режим порций»: the whole dish in N equal portions (docs/SPEC.md §3б, stage 16) ----

/** Portions of a dish never split before. */
export const DEFAULT_PORTIONS = 2

export interface DishPortions {
  /** Whole cooked grams of each portion, summing to the rounded dish; null until it is weighed. */
  cookedGrams: number[] | null
  /** Raw content of one portion, counted ingredients only (full precision, the same for every portion). */
  raw: RawAmount[]
  /** Dry grams of one portion when the dish has one counted ingredient; null otherwise. */
  baseRaw: number | null
}

/**
 * The whole dish in n equal portions: nobody's own portion and nothing set aside count here,
 * whatever the cooking carries. Raw weights are known before weighing; cooked ones are not.
 */
export function splitDish(cooking: Cooking, n: number): DishPortions | null {
  if (!isValidSplitN(n)) return null
  const result = computeCooking({ ...cooking, portions: [], keepPercent: null })
  const whole = result.phases[0]?.remainder
  if (!whole) return null
  const raw = whole.raw.map((r) => ({ ingredientId: r.ingredientId, grams: r.grams / n }))
  return {
    cookedGrams: whole.cookedGrams !== null ? splitEqual(whole.cookedGrams, n) : null,
    raw,
    baseRaw: baseRawGrams(result, raw),
  }
}

/** «−» / «+»: one portion fewer or more, from 1 to MAX_SPLIT_PORTIONS. */
export function nudgePortions(n: number, step: 1 | -1): number {
  return Math.min(Math.max(Math.round(n) + step, 1), MAX_SPLIT_PORTIONS)
}

/** How many portions a dish is split into on this device: what was set last, otherwise DEFAULT_PORTIONS. */
export function portionCount(counts: Record<Id, number>, dishId: Id): number {
  const n = counts[dishId] ?? null
  return isValidSplitN(n) ? n : DEFAULT_PORTIONS
}

const plural = new Intl.PluralRules('ru-RU')
const PORTION_WORDS: Partial<Record<Intl.LDMLPluralRule, string>> = { one: 'порция', few: 'порции', many: 'порций' }

/** «1 порция», «2 порции», «5 порций», «21 порция». */
export function portionsLabel(n: number): string {
  return `${n} ${PORTION_WORDS[plural.select(n)] ?? 'порции'}`
}
