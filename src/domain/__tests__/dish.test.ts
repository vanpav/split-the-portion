import { describe, expect, it } from 'vitest'
import { asSimple, defaultShareWeight, dishErrors, dishKind, dishSource, recipeInOneColumn, dishTitle, lineupName, liveTareId, matchingCompany, rawTile, recentDishes, shareWeights, shelfOrder, startDish } from '../dish'
import type { Dish } from '../types'
import { cooked, ingredient, share } from './fixtures'

const dish = (parts: Partial<Dish>): Dish => ({
  id: 'd',
  kind: 'simple',
  name: '',
  category: null,
  createdAt: '',
  updatedAt: '',
  ingredients: [],
  tareId: null,
  cooked: null,
  usedOn: [],
  ...parts,
})

describe('dishTitle', () => {
  it('name, else counted ingredients, else empty (the UI puts its placeholder)', () => {
    expect(dishTitle(dish({ name: ' Плов ' }))).toBe('Плов')
    expect(dishTitle(dish({ ingredients: [ingredient('a', 1, false, 'Рис'), ingredient('b', 1, true, 'Соль')] }))).toBe('Рис')
    expect(dishTitle(dish({}))).toBe('')
  })
})

describe('asSimple', () => {
  it('the first counted product stays with what is not counted and empty rows; other products go', () => {
    const rows = [
      ingredient('w', 400, true, 'Вода'),
      ingredient('a', 180, false, 'Рис'),
      ingredient('b', 300, false, 'Курица'),
      ingredient('e', null, false, ''),
      ingredient('s', 5, true, 'Соль'),
    ]
    const kept = asSimple(rows)
    expect(kept.map((i) => i.id)).toEqual(['w', 'a', 'e', 's'])
    expect(dishKind(kept)).toBe('simple')
    expect(asSimple(kept)).toEqual(kept)
  })
})

describe('rawTile', () => {
  const soup = [
    ingredient('a', 600, false, 'Курица'),
    ingredient('b', 400, false, 'Картофель'),
    ingredient('c', 80, false, 'Рис'),
    ingredient('w', 2000, true, 'Вода'),
    ingredient('s', 5, true, 'Соль'),
  ]

  it('counted weights summed; how many count, then what is not counted', () => {
    expect(rawTile(soup)).toEqual({ total: 1080, count: 3, unweighed: [], uncounted: ['Вода', 'Соль'] })
  })

  it('counted ingredients without a weight are named instead of what is not counted; nothing weighed — no total', () => {
    expect(rawTile([ingredient('a', 300, false, 'Фарш'), ingredient('b', null, false, 'Шампиньоны'), ingredient('c', null, true, 'Специи')])).toEqual({
      total: 300,
      count: 2,
      unweighed: ['Шампиньоны'],
      uncounted: [],
    })
    expect(rawTile([ingredient('a', null, false, 'Фарш')])).toEqual({ total: null, count: 1, unweighed: ['Фарш'], uncounted: [] })
  })

  it('nameless rows are left out; nothing to note — no names', () => {
    expect(rawTile([ingredient('a', 200, false, 'Рис'), ingredient('b', 50, false, ' ')])).toEqual({ total: 200, count: 1, unweighed: [], uncounted: [] })
  })
})

describe('recipeInOneColumn', () => {
  it('one column once any name is longer than half a column', () => {
    expect(recipeInOneColumn(['Курица', 'Картофель', 'Лук репчатый'])).toBe(false)
    expect(recipeInOneColumn(['Курица', 'Лук репчатый красный'])).toBe(true)
    expect(recipeInOneColumn([])).toBe(false)
  })
})

describe('recentDishes', () => {
  it('the latest used first, without changing the list it was given', () => {
    const dishes = [
      dish({ id: 'a', updatedAt: '2026-10-01T10:00:00.000Z' }),
      dish({ id: 'b', updatedAt: '2026-10-05T19:40:00.000Z' }),
      dish({ id: 'c', updatedAt: '2026-10-03T08:00:00.000Z' }),
    ]
    expect(recentDishes(dishes).map((d) => d.id)).toEqual(['b', 'c', 'a'])
    expect(dishes.map((d) => d.id)).toEqual(['a', 'b', 'c'])
    expect(recentDishes([])).toEqual([])
  })
})

describe('startDish', () => {
  const a = dish({ id: 'a', updatedAt: '2026-10-01T10:00:00.000Z' })
  const b = dish({ id: 'b', updatedAt: '2026-10-05T19:40:00.000Z' })

  it('the dish open last, even if another was used later', () => {
    expect(startDish([a, b], 'a')).toBe(a)
  })

  it('none open yet or it is gone: the latest used', () => {
    expect(startDish([a, b], null)).toBe(b)
    expect(startDish([a, b], 'deleted')).toBe(b)
    expect(startDish([], 'a')).toBeUndefined()
  })
})

