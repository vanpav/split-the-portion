import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { canReweigh, leftoverCookedGrams } from '../phases'
import { buckwheat, cooked, cooking, food, raw, soup, withTare } from './fixtures'

const nextDay = (portions = [raw('anya', 'buckwheat', 80)]) => ({
  ...buckwheat(portions),
  weighings: [withTare('w0', 1410, 850), food('w1', 310)],
})

describe('canReweigh', () => {
  it('needs something left in the current phase', () => {
    expect(canReweigh(computeCooking(buckwheat([raw('anya', 'buckwheat', 80)])))).toBe(true)
    expect(canReweigh(computeCooking(buckwheat([raw('anya', 'buckwheat', 200)])))).toBe(false)
    expect(canReweigh(computeCooking(buckwheat([raw('anya', 'buckwheat', 250)])))).toBe(false)
  })

  it('looks at the last phase', () => {
    expect(canReweigh(computeCooking(nextDay([raw('anya', 'buckwheat', 80), cooked('b', 310, 'w1')])))).toBe(false)
    expect(canReweigh(computeCooking(nextDay()))).toBe(true)
  })

  it('needs the current phase weighed', () => {
    const unweighed = { ...nextDay(), weighings: [withTare('w0', 1410, 850), food('w1', null)] }
    expect(canReweigh(computeCooking(unweighed))).toBe(false)
  })

  it('needs counted ingredients', () => {
    expect(canReweigh(computeCooking(cooking({ ingredients: [] })))).toBe(false)
  })
})

describe('leftoverCookedGrams', () => {
  it('is null while nothing was taken', () => {
    expect(leftoverCookedGrams(computeCooking(buckwheat()))).toBeNull()
  })

  it('is the cooked leftover of the current phase', () => {
    expect(leftoverCookedGrams(computeCooking(buckwheat([raw('anya', 'buckwheat', 80)])))).toBeCloseTo(336, 9)
    expect(leftoverCookedGrams(computeCooking(nextDay()))).toBeCloseTo(310, 9)
  })

  it('is null when nothing is left or the weight is unknown', () => {
    expect(leftoverCookedGrams(computeCooking(buckwheat([raw('anya', 'buckwheat', 200)])))).toBeNull()
    expect(leftoverCookedGrams(computeCooking({ ...nextDay(), weighings: [withTare('w0', 1410, 850), food('w1', null)] }))).toBeNull()
  })
})

describe('composite dish re-weighed', () => {
  // Soup 3160 g, «Я» took 395 g (1/8), the rest re-weighed at 2600 g (it thickened overnight).
  const result = computeCooking({
    ...soup([cooked('me', 395), cooked('next', 500, 'w1')]),
    weighings: [food('w0', 3160), food('w1', 2600)],
  })
  const phase = result.phases[1]

  it('leftover k is per raw weight of what is left', () => {
    expect(phase.available).toBeCloseTo(0.875, 12)
    expect(phase.k).toMatchObject({ kind: 'dish' })
    expect(phase.k!.value).toBeCloseTo(2600 / (result.rawTotal * 0.875), 12)
  })

  it('a new portion is computed from the new weight', () => {
    const chicken = phase.portions[0].raw.find((r) => r.ingredientId === 'chicken')!
    expect(chicken.grams).toBeCloseTo(600 * (500 / 2600) * 0.875, 9)
    expect(phase.reconcile).toMatchObject({ basis: 'cooked', total: 2600 })
  })
})
