import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cooking, dish, tare } from '../../src/sync/__tests__/fixtures'
import { device } from '../../src/sync/__tests__/device'
import type { SyncRequest, SyncResponse } from '../../src/sync/protocol'
import { syncGroup } from '../sync'
import { parseSyncRequest } from '../syncRequest'
import { addMember, localD1 } from './localD1'

let db: D1Database
let dispose: () => Promise<void>
let group = 0
beforeAll(async () => {
  ;({ db, dispose } = await localD1())
}, 30_000)
afterAll(() => dispose())

/** Two phones of one group, talking to the real sync statements on a local D1. */
async function twoPhones() {
  const groupId = `g${++group}`
  await addMember(db, `vanya${group}`, groupId)
  await addMember(db, `ksusha${group}`, groupId)
  const send = (userId: string) => async (req: SyncRequest) => {
    const checked = parseSyncRequest(JSON.parse(JSON.stringify(req)))
    if (typeof checked === 'string') throw new Error(checked)
    return JSON.parse(await syncGroup(db, groupId, userId, checked, '2026-10-06T12:00:00.000Z')) as SyncResponse
  }
  return { vanya: device(send(`vanya${group}`)), ksusha: device(send(`ksusha${group}`)) }
}

describe('two phones of one group', () => {
  it('offline edits on both sides meet', async () => {
    const { vanya, ksusha } = await twoPhones()
    vanya.edit((s) => ({ ...s, dishes: [dish('pasta')], tares: [tare('pot')] }))
    ksusha.edit((s) => ({ ...s, cookings: [cooking('c1', 'pasta', 560)], holdMs: 0 }))
    await vanya.engine.sync()
    await ksusha.engine.sync()
    await vanya.engine.sync()
    expect(vanya.data).toEqual(ksusha.data)
    expect(vanya.data).toMatchObject({ holdMs: 0, tares: [tare('pot')] })
    expect(vanya.data.cookings.map((c) => c.id)).toEqual(['c1'])
  })

  it('a removal against an edit: the one synced later wins, on both phones', async () => {
    for (const editLast of [true, false]) {
      const { vanya, ksusha } = await twoPhones()
      vanya.edit((s) => ({ ...s, cookings: [cooking('c1', 'pasta')] }))
      await vanya.engine.sync()
      await ksusha.engine.sync()

      vanya.edit((s) => ({ ...s, cookings: [cooking('c1', 'pasta', 560)] }))
      ksusha.edit((s) => ({ ...s, cookings: [] }))
      const [first, second] = editLast ? [ksusha, vanya] : [vanya, ksusha]
      await first.engine.sync()
      await second.engine.sync()
      await first.engine.sync()

      expect(vanya.data).toEqual(ksusha.data)
      expect(vanya.data.cookings.map((c) => c.weighings[0].grams)).toEqual(editLast ? [560] : [])
    }
  })
})
