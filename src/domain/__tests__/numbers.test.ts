import { describe, expect, it } from 'vitest'
import { formatGrams, formatInput, formatK, formatPercent, formatTyped, parseGrams, roundHalfUp } from '../numbers'

const NBSP = ' '

describe('parseGrams', () => {
  it.each([
    ['1240', 1240],
    ['1240,5', 1240.5],
    ['1240.5', 1240.5],
    [' 1 240 ', 1240],
    [`1${NBSP}240`, 1240],
    ['12,', 12],
    [',5', 0.5],
    ['0', 0],
  ])('%j → %d', (input, value) => {
    expect(parseGrams(input)).toEqual({ ok: true, value })
  })

  it('empty input means "not set"', () => {
    expect(parseGrams('')).toEqual({ ok: true, value: null })
    expect(parseGrams('   ')).toEqual({ ok: true, value: null })
  })

  it.each(['1.240,5', '12a', '-5', ',', '1,2,3', '1e3', '+5'])('%j is invalid', (input) => {
    expect(parseGrams(input)).toEqual({ ok: false })
  })
})

describe('roundHalfUp', () => {
  it('rounds half away from zero', () => {
    expect(roundHalfUp(89.5)).toBe(90)
    expect(roundHalfUp(89.49)).toBe(89)
    expect(roundHalfUp(-0.5)).toBe(-1)
  })

  it('absorbs float noise', () => {
    expect(roundHalfUp(1.005, 2)).toBe(1.01)
    expect(roundHalfUp(2.675, 2)).toBe(2.68)
  })
})

describe('formatting', () => {
  it('grams: whole, ru-RU grouping, "< 1" for tiny positive amounts', () => {
    expect(formatGrams(89.2857)).toBe('89')
    expect(formatGrams(89.5)).toBe('90')
    expect(formatGrams(3160)).toBe(`3${NBSP}160`)
    expect(formatGrams(0.3)).toBe('< 1')
    expect(formatGrams(0)).toBe('0')
    expect(formatGrams(-0.2)).toBe('0')
  })

  it('k: up to 2 decimals with a comma', () => {
    expect(formatK(2.8)).toBe('2,8')
    expect(formatK(2.58333)).toBe('2,58')
    expect(formatK(3)).toBe('3')
  })

  it('percent: one decimal', () => {
    expect(formatPercent(0.125)).toBe('12,5')
    expect(formatPercent(1 / 3)).toBe('33,3')
  })
})

describe('formatInput', () => {
  it('round-trips through parseGrams', () => {
    expect(formatInput(null)).toBe('')
    expect(formatInput(1240.5)).toBe('1240,5')
    expect(formatInput(336.00000001)).toBe('336')
    expect(formatInput(89.2857)).toBe('89,3')
    expect(parseGrams(formatInput(1240.5))).toEqual({ ok: true, value: 1240.5 })
  })
})

describe('formatTyped', () => {
  it('the whole part grouped like formatGrams, the comma and fraction as typed', () => {
    expect(formatTyped('3160')).toBe(formatGrams(3160))
    expect(formatTyped('3160')).not.toBe('3160')
    expect(formatTyped('80')).toBe('80')
    expect(formatTyped('1500,')).toBe(`${formatGrams(1500)},`)
    expect(formatTyped('12500,5')).toBe(`${formatGrams(12500)},5`)
    expect(formatTyped('0,5')).toBe('0,5')
  })

  it('nothing typed or not a number — as it is', () => {
    expect(formatTyped('')).toBe('')
    expect(formatTyped(',5')).toBe(',5')
  })
})
