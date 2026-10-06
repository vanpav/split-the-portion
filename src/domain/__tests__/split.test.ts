import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PORTIONS,
  nudgePortions,
  portionCount,
  portionsLabel,
  roundPreservingSum,
  splitDish,
  splitEqual,
} from '../split'
import { MAX_SPLIT_PORTIONS } from '../validation'
import { buckwheat, cooking, ingredient, raw, share, soup, withTare } from './fixtures'

describe('splitEqual', () => {
  it('1000 / 3 → 334, 333, 333 (ties go to the lower index)', () => {
    expect(splitEqual(1000, 3)).toEqual([334, 333, 333])
  })

  it('sum always equals the rounded total', () => {
    for (const [total, n] of [[3160, 8], [1053.7, 4], [7, 3], [0.4, 2], [999.5, 7]] as const) {
      const parts = splitEqual(total, n)
      expect(parts).toHaveLength(n)
      expect(parts.reduce((a, b) => a + b, 0)).toBe(Math.round(total))
    }
  })

  it('invalid n → empty', () => {
    expect(splitEqual(100, 0)).toEqual([])
    expect(splitEqual(100, 2.5)).toEqual([])
  })
})

describe('roundPreservingSum', () => {
  it('gives extra grams to the largest fractions', () => {
    expect(roundPreservingSum([1.2, 1.7, 1.1])).toEqual([1, 2, 1])
    expect(roundPreservingSum([0.5, 0.5, 0.5, 0.5])).toEqual([1, 1, 0, 0])
  })
})

describe('splitDish («Режим порций»)', () => {
  it('buckwheat 200 → 560 in 6: cooked by largest remainder, dry the same in each', () => {
    const split = splitDish(buckwheat(), 6)!
    expect(split.cookedGrams).toEqual([94, 94, 93, 93, 93, 93])
    expect(split.baseRaw).toBeCloseTo(200 / 6, 9)
    expect(split.raw).toEqual([{ ingredientId: 'buckwheat', grams: 200 / 6 }])
  })

  it('one portion fewer: 5 × 112 g, 40 g dry', () => {
    const split = splitDish(buckwheat(), 5)!
    expect(split.cookedGrams).toEqual([112, 112, 112, 112, 112])
    expect(split.baseRaw).toBeCloseTo(40, 9)
  })

  it('the whole dish: own portions and «на завтра» of the cooking do not count', () => {
    const split = splitDish({ ...buckwheat([raw('anya', 'buckwheat', 80), share('boris', 1)]), keepPercent: 20 }, 2)!
    expect(split.cookedGrams).toEqual([280, 280])
    expect(split.baseRaw).toBeCloseTo(100, 9)
  })

  it('before weighing: no cooked grams, dry grams already', () => {
    const split = splitDish(cooking({ kind: 'simple', ingredients: [ingredient('rice', 150)] }), 3)!
    expect(split.cookedGrams).toBeNull()
    expect(split.baseRaw).toBeCloseTo(50, 9)
  })

  it('composite: raw content per portion, excluded ingredients left out, no base', () => {
    const split = splitDish(soup(), 8)!
    expect(split.cookedGrams).toEqual(Array(8).fill(395))
    expect(split.baseRaw).toBeNull()
    expect(split.raw.map((r) => [r.ingredientId, r.grams])).toEqual([
      ['chicken', 75],
      ['potato', 50],
      ['carrot', 20],
      ['onion', 15],
      ['rice', 10],
    ])
  })

  it('weight with tare below the tare: no cooked grams', () => {
    const split = splitDish({ ...buckwheat(), weighings: [withTare('w0', 800, 850)] }, 2)!
    expect(split.cookedGrams).toBeNull()
  })

  it('invalid n → null', () => {
    expect(splitDish(buckwheat(), 0)).toBeNull()
    expect(splitDish(buckwheat(), 1.5)).toBeNull()
    expect(splitDish(buckwheat(), MAX_SPLIT_PORTIONS + 1)).toBeNull()
  })
})

describe('nudgePortions', () => {
  it('one step at a time, from 1 to MAX_SPLIT_PORTIONS', () => {
    expect(nudgePortions(6, -1)).toBe(5)
    expect(nudgePortions(2, 1)).toBe(3)
    expect(nudgePortions(1, -1)).toBe(1)
    expect(nudgePortions(MAX_SPLIT_PORTIONS, 1)).toBe(MAX_SPLIT_PORTIONS)
  })
})

describe('portionCount', () => {
  it('what was set for the dish, otherwise the default', () => {
    expect(portionCount({ d1: 6 }, 'd1')).toBe(6)
    expect(portionCount({ d1: 6 }, 'd2')).toBe(DEFAULT_PORTIONS)
    expect(DEFAULT_PORTIONS).toBe(2)
  })

  it('a broken stored value falls back to the default', () => {
    expect(portionCount({ d1: 0 }, 'd1')).toBe(DEFAULT_PORTIONS)
    expect(portionCount({ d1: 2.5 }, 'd1')).toBe(DEFAULT_PORTIONS)
    expect(portionCount({ d1: 1000 }, 'd1')).toBe(DEFAULT_PORTIONS)
  })
})

describe('portionsLabel', () => {
  it('agrees with the number', () => {
    expect(portionsLabel(1)).toBe('1 порция')
    expect(portionsLabel(2)).toBe('2 порции')
    expect(portionsLabel(5)).toBe('5 порций')
    expect(portionsLabel(11)).toBe('11 порций')
    expect(portionsLabel(21)).toBe('21 порция')
    expect(portionsLabel(22)).toBe('22 порции')
    expect(portionsLabel(100)).toBe('100 порций')
  })
})
