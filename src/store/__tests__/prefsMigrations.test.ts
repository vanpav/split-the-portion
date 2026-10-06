import { describe, expect, it } from 'vitest'
import { EMPTY_PREFS, migratePrefs, PREFS_VERSION } from '../prefsMigrations'

const counter = () => {
  let n = 0
  return () => `id${++n}`
}

describe('migratePrefs', () => {
  it('v1 «Порции» with equal portions → v2 «Доли» with equal shares', () => {
    const v1 = { splitMode: 'portions', portionCounts: { d1: 6, d2: 1, broken: 0, half: 2.5 } }
    const migrated = migratePrefs(v1, 1, counter())
    expect(migrated.splitMode).toBe('shares')
    expect(Object.keys(migrated.portions)).toEqual(['d1', 'd2'])
    expect(migrated.portions.d1.map((p) => p.weight)).toEqual([1, 1, 1, 1, 1, 1])
    expect(new Set(migrated.portions.d1.map((p) => p.id)).size).toBe(6)
    expect(migrated.portions.d2).toEqual([{ id: 'id7', weight: 1 }])
  })

  it('v1 «Люди» stays people', () => {
    expect(migratePrefs({ splitMode: 'people', portionCounts: {} }, 1, counter())).toEqual(EMPTY_PREFS)
  })

  it('the current version is kept; junk becomes the defaults', () => {
    const v2 = { splitMode: 'shares', portions: { d1: [{ id: 'a', weight: 1 }] } }
    expect(migratePrefs(v2, PREFS_VERSION, counter())).toEqual(v2)
    expect(migratePrefs(null, PREFS_VERSION, counter())).toEqual(EMPTY_PREFS)
    expect(migratePrefs({ splitMode: 'x', portions: [] }, PREFS_VERSION, counter())).toEqual(EMPTY_PREFS)
  })
})
