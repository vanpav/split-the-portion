import { describe, expect, it } from 'vitest'
import { equalPercents, keepAt, keepLimit, moveBoundary, nudgePercent, percentShares, portionIn, toPercents } from '../shares'

const total = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('toPercents', () => {
  it('any weights → whole percents summing to 100', () => {
    expect(toPercents([70, 60])).toEqual([54, 46])
    expect(toPercents([1, 1, 1])).toEqual([34, 33, 33])
    expect(total(toPercents([70, 60, 60, 65]))).toBe(100)
  })

  it('nobody under 1 %; no weights at all → equal', () => {
    expect(toPercents([1000, 1])).toEqual([99, 1])
    expect(toPercents([1000, 0])).toEqual([99, 1])
    expect(toPercents([0, 0])).toEqual([50, 50])
  })
})

describe('percentShares', () => {
  it('parts of the whole in the whole percents of the bar', () => {
    expect(percentShares([70, 60])).toEqual([0.54, 0.46])
    expect(percentShares([1, 1, 1])).toEqual([0.34, 0.33, 0.33])
    expect(percentShares([5])).toEqual([1])
    expect(percentShares([])).toEqual([])
  })
})

describe('equalPercents', () => {
  it('as equal as possible', () => {
    expect(equalPercents(3)).toEqual([34, 33, 33])
    expect(equalPercents(4)).toEqual([25, 25, 25, 25])
    expect(equalPercents(0)).toEqual([])
  })
})

describe('moveBoundary', () => {
  it('moves the border between two neighbours only', () => {
    expect(moveBoundary([40, 30, 30], 0, 50)).toEqual([50, 20, 30])
    expect(moveBoundary([40, 30, 30], 1, 60)).toEqual([40, 20, 40])
  })

  it('rounds to whole percents and keeps each neighbour at 1 % or more', () => {
    expect(moveBoundary([50, 50], 0, 62.4)).toEqual([62, 38])
    expect(moveBoundary([50, 50], 0, 120)).toEqual([99, 1])
    expect(moveBoundary([40, 30, 30], 1, 10)).toEqual([40, 1, 59])
  })

  it('ignores a border that does not exist', () => {
    expect(moveBoundary([50, 50], 1, 30)).toEqual([50, 50])
  })
})

describe('nudgePercent', () => {
  it('two people: one gains 1 %, the other gives it', () => {
    expect(nudgePercent([54, 46], 0, 1)).toEqual([55, 45])
    expect(nudgePercent([54, 46], 1, -1)).toEqual([55, 45])
  })

  it('several people: the difference is shared in proportion, the total stays 100', () => {
    const result = nudgePercent([25, 25, 25, 25], 0, 3)
    expect(result).toEqual([28, 24, 24, 24])
    expect(total(nudgePercent([40, 30, 20, 10], 3, 7))).toBe(100)
  })

  it('stops at the edges: nobody under 1 %', () => {
    expect(nudgePercent([99, 1], 0, 1)).toEqual([99, 1])
    expect(nudgePercent([2, 49, 49], 0, -5)).toEqual([1, 50, 49])
    expect(nudgePercent([98, 1, 1], 0, 5)).toEqual([98, 1, 1])
  })
})

describe('portionIn', () => {
  it('grams ⇄ percent of the dish', () => {
    expect(portionIn({ share: 76 / 333, cookedGrams: 76 }, '%')).toBe(22.8)
    expect(portionIn({ share: 0.5, cookedGrams: 166.5 }, 'g')).toBe(167)
  })

  it('null when it cannot be known', () => {
    expect(portionIn({ share: 0.5, cookedGrams: null }, 'g')).toBeNull()
    expect(portionIn({ share: null, cookedGrams: null }, '%')).toBeNull()
  })
})

describe('keepAt', () => {
  it('the border at 65 % of the dish → 35 % set aside', () => {
    expect(keepAt(65, 98)).toBe(35)
    expect(keepAt(64.6, 98)).toBe(35)
  })

  it('back to the edge (or past it) → nothing set aside', () => {
    expect(keepAt(99.7, 98)).toBe(0)
    expect(keepAt(120, 98)).toBe(0)
  })

  it('no further than the limit', () => {
    expect(keepAt(0, 98)).toBe(98)
    expect(keepAt(10, 0)).toBe(0)
  })
})

describe('keepLimit', () => {
  const portion = (portionId: string, share: number | null) => ({ portionId, share })
  const phase = (...portions: ReturnType<typeof portion>[]) => ({ portions }) as unknown as Parameters<typeof keepLimit>[0]

  it('everyone shares: all of the dish less a minimum each', () => {
    expect(keepLimit(phase(portion('v', 0.6), portion('k', 0.4)), ['v', 'k'])).toBe(98)
  })

  it('after an own portion: only what the sharing people have', () => {
    expect(keepLimit(phase(portion('v', 0.8), portion('k', 0.2)), ['k'])).toBe(19)
    expect(keepLimit(phase(portion('v', 0.605), portion('k', 0.395)), ['k'])).toBe(38)
  })

  it('nothing left for them, or no one shares → 0', () => {
    expect(keepLimit(phase(portion('v', 1), portion('k', null)), ['k'])).toBe(0)
    expect(keepLimit(phase(portion('v', 1)), [])).toBe(0)
  })
})
