import { describe, expect, it } from 'vitest'
import { diffState } from '../diff'
import { AT, dish, state, tare } from './fixtures'

const pasta = dish('pasta')
const before = state({ dishes: [pasta], tares: [tare('pot')], lineups: { pasta: { companyId: null, members: [] } } })

describe('diffState', () => {
  it('the same state — nothing to send', () => {
    expect(diffState(before, { ...before }, 10)).toEqual([])
  })

  it('a dish weighed — one record, the whole dish with its cooked weight', () => {
    const weighed = { ...pasta, cooked: { grams: 360, tareId: null, at: AT } }
    expect(diffState(before, { ...before, dishes: [weighed] }, 11)).toEqual([{ type: 'dish', id: 'pasta', data: weighed, v: 11 }])
  })

  it('a dish removed with its lineup — two removals', () => {
    const after = state({ tares: before.tares })
    expect(diffState(before, after, 11)).toEqual([
      { type: 'dish', id: 'pasta', data: null, v: 11 },
      { type: 'lineup', id: 'pasta', data: null, v: 11 },
    ])
  })

  it('a new tare and «Убрать человека» changed', () => {
    const pan = tare('pan')
    expect(diffState(before, { ...before, tares: [...before.tares, pan], holdMs: 0 }, 10)).toEqual([
      { type: 'tare', id: 'pan', data: pan, v: 10 },
      { type: 'settings', id: 'settings', data: { holdMs: 0 }, v: 10 },
    ])
  })
})
