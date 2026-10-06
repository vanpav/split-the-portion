import { describe, expect, it } from 'vitest'
import { applyChanges, mergeLocal } from '../merge'
import type { Change } from '../records'
import { company, cooking, dish, state, tare } from './fixtures'

describe('applyChanges', () => {
  const base = state({ dishes: [dish('pasta')], tares: [tare('pot')] })

  it('adds, replaces and removes records', () => {
    const pot = tare('pot', 860)
    const changes: Change[] = [
      { type: 'tare', id: 'pot', data: pot, v: 10 },
      { type: 'dish', id: 'pasta', data: null, v: 10 },
      { type: 'cooking', id: 'c1', data: cooking('c1', 'soup'), v: 10 },
      { type: 'settings', id: 'settings', data: { holdMs: 0 }, v: 10 },
    ]
    const next = applyChanges(base, changes, new Set())
    expect(next).toMatchObject({ dishes: [], tares: [pot], holdMs: 0 })
    // A cooking from an app before v11 changes nothing.
    expect(next).not.toHaveProperty('cookings')
  })

  it('a record waiting to be sent keeps the local version', () => {
    const next = applyChanges(base, [{ type: 'tare', id: 'pot', data: tare('pot', 1), v: 10 }], new Set(['tare:pot']))
    expect(next.tares).toEqual(base.tares)
  })

  it('tares and companies come out in createdAt order whatever order they arrive in', () => {
    const changes: Change[] = [
      { type: 'company', id: 'mom', data: company('mom', '2026-10-02T00:00:00.000Z'), v: 10 },
      { type: 'company', id: 'us', data: company('us', '2026-10-01T00:00:00.000Z'), v: 10 },
    ]
    expect(applyChanges(state(), changes, new Set()).companies.map((c) => c.id)).toEqual(['us', 'mom'])
  })

  it('nothing applicable — the same state object', () => {
    expect(applyChanges(base, [], new Set())).toBe(base)
  })
})

describe('mergeLocal', () => {
  it('adds what the group lacks, keeps the group’s own records and settings', () => {
    const group = state({ dishes: [dish('soup')], tares: [tare('pot', 850, '2026-10-02T00:00:00.000Z')], holdMs: 0 })
    const local = state({ dishes: [dish('pasta'), dish('soup')], tares: [tare('pan', 900, '2026-10-01T00:00:00.000Z')] })
    const merged = mergeLocal(group, local)
    expect(merged.dishes.map((d) => d.id)).toEqual(['soup', 'pasta'])
    expect(merged.tares.map((t) => t.id)).toEqual(['pan', 'pot'])
    expect(merged.holdMs).toBe(0)
  })
})
