// Edge cases from docs/SPEC.md §8.
import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { fillRemainder } from '../remainder'
import { splitLeftover } from '../split'
import { cookingWarnings, isValidTareGrams } from '../validation'
import { auto, buckwheat, cooked, cooking, food, ingredient, raw, share, soup, withTare } from './fixtures'

describe('no cooked weight yet', () => {
  const c = cooking({
    ingredients: [ingredient('buckwheat', 200)],
    portions: [raw('anya', 'buckwheat', 80), cooked('boris', 300)],
  })
  const phase = computeCooking(c).phases[0]

  it('raw portions still work, cooked values are unknown', () => {
    expect(phase.foodGrams).toBeNull()
    expect(phase.weighingError).toBe('empty')
    expect(phase.k).toBeNull()
    expect(phase.portions[0].share).toBeCloseTo(0.4, 12)
    expect(phase.portions[0].cookedGrams).toBeNull()
    expect(phase.portions[1].issue).toBe('noCookedWeight')
  })

  it('raw reconciliation works and is incomplete while a portion cannot be computed', () => {
    expect(phase.reconcile).toMatchObject({ basis: 'raw', status: 'incomplete' })
    expect(phase.reconcile!.distributed).toBeCloseTo(80, 9)
  })

  it('composite dish without cooked weight has no reconciliation', () => {
    const s = { ...soup([raw('me', 'chicken', 100)]), weighings: [food('w0', null)] }
    expect(computeCooking(s).phases[0].reconcile).toBeNull()
  })
})

describe('reconciliation states', () => {
  it('empty rows → incomplete, not under', () => {
    const r = computeCooking(buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', null)]))
      .phases[0].reconcile!
    expect(r.status).toBe('incomplete')
  })

  it('no portions at all → incomplete', () => {
    expect(computeCooking(buckwheat()).phases[0].reconcile!.status).toBe('incomplete')
  })

  it('over is shown even with empty rows', () => {
    const r = computeCooking(buckwheat([raw('anya', 'buckwheat', 250), raw('boris', 'buckwheat', null)]))
      .phases[0].reconcile!
    expect(r.status).toBe('over')
  })

  it('differences below 0.5 g are ok', () => {
    const r = computeCooking(buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 119.6)]))
      .phases[0].reconcile!
    expect(r.status).toBe('ok')
  })

  it('composite dish reconciles in cooked grams', () => {
    const r = computeCooking(soup([cooked('a', 1000), raw('b', 'chicken', 300)])).phases[0].reconcile!
    expect(r.basis).toBe('cooked')
    expect(r.total).toBe(3160)
    expect(r.distributed).toBeCloseTo(1000 + 1580, 9)
    expect(r.status).toBe('under')
  })
})

describe('ingredients', () => {
  it('excluded ingredients alone do not make a base ingredient', () => {
    const c = cooking({
      ingredients: [ingredient('buckwheat', 200), ingredient('salt', 5, true)],
      weighings: [food('w0', 560)],
    })
    const result = computeCooking(c)
    expect(result.baseIngredientId).toBe('buckwheat')
    expect(result.phases[0].k).toEqual({ kind: 'base', value: expect.closeTo(2.8, 12) })
    expect(result.rawTotal).toBe(205)
  })

  it('ingredient with zero or empty raw weight is ignored and flagged', () => {
    const c = cooking({
      ingredients: [ingredient('buckwheat', 200), ingredient('oil', 0), ingredient('x', null)],
      weighings: [food('w0', 560)],
    })
    const result = computeCooking(c)
    expect(result.countedIngredientIds).toEqual(['buckwheat'])
    expect(cookingWarnings(c, result)).toEqual(
      expect.arrayContaining([
        { code: 'ingredientNoRaw', ingredientId: 'oil' },
        { code: 'ingredientNoRaw', ingredientId: 'x' },
      ]),
    )
  })

  it('all ingredients excluded → warning, nothing to reconcile', () => {
    const c = cooking({ ingredients: [ingredient('water', 1000, true)], weighings: [food('w0', 900)] })
    const result = computeCooking(c)
    expect(result.phases[0].reconcile).toBeNull()
    expect(result.phases[0].k?.kind).toBe('dish')
    expect(cookingWarnings(c, result)).toContainEqual({ code: 'allExcluded' })
  })

  it('no ingredients at all → no k, no reconciliation, no crash', () => {
    const result = computeCooking(cooking({ ingredients: [], weighings: [food('w0', 500)] }))
    expect(result.phases[0].k).toBeNull()
    expect(result.phases[0].reconcile).toBeNull()
  })

  it('portion based on a removed or excluded ingredient is flagged and not reconciled', () => {
    const base = soup([raw('me', 'chicken', 100), cooked('you', 395)])
    for (const c of [
      { ...base, ingredients: base.ingredients.filter((i) => i.id !== 'chicken') },
      { ...base, ingredients: base.ingredients.map((i) => (i.id === 'chicken' ? { ...i, excluded: true } : i)) },
    ]) {
      const result = computeCooking(c)
      expect(result.phases[0].portions[0].issue).toBe('missingIngredient')
      expect(result.phases[0].reconcile!.status).toBe('incomplete')
      expect(cookingWarnings(c, result)).toContainEqual({ code: 'portionWithoutBasis', portionId: 'me' })
    }
  })
})

