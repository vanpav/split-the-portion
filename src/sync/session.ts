import { del } from 'idb-keyval'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { groupLabel } from '@/account/groupLabel'
import { refreshAccount } from '@/account/refreshAccount'
import { useAccountStore } from '@/store/account'
import { storedData } from '@/store/createAppStore'
import { idbStorage } from '@/store/idbStorage'
import { backupKey, CURRENT_VERSION, EMPTY_STATE, STORAGE_KEY, type PersistedState } from '@/store/migrations'
import { useAppStore } from '@/store/store'
import { useSyncStore } from '@/store/sync'
import { groupDataKey } from './keys'
import { mergeLocal } from './merge'
import { isEmptyData } from './records'
import { backgroundDone, forgetOutbox, startSync, stopSync, syncedGroup, syncStoredGroup } from './runner'

export { groupDataKey }

/**
 * Which data the store holds (docs/ARCHITECTURE.md §10 «Группы на устройстве»): without an account —
 * `split-the-portion`, as before sync; signed in — the open group's own copy. On launch the
 * default group opens; another one can be opened for the session.
 */

const storage = idbStorage(null)
const blob = (state: PersistedState) => JSON.stringify({ state, version: CURRENT_VERSION })

/**
 * Points the store at another set of data and reads it. A set seen for the first time is created
 * empty first: persist leaves the state as it is when there is nothing to read.
 */
async function openData(key: string, groupId: string | null) {
  if ((await storage.getItem(key)) === null) await storage.setItem(key, blob(EMPTY_STATE))
  useAppStore.persist.setOptions({ name: key })
  await useAppStore.persist.rehydrate()
  useSyncStore.setState({ groupId })
}
const openGroupData = (groupId: string) => openData(groupDataKey(groupId), groupId)

const openedKey = () => useAppStore.persist.getOptions().name
const me = () => useAccountStore.getState().me
const defaultGroup = () => me()?.defaultGroupId ?? null


/** The account's other groups, one after another, on the open group's occasions. */
function syncOtherGroups() {
  const open = syncedGroup()
  void (async () => {
    for (const group of me()?.groups ?? []) {
      if (group.id !== open && (await syncStoredGroup(group.id)) === 'forbidden') await refreshGroups()
    }
  })()
}

const syncGroup = (groupId: string) => startSync(groupId, syncOtherGroups)

/** At launch, before the first render: the signed-in account's default group, also offline. */
export async function openStartData() {
  const groupId = defaultGroup()
  // Signed in on this device before sync existed: its data has not moved to the group yet (resumeSync).
  if (groupId && (await storage.getItem(groupDataKey(groupId))) !== null) await openGroupData(groupId)
}

/** At launch, after the first render: sync the open group, or move the device's data into it first. */
export function resumeSync() {
  const groupId = defaultGroup()
  if (!groupId) return
  if (openedKey() === groupDataKey(groupId)) void syncGroup(groupId)
  else void enterAccount()
}

/** «Открыть группу»: its data on screen (offline — as last synced here), synced from now on. */
export async function openGroup(groupId: string) {
  if (openedKey() === groupDataKey(groupId)) return
  stopSync()
  await backgroundDone(groupId)
  await openGroupData(groupId)
  await syncGroup(groupId)
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
  if (openedKey() === groupDataKey(groupId)) return void syncGroup(groupId)

  // Only data without an account is the device's own; another account's group is never merged in.
  const local = openedKey() === STORAGE_KEY ? storedData(useAppStore.getState()) : EMPTY_STATE
  const hasLocal = !isEmptyData(local)
  if (hasLocal) await storage.setItem(backupKey(new Date()), blob(local))
  await openGroupData(groupId)
  const engine = await syncGroup(groupId)
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
 * Asks the server again who the user is and where; a group the user has left or was removed
 * from leaves the device. If it was open, the default group opens instead (docs/SPEC.md §13.3).
 */
export async function refreshGroups() {
  const before = me()?.groups ?? []
  const openBefore = useSyncStore.getState().groupId
  await refreshAccount()
  const now = me()
  if (!now) return
  const gone = before.filter((g) => !now.groups.some((n) => n.id === g.id))
  if (openBefore && gone.some((g) => g.id === openBefore) && now.defaultGroupId) {
    stopSync()
    await openGroupData(now.defaultGroupId)
    await syncGroup(now.defaultGroupId)
  }
  for (const group of gone) {
    await Promise.all([del(groupDataKey(group.id)), forgetOutbox(group.id)])
    toast(`Вы больше не в группе «${groupLabel(group)}»`)
  }
}

/** «Открывать при запуске» (online: the choice is the account's, the same on every device). */
export async function makeDefaultGroup(groupId: string) {
  await groupsApi.setDefault(groupId)
  await refreshAccount()
}

/** A code accepted: the new group's data comes on opening it. */
export async function joinGroup(code: string) {
  const groupId = await groupsApi.accept(code)
  if (groupId) await refreshAccount()
  return groupId
}

/**
 * After the session has ended on the server: the groups' data leaves the device (it stays on the
 * server) and the app is back to an empty device without an account.
 */
export async function leaveAccount() {
  const groups = me()?.groups ?? []
  stopSync()
  await storage.setItem(STORAGE_KEY, blob(EMPTY_STATE))
  await openData(STORAGE_KEY, null)
  await Promise.all(groups.flatMap((g) => [del(groupDataKey(g.id)), forgetOutbox(g.id)]))
  useSyncStore.setState({ localData: null })
  useAccountStore.getState().setMe(null)
}

// The open group answered 403: the user is no longer in it (removed by the owner, or left elsewhere).
useSyncStore.subscribe((state, prev) => {
  if (state.status.kind === 'forbidden' && prev.status.kind !== 'forbidden') void refreshGroups()
})
