// Reference examples from docs/SPEC.md §11. Do not change without changing the spec.
import { describe, expect, it } from 'vitest'
import { computeCooking } from '../cooking'
import { portionCopyLines } from '../copyText'
import { formatGrams, formatK } from '../numbers'
import { fillRemainder } from '../remainder'
import { splitLeftover } from '../split'
import { cookingWarnings } from '../validation'
import { buckwheat, cooked, food, raw, soup, withTare } from './fixtures'

const grams = (amounts: { ingredientId: string; grams: number }[]) =>
  Object.fromEntries(amounts.map((a) => [a.ingredientId, formatGrams(a.grams, 'ru-RU')]))

describe('Example 1: buckwheat', () => {
  it('1.0 food weight 560, k = 2.8', () => {
    const phase = computeCooking(buckwheat()).phases[0]
    expect(phase.foodGrams).toBe(560)
    expect(phase.k).toEqual({ kind: 'base', value: expect.closeTo(2.8, 9) })
    expect(formatK(phase.k!.value, 'ru-RU')).toBe('2,8')
  })

  it('1.1 Anya 80 raw → 224 cooked, Boris 120 raw → 336 cooked, reconciled, nothing left', () => {
    const phase = computeCooking(
      buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 120)]),
    ).phases[0]
    expect(phase.portions[0].cookedGrams).toBeCloseTo(224, 9)
    expect(phase.portions[1].cookedGrams).toBeCloseTo(336, 9)
    expect(phase.reconcile).toMatchObject({ basis: 'raw', status: 'ok' })
    expect(phase.reconcile!.distributed).toBeCloseTo(200, 9)
    expect(phase.remainder.cookedGrams).toBeCloseTo(0, 9)
    expect(phase.remainder.raw[0].grams).toBeCloseTo(0, 9)
  })

  it('1.2 Anya 80 + Boris 100 = 180 of 200 → not distributed 20 g', () => {
    const r = computeCooking(buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 100)]))
      .phases[0].reconcile!
    expect(r.status).toBe('under')
    expect(r.distributed).toBeCloseTo(180, 9)
    expect(r.total).toBe(200)
    expect(formatGrams(-r.diff, 'ru-RU')).toBe('20')
  })

  it('1.3 Anya 80 + Boris 130 = 210 of 200 → over by 10 g', () => {
    const r = computeCooking(buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', 130)]))
      .phases[0].reconcile!
    expect(r.status).toBe('over')
    expect(r.distributed).toBeCloseTo(210, 9)
    expect(formatGrams(r.diff, 'ru-RU')).toBe('10')
  })

  it('1.4 portion of 250 cooked ≈ 89 g dry', () => {
    const portion = computeCooking(buckwheat([cooked('me', 250)])).phases[0].portions[0]
    expect(portion.raw[0].grams).toBeCloseTo(89.2857142857, 9)
    expect(formatGrams(portion.raw[0].grams, 'ru-RU')).toBe('89')
  })

  it('1.5 Anya 224 cooked + Boris 120 raw reconcile (cooked converted to raw)', () => {
    const r = computeCooking(buckwheat([cooked('anya', 224), raw('boris', 'buckwheat', 120)])).phases[0]
      .reconcile!
    expect(r.status).toBe('ok')
    expect(r.distributed).toBeCloseTo(200, 9)
  })

  it('1.6 «Остаток» for Boris after Anya 80 raw → 120 raw, reconciled', () => {
    const c = buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', null)])
    const fill = fillRemainder(c, computeCooking(c), 'boris')
    expect(fill).toBeCloseTo(120, 9)

    const filled = buckwheat([raw('anya', 'buckwheat', 80), raw('boris', 'buckwheat', fill)])
    expect(computeCooking(filled).phases[0].reconcile!.status).toBe('ok')
  })

  it('1.7 800 with tare on an 850 g pot → error', () => {
    const c = { ...buckwheat(), weighings: [withTare('w0', 800, 850)] }
    const result = computeCooking(c)
    expect(result.phases[0].weighingError).toBe('tareExceeds')
    expect(result.phases[0].foodGrams).toBeNull()
    expect(cookingWarnings(c, result)).toContainEqual({
      code: 'weighingError',
      weighingId: 'w0',
      error: 'tareExceeds',
    })
  })
})

