import { reconcilePhase } from './reconcile'
import { SHARE_EPSILON } from './tolerance'
import {
  RAW_SUM,
  type Cooking,
  type CookingResult,
  type Id,
  type Ingredient,
  type PhaseResult,
  type Portion,
  type PortionResult,
  type RawAmount,
  type ResolvedPortionInput,
  type YieldK,
} from './types'
import { foodGrams } from './weighing'

function hasRaw(ingredient: Ingredient): ingredient is Ingredient & { rawGrams: number } {
  return ingredient.rawGrams !== null && ingredient.rawGrams > 0
}

/** Ingredients that go to the tracker: valid raw weight and not excluded. */
export function countedIngredients(cooking: Cooking): (Ingredient & { rawGrams: number })[] {
  return cooking.ingredients.filter(hasRaw).filter((i) => !i.excluded)
}

/** Name for display and copy text; '' — unnamed, the UI puts its placeholder. */
export function ingredientDisplayName(ingredient: Ingredient): string {
  return ingredient.name.trim()
}

/** id → display name for all ingredients of a cooking. */
export function ingredientNames(cooking: Cooking): Map<Id, string> {
  return new Map(cooking.ingredients.map((i) => [i.id, ingredientDisplayName(i)]))
}

/** Raw grams of a portion: the base ingredient's, or for several counted ingredients their sum; null when none. */
export function portionRawGrams(result: CookingResult, raw: RawAmount[]): number | null {
  return result.baseIngredientId !== null ? baseRawGrams(result, raw) : raw.length > 0 ? raw.reduce((sum, r) => sum + r.grams, 0) : null
}

/** Raw grams of the base ingredient in a list of raw amounts; null for composite dishes. */
export function baseRawGrams(result: CookingResult, raw: RawAmount[]): number | null {
  return raw.find((r) => r.ingredientId === result.baseIngredientId)?.grams ?? null
}

interface Context {
  counted: (Ingredient & { rawGrams: number })[]
  rawById: Map<Id, number>
  baseId: Id | null
}

/**
 * Basis 'default' follows the dish: raw of the only counted ingredient, otherwise cooked
 * (docs/SPEC.md §4). Default people are created before ingredients are known.
 */
function resolveInput(portion: Portion, ctx: Context): ResolvedPortionInput {
  const { input } = portion
  if (input.basis !== 'default') return input
  return ctx.baseId !== null ? { basis: 'raw', ingredientId: ctx.baseId, grams: null } : { basis: 'cooked', grams: null }
}

function rawAmounts(ctx: Context, share: number): RawAmount[] {
  return ctx.counted.map((i) => ({ ingredientId: i.id, grams: i.rawGrams * share }))
}

type ShareOrIssue = { share: number } | { issue: NonNullable<PortionResult['issue']> }

function portionShare(
  input: ResolvedPortionInput,
  ctx: Context,
  available: number,
  food: number | null,
  free: number,
  totalWeight: number,
): ShareOrIssue {
  if (available <= SHARE_EPSILON) return { issue: 'nothingLeft' }
  if (input.basis === 'share') {
    return free <= SHARE_EPSILON ? { issue: 'nothingLeft' } : { share: (free * input.weight) / totalWeight }
  }
  if (input.basis === 'part') return { share: (Math.max(input.percent, 0) / 100) * available }
  if (input.grams === null) return { issue: 'empty' }
  if (input.basis === 'cooked') {
    if (food === null) return { issue: 'noCookedWeight' }
    return { share: (input.grams / food) * available }
  }
  const raw = ctx.rawById.get(input.ingredientId)
  if (raw === undefined) return { issue: 'missingIngredient' }
  return { share: input.grams / raw }
}

function computePortion(
  portion: Portion,
  ctx: Context,
  available: number,
  food: number | null,
  free = 0,
  totalWeight = 0,
): PortionResult {
  const input = resolveInput(portion, ctx)
  const r = portionShare(input, ctx, available, food, free, totalWeight)
  if ('issue' in r) {
    return { portionId: portion.id, input, share: null, cookedGrams: null, raw: [], issue: r.issue }
  }
  return {
    portionId: portion.id,
    input,
    share: r.share,
    cookedGrams: food === null ? null : (r.share / available) * food,
    raw: rawAmounts(ctx, r.share),
  }
}

const isShare = (p: Portion) => p.input.basis === 'share'
const shareWeight = (p: Portion) => (p.input.basis === 'share' && p.input.weight > 0 ? p.input.weight : 0)

