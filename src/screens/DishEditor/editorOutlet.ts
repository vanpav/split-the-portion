import type { dishSource } from '@/domain'

/** A whole simple dish as an ingredient: its name and usual raw weight. */
export type DishSourceIngredient = NonNullable<ReturnType<typeof dishSource>>

/**
 * What the dish editor gives the screen opened over it («Из простого блюда», `…/from-dish`).
 * The form stays mounted under it, hidden, so its draft is there on the way back.
 */
export interface EditorOutlet {
  onPick: (source: DishSourceIngredient) => void
}
