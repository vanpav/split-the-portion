import { findPortionPhase, ingredientNames } from './cooking'
import { roundHalfUp } from './numbers'
import type { Cooking, CookingResult, Id, RawAmount } from './types'

/** A line for the tracker; the UI words it: «Гречка (сырой вес) — 89 г». '' name — unnamed. */
export interface CopyLine {
  name: string
  grams: number
}

/** Lines for the tracker. Amounts that round to 0 g are skipped. */
export function rawAmountsCopyLines(cooking: Cooking, raw: RawAmount[]): CopyLine[] {
  const names = ingredientNames(cooking)
  return raw.filter((r) => roundHalfUp(r.grams) > 0).map((r) => ({ name: names.get(r.ingredientId) ?? '', grams: r.grams }))
}

/** Copy lines for a portion (docs/SPEC.md §9); null if the portion cannot be computed or has none. */
export function portionCopyLines(cooking: Cooking, result: CookingResult, portionId: Id): CopyLine[] | null {
  const found = findPortionPhase(result, portionId)
  if (!found || found.portion.share === null) return null
  const lines = rawAmountsCopyLines(cooking, found.portion.raw)
  return lines.length === 0 ? null : lines
}