/**
 * Gram portions first; what they leave, less the part set aside (`keep`, share of the dish),
 * is split between share portions by weight. Order is kept.
 */
function computePhasePortions(
  portions: Portion[],
  ctx: Context,
  available: number,
  food: number | null,
  keep = 0,
): PortionResult[] {
  const byGrams = new Map(
    portions.filter((p) => !isShare(p)).map((p) => [p.id, computePortion(p, ctx, available, food)]),
  )
  const takenByGrams = [...byGrams.values()].reduce((sum, p) => sum + (p.share ?? 0), 0)
  const free = Math.max(0, available - takenByGrams - keep)
  const totalWeight = portions.reduce((sum, p) => sum + shareWeight(p), 0)
  return portions.map((p) => {
    const computed = byGrams.get(p.id)
    if (computed) return computed
    if (shareWeight(p) === 0) return computePortion(p, ctx, available, food, 0, 1)
    return computePortion(p, ctx, available, food, free, totalWeight)
  })
}

function yieldK(
  food: number | null,
  available: number,
  baseRaw: number | null,
  rawTotal: number,
): YieldK | null {
  if (food === null || available <= SHARE_EPSILON) return null
  if (baseRaw !== null) return { kind: 'base', value: food / (baseRaw * available) }
  if (rawTotal > 0) return { kind: 'dish', value: food / (rawTotal * available) }
  return null
}

/**
 * Computes everything derived from a cooking. Formulas: docs/SPEC.md §5.
 * A portion is reduced to a share of the whole dish; phases are separated by weighings.
 */
export function computeCooking(cooking: Cooking): CookingResult {
  const counted = countedIngredients(cooking)
  const base = counted.length === 1 ? counted[0] : null
  // A portion «in raw grams of the sum» (RAW_SUM) is read against all counted ingredients together.
  const rawById = new Map<Id, number>(counted.map((i) => [i.id, i.rawGrams]))
  if (counted.length > 0) rawById.set(RAW_SUM, counted.reduce((sum, i) => sum + i.rawGrams, 0))
  const ctx: Context = {
    counted,
    rawById,
    baseId: base?.id ?? null,
  }
  const rawTotal = cooking.ingredients.filter(hasRaw).reduce((sum, i) => sum + i.rawGrams, 0)

  const weighingIds = new Set(cooking.weighings.map((w) => w.id))
  const lastWeighingId = cooking.weighings.at(-1)?.id

  const phases: PhaseResult[] = []
  let available = 1
  for (const weighing of cooking.weighings) {
    const food = foodGrams(weighing)
    const foodValue = food.ok ? food.grams : null
    // Portions pointing to a missing weighing are attached to the last phase.
    const phasePortions = cooking.portions.filter((p) =>
      weighingIds.has(p.weighingId) ? p.weighingId === weighing.id : weighing.id === lastWeighingId,
    )
    // The part set aside «на завтра» is taken from the dish as cooked: the first phase.
    const keep = phases.length === 0 ? Math.min(Math.max(cooking.keepPercent ?? 0, 0), 100) / 100 : 0
    const portions = computePhasePortions(phasePortions, ctx, available, foodValue, keep)
    const taken = portions.reduce((sum, p) => sum + (p.share ?? 0), 0)
    const remainderShare = available - taken

    phases.push({
      weighingId: weighing.id,
      available,
      foodGrams: foodValue,
      weighingError: food.ok ? null : food.error,
      k: yieldK(foodValue, available, base?.rawGrams ?? null, rawTotal),
      portions,
      remainder: {
        state: remainderShare > SHARE_EPSILON ? 'some' : remainderShare < -SHARE_EPSILON ? 'over' : 'none',
        share: remainderShare,
        cookedGrams: foodValue === null || available <= SHARE_EPSILON ? null : (remainderShare / available) * foodValue,
        raw: rawAmounts(ctx, remainderShare),
      },
      reconcile: reconcilePhase({
        available,
        foodGrams: foodValue,
        baseRawGrams: base?.rawGrams ?? null,
        hasCounted: counted.length > 0,
        portions,
      }),
    })
    available = remainderShare
  }

  return {
    baseIngredientId: base?.id ?? null,
    countedIngredientIds: counted.map((i) => i.id),
    rawTotal,
    phases,
  }
}

/** Phase that contains the portion, or undefined. */
export function findPortionPhase(result: CookingResult, portionId: Id) {
  for (const phase of result.phases) {
    const portion = phase.portions.find((p) => p.portionId === portionId)
    if (portion) return { phase, portion }
  }
  return undefined
}
