import { CURRENT_VERSION, type PersistedState } from '@/store/migrations'
import { applyChanges } from './merge'
import { migrateChange } from './migrateChange'
import { acknowledge, enqueue, pendingKeys, takeBatch, type Outbox } from './outbox'
import { SYNC_LIMITS, type SyncRequest, type SyncResponse } from './protocol'
import type { Change } from './records'

/** What the settings show (docs/UX.md «Аккаунт и группа»). */
export type SyncStatus =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'synced'; at: string }
  /** No network: changes wait on the device. */
  | { kind: 'offline' }
  /** The server answered with an error; tried again on the next occasion. */
  | { kind: 'failed' }
  /** 401: the session is gone. */
  | { kind: 'needsLogin' }
  /** 403: not in the group any more. */
  | { kind: 'forbidden' }
  /** A record written by a newer app: this one has to be updated first. */
  | { kind: 'needsUpdate' }

export type SyncFailureKind = 'offline' | 'failed' | 'needsLogin' | 'forbidden'

/** Thrown by `send` when there is no answer worth using. */
export class SyncFailure extends Error {
  readonly kind: SyncFailureKind
  constructor(kind: SyncFailureKind) {
    super(kind)
    this.kind = kind
  }
}

export interface SyncEngineDeps {
  /** The group's data on the device. */
  read(): PersistedState
  /** Records from the server into the store, without counting them as local changes. */
  write(state: PersistedState): void
  send(request: SyncRequest): Promise<SyncResponse>
  /** Every new outbox: it has to outlive a closed app. */
  save(outbox: Outbox): void
  status(status: SyncStatus): void
  now(): string
}

const encoder = new TextEncoder()
const size = (change: Change) => encoder.encode(JSON.stringify(change)).length

/**
 * One group's sync on one device (docs/ARCHITECTURE.md §10): local changes wait in the outbox,
 * each run sends a batch and applies what others changed. Runs never overlap; a request during
 * a run makes one more pass after it.
 */
export function createSyncEngine(deps: SyncEngineDeps, initial: Outbox) {
  let outbox = initial
  let running: Promise<void> | null = null
  let again = false

  const update = (next: Outbox) => {
    if (next === outbox) return
    outbox = next
    deps.save(next)
  }

  async function run() {
    deps.status({ kind: 'syncing' })
    try {
      do {
        again = false
        const batch = takeBatch(outbox, { count: SYNC_LIMITS.changesPerRequest, bytes: SYNC_LIMITS.requestBytes }, size)
        const leftover = Object.keys(outbox.pending).length > batch.length
        const response = await deps.send({
          cursor: outbox.cursor,
          v: CURRENT_VERSION,
          changes: batch.map((p) => p.change),
        })
        update(acknowledge(outbox, batch))

        const incoming: Change[] = []
        for (const wire of response.changes) {
          const change = migrateChange(wire)
          // The cursor stays: the same page comes again once the app is updated.
          if (change === 'newer') return deps.status({ kind: 'needsUpdate' })
          if (change) incoming.push(change)
        }
        const state = deps.read()
        const merged = applyChanges(state, incoming, pendingKeys(outbox))
        if (merged !== state) deps.write(merged)
        update({ ...outbox, cursor: response.cursor })
        if (response.more || leftover) again = true
      } while (again)
      deps.status({ kind: 'synced', at: deps.now() })
    } catch (e) {
      deps.status({ kind: e instanceof SyncFailure ? e.kind : 'failed' })
    }
  }

  return {
    /** Local edits: kept until the server has them. */
    enqueue(changes: readonly Change[]) {
      update(enqueue(outbox, changes))
    },
    sync(): Promise<void> {
      if (running) {
        again = true
        return running
      }
      running = run().finally(() => (running = null))
      return running
    },
    /**
     * At start: what is waiting to be sent is the latest local state of those records. The outbox
     * is written before the data, so after a crash between the two it is the one to trust.
     */
    replayPending() {
      const changes = Object.values(outbox.pending).map((p) => p.change)
      if (changes.length > 0) deps.write(applyChanges(deps.read(), changes, new Set()))
    },
    outbox: () => outbox,
  }
}

export type SyncEngine = ReturnType<typeof createSyncEngine>
