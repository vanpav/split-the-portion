import { dishSource, dishTitle } from './dish'
import { categoryMatches, dishCategory, DISH_CATEGORIES } from './dishCategories'
import { plain } from './dishRow'
import type { PresetDish } from './presets'
import { presetSource } from './presets'
import type { Dish, DishCategory } from './types'
import { lastUsedDay, usesSince } from './usage'

export interface DishMenuOptions {
  /** What is typed in the search field; empty — everything. */
  query: string
  /** Today, «YYYY-MM-DD» (`localDay`): passed in to keep the domain pure. */
  today: string
  /** «По категориям» (`dishMenu` only): own dishes in sections by category (docs/SPEC.md §3б). */
  byCategory?: boolean
}

/**
 * The dish menu as shown: «Часто готовите» (only without a query), the other own dishes, then the
 * popular ones the user does not have yet.
 */
export interface DishMenu<D, P> {
  often: D[]
  rest: D[]
  /** «По категориям»: own dishes by category, empty categories left out; then `often` and `rest` are empty. */
  categories: { category: DishCategory; dishes: D[] }[]
  popular: P[]
}

/** A whole simple dish as an ingredient: the product name and its usual raw weight. */
export interface DishPickSource {
  name: string
  rawGrams: number | null
}

/** «Из блюда»: own simple dishes, then the popular simple ones the user does not have yet. */
export interface DishPicks<D, P> {
  own: { dish: D; source: DishPickSource }[]
  popular: { preset: P; source: DishPickSource }[]
}

/** «Часто готовите» holds at most this many dishes. */
export const OFTEN_LIMIT = 5
/** A dish is «часто готовите» from this many distinct days of use in the window (`FREQUENT_WINDOW_DAYS`). */
export const OFTEN_MIN_USES = 2

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true })

/** Alphabetical: Russian alphabet, case and «ё» / «е» alike — «Ёжики» stand among «Е». */
export function compareNames(a: string, b: string): number {
  return collator.compare(plain(a.trim()), plain(b.trim()))
}

/**
 * How well a dish matches the search, 0 — not at all. As text, not fuzzy: «бул» is булгур, not «Борщ».
 * The title before the products, a word that starts with the query before one that only contains it:
 * «рис» puts «Рис» above «Суп» with rice in it. An empty query matches everything alike. A dish whose
 * `category` label starts with the query («гарн») is found below every title and product match.
 */
export function matchRank(query: string, title: string, products: readonly string[], category?: DishCategory): number {
  const q = plain(query).trim()
  if (!q) return 1
  const name = plain(title)
  const names = products.map(plain)
  const startsWord = (text: string) => text.startsWith(q) || text.includes(` ${q}`)
  if (name === q) return 5
  if (startsWord(name)) return 4
  if (name.includes(q)) return 3
  if (names.some(startsWord)) return 2
  if (names.some((n) => n.includes(q))) return 1
  return category !== undefined && categoryMatches(q, category) ? CATEGORY_RANK : 0
}

/** Found by its category alone: below any title or product match. */
const CATEGORY_RANK = 0.5

type MenuDish = Pick<Dish, 'kind' | 'name' | 'category' | 'ingredients' | 'updatedAt' | 'usedOn'>

interface Ranked<D> {
  dish: D
  title: string
  rank: number
  uses: number
  last: string
}

/** «Часто готовите» order: more distinct days of use, then the later use, then `updatedAt`, then the name. */
function byFrequent<D extends MenuDish>(a: Ranked<D>, b: Ranked<D>): number {
  return (
    b.uses - a.uses ||
    b.last.localeCompare(a.last) ||
    b.dish.updatedAt.localeCompare(a.dish.updatedAt) ||
    compareNames(a.title, b.title)
  )
}

/** Own dishes that match the query, best match first; among equals — the «Часто готовите» order. */
function rankOwn<D extends MenuDish>(dishes: readonly D[], query: string, today: string): Ranked<D>[] {
  return dishes
    .map((dish) => {
      const title = dishTitle(dish)
      return {
        dish,
        title,
        rank: matchRank(query, title, dish.ingredients.map((i) => i.name), dishCategory(dish)),
        uses: usesSince(dish.usedOn, today),
        last: lastUsedDay(dish.usedOn),
      }
    })
    .filter((row) => row.rank > 0)
    .sort((a, b) => b.rank - a.rank || byFrequent(a, b))
}

