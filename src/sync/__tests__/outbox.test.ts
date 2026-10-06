import { describe, expect, it } from 'vitest'
import { acknowledge, EMPTY_OUTBOX, enqueue, pendingKeys, takeBatch } from '../outbox'
import type { Change } from '../records'
import { tare } from './fixtures'

const change = (id: string, grams = 850): Change => ({ type: 'tare', id, data: tare(id, grams), v: 10 })
const one = () => 1

describe('outbox', () => {
  it('keeps only the latest change of a record', () => {
    const outbox = enqueue(EMPTY_OUTBOX, [change('pot', 850), change('pan'), change('pot', 860)])
    expect(pendingKeys(outbox)).toEqual(new Set(['tare:pot', 'tare:pan']))
    expect(outbox.pending['tare:pot'].change).toEqual(change('pot', 860))
  })

  it('a batch keeps to the count and size limits, but always takes one record', () => {
    const outbox = enqueue(EMPTY_OUTBOX, [change('a'), change('b'), change('c')])
    expect(takeBatch(outbox, { count: 2, bytes: 100 }, one).map((p) => p.change.id)).toEqual(['a', 'b'])
    expect(takeBatch(outbox, { count: 10, bytes: 1 }, () => 5).map((p) => p.change.id)).toEqual(['a'])
  })

  it('a record edited while its change was in flight stays to be sent again', () => {
    let outbox = enqueue(EMPTY_OUTBOX, [change('pot'), change('pan')])
    const sent = takeBatch(outbox, { count: 10, bytes: 1e6 }, one)
    outbox = enqueue(outbox, [change('pot', 860)])
    outbox = acknowledge(outbox, sent)
    expect(Object.values(outbox.pending).map((p) => p.change)).toEqual([change('pot', 860)])
  })
})
