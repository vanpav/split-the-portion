import type { Id } from '@/domain'

export const portionGramsId = (id: Id) => `portion-grams-${id}`
/** A calculator field: a weight row or a person's own portion. */
export const calculatorFieldId = (row: string) => `calculator-${row}`
/** Calculator fields focused again on the way back from «Новая тара» and «Новая компания». */
export const TARE_SELECT_ID = 'calculator-tare'
/** The «›» of «Сырой», focused again on the way back from «Ингредиенты». */
export const INGREDIENTS_KNOB_ID = 'calculator-ingredients'
export const COMPANY_SELECT_ID = 'calculator-company'
export const ADD_PERSON_ID = 'calculator-add-person'

/**
 * An invisible field that is always on the page. iPhone opens the keyboard only for a field focused within
 * the tap itself, not after the address changes: 🔍 focuses this one in its tap, then the dish menu's
 * search field takes the focus over and the keyboard stays (docs/UX.md «Меню блюд»).
 */
export const KEYBOARD_PROXY_ID = 'keyboard-proxy'

/** Enter moves on: focus an element by id; nothing to move to — close the keyboard. */
export function focusOrBlur(id: string | null) {
  const next = id && document.getElementById(id)
  if (next) next.focus()
  else if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}
