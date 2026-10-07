import { localDay } from '@/domain'
import { describe, expect, it } from 'vitest'
import { backupFile, readBackupFile } from '../backupFile'
import { CURRENT_VERSION, EMPTY_STATE, STORAGE_KEY, type PersistedState } from '../migrations'

const NOW = new Date('2026-10-06T12:00:00.000Z')
const tare = { id: 't1', name: 'Кастрюля', grams: 850, createdAt: '2026-10-01T08:00:00.000Z' }
const data: PersistedState = { ...EMPTY_STATE, tares: [tare], holdMs: 2000 }

describe('backup file', () => {
  it('round trip: what is saved comes back as it was', () => {
    const { name, text } = backupFile(data, NOW)
    expect(name).toBe('split-the-portion-2026-10-06.json')
    expect(JSON.parse(text)).toMatchObject({ app: STORAGE_KEY, version: CURRENT_VERSION, exportedAt: NOW.toISOString() })
    expect(readBackupFile(text)).toEqual(data)
  })

  it('a file from an older version is migrated, user data kept', () => {
    const v7 = { dishes: [], cookings: [{ id: 'c', keepPercent: 20 }], tares: [tare], companies: [], lineup: null }
    const text = JSON.stringify({ app: STORAGE_KEY, version: 7, exportedAt: NOW.toISOString(), state: v7 })
    const { lineup: _lineup, cookings: _cookings, ...rest } = v7
    expect(readBackupFile(text)).toEqual({ ...rest, lineups: {}, holdMs: 1500 })
  })

  it('a file from v10 loads without its cookings; dishes are not weighed yet', () => {
    const dish = { id: 'd', kind: 'simple', name: 'Гречка', createdAt: NOW.toISOString(), updatedAt: NOW.toISOString(), ingredients: [], tareId: null }
    const v10 = { dishes: [dish], cookings: [{ id: 'c', dishId: 'd' }], tares: [tare], companies: [], lineups: {}, holdMs: 1500 }
    const text = JSON.stringify({ app: STORAGE_KEY, version: 10, exportedAt: NOW.toISOString(), state: v10 })
    expect(readBackupFile(text)).toEqual({
      dishes: [{ ...dish, category: null, cooked: null, usedOn: [localDay(NOW)] }],
      tares: [tare],
      companies: [],
      lineups: {},
      holdMs: 1500,
    })
  })

  it.each([
    ['not JSON', '{oops'],
    ['another app', JSON.stringify({ app: 'other', version: 1, state: {} })],
    ['no version', JSON.stringify({ app: STORAGE_KEY, state: data })],
    ['a newer version', JSON.stringify({ app: STORAGE_KEY, version: CURRENT_VERSION + 1, state: data })],
    ['a damaged state', JSON.stringify({ app: STORAGE_KEY, version: CURRENT_VERSION, state: { dishes: 'x' } })],
  ])('rejects %s', (_, text) => {
    expect(() => readBackupFile(text)).toThrow()
  })
})
