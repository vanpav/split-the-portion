import type { CookingKind, YieldK } from '@/domain'
import { i18n } from '@/i18n'
import { formatK } from '@/i18n/format'

/** «k = 2,8» for one counted ingredient, «k блюда = 0,94» for a dish, «k остатка» after re-weighing. */
export function kText(k: YieldK, leftover: boolean): string {
  const key = leftover ? 'leftover' : k.kind === 'dish' ? 'dish' : 'ingredient'
  return i18n.t(`calculator.k.${key}`, { k: formatK(k.value) })
}

export function kOutOfRangeText(k: number, maybeForgotTare: boolean): string {
  const hint = i18n.t(maybeForgotTare ? 'calculator.k.maybeForgotTare' : 'calculator.k.checkWeights')
  return i18n.t('calculator.k.outOfRange', { k: formatK(k), hint })
}

export const tareExceedsText = () => i18n.t('calculator.tareExceeds')

/** «сухого» for a simple dish (крупа, макароны), «сырого» otherwise. */
export function rawWord(kind: CookingKind): string {
  return i18n.t(kind === 'simple' ? 'calculator.rawWordSimple' : 'calculator.rawWordComposite')
}

/** A portion in «Доли» is named by its place: «Порция 1», «Порция 2» (docs/UX.md §6). */
export function portionName(index: number): string {
  return i18n.t('calculator.portionName', { n: index + 1 })
}

/** «1 порция», «3 порции», «7 порций»: the word alone. */
export function portionsWord(count: number): string {
  return i18n.t('calculator.portionsWord', { count })
}

export const kHintTitle = () => i18n.t('calculator.k.hintTitle')

/** What k tells, shown in a tooltip (desktop) or a bottom sheet (touch). */
export function kHint(k: YieldK, leftover: boolean): string {
  const of = leftover ? 'hintOfLeftover' : k.kind === 'dish' ? 'hintOfDish' : 'hintOfIngredient'
  return i18n.t('calculator.k.hint', { of: i18n.t(`calculator.k.${of}`) })
}

/**
 * Lines under «Сырой» of a composite dish (docs/SPEC.md §3б): «5 ингредиентов,» then what has no
 * weight yet («без веса: Шампиньоны») or what is not counted («не в счёт: Вода, Соль»).
 */
export function rawTileLines(tile: { count: number; unweighed: string[]; uncounted: string[] }): string[] {
  const first = i18n.t('calculator.raw.count', { count: tile.count })
  const second =
    tile.unweighed.length > 0
      ? i18n.t('calculator.raw.unweighed', { names: tile.unweighed.join(', ') })
      : tile.uncounted.length > 0
        ? i18n.t('calculator.raw.uncounted', { names: tile.uncounted.join(', ') })
        : null
  return second !== null ? [`${first},`, second] : [first]
}