describe('Example 2: soup', () => {
  it('2.1 portion 395 cooked → raw content without water and salt', () => {
    const portion = computeCooking(soup([cooked('me', 395)])).phases[0].portions[0]
    expect(portion.share).toBeCloseTo(0.125, 12)
    expect(grams(portion.raw)).toEqual({
      chicken: '75',
      potato: '50',
      carrot: '20',
      onion: '15',
      rice: '10',
    })
  })

  it('2.2 «I want 100 g raw chicken» → ≈ 527 g of soup', () => {
    const portion = computeCooking(soup([raw('me', 'chicken', 100)])).phases[0].portions[0]
    expect(portion.cookedGrams).toBeCloseTo(526.6666666667, 9)
    expect(formatGrams(portion.cookedGrams!, 'ru-RU')).toBe('527')
  })

  it('2.3 split into 8 equal portions → 395 each', () => {
    const split = splitLeftover(computeCooking(soup()), 8)!
    expect(split.cookedGrams).toEqual(Array(8).fill(395))
    expect(grams(split.rawPerPortion)).toMatchObject({ chicken: '75', rice: '10' })
  })

  it('2.4 dish yield k ≈ 0.94 (excluded ingredients count in raw total)', () => {
    const { k } = computeCooking(soup()).phases[0]
    expect(k!.kind).toBe('dish')
    expect(k!.value).toBeCloseTo(3160 / 3376, 12)
    expect(formatK(k!.value, 'ru-RU')).toBe('0,94')
  })

  it('2.5 copy text for the 395 g portion', () => {
    const c = soup([cooked('me', 395)])
    // The UI words each line «Курица (сырой вес) — 75 г» (src/i18n/__tests__/format.test.ts).
    const lines = portionCopyLines(c, computeCooking(c), 'me')
    expect(lines?.map((l) => `${l.name} — ${formatGrams(l.grams, 'ru-RU')}`)).toEqual([
      'Курица — 75',
      'Картофель — 50',
      'Морковь — 20',
      'Лук — 15',
      'Рис — 10',
    ])
  })
})

describe('Example 3: buckwheat leftover re-weighed', () => {
  const nextDay = (portions = [raw('anya', 'buckwheat', 80)]) => ({
    ...buckwheat(portions),
    weighings: [withTare('w0', 1410, 850), food('w1', 310)],
  })

  it('3.1 after Anya: 336 cooked = 120 dry left, share 0.6', () => {
    const phase = computeCooking(buckwheat([raw('anya', 'buckwheat', 80)])).phases[0]
    expect(phase.remainder.share).toBeCloseTo(0.6, 12)
    expect(phase.remainder.cookedGrams).toBeCloseTo(336, 9)
    expect(phase.remainder.raw[0].grams).toBeCloseTo(120, 9)
  })

  it('3.2 re-weighed 310 → leftover k ≈ 2.58', () => {
    const phase = computeCooking(nextDay()).phases[1]
    expect(phase.available).toBeCloseTo(0.6, 12)
    expect(phase.k!.value).toBeCloseTo(310 / 120, 12)
    expect(formatK(phase.k!.value, 'ru-RU')).toBe('2,58')
  })

  it('3.3 portion of 155 cooked on day two = 60 dry; 155 / 60 left', () => {
    const phase = computeCooking(
      nextDay([raw('anya', 'buckwheat', 80), cooked('boris', 155, 'w1')]),
    ).phases[1]
    expect(phase.portions[0].raw[0].grams).toBeCloseTo(60, 9)
    expect(phase.remainder.cookedGrams).toBeCloseTo(155, 9)
    expect(phase.remainder.raw[0].grams).toBeCloseTo(60, 9)
  })

  it('3.4 reconciliation of day two: 60 of 120 dry', () => {
    const r = computeCooking(nextDay([raw('anya', 'buckwheat', 80), cooked('boris', 155, 'w1')]))
      .phases[1].reconcile!
    expect(r.basis).toBe('raw')
    expect(r.distributed).toBeCloseTo(60, 9)
    expect(r.total).toBeCloseTo(120, 9)
    expect(r.status).toBe('under')
  })
})
