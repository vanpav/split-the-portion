import { describe, expect, it } from 'vitest'
import { defaultShareWeight, dishErrors, dishKind, dishSource, dishTitle, lineupName, matchingCompany, shareWeights, usualScaleGrams } from '../dish'
import type { Dish } from '../types'
import { cooked, cooking, food, ingredient, share, withTare } from './fixtures'

const dish = (parts: Partial<Dish>): Dish => ({
  id: 'd',
  kind: 'simple',
  name: '',
  createdAt: '',
  updatedAt: '',
  ingredients: [],
  tareId: null,
  ...parts,
})

describe('dishTitle', () => {
  it('name, else counted ingredients, else a placeholder', () => {
    expect(dishTitle(dish({ name: ' Плов ' }))).toBe('Плов')
    expect(dishTitle(dish({ ingredients: [ingredient('a', 1, false, 'Рис'), ingredient('b', 1, true, 'Соль')] }))).toBe('Рис')
    expect(dishTitle(dish({}))).toBe('Без названия')
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

  it('lineupName joins names', () => {
    expect(lineupName([m('Ваня', 1), m('Ксюша', 1), m('Тёща', 1)])).toBe('Ваня, Ксюша и Тёща')
    expect(lineupName([m('Ваня', 1)])).toBe('Ваня')
    expect(lineupName([m(' ', 1)])).toBe('Компания')
  })
})

describe('usualScaleGrams', () => {
  const at = (day: number) => `2026-10-0${day}T12:00:00.000Z`
  const saved = (dishId: string, day: number, weighing: ReturnType<typeof food>) =>
    cooking({ id: `c${day}`, dishId, createdAt: at(day), ingredients: [], weighings: [weighing] })

  it('the most frequent weight of this dish; a tie goes to the latest', () => {
    const history = [
      saved('pasta', 1, food('w', 312)),
      saved('pasta', 2, food('w', 300)),
      saved('pasta', 3, food('w', 312)),
      saved('pasta', 4, food('w', 300)),
      saved('pasta', 5, food('w', 290)),
      saved('soup', 6, food('w', 3160)),
    ]
    expect(usualScaleGrams(history, 'pasta', null)).toBe(300)
    expect(usualScaleGrams(history.slice(0, 3), 'pasta', null)).toBe(312)
  })

  it('counts only weighings with the same tare; skips empty ones', () => {
    const history = [
      saved('pasta', 1, withTare('w', 1160, 850)),
      saved('pasta', 2, withTare('w', 1160, 850)),
      saved('pasta', 3, food('w', 312)),
      saved('pasta', 4, food('w', null)),
    ]
    expect(usualScaleGrams(history, 'pasta', 'pot')).toBe(1160)
    expect(usualScaleGrams(history, 'pasta', null)).toBe(312)
    expect(usualScaleGrams(history, 'pasta', 'other')).toBeNull()
    expect(usualScaleGrams([], 'pasta', null)).toBeNull()
  })
})
