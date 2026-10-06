import { ingredientDisplayName } from './cooking'
import { toPercents } from './shares'
import type { Company, CompanyMember, Cooking, CookingKind, Dish, Id, Ingredient, Portion } from './types'

/** Shown name: the dish name, or its ingredients, or a placeholder. */
export function dishTitle(dish: Pick<Dish, 'name' | 'ingredients'>): string {
  const name = dish.name.trim()
  if (name) return name
  const names = dish.ingredients
    .filter((i) => !i.excluded)
    .map((i) => i.name.trim())
    .filter(Boolean)
  return names.length > 0 ? names.join(', ') : 'Без названия'
}

/** Ingredients that go to the tracker: named and not «не учитывать». The weight may still be empty. */
const countedNamed = (ingredients: Ingredient[]) => ingredients.filter((i) => i.name.trim() && !i.excluded)

/**
 * The kind follows the recipe (docs/SPEC.md §3): one counted product is a simple dish, even with
 * water or salt marked «не учитывать»; two or more counted ingredients make it composite.
 */
export function dishKind(ingredients: Ingredient[]): CookingKind {
  return countedNamed(ingredients).length > 1 ? 'composite' : 'simple'
}

export type DishError = 'noIngredients' | 'badWeight'

/**
 * What blocks «Создать» / «Сохранить» (docs/SPEC.md §3а): at least one counted product.
 * The name may be empty (the product names it); the usual weight may be empty (typed at cooking).
 */
export function dishErrors(dish: Pick<Dish, 'ingredients'>): DishError[] {
  const errors: DishError[] = []
  if (countedNamed(dish.ingredients).length === 0) errors.push('noIngredients')
  if (dish.ingredients.some((i) => i.rawGrams !== null && i.rawGrams <= 0)) errors.push('badWeight')
  return errors
}

/**
 * What a simple dish brings into a composite one, taken whole (docs/SPEC.md §3): product name
 * and its usual raw weight. Null for a composite dish or a simple one without a product.
 */
export function dishSource(dish: Dish): { name: string; rawGrams: number | null } | null {
  if (dish.kind !== 'simple') return null
  const product = dish.ingredients[0]
  if (!product) return null
  return { name: product.name.trim() || dish.name.trim() || ingredientDisplayName(product), rawGrams: product.rawGrams }
}

/** Share weights of the portions that split by share. */
export function shareWeights(portions: Portion[]): number[] {
  return portions.flatMap((p) => (p.input.basis === 'share' ? [p.input.weight] : []))
}

/** Weight for a person added later: the average of the others' shares, so they get a typical portion. */
export function defaultShareWeight(weights: number[]): number {
  const positive = weights.filter((w) => w > 0)
  return positive.length > 0 ? positive.reduce((a, b) => a + b, 0) / positive.length : 1
}

/**
 * The company whose people are this lineup: same names, same split (70 : 60 and 54 : 46 are the
 * same split in whole percents), in any order.
 */
export function matchingCompany(lineup: CompanyMember[], companies: Company[]): Company | null {
  const key = (members: CompanyMember[]) => {
    const percents = toPercents(members.map((m) => m.weight))
    return members
      .map((m, i) => `${m.name.trim().toLowerCase()}:${percents[i]}`)
      .sort()
      .join('|')
  }
  const lineupKey = key(lineup)
  return companies.find((c) => key(c.members) === lineupKey) ?? null
}

/** Name for a lineup saved as a company: «Ваня, Ксюша и Тёща». */
export function lineupName(lineup: CompanyMember[]): string {
  const names = lineup.map((m) => m.name.trim()).filter(Boolean)
  if (names.length === 0) return 'Компания'
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} и ${names.at(-1)}`
}

/**
 * The weight after cooking typed most often for this dish with this tare (null — without tare),
 * from its saved cookings; a tie goes to the latest. Prefills «Готовый» in the calculator.
 */
export function usualScaleGrams(cookings: Cooking[], dishId: Id, tareId: Id | null): number | null {
  const counts = new Map<number, { count: number; latest: string }>()
  for (const cooking of cookings) {
    if (cooking.dishId !== dishId) continue
    const weighing = cooking.weighings[0]
    if (!weighing || weighing.grams === null || weighing.grams <= 0) continue
    const weighingTare = weighing.kind === 'withTare' ? weighing.tare.id : null
    if (weighingTare !== tareId) continue
    const entry = counts.get(weighing.grams)
    counts.set(weighing.grams, {
      count: (entry?.count ?? 0) + 1,
      latest: entry && entry.latest > cooking.createdAt ? entry.latest : cooking.createdAt,
    })
  }
  let best: { grams: number; count: number; latest: string } | null = null
  for (const [grams, { count, latest }] of counts) {
    if (!best || count > best.count || (count === best.count && latest > best.latest)) best = { grams, count, latest }
  }
  return best?.grams ?? null
}