/** Presets that match the query, best match first; among equals — the catalogue order. */
function rankPresets<P extends PresetDish>(presets: readonly P[], query: string): P[] {
  return presets
    .map((preset, order) => ({ preset, order, rank: matchRank(query, preset.name, preset.ingredients.map((i) => i.name), dishCategory(preset)) }))
    .filter((row) => row.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.order - b.order)
    .map((row) => row.preset)
}

/**
 * The dish menu (docs/SPEC.md §3б «Меню блюд»). No query: `often` — own dishes used on two or more
 * distinct days in the last 60, five at most, most days first; `rest` — every other own dish by name;
 * `popular` — the presets in catalogue order. With a query: only matches, `often` is empty, `rest`
 * holds the own ones (better match first, then the «Часто готовите» order), `popular` the presets.
 *
 * `byCategory`: the own dishes go to `categories` instead (`often` and `rest` are empty). No query:
 * the categories in display order, the «Часто готовите» order inside. With one: only categories with
 * matches, the one holding the best match first (then display order), inside — better match first,
 * then the «Часто готовите» order.
 */
export function dishMenu<D extends MenuDish, P extends PresetDish>(
  dishes: readonly D[],
  presets: readonly P[],
  { query, today, byCategory = false }: DishMenuOptions,
): DishMenu<D, P> {
  const own = rankOwn(dishes, query, today)
  const popular = rankPresets(presets, query)
  const typed = query.trim() !== ''
  if (byCategory) {
    const categories = DISH_CATEGORIES.map((category, order) => ({
      category,
      order,
      rows: own.filter((r) => dishCategory(r.dish) === category).sort(typed ? (a, b) => b.rank - a.rank || byFrequent(a, b) : byFrequent),
    }))
      .filter((c) => c.rows.length > 0)
      .sort(typed ? (a, b) => b.rows[0].rank - a.rows[0].rank || a.order - b.order : (a, b) => a.order - b.order)
      .map((c) => ({ category: c.category, dishes: c.rows.map((r) => r.dish) }))
    return { often: [], rest: [], categories, popular }
  }
  if (typed) return { often: [], rest: own.map((r) => r.dish), categories: [], popular }

  const often = own.filter((r) => r.uses >= OFTEN_MIN_USES).sort(byFrequent).slice(0, OFTEN_LIMIT)
  const rest = own.filter((r) => !often.includes(r)).sort((a, b) => compareNames(a.title, b.title))
  return { often: often.map((r) => r.dish), rest: rest.map((r) => r.dish), categories: [], popular }
}

/**
 * «Из блюда» in the dish editor: own simple dishes and the popular simple ones (`presets` are the ones
 * the user does not have yet). No query: own in the «Часто готовите» order, popular in the catalogue
 * order; with one: better matches first. Each comes with what is inserted into the form.
 */
export function dishPicks<D extends Dish, P extends PresetDish>(
  dishes: readonly D[],
  presets: readonly P[],
  { query, today }: DishMenuOptions,
): DishPicks<D, P> {
  const own = rankOwn(dishes, query, today).flatMap(({ dish }) => {
    const source = dishSource(dish)
    return source ? [{ dish, source }] : []
  })
  const popular = rankPresets(presets, query).flatMap((preset) => {
    const source = presetSource(preset)
    return source ? [{ preset, source }] : []
  })
  return { own, popular }
}

/**
 * «Создать «Хачапури»»: the typed text, trimmed, first letter capital; null when nothing is typed or
 * an own dish is already called that (case and «ё» aside) — then it is in the list.
 */
export function createDishText(dishes: readonly Pick<Dish, 'name' | 'ingredients'>[], query: string): string | null {
  const text = query.trim()
  if (!text) return null
  if (dishes.some((d) => plain(dishTitle(d)) === plain(text))) return null
  return text.charAt(0).toUpperCase() + text.slice(1)
}
