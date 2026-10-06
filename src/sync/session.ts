import { del } from 'idb-keyval'
import { useAccountStore } from '@/store/account'
import { storedData } from '@/store/createAppStore'
import { idbStorage } from '@/store/idbStorage'
import { backupKey, CURRENT_VERSION, EMPTY_STATE, STORAGE_KEY, type PersistedState } from '@/store/migrations'
import { useAppStore } from '@/store/store'
import { useSyncStore } from '@/store/sync'
import { mergeLocal } from './merge'
import { isEmptyData } from './records'
import { forgetOutbox, startSync, stopSync } from './runner'

/**
 * Which data the store holds (docs/ARCHITECTURE.md §10 «Группы на устройстве»): without an account —
 * `split-the-portion`, as before sync; signed in — the open group's own copy.
 */
export const groupDataKey = (groupId: string) => `${STORAGE_KEY}:group:${groupId}`

const storage = idbStorage(null)
const blob = (state: PersistedState) => JSON.stringify({ state, version: CURRENT_VERSION })

/**
 * Points the store at another set of data and reads it. A set seen for the first time is created
 * empty first: persist leaves the state as it is when there is nothing to read.
 */
async function openData(key: string) {
  if ((await storage.getItem(key)) === null) await storage.setItem(key, blob(EMPTY_STATE))
  useAppStore.persist.setOptions({ name: key })
  await useAppStore.persist.rehydrate()
}

const openedKey = () => useAppStore.persist.getOptions().name
const defaultGroup = () => useAccountStore.getState().me?.defaultGroupId ?? null

/** At launch, before the first render: the signed-in account's default group, also offline. */
export async function openStartData() {
  const groupId = defaultGroup()
  // Signed in on this device before sync existed: its data has not moved to the group yet (resumeSync).
  if (groupId && (await storage.getItem(groupDataKey(groupId))) !== null) await openData(groupDataKey(groupId))
}

/** At launch, after the first render: sync the open group, or move the device's data into it first. */
export function resumeSync() {
  const groupId = defaultGroup()
  if (!groupId) return
  if (openedKey() === groupDataKey(groupId)) void startSync(groupId)
  else void enterAccount()
}

/**
 * Right after signing in or creating an account (docs/SPEC.md §13.2). The data the device had
 * without an account goes into the default group: silently if the group is empty, otherwise the
 * user is asked (`localData`, LocalDataDialog). A copy of it is kept either way.
 */
export async function enterAccount() {
  const groupId = defaultGroup()
  if (!groupId) return
  // Signed in again after the session ran out: the group is already open, just sync.
  if (openedKey() === groupDataKey(groupId)) return void startSync(groupId)

  // Only data without an account is the device's own; another account's group is never merged in.
  const local = openedKey() === STORAGE_KEY ? storedData(useAppStore.getState()) : EMPTY_STATE
  const hasLocal = !isEmptyData(local)
  if (hasLocal) await storage.setItem(backupKey(new Date()), blob(local))
  await openData(groupDataKey(groupId))
  const engine = await startSync(groupId)
  await engine.sync()
  await storage.setItem(STORAGE_KEY, blob(EMPTY_STATE))
  if (!hasLocal) return

  const group = storedData(useAppStore.getState())
  if (isEmptyData(group)) useAppStore.setState(mergeLocal(group, local))
  else useSyncStore.setState({ localData: local })
}

/** «Перенести»: the device's records the group lacks are added and sent like any edit. */
export function adoptLocalData() {
  const { localData } = useSyncStore.getState()
  if (localData) useAppStore.setState(mergeLocal(storedData(useAppStore.getState()), localData))
  useSyncStore.setState({ localData: null })
}

/** «Не переносить»: the copy saved at sign-in stays in IndexedDB; the group is left as it is. */
export function keepLocalDataApart() {
  useSyncStore.setState({ localData: null })
}

/**
 * After the session has ended on the server: the groups' data leaves the device (it stays on the
 * server) and the app is back to an empty device without an account.
 */
export async function leaveAccount() {
  const groups = useAccountStore.getState().me?.groups ?? []
  stopSync()
  await storage.setItem(STORAGE_KEY, blob(EMPTY_STATE))
  await openData(STORAGE_KEY)
  await Promise.all(groups.flatMap((g) => [del(groupDataKey(g.id)), forgetOutbox(g.id)]))
  useSyncStore.setState({ localData: null })
  useAccountStore.getState().setMe(null)
}
