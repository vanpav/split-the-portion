import { dishTitle } from './dish'
import type { PresetDish } from './presets'
import type { CookingKind, Dish } from './types'
import { lastUsedDay, usesSince } from './usage'

/** «Все · Простые · Составные» in the dish menu. */
export type KindFilter = 'all' | CookingKind
/** «Частые» (the default) or «По названию». */
export type DishSort = 'frequent' | 'name'

export interface DishMenuOptions {
  /** What is typed in the search field; empty — everything. */
  query: string
  kind: KindFilter
  sort: DishSort
  /** Today, «YYYY-MM-DD» (`localDay`): passed in to keep the domain pure. */
  today: string
}

/** The dish menu as shown: the user's dishes, then the popular ones they do not have yet. */
export interface DishMenu<D, P> {
  own: D[]
  popular: P[]
}

/** Lower case, «е» for «ё»: nobody types «свёкла» at the stove. */
const plain = (text: string) => text.toLowerCase().replace(/ё/g, 'е')

const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true })

/** «По названию»: Russian alphabet, case and «ё» / «е» alike — «Ёжики» stand among «Е». */
export function compareNames(a: string, b: string): number {
  return collator.compare(plain(a.trim()), plain(b.trim()))
}

/**
 * How well a dish matches the search, 0 — not at all. As text, not fuzzy: «бул» is булгур, not «Борщ».
 * The title before the products, a word that starts with the query before one that only contains it:
 * «рис» puts «Рис» above «Суп» with rice in it. An empty query matches everything alike.
 */
export function matchRank(query: string, title: string, products: readonly string[]): number {
  const q = plain(query).trim()
  if (!q) return 1
  const name = plain(title)
  const names = products.map(plain)
  const startsWord = (text: string) => text.startsWith(q) || text.includes(` ${q}`)
  if (name === q) return 5
  if (startsWord(name)) return 4
  if (name.includes(q)) return 3
  if (names.some(startsWord)) return 2
  return names.some((n) => n.includes(q)) ? 1 : 0
}

/** The kind a popular dish gets once added: two or more counted products make it composite (SPEC §3). */
export function presetKind(preset: PresetDish): CookingKind {
  return preset.ingredients.filter((i) => !i.excluded && i.name.trim()).length > 1 ? 'composite' : 'simple'
}

/** `kind` from the address; anything else is «Все». */
export function parseKindFilter(value: string | null): KindFilter {
  return value === 'simple' || value === 'composite' ? value : 'all'
}

/** `sort` from the address; anything else is «Частые». */
export function parseDishSort(value: string | null): DishSort {
  return value === 'name' ? 'name' : 'frequent'
}

type MenuDish = Pick<Dish, 'kind' | 'name' | 'ingredients' | 'updatedAt' | 'usedOn'>

/**
 * The dish menu (docs/SPEC.md §3б «Меню блюд»): only the kind chosen and what matches the query;
 * while something is typed, better matches first, the chosen sort among equals.
 * «Частые» — distinct days of use in the last 60 days, ties by the latest use; the popular dishes
 * have no use and keep the catalogue order. «По названию» — the Russian alphabet.
 */
export function dishMenu<D extends MenuDish, P extends PresetDish>(
  dishes: readonly D[],
  presets: readonly P[],
  { query, kind, sort, today }: DishMenuOptions,
): DishMenu<D, P> {
  const fits = (k: CookingKind) => kind === 'all' || kind === k

  const own = dishes
    .filter((d) => fits(d.kind))
    .map((dish) => {
      const title = dishTitle(dish)
      return {
        dish,
        title,
        rank: matchRank(query, title, dish.ingredients.map((i) => i.name)),
        uses: usesSince(dish.usedOn, today),
        last: lastUsedDay(dish.usedOn),
      }
    })
    .filter((row) => row.rank > 0)
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        (sort === 'name'
          ? compareNames(a.title, b.title)
          : b.uses - a.uses || b.last.localeCompare(a.last) || b.dish.updatedAt.localeCompare(a.dish.updatedAt)) ||
        compareNames(a.title, b.title),
    )
    .map((row) => row.dish)

  const popular = presets
    .map((preset, order) => ({
      preset,
      order,
      rank: matchRank(query, preset.name, preset.ingredients.map((i) => i.name)),
    }))
    .filter((row) => row.rank > 0 && fits(presetKind(row.preset)))
    .sort((a, b) => b.rank - a.rank || (sort === 'name' ? compareNames(a.preset.name, b.preset.name) : a.order - b.order))
    .map((row) => row.preset)

  return { own, popular }
}
