import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Me } from '@/account/types'
import { idbStorage } from './idbStorage'

interface AccountState {
  /** Who is signed in, as last heard from `/api/me`; null — nobody. Cached so the app knows it offline. */
  me: Me | null
  setMe(me: Me | null): void
}

/**
 * The account, apart from the app data: it is not in the backup file and not per group
 * (docs/ARCHITECTURE.md §5.2). Kept in IndexedDB like the data.
 */
export const useAccountStore = create<AccountState>()(
  persist((set) => ({ me: null, setMe: (me) => set({ me }) }), {
    name: 'split-the-portion:account',
    storage: createJSONStorage(() => idbStorage(null)),
    partialize: (s) => ({ me: s.me }),
  }),
)

/** Resolves once the cached account is read: the app renders after it, like after the data. */
export const accountReady = new Promise<void>((resolve) => {
  if (useAccountStore.persist.hasHydrated()) resolve()
  else useAccountStore.persist.onFinishHydration(() => resolve())
})