describe('yield plausibility', () => {
  it('k above range with food-only weighing hints at forgotten tare', () => {
    const c = { ...buckwheat(), weighings: [food('w0', 1410)] }
    expect(cookingWarnings(c, computeCooking(c))).toContainEqual({
      code: 'kOutOfRange',
      weighingId: 'w0',
      k: expect.closeTo(7.05, 9),
      maybeForgotTare: true,
    })
  })

  it('k out of range with tare does not blame the tare', () => {
    const c = { ...buckwheat(), weighings: [withTare('w0', 2400, 850)] }
    expect(cookingWarnings(c, computeCooking(c))).toContainEqual(
      expect.objectContaining({ code: 'kOutOfRange', maybeForgotTare: false }),
    )
  })

  it('normal buckwheat produces no warnings', () => {
    const c = buckwheat()
    expect(cookingWarnings(c, computeCooking(c))).toEqual([])
  })
})

describe('phases', () => {
  it('changing a day-one portion changes day two', () => {
    const c = {
      ...buckwheat([raw('anya', 'buckwheat', 100), cooked('boris', 155, 'w1')]),
      weighings: [withTare('w0', 1410, 850), food('w1', 310)],
    }
    const phase = computeCooking(c).phases[1]
    expect(phase.available).toBeCloseTo(0.5, 12)
    expect(phase.k!.value).toBeCloseTo(3.1, 12)
    expect(phase.portions[0].raw[0].grams).toBeCloseTo(50, 9)
  })

  it('nothing left after day one → day-two portions cannot be computed', () => {
    const c = {
      ...buckwheat([raw('anya', 'buckwheat', 200), cooked('boris', 100, 'w1')]),
      weighings: [withTare('w0', 1410, 850), food('w1', 50)],
    }
    const phase = computeCooking(c).phases[1]
    expect(phase.k).toBeNull()
    expect(phase.reconcile).toBeNull()
    expect(phase.portions[0].issue).toBe('nothingLeft')
  })

  it('portion pointing to an unknown weighing goes to the last phase', () => {
    const c = {
      ...buckwheat([raw('anya', 'buckwheat', 80, 'gone')]),
      weighings: [withTare('w0', 1410, 850), food('w1', 310)],
    }
    const result = computeCooking(c)
    expect(result.phases[0].portions).toHaveLength(0)
    expect(result.phases[1].portions).toHaveLength(1)
  })

  it('equal split uses the leftover of the last phase', () => {
    const split = splitLeftover(computeCooking(buckwheat([raw('anya', 'buckwheat', 80)])), 2)!
    expect(split.cookedGrams).toEqual([168, 168])
    expect(split.rawPerPortion[0].grams).toBeCloseTo(60, 9)
  })
})

describe('fillRemainder', () => {
  it('fills in cooked units', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), cooked('boris', 100)])
    expect(fillRemainder(c, computeCooking(c), 'boris')).toBeCloseTo(336, 9)
  })

  it('a portion with basis "default" is filled in the default basis of the dish', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), auto('boris')])
    expect(fillRemainder(c, computeCooking(c), 'boris')).toBeCloseTo(120, 9)
  })

  it('an explicitly chosen empty cooked portion is filled in cooked grams', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), cooked('boris', null)])
    expect(fillRemainder(c, computeCooking(c), 'boris')).toBeCloseTo(336, 9)
  })

  it('reduces an over-distributed last portion', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 130)])
    expect(fillRemainder(c, computeCooking(c), 'boris')).toBeCloseTo(120, 9)
  })

  it('null when already reconciled or result would be negative', () => {
    const ok = buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 120)])
    expect(fillRemainder(ok, computeCooking(ok), 'boris')).toBeNull()
    const neg = buckwheat([raw('anya', 'buckwheat', 250), raw('boris', 'buckwheat', 10)])
    expect(fillRemainder(neg, computeCooking(neg), 'boris')).toBeNull()
  })

  it('null for cooked units without cooked weight', () => {
    const c = { ...soup([cooked('boris', null)]), weighings: [food('w0', null)] }
    expect(fillRemainder(c, computeCooking(c), 'boris')).toBeNull()
  })
})

describe('isValidTareGrams', () => {
  it('accepts only positive weights', () => {
    expect(isValidTareGrams(850)).toBe(true)
    expect(isValidTareGrams(0.5)).toBe(true)
    expect(isValidTareGrams(0)).toBe(false)
    expect(isValidTareGrams(null)).toBe(false)
  })
})

describe('part set aside «на завтра»', () => {
  const c = cooking({
    ingredients: [ingredient('pasta', 200)],
    weighings: [food('w0', 500), food('w1', 200)],
    portions: [share('anya', 1), share('boris', 1), share('next', 1, 'w1')],
    keepPercent: 40,
  })
  const [first, second] = computeCooking(c).phases

  it('is taken off before sharing: shares shrink, the pot keeps it', () => {
    expect(first.portions[0].cookedGrams).toBeCloseTo(150, 9)
    expect(first.portions[1].cookedGrams).toBeCloseTo(150, 9)
    expect(first.remainder.share).toBeCloseTo(0.4, 12)
  })

  it('applies to the cooked dish only: a re-weighing splits all that is left', () => {
    expect(second.available).toBeCloseTo(0.4, 12)
    expect(second.portions[0].cookedGrams).toBeCloseTo(200, 9)
    expect(second.remainder.state).toBe('none')
  })

  it('more than own portions leave: sharing people get nothing', () => {
    const over = computeCooking({ ...c, keepPercent: 100, weighings: [food('w0', 500)] }).phases[0]
    expect(over.portions[0].issue).toBe('nothingLeft')
  })
})
