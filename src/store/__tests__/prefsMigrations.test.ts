import { describe, expect, it } from 'vitest'
import { EMPTY_HINTS } from '@/onboarding/hints'
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

  it('v2 keeps «Доли» and gets hints with nothing shown', () => {
    const v2 = { splitMode: 'shares', portions: { d1: [{ id: 'a', weight: 1 }] } }
    expect(migratePrefs(v2, 2, counter())).toEqual({ ...v2, hints: EMPTY_HINTS, dishesByCategory: false })
    // A stray `hints` in a v2 record is not trusted.
    expect(migratePrefs({ ...v2, hints: { off: true } }, 2, counter()).hints).toEqual(EMPTY_HINTS)
  })

  it('v3 starts with the flat dish list; v4 keeps the choice', () => {
    const v3 = { splitMode: 'people', portions: {}, hints: EMPTY_HINTS, dishesByCategory: true }
    expect(migratePrefs(v3, 3, counter()).dishesByCategory).toBe(false)
    expect(migratePrefs(v3, 4, counter()).dishesByCategory).toBe(true)
    expect(migratePrefs({ ...v3, dishesByCategory: 'yes' }, 4, counter()).dishesByCategory).toBe(false)
  })

  it('the current version is kept; junk becomes the defaults', () => {
    const v3 = {
      splitMode: 'shares',
      portions: { d1: [{ id: 'a', weight: 1 }] },
      hints: { settled: true, off: true, welcome: true, tour: 2 },
      dishesByCategory: true,
    }
    expect(migratePrefs(v3, PREFS_VERSION, counter())).toEqual(v3)
    expect(migratePrefs(null, PREFS_VERSION, counter())).toEqual(EMPTY_PREFS)
    expect(migratePrefs({ splitMode: 'x', portions: [], hints: 'x' }, PREFS_VERSION, counter())).toEqual(EMPTY_PREFS)
  })
})
