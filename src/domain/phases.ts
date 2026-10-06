import { SHARE_EPSILON } from './tolerance'
import type { CookingResult } from './types'

/**
 * «Перевзвесить остаток» needs the current phase weighed and something left in its pot
 * (docs/SPEC.md §8). Otherwise empty phases would pile up.
 */
export function canReweigh(result: CookingResult): boolean {
  const phase = result.phases.at(-1)
  return result.countedIngredientIds.length > 0 && phase?.foodGrams != null && phase.remainder.state === 'some'
}

/**
 * Cooked grams left in the pot for the cooking list. Null while nothing was taken or re-weighed:
 * then the leftover is just the whole dish.
 */
export function leftoverCookedGrams(result: CookingResult): number | null {
  const phase = result.phases.at(-1)
  if (!phase || phase.remainder.state !== 'some' || phase.remainder.cookedGrams === null) return null
  const touched = result.phases.length > 1 || phase.remainder.share < 1 - SHARE_EPSILON
  return touched ? phase.remainder.cookedGrams : null
}
