import { ingredientDisplayName } from './cooking'
import { formatGrams } from './numbers'
import { toPercents } from './shares'
import type { Company, CompanyMember, CookingKind, Dish, Id, Ingredient, Portion, Tare } from './types'

/** What a dish and a popular dish have in common: a name and products («не учитывать» may be absent). */
export interface Recipe {
  name: string
  ingredients: readonly { name: string; rawGrams: number | null; excluded?: boolean }[]
}

/** Shown name: the dish name, or its ingredients, or a placeholder. */
export function dishTitle(dish: Recipe): string {
  const name = dish.name.trim()
  if (name) return name
  const names = dish.ingredients
    .filter((i) => !i.excluded)
    .map((i) => i.name.trim())
    .filter(Boolean)
  return names.length > 0 ? names.join(', ') : 'Без названия'
}

/**
 * The tare a dish is weighed in, while it is still in the library; null — without tare
 * (docs/SPEC.md §8). A deleted tare is not erased from the dish: undoing the removal brings it back.
 */
export function liveTareId(tareId: Id | null, tares: Pick<Tare, 'id'>[]): Id | null {
  return tareId !== null && tares.some((t) => t.id === tareId) ? tareId : null
}

/**
 * Dishes in the order of use, the latest first: the calculator opens on the first, the dish shelf
 * follows it. Creating a dish, saving its form, typing its raw weight, tare or cooked weight is what
 * makes it the latest (docs/UX.md «Полка блюд»).
 */
export function recentDishes<T extends Pick<Dish, 'updatedAt'>>(dishes: T[]): T[] {
  return [...dishes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/**
 * The dish `#/` opens: the one whose calculator was open last on this device, while it still exists;
 * otherwise the latest used (docs/UX.md §3).
 */
export function startDish<T extends Pick<Dish, 'id' | 'updatedAt'>>(dishes: T[], lastId: Id | null): T | undefined {
  return dishes.find((d) => d.id === lastId) ?? recentDishes(dishes)[0]
}

/**
 * The dish shelf while it is open: the chips keep the order they had when it opened (`order`, ids),
 * so a chip never moves away under the finger. Dishes that appeared since — added from the search,
 * or from another device of the group — go first, the latest first; deleted ones drop out.
 */
export function shelfOrder<T extends Pick<Dish, 'id' | 'updatedAt'>>(dishes: T[], order: readonly Id[]): T[] {
  const byId = new Map(dishes.map((d) => [d.id, d]))
  const known = new Set(order)
  return [...recentDishes(dishes.filter((d) => !known.has(d.id))), ...order.flatMap((id) => byId.get(id) ?? [])]
}

/**
 * A dish at a glance, in a search list: the usual weight of its one counted product («200 г»),
 * or what it is made of («Курица, Картофель, Рис»). Empty for one product without a weight.
 */
export function dishSummary(ingredients: (Pick<Ingredient, 'name' | 'rawGrams'> & { excluded?: boolean })[]): string {
  const counted = ingredients.filter((i) => !i.excluded && i.name.trim())
  if (counted.length === 1) return counted[0].rawGrams !== null ? `${formatGrams(counted[0].rawGrams)} г` : ''
  return counted.map((i) => i.name.trim()).join(', ')
}

/**
 * A composite dish folded to one readout in the calculator: the raw weight of what counts, summed
 * (null while no counted product has a weight), and a quiet note — counted products still without
 * a weight, then what is weighed in but not counted: «не учит.: Вода 2 000 г, Соль 5 г».
 */
export function rawFold(ingredients: Pick<Ingredient, 'name' | 'rawGrams' | 'excluded'>[]): { total: number | null; note: string } {
  const named = ingredients.filter((i) => i.name.trim())
  const counted = named.filter((i) => !i.excluded)
  const weighed = counted.filter((i) => i.rawGrams !== null)
  const total = weighed.length > 0 ? weighed.reduce((a, i) => a + (i.rawGrams ?? 0), 0) : null
  const unweighed = counted.filter((i) => i.rawGrams === null).map((i) => i.name.trim())
  const uncounted = named
    .filter((i) => i.excluded)
    .map((i) => (i.rawGrams !== null ? `${i.name.trim()} ${formatGrams(i.rawGrams)} г` : i.name.trim()))
  const note = [unweighed.length > 0 && `без веса: ${unweighed.join(', ')}`, uncounted.length > 0 && `не учит.: ${uncounted.join(', ')}`]
    .filter((part): part is string => Boolean(part))
    .join(' · ')
  return { total, note }
}

/** Ingredients that go to the tracker: named and not «не учитывать». The weight may still be empty. */
const countedNamed = (ingredients: Ingredient[]) => ingredients.filter((i) => i.name.trim() && !i.excluded)

/**
 * «Простое» chosen in the dish editor: the first counted product stays, with what is not counted
 * (water, salt) and empty rows; the other counted products go. A simple dish has one product.
 */
export function asSimple(ingredients: Ingredient[]): Ingredient[] {
  const first = countedNamed(ingredients)[0]
  return ingredients.filter((i) => i === first || i.excluded || !i.name.trim())
}

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

