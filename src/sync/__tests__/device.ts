import type { PersistedState } from '@/store/migrations'
import { CURRENT_VERSION } from '@/store/migrations'
import { diffState } from '../diff'
import { createSyncEngine, type SyncStatus } from '../engine'
import { EMPTY_OUTBOX } from '../outbox'
import type { SyncRequest, SyncResponse } from '../protocol'
import { AT, state as emptyState } from './fixtures'

/**
 * A device in a test: its data, an engine, and local edits counted the way the app's store
 * subscription counts them (diffState between the states before and after).
 */
export function device(send: (req: SyncRequest) => Promise<SyncResponse>, initial: PersistedState = emptyState()) {
  let data = initial
  const statuses: SyncStatus['kind'][] = []
  const engine = createSyncEngine(
    {
      read: () => data,
      write: (next) => void (data = next),
      send,
      save: () => {},
      status: (s) => void statuses.push(s.kind),
      now: () => AT,
    },
    EMPTY_OUTBOX,
  )
  return {
    engine,
    statuses,
    get data() {
      return data
    },
    edit(fn: (s: PersistedState) => PersistedState) {
      const next = fn(data)
      engine.enqueue(diffState(data, next, CURRENT_VERSION))
      data = next
    },
  }
}
