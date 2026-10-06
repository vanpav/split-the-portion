import type { Cooking, CookingResult, Id, WeighingError } from './types'

/** Plausible yield ranges (docs/SPEC.md §8). */
export const K_RANGE = {
  base: { min: 0.3, max: 4 },
  dish: { min: 0.2, max: 5 },
} as const

export type CookingWarning =
  | { code: 'ingredientNoRaw'; ingredientId: Id }
  | { code: 'allExcluded' }
  | { code: 'weighingError'; weighingId: Id; error: Exclude<WeighingError, 'empty'> }
  | { code: 'kOutOfRange'; weighingId: Id; k: number; maybeForgotTare: boolean }
  | { code: 'portionWithoutBasis'; portionId: Id }

export function cookingWarnings(cooking: Cooking, result: CookingResult): CookingWarning[] {
  const warnings: CookingWarning[] = []

  for (const ingredient of cooking.ingredients) {
    if (ingredient.name.trim() !== '' && !(ingredient.rawGrams !== null && ingredient.rawGrams > 0)) {
      warnings.push({ code: 'ingredientNoRaw', ingredientId: ingredient.id })
    }
  }

  const withRaw = cooking.ingredients.filter((i) => i.rawGrams !== null && i.rawGrams > 0)
  if (withRaw.length > 0 && result.countedIngredientIds.length === 0) {
    warnings.push({ code: 'allExcluded' })
  }

  for (const phase of result.phases) {
    const weighing = cooking.weighings.find((w) => w.id === phase.weighingId)
    if (phase.weighingError === 'tareExceeds') {
      warnings.push({ code: 'weighingError', weighingId: phase.weighingId, error: 'tareExceeds' })
    }
    if (phase.k) {
      const range = K_RANGE[phase.k.kind]
      if (phase.k.value < range.min || phase.k.value > range.max) {
        warnings.push({
          code: 'kOutOfRange',
          weighingId: phase.weighingId,
          k: phase.k.value,
          maybeForgotTare: weighing?.kind === 'food' && phase.k.value > range.max,
        })
      }
    }
    for (const portion of phase.portions) {
      if (portion.issue === 'missingIngredient') {
        warnings.push({ code: 'portionWithoutBasis', portionId: portion.portionId })
      }
    }
  }

  return warnings
}

/** Tare weight must be a positive number of grams. */
export function isValidTareGrams(grams: number | null): grams is number {
  return grams !== null && grams > 0
}

/** Upper bound for «Разделить на N». */
export const MAX_SPLIT_PORTIONS = 100

/** N for an equal split: a whole number from 1 to MAX_SPLIT_PORTIONS. */
export function isValidSplitN(n: number | null): n is number {
  return n !== null && Number.isInteger(n) && n >= 1 && n <= MAX_SPLIT_PORTIONS
}
