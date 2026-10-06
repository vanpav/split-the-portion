import { describe, expect, it } from 'vitest'
import { roundPreservingSum, splitEqual } from '../split'

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
