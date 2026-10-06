import { describe, expect, it } from 'vitest'
import { diffState } from '../diff'
import { cooking, dish, state, tare } from './fixtures'

const pasta = dish('pasta')
const today = cooking('c1', 'pasta')
const before = state({ dishes: [pasta], cookings: [today], tares: [tare('pot')], lineups: { pasta: { companyId: null, members: [] } } })

describe('diffState', () => {
  it('the same state — nothing to send', () => {
    expect(diffState(before, { ...before }, 10)).toEqual([])
  })

  it('one cooking edited — one record, the whole cooking', () => {
    const edited = { ...today, equalSplitN: 3 }
    expect(diffState(before, { ...before, cookings: [edited] }, 10)).toEqual([{ type: 'cooking', id: 'c1', data: edited, v: 10 }])
  })

  it('a dish removed with its cookings and lineup — three removals', () => {
    const after = state({ tares: before.tares })
    expect(diffState(before, after, 10)).toEqual([
      { type: 'dish', id: 'pasta', data: null, v: 10 },
      { type: 'cooking', id: 'c1', data: null, v: 10 },
      { type: 'lineup', id: 'pasta', data: null, v: 10 },
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
