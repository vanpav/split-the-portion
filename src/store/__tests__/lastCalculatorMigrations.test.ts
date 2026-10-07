import { describe, expect, it } from 'vitest'
import { LAST_CALCULATOR_VERSION, migrateLastCalculator } from '../lastCalculatorMigrations'

const input = { texts: { cooked: '3160' }, cookedTouched: true, weightRow: 'cooked', fixed: {}, keep: 0 }
const units = { unit: 'g', barUnit: '%', shown: { p1: '%' } }
const at = '2026-10-01T12:00:00.000Z'

describe('migrateLastCalculator', () => {
  it('v1 → v3: `folded` and the units go, the rest stays', () => {
    const v1 = { last: { dishId: 'd1', at, input: { ...input, ...units, folded: true } } }
    expect(migrateLastCalculator(v1, 1)).toEqual({ last: { dishId: 'd1', at, input } })
  })

  it('v2 → v3: own portions are grams; one in percent shares again', () => {
    const fixed = {
      p1: { unit: 'g', value: 120 },
      p2: { unit: '%', value: 40 },
      p3: { unit: 'g', value: 60, raw: 'rice' },
      junk: 'x',
    }
    const v2 = { last: { dishId: 'd1', at, input: { ...input, ...units, fixed } } }
    expect(migrateLastCalculator(v2, 2)).toEqual({
      last: { dishId: 'd1', at, input: { ...input, fixed: { p1: { value: 120 }, p3: { value: 60, raw: 'rice' } } } },
    })
  })

  it('nothing stored, junk and the current version are left alone', () => {
    expect(migrateLastCalculator({ last: null }, 1)).toEqual({ last: null })
    expect(migrateLastCalculator(null, 1)).toBeNull()
    const current = { last: { dishId: 'd1', at: '', input } }
    expect(migrateLastCalculator(current, LAST_CALCULATOR_VERSION)).toBe(current)
  })
})