describe('shelfOrder', () => {
  const a = dish({ id: 'a', updatedAt: '2026-10-01T10:00:00.000Z' })
  const b = dish({ id: 'b', updatedAt: '2026-10-05T19:40:00.000Z' })
  const c = dish({ id: 'c', updatedAt: '2026-10-03T08:00:00.000Z' })

  it('keeps the order the shelf opened with, even when a dish becomes the latest', () => {
    const usedA = { ...a, updatedAt: '2026-10-06T12:00:00.000Z' }
    expect(shelfOrder([usedA, b, c], ['b', 'c', 'a']).map((d) => d.id)).toEqual(['b', 'c', 'a'])
  })

  it('puts dishes that appeared since first, the latest first', () => {
    const added = dish({ id: 'n', updatedAt: '2026-10-06T12:00:00.000Z' })
    const synced = dish({ id: 's', updatedAt: '2026-10-06T09:00:00.000Z' })
    expect(shelfOrder([a, b, c, synced, added], ['b', 'c', 'a']).map((d) => d.id)).toEqual(['n', 's', 'b', 'c', 'a'])
  })

  it('drops deleted dishes and shows the latest data of the rest', () => {
    const renamed = { ...c, name: 'Гречка' }
    expect(shelfOrder([a, renamed], ['b', 'c', 'a'])).toEqual([renamed, a])
  })

  it('without an order is the order of use', () => {
    expect(shelfOrder([a, b, c], []).map((d) => d.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('dishKind', () => {
  it('one counted product is simple, even with salt and water not counted', () => {
    expect(dishKind([ingredient('p', 130, false, 'Макароны')])).toBe('simple')
    expect(dishKind([ingredient('p', 130, false, 'Макароны'), ingredient('s', 5, true, 'Соль'), ingredient('w', 2000, true, 'Вода')])).toBe('simple')
  })

  it('two counted ingredients make it composite; unnamed rows do not count', () => {
    expect(dishKind([ingredient('p', 130, false, 'Макароны'), ingredient('m', 300, false, 'Фарш')])).toBe('composite')
    expect(dishKind([ingredient('p', 130, false, 'Макароны'), ingredient('e', null, false, ' ')])).toBe('simple')
  })
})

describe('dishErrors', () => {
  it('needs a counted, named product; the name and the usual weight may be empty', () => {
    expect(dishErrors(dish({ ingredients: [ingredient('p', null, false, '')] }))).toEqual(['noIngredients'])
    expect(dishErrors(dish({ ingredients: [ingredient('s', 5, true, 'Соль')] }))).toEqual(['noIngredients'])
    expect(dishErrors(dish({ ingredients: [ingredient('p', null, false, 'Макароны')] }))).toEqual([])
  })

  it('a weight must be positive when given', () => {
    expect(dishErrors(dish({ ingredients: [ingredient('p', 0, false, 'Макароны')] }))).toEqual(['badWeight'])
  })
})

describe('dishSource', () => {
  it('simple dish: product name and usual weight', () => {
    expect(dishSource(dish({ ingredients: [ingredient('p', 130, false, ' Макароны ')] }))).toEqual({ name: 'Макароны', rawGrams: 130 })
    expect(dishSource(dish({ name: 'Паста', ingredients: [ingredient('p', null, false, '')] }))).toEqual({ name: 'Паста', rawGrams: null })
  })

  it('nothing from a composite dish', () => {
    expect(dishSource(dish({ kind: 'composite', ingredients: [ingredient('p', 130)] }))).toBeNull()
  })
})

describe('defaultShareWeight', () => {
  it('average of positive weights, 1 when there are none', () => {
    expect(defaultShareWeight([70, 60, 0])).toBe(65)
    expect(defaultShareWeight([])).toBe(1)
  })

  it('shareWeights ignores gram portions', () => {
    expect(shareWeights([share('a', 70), cooked('c', 100), share('b', 60)])).toEqual([70, 60])
  })
})

describe('lineup', () => {
  const m = (name: string, weight: number) => ({ id: name, name, weight })
  const us = { id: 'us', name: 'Мы', members: [m('Ваня', 70), m('Ксюша', 60)], createdAt: '2026-10-01T08:00:00.000Z' }
  const withMom = { id: 'mom', name: 'С тёщей', members: [m('Ваня', 70), m('Ксюша', 60), m('Тёща', 60)], createdAt: '2026-10-01T09:00:00.000Z' }

  it('matchingCompany: same people and shares in any order, names ignore case and spaces', () => {
    expect(matchingCompany([m(' ксюша', 60), m('Ваня', 70)], [us, withMom])).toBe(us)
    expect(matchingCompany([m('Ваня', 70), m('Ксюша', 60), m('Тёща', 60)], [us, withMom])).toBe(withMom)
    expect(matchingCompany([m('Ваня', 70), m('Ксюша', 50)], [us, withMom])).toBeNull()
    expect(matchingCompany([...us.members, m('Гость', 65)], [us, withMom])).toBeNull()
  })

  it('matchingCompany compares the split, not the numbers: 54 : 46 is 70 : 60', () => {
    expect(matchingCompany([m('Ваня', 54), m('Ксюша', 46)], [us, withMom])).toBe(us)
    expect(matchingCompany([m('Ваня', 55), m('Ксюша', 45)], [us, withMom])).toBeNull()
  })

  it('lineupName joins names the way the locale does', () => {
    expect(lineupName([m('Ваня', 1), m('Ксюша', 1), m('Тёща', 1)], 'ru-RU')).toBe('Ваня, Ксюша и Тёща')
    expect(lineupName([m('Vanya', 1), m('Ksyusha', 1), m('Mom', 1)], 'en-US')).toBe('Vanya, Ksyusha, and Mom')
    expect(lineupName([m('Ваня', 1)], 'ru-RU')).toBe('Ваня')
    expect(lineupName([m(' ', 1)], 'ru-RU')).toBe('')
  })
})


describe('liveTareId', () => {
  const tares = [{ id: 'pot' }, { id: 'bowl' }]

  it('keeps a tare that is in the library', () => {
    expect(liveTareId('bowl', tares)).toBe('bowl')
  })

  it('falls back to no tare when the tare was deleted', () => {
    expect(liveTareId('pan', tares)).toBeNull()
    expect(liveTareId('pot', [])).toBeNull()
  })

  it('no tare stays no tare', () => {
    expect(liveTareId(null, tares)).toBeNull()
  })
})
