import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION } from '@/store/migrations'
import { SyncFailure } from '../engine'
import type { SyncRequest, SyncResponse } from '../protocol'
import { device } from './device'
import { tare } from './fixtures'

const empty: SyncResponse = { cursor: 0, changes: [], more: false }

/** A server answer the test lets through when it wants to. */
function heldServer() {
  const requests: SyncRequest[] = []
  let release: (res: SyncResponse) => void = () => {}
  const send = (req: SyncRequest) => {
    requests.push(req)
    return new Promise<SyncResponse>((resolve) => (release = resolve))
  }
  return { requests, send, answer: (res: SyncResponse) => release(res) }
}

describe('sync engine', () => {
  it('an edit made while a request is in flight is neither lost nor overwritten by the answer', async () => {
    const server = heldServer()
    const phone = device(server.send)
    phone.edit((s) => ({ ...s, tares: [tare('pot', 850)] }))
    const run = phone.engine.sync()
    phone.edit((s) => ({ ...s, tares: [tare('pot', 860)] }))
    // The server sends back someone else's older version of the same tare.
    server.answer({ cursor: 2, changes: [{ type: 'tare', id: 'pot', data: tare('pot', 1), v: CURRENT_VERSION }], more: false })
    await Promise.resolve()
    expect(phone.data.tares).toEqual([tare('pot', 860)])
    expect(Object.keys(phone.engine.outbox().pending)).toEqual(['tare:pot'])

    // One more pass was asked for by nobody: the new edit waits for its own occasion.
    await new Promise((r) => setTimeout(r, 0))
    void phone.engine.sync()
    expect(server.requests.at(-1)?.changes).toEqual([{ type: 'tare', id: 'pot', data: tare('pot', 860), v: CURRENT_VERSION }])
    server.answer(empty)
    await run
  })

  it('runs never overlap; a call during a run makes one more pass', async () => {
    const server = heldServer()
    const phone = device(server.send)
    const first = phone.engine.sync()
    void phone.engine.sync()
    expect(server.requests).toHaveLength(1)
    server.answer(empty)
    await new Promise((r) => setTimeout(r, 0))
    expect(server.requests).toHaveLength(2)
    server.answer(empty)
    await first
    expect(phone.statuses.at(-1)).toBe('synced')
  })

  it('offline: the status says so and the edits wait', async () => {
    const phone = device(() => Promise.reject(new SyncFailure('offline')))
    phone.edit((s) => ({ ...s, tares: [tare('pot')] }))
    await phone.engine.sync()
    expect(phone.statuses.at(-1)).toBe('offline')
    expect(Object.keys(phone.engine.outbox().pending)).toEqual(['tare:pot'])
  })

  it('a record from a newer app stops the sync and keeps the cursor', async () => {
    const newer = { type: 'tare' as const, id: 'pot', data: {}, v: CURRENT_VERSION + 1 }
    const phone = device(() => Promise.resolve({ cursor: 5, changes: [newer], more: false }))
    await phone.engine.sync()
    expect(phone.statuses.at(-1)).toBe('needsUpdate')
    expect(phone.engine.outbox().cursor).toBe(0)
    expect(phone.data.tares).toEqual([])
  })
})
