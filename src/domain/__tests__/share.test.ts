// Share portions: a company splits the dish by weight (docs/SPEC.md §3а, §5).
import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { fillRemainder } from '../remainder'
import { buckwheat, cooked, food, raw, share, soup } from './fixtures'

describe('share portions', () => {
  it('130 g pasta split 70 : 60 by dry weight, whatever water it took', () => {
    const c = {
      ...buckwheat([share('vanya', 70), share('ksyusha', 60)]),
      ingredients: [{ id: 'buckwheat', name: 'Макароны', rawGrams: 130, excluded: false }],
      weighings: [food('w0', 312)],
    }
    const [vanya, ksyusha] = computeCooking(c).phases[0].portions
    expect(vanya.raw[0].grams).toBeCloseTo(70, 9)
    expect(ksyusha.raw[0].grams).toBeCloseTo(60, 9)
    expect(vanya.cookedGrams).toBeCloseTo(168, 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(144, 9)
  })

  it('the same ratio holds when more is cooked', () => {
    const c = {
      ...buckwheat([share('vanya', 70), share('ksyusha', 60)]),
      ingredients: [{ id: 'buckwheat', name: 'Макароны', rawGrams: 260, excluded: false }],
      weighings: [food('w0', 600)],
    }
    const [vanya, ksyusha] = computeCooking(c).phases[0].portions
    expect(vanya.raw[0].grams).toBeCloseTo(140, 9)
    expect(ksyusha.cookedGrams).toBeCloseTo(600 * (60 / 130), 9)
  })

  it('a gram portion is taken first, shares split the rest; the phase reconciles', () => {
    // Example 1 buckwheat: 200 dry, 560 cooked. Anya 80 dry, Boris and Vasya split 120 dry 1 : 1.
    const phase = computeCooking(buckwheat([share('boris', 1), raw('anya', 'buckwheat', 80), share('vasya', 1)])).phases[0]
    expect(phase.portions.map((p) => p.portionId)).toEqual(['boris', 'anya', 'vasya'])
    expect(phase.portions[0].raw[0].grams).toBeCloseTo(60, 9)
    expect(phase.portions[2].cookedGrams).toBeCloseTo(168, 9)
    expect(phase.remainder.state).toBe('none')
    expect(phase.reconcile?.status).toBe('ok')
  })

  it('an empty gram portion does not take anything', () => {
    const phase = computeCooking(buckwheat([share('a', 1), cooked('b', null)])).phases[0]
    expect(phase.portions[0].share).toBeCloseTo(1, 12)
  })

  it('gram portions eat everything → shares get nothing left', () => {
    const phase = computeCooking(buckwheat([raw('anya', 'buckwheat', 200), share('b', 1)])).phases[0]
    expect(phase.portions[1]).toMatchObject({ share: null, issue: 'nothingLeft' })
  })

  it('zero weight takes nothing', () => {
    const phase = computeCooking(buckwheat([share('a', 0), share('b', 2)])).phases[0]
    expect(phase.portions[0]).toMatchObject({ share: null, issue: 'nothingLeft' })
    expect(phase.portions[1].share).toBeCloseTo(1, 12)
  })

  it('works without a cooked weight: raw known, cooked unknown', () => {
    const c = { ...buckwheat([share('a', 1), share('b', 1)]), weighings: [food('w0', null)] }
    const [a] = computeCooking(c).phases[0].portions
    expect(a.raw[0].grams).toBeCloseTo(100, 9)
    expect(a.cookedGrams).toBeNull()
  })

  it('composite dish: raw composition by share', () => {
    const [me] = computeCooking(soup([share('me', 1), share('you', 7)])).phases[0].portions
    expect(me.cookedGrams).toBeCloseTo(395, 9)
    expect(me.raw.find((r) => r.ingredientId === 'chicken')!.grams).toBeCloseTo(75, 9)
  })

  it('«Остаток» is not offered on a share portion', () => {
    const c = buckwheat([share('a', 1)])
    expect(fillRemainder(c, computeCooking(c), 'a')).toBeNull()
  })
})

describe('percent portions', () => {
  it('«мне 50 %, Ксюше 40 %»: the rest stays in the pot', () => {
    const c = buckwheat([
      { id: 'me', name: 'me', weighingId: 'w0', input: { basis: 'part', percent: 50 } },
      { id: 'k', name: 'k', weighingId: 'w0', input: { basis: 'part', percent: 40 } },
    ])
    const phase = computeCooking(c).phases[0]
    expect(phase.portions[0].cookedGrams).toBeCloseTo(280, 9)
    expect(phase.portions[1].cookedGrams).toBeCloseTo(224, 9)
    expect(phase.remainder.cookedGrams).toBeCloseTo(56, 9)
  })

  it('a percent is taken first; share people split the rest', () => {
    const phase = computeCooking(
      buckwheat([{ id: 'me', name: 'me', weighingId: 'w0', input: { basis: 'part', percent: 50 } }, share('a', 1), share('b', 1)]),
    ).phases[0]
    expect(phase.portions[1].share).toBeCloseTo(0.25, 12)
    expect(phase.remainder.state).toBe('none')
  })

  it('works before weighing: raw is known, cooked is not', () => {
    const c = { ...buckwheat([{ id: 'me', name: 'me', weighingId: 'w0', input: { basis: 'part', percent: 25 } }]), weighings: [food('w0', null)] }
    const [me] = computeCooking(c).phases[0].portions
    expect(me.raw[0].grams).toBeCloseTo(50, 9)
    expect(me.cookedGrams).toBeNull()
  })
})
