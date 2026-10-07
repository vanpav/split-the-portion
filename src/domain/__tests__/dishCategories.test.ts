import { describe, expect, it } from 'vitest'
import { categoryMatches, CATEGORY_LABELS, detectCategory, dishCategory, DISH_CATEGORIES } from '../dishCategories'
import type { DishCategory } from '../types'

describe('the categories', () => {
  it('are shown in this order, each with a label', () => {
    expect(DISH_CATEGORIES.map((c) => CATEGORY_LABELS[c])).toEqual([
      'Первые',
      'Вторые',
      'Гарниры',
      'Салаты',
      'Завтраки',
      'Выпечка и сладкое',
      'Напитки',
      'Другое',
    ])
  })
})

describe('detectCategory', () => {
  it.each<[string, DishCategory]>([
    // Russian, by the start of a word
    ['Борщ', 'first'],
    ['Солянка сборная', 'first'],
    ['Компот из сухофруктов', 'drinks'],
    ['Оливье', 'salads'],
    ['Овсянка на воде', 'breakfast'],
    ['Омлет', 'breakfast'],
    ['Сырники запечённые, блины', 'baking'],
    ['Котлеты', 'mains'],
    ['Бёдра в духовке', 'mains'],
    ['Гречка', 'sides'],
    ['Пюре', 'sides'],
    ['Свёкла запечённая', 'sides'],
    // English
    ['Beef stew', 'mains'],
    ['Green salad', 'salads'],
    ['Fried rice', 'sides'],
    ['Oatmeal', 'breakfast'],
    ['Apple pie', 'baking'],
    ['Orange juice', 'drinks'],
    // Spanish, with diacritics
    ['Ensalada mixta', 'salads'],
    ['Puré de patata', 'sides'],
    ['Café con leche', 'drinks'],
    ['Pollo al horno', 'mains'],
    ['Tortilla de patatas', 'breakfast'],
  ])('%s → %s', (title, category) => {
    expect(detectCategory(title)).toBe(category)
  })

  it('a first course wins over its products: soup with buckwheat is not a side', () => {
    expect(detectCategory('Суп с гречкой')).toBe('first')
    expect(detectCategory('Chicken soup')).toBe('first')
    expect(detectCategory('Sopa de pollo')).toBe('first')
  })

  it('the other priorities: meat over a side, a drink over a side, baking over a side', () => {
    expect(detectCategory('Курица с рисом')).toBe('mains')
    expect(detectCategory('Рисовый кисель')).toBe('drinks')
    expect(detectCategory('Запеканка картофельная')).toBe('baking')
    expect(detectCategory('Салат с курицей')).toBe('salads')
    expect(detectCategory('Каша гречневая')).toBe('breakfast')
  })

  it('a word must start with a stem, not just contain it', () => {
    expect(detectCategory('Ирис')).toBe('other')
    expect(detectCategory('Мандарин')).toBe('other')
  })

  it('case, «ё» and diacritics do not matter; punctuation splits words', () => {
    expect(detectCategory('СВЁКЛА')).toBe(detectCategory('свекла'))
    expect(detectCategory('PURÉ')).toBe('sides')
    expect(detectCategory('чай, мёд')).toBe('drinks')
    expect(detectCategory('Мясо-гриль')).toBe('mains')
  })

  it('nothing known — «Другое»', () => {
    expect(detectCategory('Хачапури')).toBe('other')
    expect(detectCategory('')).toBe('other')
    expect(detectCategory('  ')).toBe('other')
  })
})

describe('dishCategory', () => {
  const recipe = { name: 'Суп', ingredients: [] }

  it('detected from the title while nothing is chosen', () => {
    expect(dishCategory({ ...recipe, category: null })).toBe('first')
    // A popular dish has no such field at all.
    expect(dishCategory(recipe)).toBe('first')
  })

  it('the one chosen by hand beats the detection', () => {
    expect(dishCategory({ ...recipe, category: 'sides' })).toBe('sides')
    expect(dishCategory({ ...recipe, category: 'other' })).toBe('other')
  })

  it('a dish without a name is detected from its products', () => {
    const unnamed = { name: '', ingredients: [{ name: 'Гречка', rawGrams: 200 }] }
    expect(dishCategory(unnamed)).toBe('sides')
  })
})

describe('categoryMatches', () => {
  it('the query starts a word of the label, case and «ё» aside', () => {
    expect(categoryMatches('гарн', 'sides')).toBe(true)
    expect(categoryMatches('ПЕРВ', 'first')).toBe(true)
    expect(categoryMatches('выпечк', 'baking')).toBe(true)
    // the second word of «Выпечка и сладкое»
    expect(categoryMatches('слад', 'baking')).toBe(true)
    expect(categoryMatches('вторые', 'mains')).toBe(true)
  })

  it('not from the middle of a word, not for an empty query', () => {
    expect(categoryMatches('арн', 'sides')).toBe(false)
    expect(categoryMatches('', 'sides')).toBe(false)
    expect(categoryMatches('  ', 'sides')).toBe(false)
    expect(categoryMatches('гарн', 'first')).toBe(false)
  })
})
