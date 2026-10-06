import type { Cooking, Ingredient, Portion, PortionInput, Weighing } from '../types'

const AT = '2026-10-01T12:00:00.000Z'

export function ingredient(id: string, rawGrams: number | null, excluded = false, name = id): Ingredient {
  return { id, name, rawGrams, excluded }
}

export function food(id: string, grams: number | null): Weighing {
  return { id, at: AT, kind: 'food', grams }
}

export function withTare(id: string, grams: number | null, tareGrams: number): Weighing {
  return { id, at: AT, kind: 'withTare', grams, tare: { id: 'pot', name: 'Кастрюля', grams: tareGrams } }
}

export function raw(id: string, ingredientId: string, grams: number | null, weighingId = 'w0'): Portion {
  return { id, name: id, weighingId, input: { basis: 'raw', ingredientId, grams } }
}

export function cooked(id: string, grams: number | null, weighingId = 'w0'): Portion {
  return { id, name: id, weighingId, input: { basis: 'cooked', grams } satisfies PortionInput }
}

/** Company member: splits what is left by weight. */
export function share(id: string, weight: number, weighingId = 'w0'): Portion {
  return { id, name: id, weighingId, input: { basis: 'share', weight } }
}

/** Portion whose basis is not chosen yet (follows the dish). */
export function auto(id: string, weighingId = 'w0'): Portion {
  return { id, name: id, weighingId, input: { basis: 'default', grams: null } }
}

export function cooking(parts: Partial<Cooking> & Pick<Cooking, 'ingredients'>): Cooking {
  return {
    id: 'c1',
    dishId: 'd1',
    kind: 'composite',
    title: 'Тест',
    createdAt: AT,
    updatedAt: AT,
    weighings: [food('w0', null)],
    portions: [],
    equalSplitN: null,
    keepPercent: null,
    companyId: null,
    ...parts,
  }
}

/** Example 1: buckwheat 200 g dry, pot 850 g, 1410 g with tare → 560 g food. */
export function buckwheat(portions: Portion[] = []): Cooking {
  return cooking({
    title: 'Гречка',
    ingredients: [ingredient('buckwheat', 200, false, 'Гречка')],
    weighings: [withTare('w0', 1410, 850)],
    portions,
  })
}

/** Example 2: soup, 3160 g cooked. */
export function soup(portions: Portion[] = []): Cooking {
  return cooking({
    title: 'Суп',
    ingredients: [
      ingredient('chicken', 600, false, 'Курица'),
      ingredient('potato', 400, false, 'Картофель'),
      ingredient('carrot', 160, false, 'Морковь'),
      ingredient('onion', 120, false, 'Лук'),
      ingredient('rice', 80, false, 'Рис'),
      ingredient('water', 2000, true, 'Вода'),
      ingredient('salt', 16, true, 'Соль'),
    ],
    weighings: [food('w0', 3160)],
    portions,
  })
}
