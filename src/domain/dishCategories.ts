import { dishTitle, type Recipe } from './dish'
import { LANGUAGES, type Language } from './language'
import type { DishCategory } from './types'

/** The categories in the order they are shown (menu sections, the editor's list). */
export const DISH_CATEGORIES: readonly DishCategory[] = ['first', 'mains', 'sides', 'salads', 'breakfast', 'baking', 'drinks', 'other']

/**
 * Category names in every UI language. Data, not UI copy: search matches a query against all of them
 * («гарн», «sides», «guarn» all find side dishes), and the UI shows the one of its language.
 */
export const CATEGORY_LABELS: Record<Language, Record<DishCategory, string>> = {
  en: {
    first: 'Soups',
    mains: 'Mains',
    sides: 'Sides',
    salads: 'Salads',
    breakfast: 'Breakfast',
    baking: 'Baking and sweets',
    drinks: 'Drinks',
    other: 'Other',
  },
  ru: {
    first: 'Первые',
    mains: 'Вторые',
    sides: 'Гарниры',
    salads: 'Салаты',
    breakfast: 'Завтраки',
    baking: 'Выпечка и сладкое',
    drinks: 'Напитки',
    other: 'Другое',
  },
  es: {
    first: 'Sopas',
    mains: 'Platos principales',
    sides: 'Guarniciones',
    salads: 'Ensaladas',
    breakfast: 'Desayunos',
    baking: 'Repostería y dulces',
    drinks: 'Bebidas',
    other: 'Otros',
  },
}

/**
 * Lower case, «ё» → «е», no diacritics («café», «puré»). The same for words and stems, so «й» (a
 * letter and a breve once decomposed) stays consistent on both sides.
 */
const fold = (text: string) =>
  text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

/**
 * Word stems per category, Russian, English and Spanish. A word matches when it starts with a stem.
 * The array order is the detection priority: a soup with buckwheat is a first course, not a side.
 */
const RAW_STEMS: { category: Exclude<DishCategory, 'other'>; stems: string[] }[] = [
  {
    category: 'first',
    stems: ['суп', 'борщ', 'щи', 'солянк', 'бульон', 'уха', 'рассольник', 'харчо', 'окрошк', 'soup', 'broth', 'ramen', 'chowder', 'sopa', 'caldo', 'gazpacho', 'crema'],
  },
  {
    category: 'drinks',
    stems: ['компот', 'кисел', 'морс', 'смузи', 'какао', 'чай', 'кофе', 'сок', 'smoothie', 'juice', 'tea', 'coffee', 'lemonade', 'batido', 'zumo', 'jugo', 'cafe', 'limonada'],
  },
  { category: 'salads', stems: ['салат', 'винегрет', 'оливье', 'salad', 'slaw', 'ensalada'] },
  {
    category: 'breakfast',
    stems: ['каш', 'овсянк', 'омлет', 'яичниц', 'гранол', 'oatmeal', 'porridge', 'omelet', 'granola', 'avena', 'tortilla', 'huevos'],
  },
  {
    category: 'baking',
    stems: ['пирог', 'пирож', 'торт', 'блин', 'оладь', 'кекс', 'печень', 'запеканк', 'cake', 'pie', 'pancake', 'muffin', 'cookie', 'tarta', 'pastel', 'galleta', 'bizcocho'],
  },
  {
    category: 'mains',
    stems: [
      'котлет', 'плов', 'гуляш', 'курин', 'куриц', 'бедр', 'рыб', 'жарк', 'тефтел', 'голубц', 'рагу', 'мясо', 'индейк', 'говядин', 'лосос', 'треск', 'минтай', 'креветк', 'шакшук', 'чили',
      'chicken', 'stew', 'curry', 'beef', 'fish', 'meatball', 'pollo', 'estofado', 'pescado', 'carne', 'albondig',
    ],
  },
  {
    category: 'sides',
    stems: [
      'гречк', 'рис', 'макарон', 'паст', 'спагетт', 'булгур', 'кускус', 'киноа', 'пюре', 'картоф', 'перлов', 'пшен', 'чечевиц', 'нут', 'фасол', 'батат', 'брокколи', 'капуст', 'кабачк', 'свекл', 'шампиньон',
      'rice', 'pasta', 'noodle', 'quinoa', 'couscous', 'potato', 'mash', 'arroz', 'fideo', 'patata', 'pure',
    ],
  },
]
const STEMS = RAW_STEMS.map((c) => ({ ...c, stems: c.stems.map(fold) }))

/** The words of a text: letters only, folded. */
const words = (text: string) => fold(text).split(/[^\p{L}]+/u).filter(Boolean)

/**
 * The category a title suggests (docs/SPEC.md §3б «Категории блюд»): categories are tried in priority
 * order, the first with a word that starts with one of its stems wins; nothing found — «Другое».
 */
export function detectCategory(text: string): DishCategory {
  const ws = words(text)
  const hit = STEMS.find(({ stems }) => ws.some((w) => stems.some((s) => w.startsWith(s))))
  return hit ? hit.category : 'other'
}

/** What a dish or a popular dish may carry: the manual category, absent for a preset. */
export type Categorized = Recipe & { category?: DishCategory | null }

/** The category of a dish: the one chosen by hand, else detected from its title. */
export function dishCategory(dish: Categorized): DishCategory {
  return dish.category ?? detectCategory(dishTitle(dish))
}

/**
 * The query starts a word of the category's label in any UI language: «гарн», «перв», «выпечк»,
 * «sides» (case and «ё» aside).
 */
export function categoryMatches(query: string, category: DishCategory): boolean {
  const q = fold(query).trim()
  return q !== '' && LANGUAGES.some((lang) => fold(CATEGORY_LABELS[lang][category]).split(' ').some((w) => w.startsWith(q)))
}
