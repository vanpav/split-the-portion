import { describe, expect, it } from 'vitest'
import { baseRawGrams, computeCooking, ingredientDisplayName, ingredientNames, portionRawGrams } from '../cooking'
import { basisKey, convertPortionInput, portionBasisOptions } from '../portionInput'
import { fillRemainder } from '../remainder'
import { splitLeftover } from '../split'
import { RAW_SUM } from '../types'
import { isValidSplitN, MAX_SPLIT_PORTIONS } from '../validation'
import { auto, buckwheat, cooked, cooking, food, ingredient, raw, soup } from './fixtures'

const inputOf = (c: ReturnType<typeof soup>, portionId: string) =>
  computeCooking(c).phases[0].portions.find((p) => p.portionId === portionId)!.input

describe('basis "default" is resolved by computeCooking', () => {
  it('single counted ingredient → its raw weight (excluded ones ignored)', () => {
    const c = cooking({
      ingredients: [ingredient('buckwheat', 200), ingredient('salt', 5, true)],
      portions: [auto('anya')],
    })
    expect(inputOf(c, 'anya')).toEqual({ basis: 'raw', ingredientId: 'buckwheat', grams: null })
  })

  it('composite dish or no ingredients → cooked', () => {
    expect(inputOf(soup([auto('anya')]), 'anya')).toEqual({ basis: 'cooked', grams: null })
    expect(inputOf(cooking({ ingredients: [], portions: [auto('anya')] }), 'anya')).toEqual({
      basis: 'cooked',
      grams: null,
    })
  })

  it('an explicit choice is kept even while empty', () => {
    const empty = raw('anya', 'chicken', null)
    const filled = raw('boris', 'chicken', 100)
    const c = soup([empty, filled])
    expect(inputOf(c, 'anya')).toEqual(empty.input)
    expect(inputOf(c, 'boris')).toEqual(filled.input)
  })
})

describe('portionBasisOptions', () => {
  it('single ingredient: raw first, then cooked', () => {
    expect(portionBasisOptions(computeCooking(buckwheat())).map(basisKey)).toEqual(['raw:buckwheat', 'cooked'])
  })

  it('composite: cooked first, then raw of each counted ingredient', () => {
    expect(portionBasisOptions(computeCooking(soup())).map(basisKey)).toEqual([
      'cooked',
      'raw:chicken',
      'raw:potato',
      'raw:carrot',
      'raw:onion',
      'raw:rice',
    ])
  })
})

describe('convertPortionInput', () => {
  it('80 g dry buckwheat ↔ 224 g cooked', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), cooked('boris', 336)])
    const result = computeCooking(c)
    expect(convertPortionInput(result, 'anya', { basis: 'cooked' }).grams).toBeCloseTo(224, 9)
    expect(convertPortionInput(result, 'boris', { basis: 'raw', ingredientId: 'buckwheat' }).grams).toBeCloseTo(120, 9)
  })

  it('soup portion 395 cooked → 75 g raw chicken', () => {
    const result = computeCooking(soup([cooked('me', 395)]))
    expect(convertPortionInput(result, 'me', { basis: 'raw', ingredientId: 'chicken' })).toEqual({
      basis: 'raw',
      ingredientId: 'chicken',
      grams: expect.closeTo(75, 9),
    })
  })

  it('not computable → grams null', () => {
    const result = computeCooking(soup([cooked('me', null)]))
    expect(convertPortionInput(result, 'me', { basis: 'raw', ingredientId: 'rice' }).grams).toBeNull()
  })
})

describe('fillRemainder with default basis', () => {
  it('a default person in a soup is filled in cooked grams', () => {
    const c = soup([cooked('me', 395), auto('anya')])
    expect(fillRemainder(c, computeCooking(c), 'anya')).toBeCloseTo(3160 - 395, 9)
  })

  it('an explicitly chosen empty basis is filled in its own units', () => {
    const c = soup([cooked('me', 395), raw('anya', 'chicken', null)])
    expect(fillRemainder(c, computeCooking(c), 'anya')).toBeCloseTo(525, 9)
  })
})

describe('remainder state', () => {
  it('some / none / over', () => {
    const state = (portions: Parameters<typeof buckwheat>[0]) => computeCooking(buckwheat(portions)).phases[0].remainder.state
    expect(state([raw('anya', 'buckwheat', 80)])).toBe('some')
    expect(state([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 120)])).toBe('none')
    expect(state([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 130)])).toBe('over')
  })

  it('nothing to split when nothing is left', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 200)])
    expect(splitLeftover(computeCooking(c), 2)).toBeNull()
  })
})

describe('isValidSplitN', () => {
  it('whole numbers from 1 to the maximum', () => {
    expect(isValidSplitN(1)).toBe(true)
    expect(isValidSplitN(MAX_SPLIT_PORTIONS)).toBe(true)
    expect(isValidSplitN(0)).toBe(false)
    expect(isValidSplitN(2.5)).toBe(false)
    expect(isValidSplitN(MAX_SPLIT_PORTIONS + 1)).toBe(false)
    expect(isValidSplitN(null)).toBe(false)
  })
})

describe('names', () => {
  it('unnamed ingredient gets a label; base raw is looked up by id', () => {
    expect(ingredientDisplayName(ingredient('x', 10, false, '  '))).toBe('Без названия')
    expect(ingredientNames(soup()).get('chicken')).toBe('Курица')
    const result = computeCooking(buckwheat([raw('anya', 'buckwheat', 80)]))
    expect(baseRawGrams(result, result.phases[0].remainder.raw)).toBeCloseTo(120, 9)
    expect(baseRawGrams(computeCooking(soup()), [])).toBeNull()
  })
})

describe('a portion in raw grams of the sum (composite dish, RAW_SUM)', () => {
  it('170 g of the 1 360 g counted is the same 1/8 of the soup as 395 g of the 3 160 g cooked', () => {
    const byRaw = computeCooking(soup([raw('p', RAW_SUM, 170)])).phases[0].portions[0]
    expect(byRaw.share).toBeCloseTo(0.125, 9)
    expect(byRaw.cookedGrams).toBeCloseTo(395, 9)
    expect(portionRawGrams(computeCooking(soup()), byRaw.raw)).toBeCloseTo(170, 9)
  })

  it('nothing counted: the portion cannot be computed', () => {
    const none = cooking({ ingredients: [ingredient('w', 2000, true)], weighings: [food('w0', 1000)], portions: [raw('p', RAW_SUM, 100)] })
    expect(computeCooking(none).phases[0].portions[0]).toMatchObject({ share: null, issue: 'missingIngredient' })
  })

  it('one counted ingredient: the sum is that ingredient', () => {
    const result = computeCooking(cooking({ ingredients: [ingredient('b', 200)], weighings: [food('w0', 560)], portions: [raw('p', RAW_SUM, 80)] }))
    expect(result.phases[0].portions[0].cookedGrams).toBeCloseTo(224, 9)
    expect(portionRawGrams(result, result.phases[0].portions[0].raw)).toBeCloseTo(80, 9)
  })
})
