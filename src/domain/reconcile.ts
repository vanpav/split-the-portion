import { SHARE_EPSILON } from './tolerance'
import type { PortionResult, Reconciliation } from './types'

/** Differences below half a gram are rounding noise, not a user error. */
export const RECONCILE_TOLERANCE_GRAMS = 0.5

export interface ReconcileInput {
  available: number
  foodGrams: number | null
  /** Raw weight of the only counted ingredient; null for composite dishes. */
  baseRawGrams: number | null
  hasCounted: boolean
  portions: PortionResult[]
}

/**
 * Compares the sum of portions with what was available in the phase (docs/SPEC.md §5 «Сверка»).
 * Single counted ingredient → raw grams; otherwise → cooked grams of the phase.
 */
export function reconcilePhase(input: ReconcileInput): Reconciliation | null {
  const { available, foodGrams, baseRawGrams, portions } = input
  if (!input.hasCounted || available <= SHARE_EPSILON) return null

  const takenShare = portions.reduce((sum, p) => sum + (p.share ?? 0), 0)

  let basis: Reconciliation['basis']
  let total: number
  let distributed: number
  if (baseRawGrams !== null) {
    basis = 'raw'
    total = baseRawGrams * available
    distributed = baseRawGrams * takenShare
  } else {
    if (foodGrams === null) return null
    basis = 'cooked'
    total = foodGrams
    distributed = (foodGrams * takenShare) / available
  }

  const diff = distributed - total
  let status: Reconciliation['status']
  if (Math.abs(diff) < RECONCILE_TOLERANCE_GRAMS) status = 'ok'
  else if (diff > 0) status = 'over'
  else {
    // "Not distributed" is an error only when every row is filled; otherwise the user is still typing.
    const allComputed = portions.length > 0 && portions.every((p) => p.share !== null)
    status = allComputed ? 'under' : 'incomplete'
  }

  return { basis, distributed, total, diff, status }
}
