import { describe, expect, it } from 'vitest'
import type { Recipe } from '../dish'
import { dishFoundBy, dishProducts, dishRow, dishWeight, highlightRange } from '../dishRow'
import { presetSource } from '../presets'

const p = (name: string, rawGrams: number | null = null, excluded = false) => ({ name, rawGrams, excluded })
const recipe = (name: string, ...ingredients: ReturnType<typeof p>[]): Recipe => ({ name, ingredients })

describe('dishWeight', () => {
  it('one counted product: its weight; not counted ones do not matter', () => {
    expect(dishWeight(recipe('Рис', p('Рис', 180), p('Вода', 400, true)))).toBe(180)
    expect(dishWeight(recipe('Шампиньоны', p('Шампиньоны')))).toBeNull()
  })

  it('several: the sum of those that have a weight; none — null', () => {
    expect(dishWeight(recipe('Суп', p('Курица', 400), p('Рис', 100), p('Лук'), p('Вода', 2000, true)))).toBe(500)
    expect(dishWeight(recipe('Суп', p('Курица'), p('Рис')))).toBeNull()
  })
})

describe('dishProducts', () => {
  it('counted names for two or more products, nothing for one', () => {
    expect(dishProducts(recipe('Плов', p('Рис', 1), p('Курица', 1), p('Вода', 1, true), p(' ')))).toEqual(['Рис', 'Курица'])
    expect(dishProducts(recipe('Рис', p('Рис'), p('Вода', 1, true)))).toEqual([])
  })
})

describe('dishFoundBy', () => {
  const soup = recipe('Борщ', p('Свёкла'), p('Капуста'), p('Вода', 2000, true))

  it('the product when the title does not match; «ё» = «е»; an uncounted one too', () => {
    expect(dishFoundBy(soup, 'свекла')).toBe('Свёкла')
    expect(dishFoundBy(soup, 'вода')).toBe('Вода')
  })

  it('null when the title matches, the query is empty or nothing matches', () => {
    expect(dishFoundBy(soup, 'бор')).toBeNull()
    expect(dishFoundBy(soup, '  ')).toBeNull()
    expect(dishFoundBy(soup, 'рис')).toBeNull()
  })

  it('a word start before the middle of a name', () => {
    expect(dishFoundBy(recipe('Суп', p('Барис'), p('Рис круглый')), 'рис')).toBe('Рис круглый')
  })
})

describe('highlightRange', () => {
  it('case and «ё» do not matter', () => {
    expect(highlightRange('Свёкла', 'СВЕК')).toEqual({ start: 0, end: 4 })
  })

  it('a word start before an earlier occurrence inside a word', () => {
    expect(highlightRange('Ирис рис', 'рис')).toEqual({ start: 5, end: 8 })
    expect(highlightRange('Ирис', 'рис')).toEqual({ start: 1, end: 4 })
  })

  it('null for an empty query or no match', () => {
    expect(highlightRange('Рис', ' ')).toBeNull()
    expect(highlightRange('Рис', 'гречка')).toBeNull()
  })
})

describe('dishRow', () => {
  const plov = recipe('Плов', p('Курица', 400), p('Рис', 200), p('Вода', 450, true))

  it('a composite dish: its products on the second line, the usual weight is their sum', () => {
    expect(dishRow(plov, '', 'ru')).toEqual({ title: 'Плов', weight: 600, second: 'Курица, Рис', foundBy: false })
  })

  it('found by a product: it goes first and the highlight moves to the second line', () => {
    expect(dishRow(plov, 'рис', 'ru')).toMatchObject({ second: 'Рис, Курица', foundBy: true })
    expect(dishRow(plov, 'вода', 'ru')).toMatchObject({ second: 'Вода, Курица, Рис', foundBy: true })
  })

  it('a title match keeps the highlight in the title', () => {
    expect(dishRow(plov, 'пло', 'ru')).toMatchObject({ second: 'Курица, Рис', foundBy: false })
  })

  it('an untitled composite dish has no second line: the title is its products', () => {
    expect(dishRow(recipe('', p('Курица', 400), p('Рис', 200)), 'рис', 'ru')).toEqual({ title: 'Курица, Рис', weight: 600, second: null, foundBy: false })
  })

  it('a one-product dish: nothing, the product it was found by, or (picking) its name when it differs', () => {
    const breast = recipe('Куриная грудка', p('Куриное филе', 500))
    expect(dishRow(breast, '', 'ru')).toMatchObject({ second: null, weight: 500 })
    expect(dishRow(breast, 'филе', 'ru')).toMatchObject({ second: 'Куриное филе', foundBy: true })
    expect(dishRow(breast, '', 'ru', { pick: true })).toMatchObject({ second: 'Куриное филе', foundBy: false })
    expect(dishRow(recipe('Рис', p('Рис', 180)), '', 'ru', { pick: true }).second).toBeNull()
    expect(dishRow(recipe('', p('Рис', 180)), '', 'ru', { pick: true }).second).toBeNull()
  })
})

describe('presetSource', () => {
  it('the counted product and its weight; water does not count', () => {
    expect(presetSource({ name: 'Рис', ingredients: [p('Вода', 400, true), p('Рис', 180)] })).toEqual({ name: 'Рис', rawGrams: 180 })
  })

  it('null for a composite preset', () => {
    expect(presetSource({ name: 'Плов', ingredients: [p('Рис', 1), p('Курица', 1)] })).toBeNull()
  })
})

describe('dishRow found by category', () => {
  const buckwheat = { ...recipe('Гречка', p('Гречка', 200)), category: null }

  it('the category label is the second line and carries the highlight', () => {
    expect(dishRow(buckwheat, 'гарн', 'ru')).toEqual({ title: 'Гречка', weight: 200, second: 'Гарниры', foundBy: true })
  })

  it('a composite dish shows the label alone', () => {
    const plov = recipe('Плов', p('Рис', 300), p('Курица', 500))
    expect(dishRow(plov, 'втор', 'ru').second).toBe('Вторые')
  })

  it('the manual category counts', () => {
    expect(dishRow({ ...buckwheat, category: 'mains' }, 'гарн', 'ru').second).toBeNull()
    expect(dishRow({ ...buckwheat, category: 'mains' }, 'втор', 'ru').second).toBe('Вторые')
  })

  it('under a category heading the label is not repeated', () => {
    expect(dishRow(buckwheat, 'гарн', 'ru', { underCategory: true })).toEqual({ title: 'Гречка', weight: 200, second: null, foundBy: false })
  })

  it('a title or product match wins over the category', () => {
    expect(dishRow(recipe('Гарнир', p('Рис')), 'гарн', 'ru').foundBy).toBe(false)
    expect(dishRow(recipe('Суп', p('Курица'), p('Гарнир')), 'гарн', 'ru').second).toBe('Гарнир, Курица')
  })

  it('no query, no label', () => {
    expect(dishRow(buckwheat, '', 'ru').second).toBeNull()
  })
})
