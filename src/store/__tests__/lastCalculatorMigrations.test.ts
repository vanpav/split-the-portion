import { describe, expect, it } from 'vitest'
import { LAST_CALCULATOR_VERSION, migrateLastCalculator } from '../lastCalculatorMigrations'

const input = { texts: { cooked: '3160' }, cookedTouched: true, weightRow: 'cooked', fixed: {}, unit: 'g', barUnit: 'g', shown: {}, keep: 0 }

describe('migrateLastCalculator', () => {
  it('v1 → v2: `folded` goes, the rest stays', () => {
    const v1 = { last: { dishId: 'd1', at: '2026-10-01T12:00:00.000Z', input: { ...input, folded: true } } }
    expect(migrateLastCalculator(v1, 1)).toEqual({ last: { dishId: 'd1', at: '2026-10-01T12:00:00.000Z', input } })
  })

  it('nothing stored, junk and the current version are left alone', () => {
    expect(migrateLastCalculator({ last: null }, 1)).toEqual({ last: null })
    expect(migrateLastCalculator(null, 1)).toBeNull()
    const current = { last: { dishId: 'd1', at: '', input } }
    expect(migrateLastCalculator(current, LAST_CALCULATOR_VERSION)).toBe(current)
  })
})
