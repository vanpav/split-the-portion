import { formatK, type CookingKind, type YieldK } from '@/domain'

/** «k = 2,8» for one counted ingredient, «k блюда = 0,94» for a dish, «k остатка» after re-weighing. */
export function kText(k: YieldK, leftover: boolean): string {
  const prefix = leftover ? 'k остатка' : k.kind === 'dish' ? 'k блюда' : 'k'
  return `${prefix} = ${formatK(k.value)}`
}

export function kOutOfRangeText(k: number, maybeForgotTare: boolean): string {
  const hint = maybeForgotTare ? 'Возможно, в вес попала посуда — выберите тару.' : 'Проверьте веса.'
  return `Необычный выход: k = ${formatK(k)}. ${hint}`
}

export const TARE_EXCEEDS_TEXT = 'Вес с тарой меньше веса тары — проверьте тару'

/** «сухого» for a simple dish (крупа, макароны), «сырого» otherwise. */
export function rawWord(kind: CookingKind): string {
  return kind === 'simple' ? 'сухого' : 'сырого'
}
