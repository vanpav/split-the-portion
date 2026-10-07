import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { addPortion, DEFAULT_PORTIONS, dishPortions, removeLastPortion, splitSummary } from '../portions'
import { MAX_SPLIT_PORTIONS } from '../validation'
import { buckwheat, share } from './fixtures'

const sixEqual = () => {
  let list = dishPortions(undefined, ['a', 'b'])
  for (const id of ['c', 'd', 'e', 'f']) list = addPortion(list, id)
  return list
}

describe('dishPortions', () => {
  it('a dish never split: two equal portions with the fresh ids', () => {
    expect(DEFAULT_PORTIONS).toBe(2)
    expect(dishPortions(undefined, ['a', 'b', 'c'])).toEqual([
      { id: 'a', weight: 1 },
      { id: 'b', weight: 1 },
    ])
  })

  it('what was set for the dish', () => {
    const stored = [
      { id: 'p1', weight: 30 },
      { id: 'p2', weight: 70 },
    ]
    expect(dishPortions(stored, ['a', 'b'])).toEqual(stored)
  })

  it('a broken stored list falls back to the default', () => {
    const fallback = (stored: { id: string; weight: number }[]) => dishPortions(stored, ['a', 'b'])[0].id
    expect(fallback([])).toBe('a')
    expect(fallback([{ id: 'p1', weight: 0 }])).toBe('a')
    expect(fallback([{ id: 'p1', weight: Number.NaN }])).toBe('a')
    expect(fallback([{ id: '', weight: 1 }])).toBe('a')
    expect(
      fallback([
        { id: 'p1', weight: 1 },
        { id: 'p1', weight: 1 },
      ]),
    ).toBe('a')
    expect(fallback(Array.from({ length: MAX_SPLIT_PORTIONS + 1 }, (_, i) => ({ id: `p${i}`, weight: 1 })))).toBe('a')
  })
})

describe('addPortion / removeLastPortion', () => {
  it('«+» adds a portion with the average share at the end', () => {
    expect(
      addPortion(
        [
          { id: 'p1', weight: 20 },
          { id: 'p2', weight: 40 },
        ],
        'p3',
      ),
    ).toEqual([
      { id: 'p1', weight: 20 },
      { id: 'p2', weight: 40 },
      { id: 'p3', weight: 30 },
    ])
  })

  it('equal portions stay equal: 2 → 6, then «−» takes the last one', () => {
    const six = sixEqual()
    expect(six.map((p) => p.weight)).toEqual([1, 1, 1, 1, 1, 1])
    expect(removeLastPortion(six).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('from 1 to MAX_SPLIT_PORTIONS', () => {
    expect(removeLastPortion([{ id: 'p1', weight: 1 }])).toEqual([{ id: 'p1', weight: 1 }])
    const full = Array.from({ length: MAX_SPLIT_PORTIONS }, (_, i) => ({ id: `p${i}`, weight: 1 }))
    expect(addPortion(full, 'x')).toHaveLength(MAX_SPLIT_PORTIONS)
  })
})

describe('portions are split like people', () => {
  it('buckwheat 200 → 560 in 6 equal portions: 93,3 g cooked and 33,3 g dry each', () => {
    const phase = computeCooking(buckwheat(sixEqual().map((p) => share(p.id, p.weight)))).phases[0]
    expect(phase.portions).toHaveLength(6)
    for (const p of phase.portions) {
      expect(p.cookedGrams).toBeCloseTo(560 / 6, 9)
      expect(p.raw[0].grams).toBeCloseTo(200 / 6, 9)
    }
  })
})

describe('splitSummary', () => {
  it('the same amount when all round to the same shown value: «по 80 г × 7»', () => {
    expect(splitSummary(Array(7).fill(80))).toEqual({ count: 7, same: 80, least: 80, most: 80 })
    expect(splitSummary([79.6, 80.2, 80.4])?.same).toBeCloseTo(79.6, 9)
    expect(splitSummary(Array(6).fill(560 / 6))?.same).toBeCloseTo(93.33, 2)
  })

  it('different once rounded: the range instead', () => {
    expect(splitSummary([84, 84, 78.4, 78.4])).toEqual({ count: 4, same: null, least: 78.4, most: 84 })
  })

  it('percent: one decimal decides', () => {
    expect(splitSummary([14.28, 14.31], 1)?.same).toBeCloseTo(14.28, 9)
    expect(splitSummary([14.2, 14.3], 1)?.same).toBeNull()
  })

  it('nothing to sum up with fewer than two, or while an amount is unknown', () => {
    expect(splitSummary([80])).toBeNull()
    expect(splitSummary([])).toBeNull()
    expect(splitSummary([80, null])).toBeNull()
  })
})
