import { countedIngredients, findPortionPhase } from './cooking'
import { RECONCILE_TOLERANCE_GRAMS } from './reconcile'
import { SHARE_EPSILON } from './tolerance'
import type { Cooking, CookingResult, Id } from './types'

/**
 * «Остаток» button: the value (in the portion's own units) that makes the phase reconcile exactly.
 * Returns null when the button should not be shown: nothing to fill, result would be negative,
 * or the portion cannot be computed in its units.
 */
export function fillRemainder(cooking: Cooking, result: CookingResult, portionId: Id): number | null {
  const found = findPortionPhase(result, portionId)
  if (!found) return null
  const { phase, portion: computed } = found
  if (phase.available <= SHARE_EPSILON) return null

  // A share portion already takes everything left; there is nothing to fill.
  if (computed.input.basis === 'share' || computed.input.basis === 'part') return null
  const currentShare = computed.share ?? 0
  if (computed.share === null && computed.issue !== 'empty') return null
  const newShare = currentShare + phase.remainder.share
  if (newShare < 0) return null

  const { input } = computed
  let toUnits: number
  if (input.basis === 'cooked') {
    if (phase.foodGrams === null) return null
    toUnits = phase.foodGrams / phase.available
  } else {
    const ingredient = countedIngredients(cooking).find((i) => i.id === input.ingredientId)
    if (!ingredient) return null
    toUnits = ingredient.rawGrams
  }

  const value = newShare * toUnits
  const change = value - currentShare * toUnits
  if (computed.share !== null && Math.abs(change) < RECONCILE_TOLERANCE_GRAMS) return null
  return value
}
