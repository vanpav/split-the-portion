import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SYNC_LIMITS, type SyncRequest, type SyncResponse, type WireChange } from '../../src/sync/protocol'
import { isMember, syncGroup } from '../sync'
import { parseSyncRequest } from '../syncRequest'
import { addMember, localD1 } from './localD1'

let db: D1Database
let dispose: () => Promise<void>
beforeAll(async () => {
  ;({ db, dispose } = await localD1())
  await addMember(db, 'vanya', 'home', 'other')
  await addMember(db, 'ksusha', 'home')
}, 30_000)
afterAll(() => dispose())

const NOW = '2026-10-06T12:00:00.000Z'
const tare = (id: string, grams: number): WireChange => ({ type: 'tare', id, data: { id, name: id, grams, createdAt: NOW }, v: 10 })
const gone = (id: string): WireChange => ({ type: 'tare', id, data: null, v: 10 })

/** What the worker does with a request body: checked, synced, answered as JSON. */
async function sync(groupId: string, userId: string, req: SyncRequest): Promise<SyncResponse> {
  const checked = parseSyncRequest(JSON.parse(JSON.stringify(req)))
  if (typeof checked === 'string') throw new Error(checked)
  return JSON.parse(await syncGroup(db, groupId, userId, checked, NOW)) as SyncResponse
}

describe('syncGroup', () => {
  it('numbers changes in order; another device reads them, the sender does not get its own back', async () => {
    const sent = await sync('home', 'vanya', { cursor: 0, v: 10, changes: [tare('pot', 850), tare('pan', 900)] })
    expect(sent.changes).toEqual([])
    expect(sent.cursor).toBe(2)

    const read = await sync('home', 'ksusha', { cursor: 0, v: 10, changes: [] })
    expect(read.changes).toEqual([tare('pot', 850), tare('pan', 900)])
    expect(read).toMatchObject({ cursor: 2, more: false })
  })

  it('the change that comes last wins, a removal included', async () => {
    await sync('home', 'vanya', { cursor: 2, v: 10, changes: [tare('pot', 860)] })
    const ksusha = await sync('home', 'ksusha', { cursor: 2, v: 10, changes: [gone('pot')] })
    // Vanya's 860 is older than her removal: she gets nothing new, the record is gone.
    expect(ksusha.changes).toEqual([])
    const fresh = await sync('home', 'vanya', { cursor: 0, v: 10, changes: [] })
    expect(fresh.changes).toEqual([tare('pan', 900), gone('pot')])
  })

  it('reads a long history page by page', async () => {
    const many = Array.from({ length: 250 }, (_, i) => tare(`t${i}`, 100 + i))
    await sync('other', 'vanya', { cursor: 0, v: 10, changes: many.slice(0, SYNC_LIMITS.changesPerRequest) })
    await sync('other', 'vanya', { cursor: 0, v: 10, changes: many.slice(SYNC_LIMITS.changesPerRequest) })

    const first = await sync('other', 'vanya', { cursor: 0, v: 10, changes: [] })
    expect(first.changes).toHaveLength(SYNC_LIMITS.pullPage)
    expect(first.more).toBe(true)
    const second = await sync('other', 'vanya', { cursor: first.cursor, v: 10, changes: [] })
    expect(second.changes).toHaveLength(250 - SYNC_LIMITS.pullPage)
    expect(second.more).toBe(false)
    expect([...first.changes, ...second.changes]).toEqual(many)
  })

  it('keeps groups apart', async () => {
    const home = await sync('home', 'vanya', { cursor: 0, v: 10, changes: [] })
    expect(home.changes.some((c) => c.id.startsWith('t'))).toBe(false)
  })

  it('a cursor ahead of the clock (a restored database) reads everything again', async () => {
    const read = await sync('home', 'ksusha', { cursor: 10_000, v: 10, changes: [] })
    expect(read.changes.map((c) => c.id)).toEqual(['pan', 'pot'])
  })

  it('isMember', async () => {
    expect(await isMember(db, 'home', 'ksusha')).toBe(true)
    expect(await isMember(db, 'other', 'ksusha')).toBe(false)
  })
})

describe('parseSyncRequest', () => {
  const ok: SyncRequest = { cursor: 0, v: 10, changes: [tare('pot', 850)] }

  it('accepts a well-formed request', () => {
    expect(parseSyncRequest(ok)).toEqual(ok)
  })

  it.each([
    ['not an object', null],
    ['a negative cursor', { ...ok, cursor: -1 }],
    ['an unknown record type', { ...ok, changes: [{ ...tare('pot', 1), type: 'user' }] }],
    ['an id that is not ours', { ...ok, changes: [{ ...tare('pot', 1), id: '../x' }] }],
    ['data that is a list', { ...ok, changes: [{ ...tare('pot', 1), data: [] }] }],
    ['too many changes', { ...ok, changes: Array.from({ length: SYNC_LIMITS.changesPerRequest + 1 }, () => tare('p', 1)) }],
    ['a record over the size limit', { ...ok, changes: [{ ...tare('p', 1), data: { note: 'x'.repeat(SYNC_LIMITS.recordBytes) } }] }],
  ])('refuses %s', (_, body) => {
    expect(typeof parseSyncRequest(body)).toBe('string')
  })
})
