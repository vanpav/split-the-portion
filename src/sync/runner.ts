import { del, get, set } from 'idb-keyval'
import { storedData } from '@/store/createAppStore'
import { CURRENT_VERSION, STORAGE_KEY } from '@/store/migrations'
import { useAppStore } from '@/store/store'
import { useSyncStore } from '@/store/sync'
import { diffState } from './diff'
import { createSyncEngine, type SyncEngine } from './engine'
import { EMPTY_OUTBOX, hasPending, type Outbox } from './outbox'
import { sendSync } from './transport'

/** Where a group's unsent changes and cursor live (docs/ARCHITECTURE.md §5.2). */
export const outboxKey = (groupId: string) => `${STORAGE_KEY}:sync:${groupId}`

/** After a local edit: a few seconds of quiet, so a burst of typing goes out as one request. */
const AFTER_EDIT_MS = 2000
/** While the app is on screen, others' changes are picked up at least this often. */
const POLL_MS = 60_000

let current: { groupId: string; engine: SyncEngine; stop(): void } | null = null

/**
 * Starts syncing the group whose data the store holds now (docs/ARCHITECTURE.md §10). Store
 * edits are counted as changes by a subscription; nothing in the store's actions knows about sync.
 * Background Sync does not exist on iOS: it runs while the app is open — at start, on network
 * coming back, on returning to the app, after edits and once a minute.
 */
export async function startSync(groupId: string): Promise<SyncEngine> {
  stopSync()
  const outbox = (await get<Outbox>(outboxKey(groupId))) ?? EMPTY_OUTBOX
  let applying = false
  const engine = createSyncEngine(
    {
      read: () => storedData(useAppStore.getState()),
      write: (state) => {
        applying = true
        try {
          useAppStore.setState(state)
        } finally {
          applying = false
        }
      },
      send: (request) => sendSync(groupId, request),
      save: (next) => void set(outboxKey(groupId), next),
      status: (status) => useSyncStore.setState({ status }),
      now: () => new Date().toISOString(),
    },
    outbox,
  )
  engine.replayPending()

  let timer: ReturnType<typeof setTimeout> | undefined
  const soon = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void engine.sync(), AFTER_EDIT_MS)
  }
  const unsubscribe = useAppStore.subscribe((next, prev) => {
    if (applying) return
    const changes = diffState(storedData(prev), storedData(next), CURRENT_VERSION)
    if (changes.length === 0) return
    engine.enqueue(changes)
    soon()
  })
  const now = () => void engine.sync()
  const onVisible = () => document.visibilityState === 'visible' && now()
  const poll = setInterval(onVisible, POLL_MS)
  addEventListener('online', now)
  document.addEventListener('visibilitychange', onVisible)

  current = {
    groupId,
    engine,
    stop: () => {
      unsubscribe()
      clearTimeout(timer)
      clearInterval(poll)
      removeEventListener('online', now)
      document.removeEventListener('visibilitychange', onVisible)
    },
  }
  void engine.sync()
  return engine
}

export function stopSync() {
  current?.stop()
  current = null
  useSyncStore.setState({ status: { kind: 'idle' } })
}

/** Something edited on this device has not reached the server yet. */
export const hasUnsentChanges = () => (current ? hasPending(current.engine.outbox()) : false)

/** Right now, e.g. after signing in again. */
export const syncNow = () => current?.engine.sync()

/** A group's unsent changes and cursor, gone with the group's data on sign-out. */
export const forgetOutbox = (groupId: string) => del(outboxKey(groupId))
