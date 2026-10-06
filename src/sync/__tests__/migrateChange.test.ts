import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/store/migrations'
import { migrateChange } from '../migrateChange'
import { tare } from './fixtures'

describe('migrateChange', () => {
  it('a record of this version passes as it is', () => {
    const change = { type: 'tare' as const, id: 'pot', data: tare('pot'), v: CURRENT_VERSION }
    expect(migrateChange(change)).toBe(change)
  })

  it('a record of an older app goes through the same migrations as stored data', () => {
    const old = { type: 'tare' as const, id: 'pot', data: { id: 'pot', name: 'Кастрюля', grams: 850 }, v: 9 }
    expect(migrateChange(old)).toEqual({
      type: 'tare',
      id: 'pot',
      data: { id: 'pot', name: 'Кастрюля', grams: 850, createdAt: '1970-01-01T00:00:00.000Z' },
      v: CURRENT_VERSION,
    })
  })

  it('a record of a newer app asks for an update', () => {
    expect(migrateChange({ type: 'tare', id: 'pot', data: {}, v: CURRENT_VERSION + 1 })).toBe('newer')
  })
})
