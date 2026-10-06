import { create } from 'zustand'
import type { SyncStatus } from '@/sync/engine'
import type { PersistedState } from './migrations'

interface SyncState {
  /** The group whose data is on screen; null — the device's own data, without an account. */
  groupId: string | null
  /** The open group's sync, for the settings and the tab bar. Not stored: it is about this session. */
  status: SyncStatus
  /**
   * Data that was on the device before sign-in while the group already has its own: waits for
   * «Перенести» / «Не переносить» (docs/UX.md «Вход»). A copy is in IndexedDB meanwhile.
   */
  localData: PersistedState | null
}

export const useSyncStore = create<SyncState>()(() => ({ groupId: null, status: { kind: 'idle' }, localData: null }))

/** Worth a dot on «Настройки»: the user has to act. Offline is normal and is not. */
export const needsAttention = (status: SyncStatus) =>
  status.kind === 'needsLogin' || status.kind === 'needsUpdate' || status.kind === 'forbidden'
