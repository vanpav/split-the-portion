import { dishTitle, type Recipe } from './dish'
import type { Language } from './language'
import { categoryMatches, CATEGORY_LABELS, dishCategory, type Categorized } from './dishCategories'

/** Lower case, «е» for «ё»: nobody types «свёкла» at the stove. */
export const plain = (text: string) => text.toLowerCase().replace(/ё/g, 'е')

/** Named products that count towards the dish (not «не учитывать»). */
const counted = (recipe: Recipe) => recipe.ingredients.filter((i) => !i.excluded && i.name.trim())

/**
 * The usual weight a dish row shows: one counted product — its weight; several — the sum of those
 * that have one; null when no counted product has a weight.
 */
export function dishWeight(recipe: Recipe): number | null {
  const weighed = counted(recipe).flatMap((i) => (i.rawGrams !== null ? [i.rawGrams] : []))
  return weighed.length > 0 ? weighed.reduce((a, b) => a + b, 0) : null
}

/** The products of a dish with two or more counted ones (counted names only); empty for any other dish. */
export function dishProducts(recipe: Recipe): string[] {
  const names = counted(recipe).map((i) => i.name.trim())
  return names.length > 1 ? names : []
}

const startsWord = (text: string, q: string) => text.startsWith(q) || text.includes(` ${q}`)

/**
 * The product a dish was found by, when its title does not match the query: a word start before the
 * middle of a name. It may be one that is not counted («Вода»). Null — the title matches or nothing does.
 */
export function dishFoundBy(recipe: Recipe, query: string): string | null {
  const q = plain(query).trim()
  if (!q || plain(dishTitle(recipe)).includes(q)) return null
  const named = recipe.ingredients.map((i) => i.name.trim()).filter(Boolean)
  return named.find((n) => startsWord(plain(n), q)) ?? named.find((n) => plain(n).includes(q)) ?? null
}

/** Where the query lies in a text, for a highlight: a word start is preferred, else the first occurrence. */
export function highlightRange(text: string, query: string): { start: number; end: number } | null {
  const q = plain(query).trim()
  if (!q) return null
  const p = plain(text)
  let start = p.startsWith(q) ? 0 : p.indexOf(` ${q}`)
  if (start > 0) start += 1
  if (start < 0) start = p.indexOf(q)
  return start < 0 ? null : { start, end: start + q.length }
}

/** What one row of a dish list shows. */
export interface DishRow {
  title: string
  /** The usual weight in grams. */
  weight: number | null
  /** The quiet second line, or null. */
  second: string | null
  /** The dish was found by a product: the highlight goes to the second line, not the title. */
  foundBy: boolean
}

/**
 * The label of the category a dish was found by, when its title and products do not match the query
 * but the category does («гарн» → «Гарниры»); null otherwise.
 */
export function dishFoundByCategory(recipe: Categorized, query: string, lang: Language): string | null {
  if (!query.trim() || dishFoundBy(recipe, query) !== null) return null
  const q = plain(query).trim()
  if (plain(dishTitle(recipe)).includes(q)) return null
  const category = dishCategory(recipe)
  return categoryMatches(query, category) ? CATEGORY_LABELS[lang][category] : null
}

/**
 * A dish row (docs/UX.md «Меню блюд»): a dish with two or more products — its products, the one it was
 * found by first; one product — the one it was found by, or, picking for a composite dish (`pick`),
 * its name when it differs from the title. A dish without a name already has its products as the title.
 * Found by its category alone, the second line is the category label (docs/SPEC.md §3б «Категории блюд»).
 */
export function dishRow(
  recipe: Categorized,
  query: string,
  lang: Language,
  { pick = false, underCategory = false }: { pick?: boolean; underCategory?: boolean } = {},
): DishRow {
  const title = dishTitle(recipe)
  const weight = dishWeight(recipe)
  const via = dishFoundBy(recipe, query)
  // Found by its category alone: the label is the second line — unless a category heading above says it already.
  const viaCategory = underCategory ? null : dishFoundByCategory(recipe, query, lang)
  if (viaCategory) return { title, weight, second: viaCategory, foundBy: true }
  const products = dishProducts(recipe)
  const base = { title, weight, foundBy: via !== null }
  if (products.length > 0) {
    // No name: the title is the products; only a product that is not counted («Вода») still needs showing.
    if (!recipe.name.trim()) return { ...base, second: via }
    const line = via ? [via, ...products.filter((n) => n !== via)] : products
    return { ...base, second: line.join(', ') }
  }
  if (via) return { ...base, second: via }
  const product = counted(recipe)[0]?.name.trim()
  if (pick && product && plain(product) !== plain(title)) return { ...base, second: product }
  return { ...base, second: null }
}
