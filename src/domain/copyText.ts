import { findPortionPhase, ingredientNames } from './cooking'
import { formatGrams, roundHalfUp } from './numbers'
import type { Cooking, CookingResult, Id, RawAmount } from './types'

/** Lines for the tracker: «Гречка (сырой вес) — 89 г». Amounts that round to 0 g are skipped. */
export function rawAmountsCopyText(cooking: Cooking, raw: RawAmount[]): string {
  const names = ingredientNames(cooking)
  return raw
    .filter((r) => roundHalfUp(r.grams) > 0)
    .map((r) => `${names.get(r.ingredientId) ?? 'Без названия'} (сырой вес) — ${formatGrams(r.grams)} г`)
    .join('\n')
}

/** Copy text for a portion (docs/SPEC.md §9); null if the portion cannot be computed. */
export function portionCopyText(cooking: Cooking, result: CookingResult, portionId: Id): string | null {
  const found = findPortionPhase(result, portionId)
  if (!found || found.portion.share === null) return null
  const text = rawAmountsCopyText(cooking, found.portion.raw)
  return text === '' ? null : text
}
