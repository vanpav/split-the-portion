import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/store/migrations'
import { migrateChange } from '../migrateChange'
import { cooking, dish, tare } from './fixtures'

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

  it('a dish of an app before v11 is not weighed yet', () => {
    const { cooked: _cooked, usedOn: _usedOn, category: _category, ...old } = dish('pasta')
    expect(migrateChange({ type: 'dish', id: 'pasta', data: old, v: 10 })).toEqual({
      type: 'dish',
      id: 'pasta',
      data: dish('pasta'),
      v: CURRENT_VERSION,
    })
  })

  it('a dish of a v11 app was used on the day of its updatedAt', () => {
    const { usedOn: _usedOn, category: _category, ...old } = dish('pasta')
    expect(migrateChange({ type: 'dish', id: 'pasta', data: old, v: 11 })).toEqual({
      type: 'dish',
      id: 'pasta',
      data: dish('pasta'),
      v: CURRENT_VERSION,
    })
  })

  it('a cooking is skipped, whatever app sent it: there are none since v11', () => {
    expect(migrateChange({ type: 'cooking', id: 'c1', data: cooking('c1', 'pasta'), v: 10 })).toBeNull()
    expect(migrateChange({ type: 'cooking', id: 'c1', data: null, v: CURRENT_VERSION })).toBeNull()
  })

  it('a dish of a v12 app has no category chosen', () => {
    const { category: _category, ...old } = dish('pasta')
    expect(migrateChange({ type: 'dish', id: 'pasta', data: old, v: 12 })).toEqual({
      type: 'dish',
      id: 'pasta',
      data: dish('pasta'),
      v: CURRENT_VERSION,
    })
  })

  it('a record of a newer app asks for an update', () => {
    expect(migrateChange({ type: 'tare', id: 'pot', data: {}, v: CURRENT_VERSION + 1 })).toBe('newer')
  })
})
