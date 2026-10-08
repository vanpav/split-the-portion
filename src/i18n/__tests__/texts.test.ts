import { describe, expect, it } from 'vitest'
import { rawTileLines } from '@/screens/Calculator/messages'
import { t } from '..'
import { copyText, dishTitle, formatGrams, gramsText } from '../format'

/* Russian texts built from the domain's numbers (stage 1 keeps the app Russian: docs/roadmap/21-i18n.md). */

describe('copy text for the tracker', () => {
  it('one line per ingredient, docs/SPEC.md §9', () => {
    expect(copyText([{ name: 'Курица', grams: 75.4 }, { name: '', grams: 10 }])).toBe(
      ['Курица (сырой вес) — 75 г', 'Без названия (сырой вес) — 10 г'].join('\n'),
    )
  })
})

describe('Russian plurals', () => {
  it('ingredients under «Сырой»', () => {
    expect([1, 2, 5, 11, 21, 22].map((count) => t('calculator.raw.count', { count }))).toEqual([
      '1 ингредиент',
      '2 ингредиента',
      '5 ингредиентов',
      '11 ингредиентов',
      '21 ингредиент',
      '22 ингредиента',
    ])
  })

  it('dishes to add from the popular ones', () => {
    expect([1, 2, 5, 11, 21].map((count) => t('dishes.popular.addCount', { count }))).toEqual([
      'Добавить 1 блюдо',
      'Добавить 2 блюда',
      'Добавить 5 блюд',
      'Добавить 11 блюд',
      'Добавить 21 блюдо',
    ])
  })

  it('portions by shares, and «своя» / «свои»', () => {
    expect([1, 3, 7].map((count) => t('calculator.summary.byShares', { count }))).toEqual([
      '1 порция по долям',
      '3 порции по долям',
      '7 порций по долям',
    ])
    expect([1, 2, 5].map((count) => t('calculator.own', { count }))).toEqual(['своя', 'свои', 'свои'])
  })
})

describe('«Сырой» lines', () => {
  it('count, then what has no weight or is not counted', () => {
    expect(rawTileLines({ count: 3, unweighed: [], uncounted: ['Вода', 'Соль'] })).toEqual(['3 ингредиента,', 'не в счёт: Вода, Соль'])
    expect(rawTileLines({ count: 2, unweighed: ['Шампиньоны'], uncounted: [] })).toEqual(['2 ингредиента,', 'без веса: Шампиньоны'])
    expect(rawTileLines({ count: 1, unweighed: [], uncounted: [] })).toEqual(['1 ингредиент'])
  })
})

describe('placeholders', () => {
  it('a dish with nothing to show, grams with their unit', () => {
    expect(dishTitle({ name: ' ', ingredients: [] })).toBe('Без названия')
    expect(gramsText(3160)).toBe(`${formatGrams(3160)} г`)
  })
})
