import type { Weighing, WeighingError } from './types'

export type FoodGramsResult = { ok: true; grams: number } | { ok: false; error: WeighingError }

/** Food weight without tare. */
export function foodGrams(weighing: Weighing): FoodGramsResult {
  if (weighing.grams === null) return { ok: false, error: 'empty' }
  if (weighing.kind === 'food') {
    return weighing.grams > 0 ? { ok: true, grams: weighing.grams } : { ok: false, error: 'empty' }
  }
  const food = weighing.grams - weighing.tare.grams
  return food > 0 ? { ok: true, grams: food } : { ok: false, error: 'tareExceeds' }
}
