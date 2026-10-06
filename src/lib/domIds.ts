import type { Id } from '@/domain'

export const ingredientNameId = (id: Id) => `ingredient-name-${id}`
export const ingredientGramsId = (id: Id) => `ingredient-grams-${id}`
export const portionGramsId = (id: Id) => `portion-grams-${id}`
/** A calculator field: a weight row or a person's own portion. */
export const calculatorFieldId = (row: string) => `calculator-${row}`
/** Calculator fields focused again on the way back from «Новая тара» and «Новая компания». */
export const TARE_SELECT_ID = 'calculator-tare'
export const COMPANY_SELECT_ID = 'calculator-company'
export const ADD_PERSON_ID = 'calculator-add-person'

/** Enter moves on: focus an element by id; nothing to move to — close the keyboard. */
export function focusOrBlur(id: string | null) {
  const next = id && document.getElementById(id)
  if (next) next.focus()
  else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}
