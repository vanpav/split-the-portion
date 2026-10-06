import { findPortionPhase } from './cooking'
import type { CookingResult, GramsPortionInput, Id } from './types'

export type PortionBasis = { basis: 'cooked' } | { basis: 'raw'; ingredientId: Id }

/** Stable key of a basis, e.g. for a select value. */
export function basisKey(basis: PortionBasis): string {
  return basis.basis === 'cooked' ? 'cooked' : `raw:${basis.ingredientId}`
}

/**
 * Units a portion can be entered in, default first: one counted ingredient → its raw weight,
 * then cooked; a composite dish → cooked, then raw of each counted ingredient.
 */
export function portionBasisOptions(result: CookingResult): PortionBasis[] {
  const cooked: PortionBasis = { basis: 'cooked' }
  const raws: PortionBasis[] = result.countedIngredientIds.map((ingredientId) => ({ basis: 'raw', ingredientId }))
  return result.baseIngredientId !== null ? [...raws, cooked] : [cooked, ...raws]
}

/** Re-expresses a portion in another basis keeping the same share; grams are null when not computable. */
export function convertPortionInput(result: CookingResult, portionId: Id, target: PortionBasis): GramsPortionInput {
  const computed = findPortionPhase(result, portionId)?.portion
  let grams: number | null = null
  if (computed && computed.share !== null) {
    grams =
      target.basis === 'cooked'
        ? computed.cookedGrams
        : (computed.raw.find((r) => r.ingredientId === target.ingredientId)?.grams ?? null)
  }
  return { ...target, grams }
}
