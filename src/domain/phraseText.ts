import { formatGrams, roundHalfUp } from './numbers'
import type { PhraseIssue, PhraseItem } from './phrase'
import type { CookingKind } from './types'

/*
 * Texts of the dish editor's parse list (docs/UX.md §6 «Разбор фразы»): the weight at the right of a
 * row, the notes under it, the summary line under the list.
 */

const amountFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const amount = (x: number) => amountFormat.format(roundHalfUp(x, 2))

/** «нет названия», «из 2 л: считаем 1 мл ≈ 1 г», «8 кг — точно?»… */
export function phraseIssueText(issue: PhraseIssue): string {
  switch (issue.code) {
    case 'noName':
      return 'нет названия'
    case 'zeroWeight':
      return 'вес 0'
    case 'badWeight':
      return 'не понял вес'
    case 'volume':
      return `из ${amount(issue.amount)} ${issue.unit === 'l' ? 'л' : 'мл'}: считаем 1 мл ≈ 1 г`
    case 'pieces':
      return `${amount(issue.count)} шт — нужен вес в граммах`
    case 'spoons':
      return 'ложки — нужен вес в граммах'
    case 'tooHeavy':
      return `${amount(issue.grams / 1000)} кг — точно?`
    case 'tooLight':
      return `${amount(issue.grams)} г — может, это штуки?`
    case 'duplicate':
      return `«${issue.name}» уже есть выше`
  }
}

/** The right side of a row: «600 г», «≈ 2 000 г», «2 шт», «ложки», «по вкусу», «без веса». */
export function phraseWeightText(item: Pick<PhraseItem, 'rawGrams' | 'approx' | 'amount' | 'toTaste'>): string {
  if (item.amount?.kind === 'pieces') return `${amount(item.amount.count)} шт`
  if (item.amount?.kind === 'spoons') return 'ложки'
  if (item.toTaste) return 'по вкусу'
  if (item.rawGrams === null) return 'без веса'
  return `${item.approx ? '≈ ' : ''}${formatGrams(item.rawGrams)} г`
}

/** The summary under the list: «Простое» + «сухой 200 г», «Составное» + «сырой 1 360 г · не учит. 2 016 г». */
export function phraseSummaryText(summary: { kind: CookingKind; countedGrams: number; excludedGrams: number }): {
  kind: string
  details: string
} {
  const counted = `${summary.kind === 'simple' ? 'сухой' : 'сырой'} ${formatGrams(summary.countedGrams)} г`
  const excluded = summary.excludedGrams > 0 ? ` · не учит. ${formatGrams(summary.excludedGrams)} г` : ''
  return { kind: summary.kind === 'simple' ? 'Простое' : 'Составное', details: counted + excluded }
}
