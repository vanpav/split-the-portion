import { roundHalfUp } from './numbers'
import { isValidSplitN } from './validation'
import type { CookingResult, RawAmount } from './types'

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
