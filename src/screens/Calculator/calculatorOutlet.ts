import type { Company, Id, Ingredient, Tare } from '@/domain'

/**
 * What a screen opened over another gives to «Новая тара» (`…/tare/new` under the calculator and the dish
 * editor, docs/UX.md §3а): the screen under it stays mounted, hidden, and takes the tare straight away.
 */
export interface TareOutlet {
  /** A tare to weigh the dish in: the first one added on «Новая тара», or one tapped in «Добавлено». */
  onTare: (tare: Tare) => void
  /** Names the screen «←» leads to when there is no previous one (a direct link). */
  backLabel: string
}

/**
 * What the calculator gives the screens opened over it (`#/d/:id/…`, docs/UX.md §3а). It stays
 * mounted under them, hidden, so a result goes straight into it — the way picking from its own list does.
 */
export interface CalculatorOutlet extends TareOutlet {
  dishId: Id
  /** A company just added on «Новая компания»: picked for this dish, focus to «+ Имя» on the way back. */
  onCompany: (company: Company) => void
  /** «Ингредиенты»: the dish's ingredients with the weights as typed today, their counted sum and where a typed weight goes. */
  ingredients: {
    dishName: string
    list: Ingredient[]
    texts: Record<Id, string>
    total: number | null
    onText: (ingredientId: Id, typed: string) => void
  }
}
