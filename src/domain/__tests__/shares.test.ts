import { describe, expect, it } from 'vitest'
import { equalPercents, equalSplit, exactPercents, isEqualSplit, keepAt, keepLimit, lineupPercents, moveBoundary, nudgePercent, percentShares, portionGrams, portionIn, toPercents } from '../shares'

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

describe('equalSplit', () => {
  it('exactly equal, summing to 100: «Поровну» on 7 is 100/7 each, not 15, 15, 14…', () => {
    const seven = equalSplit(7)
    expect(seven).toHaveLength(7)
    expect(new Set(seven).size).toBe(1)
    expect(total(seven)).toBeCloseTo(100, 9)
    expect(equalSplit(3)[0]).toBeCloseTo(33.333, 3)
    expect(equalSplit(0)).toEqual([])
  })
})

describe('isEqualSplit', () => {
  it('equal weights in any units; a rounding hair still counts as equal', () => {
    expect(isEqualSplit(equalSplit(7))).toBe(true)
    expect(isEqualSplit([1, 1, 1])).toBe(true)
    expect(isEqualSplit([15.714285714285714, 15.714285714285715])).toBe(true)
    expect(isEqualSplit([])).toBe(true)
  })

  it('70 : 60 and the whole-percent «equal» 34 : 33 : 33 are not', () => {
    expect(isEqualSplit([70, 60])).toBe(false)
    expect(isEqualSplit(equalPercents(3))).toBe(false)
  })
})

describe('exactPercents', () => {
  it('parts as percents summing to 100, without rounding', () => {
    const percents = exactPercents([0.645, 0.1917, 0.1633])
    expect(percents[0]).toBeCloseTo(64.5, 9)
    expect(percents[1]).toBeCloseTo(19.17, 9)
    expect(percents[2]).toBeCloseTo(16.33, 9)
  })

  it('a part under the minimum is lifted to it; nothing at all — equal', () => {
    expect(exactPercents([0.995, 0.005, 0])).toEqual([expect.closeTo(99.5, 9), 1, 1])
    expect(exactPercents([0, 0])).toEqual([50, 50])
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
    expect(portionIn({ share: 76 / 333, cookedGrams: 76, raw: [] }, '%')).toBe(22.8)
    expect(portionIn({ share: 0.5, cookedGrams: 166.5, raw: [] }, 'g')).toBe(167)
  })

  it('grams of the dry view: raw of the ingredient k is counted by', () => {
    const vanya = { share: 70 / 130, cookedGrams: 168, raw: [{ ingredientId: 'p', grams: 70 + 1 / 3 }] }
    expect(portionIn(vanya, 'g', 'p')).toBe(70)
    expect(portionIn(vanya, '%', 'p')).toBe(53.8)
    expect(portionIn({ share: 0.5, cookedGrams: null, raw: [{ ingredientId: 'p', grams: 65 }] }, 'g', 'p')).toBe(65)
  })

  it('null when it cannot be known', () => {
    expect(portionIn({ share: 0.5, cookedGrams: null, raw: [] }, 'g')).toBeNull()
    expect(portionIn({ share: null, cookedGrams: null, raw: [] }, '%')).toBeNull()
    expect(portionIn({ share: 0.5, cookedGrams: 100, raw: [] }, 'g', 'p')).toBeNull()
  })
})

describe('portionGrams', () => {
  const portion = { cookedGrams: 100, raw: [{ ingredientId: 'b', grams: 37.6 }] }

  it('«Готовый» in focus → cooked grams, «Сухой» → raw grams, full precision', () => {
    expect(portionGrams(portion, null)).toBe(100)
    expect(portionGrams(portion, 'b')).toBe(37.6)
  })

  it('null when the ingredient has no raw amount or there is no cooked weight', () => {
    expect(portionGrams(portion, 'x')).toBeNull()
    expect(portionGrams({ cookedGrams: null, raw: [] }, null)).toBeNull()
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

describe('lineupPercents', () => {
  const members = [
    { id: 'a', name: 'Ваня', weight: 70 },
    { id: 'b', name: 'Ксюша', weight: 60 },
    { id: 'c', name: 'Тёща', weight: 60 },
  ]

  it('each part of the dish as an exact percent, own portions included', () => {
    const portions = [
      { portionId: 'a', share: 0.645 },
      { portionId: 'b', share: 0.1917 },
      { portionId: 'c', share: 0.1633 },
    ]
    const next = lineupPercents(members, portions)
    expect(next?.map((m) => m.weight)).toEqual([expect.closeTo(64.5, 9), expect.closeTo(19.17, 9), expect.closeTo(16.33, 9)])
    expect(next?.map((m) => m.name)).toEqual(['Ваня', 'Ксюша', 'Тёща'])
  })

  it('equal parts stay equal: five of 88 g after an own 120 g are not rounded into 16 and 15 %', () => {
    const six = ['1', '2', '3', '4', '5', '6'].map((id) => ({ id, name: id, weight: 1 }))
    const shares = six.map((p) => ({ portionId: p.id, share: p.id === '5' ? 120 / 560 : 88 / 560 }))
    const next = lineupPercents(six, shares)!
    expect(isEqualSplit(next.filter((p) => p.id !== '5').map((p) => p.weight))).toBe(true)
  })

  it('what is set aside for tomorrow is not remembered: the parts are of what is given out', () => {
    const portions = [
      { portionId: 'a', share: 0.4 },
      { portionId: 'b', share: 0.2 },
      { portionId: 'c', share: 0.2 },
    ]
    expect(lineupPercents(members, portions)?.map((m) => m.weight)).toEqual([50, 25, 25].map((p) => expect.closeTo(p, 9)))
  })

  it('null while a part is not computable or nobody gets anything', () => {
    expect(lineupPercents(members, [{ portionId: 'a', share: 0.5 }, { portionId: 'b', share: null }, { portionId: 'c', share: 0.5 }])).toBeNull()
    expect(lineupPercents(members, [{ portionId: 'a', share: 1 }])).toBeNull()
    expect(lineupPercents(members, members.map((m) => ({ portionId: m.id, share: 0 })))).toBeNull()
    expect(lineupPercents([], [])).toBeNull()
  })
})
