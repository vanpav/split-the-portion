import type { CompanyMember, Cooking, Dish, Id, Portion, Tare, Weighing } from './types'

export interface CalculatorInput {
  /** Today's raw weight by ingredient id; missing ids keep the dish's usual weight. */
  rawGrams: Record<Id, number | null>
  /** What the scale shows after cooking: with the tare when there is one. */
  scaleGrams: number | null
  tare: Tare | null
  /** Who eats: a company's members or the lineup edited in the calculator. */
  people: CompanyMember[]
  /** The company the people come from, if they match one. */
  companyId: Id | null
  /**
   * Today's own portions in cooked grams, by person id: these people get exactly that,
   * the rest split what is left by share (docs/SPEC.md §5).
   */
  fixedCooked?: Record<Id, number>
  /** Today's own portions as a percent of the dish, by person id: «мне 50 %». */
  fixedPercent?: Record<Id, number>
  /** «На завтра»: percent of the dish not given to the sharing people today. */
  keepPercent?: number
}

const WEIGHING_ID = 'w'

/**
 * The calculator's cooking: the dish with today's numbers, not stored (docs/SPEC.md §3б).
 * `computeCooking` works on it as on any cooking; «Сохранить» stores it under a fresh id.
 */
export function cookingDraft(dish: Dish, input: CalculatorInput, at: string): Cooking {
  const weighing: Weighing = input.tare
    ? { id: WEIGHING_ID, at, kind: 'withTare', grams: input.scaleGrams, tare: { ...input.tare } }
    : { id: WEIGHING_ID, at, kind: 'food', grams: input.scaleGrams }
  const portions: Portion[] = input.people.map((m) => {
    const grams = input.fixedCooked?.[m.id]
    const percent = input.fixedPercent?.[m.id]
    return {
      id: m.id,
      name: m.name,
      weighingId: WEIGHING_ID,
      input:
        grams !== undefined
          ? { basis: 'cooked', grams }
          : percent !== undefined
            ? { basis: 'part', percent }
            : { basis: 'share', weight: m.weight },
    }
  })
  return {
    id: 'draft',
    dishId: dish.id,
    kind: dish.kind,
    title: dish.name,
    createdAt: at,
    updatedAt: at,
    ingredients: dish.ingredients.map((i) => ({
      ...i,
      rawGrams: i.id in input.rawGrams ? input.rawGrams[i.id] : i.rawGrams,
    })),
    weighings: [weighing],
    portions,
    equalSplitN: null,
    keepPercent: input.keepPercent ? input.keepPercent : null,
    companyId: input.companyId,
  }
}
