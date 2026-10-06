import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { cookingDraft } from '../draft'
import type { Company, Dish } from '../types'

const AT = '2026-10-05T12:00:00.000Z'
const pasta: Dish = {
  id: 'd',
  kind: 'simple',
  name: 'Макароны',
  createdAt: AT,
  updatedAt: AT,
  ingredients: [{ id: 'p', name: 'Макароны', rawGrams: 130, excluded: false }],
  tareId: null,
  cooked: null,
}
const us: Company = {
  id: 'c',
  name: 'Ваня и Ксюша',
  createdAt: AT,
  members: [
    { id: 'v', name: 'Ваня', weight: 70 },
    { id: 'k', name: 'Ксюша', weight: 60 },
  ],
}
const pot = { id: 't', name: 'Кастрюля', grams: 850, createdAt: AT }

describe('cookingDraft', () => {
  it('two numbers → each person\'s cooked grams', () => {
    const draft = cookingDraft(pasta, { rawGrams: {}, scaleGrams: 312, tare: null, people: us.members, companyId: us.id }, AT)
    const [vanya, ksyusha] = computeCooking(draft).phases[0].portions
    expect(vanya.cookedGrams).toBeCloseTo(168, 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(144, 9)
  })

  it('today\'s raw weight and a tare', () => {
    const draft = cookingDraft(pasta, { rawGrams: { p: 150 }, scaleGrams: 1210, tare: pot, people: us.members, companyId: us.id }, AT)
    expect(draft.ingredients[0].rawGrams).toBe(150)
    const phase = computeCooking(draft).phases[0]
    expect(phase.foodGrams).toBe(360)
    expect(phase.portions[0].raw[0].grams).toBeCloseTo(150 * (70 / 130), 9)
  })

  it('no company → no portions, the dish is still weighed', () => {
    const draft = cookingDraft(pasta, { rawGrams: {}, scaleGrams: 312, tare: null, people: [], companyId: null }, AT)
    expect(draft.portions).toEqual([])
    expect(computeCooking(draft).phases[0].k?.value).toBeCloseTo(2.4, 9)
  })

  it('a person with an own portion gets exactly it, the others split the rest by share', () => {
    const draft = cookingDraft(
      pasta,
      { rawGrams: {}, scaleGrams: 312, tare: null, people: us.members, companyId: us.id, fixedCooked: { v: 76 } },
      AT,
    )
    const [vanya, ksyusha] = computeCooking(draft).phases[0].portions
    expect(vanya.cookedGrams).toBeCloseTo(76, 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(312 - 76, 9)
    expect(draft.portions[0].input).toEqual({ basis: 'cooked', grams: 76 })
  })

  it('an own portion in dry grams: exactly that much dry, its cooked grams by k', () => {
    const draft = cookingDraft(
      pasta,
      {
        rawGrams: {},
        scaleGrams: 312,
        tare: null,
        people: us.members,
        companyId: us.id,
        fixedRaw: { v: { ingredientId: 'p', grams: 60 } },
      },
      AT,
    )
    const [vanya, ksyusha] = computeCooking(draft).phases[0].portions
    expect(draft.portions[0].input).toEqual({ basis: 'raw', ingredientId: 'p', grams: 60 })
    expect(vanya.raw[0].grams).toBeCloseTo(60, 9)
    expect(vanya.cookedGrams).toBeCloseTo(60 * 2.4, 9)
    expect(ksyusha.raw[0].grams).toBeCloseTo(70, 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(312 - 144, 9)
  })

  it('a dry own portion before the cooked weight: dry grams known, cooked not', () => {
    const draft = cookingDraft(
      pasta,
      { rawGrams: {}, scaleGrams: null, tare: null, people: us.members, companyId: us.id, fixedRaw: { v: { ingredientId: 'p', grams: 60 } } },
      AT,
    )
    const [vanya] = computeCooking(draft).phases[0].portions
    expect(vanya.raw[0].grams).toBeCloseTo(60, 9)
    expect(vanya.cookedGrams).toBeNull()
  })

  it('part set aside «на завтра»: shares shrink in proportion, the rest stays in the pot', () => {
    const draft = cookingDraft(
      pasta,
      { rawGrams: {}, scaleGrams: 400, tare: null, people: us.members, companyId: us.id, keepPercent: 35 },
      AT,
    )
    const phase = computeCooking(draft).phases[0]
    const [vanya, ksyusha] = phase.portions
    expect(vanya.cookedGrams).toBeCloseTo(260 * (70 / 130), 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(260 * (60 / 130), 9)
    expect(phase.remainder.cookedGrams).toBeCloseTo(140, 9)
    expect(draft.keepPercent).toBe(35)
  })

  it('set aside after own portions: sharing people split what is left of both', () => {
    const draft = cookingDraft(
      pasta,
      { rawGrams: {}, scaleGrams: 400, tare: null, people: us.members, companyId: us.id, fixedPercent: { v: 50 }, keepPercent: 20 },
      AT,
    )
    const phase = computeCooking(draft).phases[0]
    expect(phase.portions[1].cookedGrams).toBeCloseTo(120, 9)
    expect(phase.remainder.cookedGrams).toBeCloseTo(80, 9)
  })

  it('nothing set aside → keepPercent null', () => {
    const draft = cookingDraft(pasta, { rawGrams: {}, scaleGrams: 312, tare: null, people: us.members, companyId: us.id, keepPercent: 0 }, AT)
    expect(draft.keepPercent).toBeNull()
  })

  it('does not touch the dish', () => {
    cookingDraft(pasta, { rawGrams: { p: 150 }, scaleGrams: null, tare: null, people: [], companyId: null }, AT)
    expect(pasta.ingredients[0].rawGrams).toBe(130)
  })
})
