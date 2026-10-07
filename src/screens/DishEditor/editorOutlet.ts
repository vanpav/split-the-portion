import type { dishSource } from '@/domain'
import type { TareOutlet } from '@/screens/Calculator/calculatorOutlet'

/** A whole simple dish as an ingredient: its name and usual raw weight. */
export type DishSourceIngredient = NonNullable<ReturnType<typeof dishSource>>

/**
 * What the dish editor gives the screens opened over it («Из блюда», `…/from-dish`;
 * «Новая тара», `…/tare/new`). The form stays mounted under them, hidden, so its draft is there on the way back.
 */
export interface EditorOutlet extends TareOutlet {
  onPick: (source: DishSourceIngredient) => void
}
