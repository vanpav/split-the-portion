import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Id, SplitMode } from '@/domain'
import { idbStorage } from './idbStorage'

interface PrefsState {
  /** «Люди | Порции»: how the calculator splits every dish. */
  splitMode: SplitMode
  /** How many portions each dish is split into, by dish id; see `portionCount` for the default. */
  portionCounts: Record<Id, number>
  setSplitMode(mode: SplitMode): void
  setPortionCount(dishId: Id, n: number): void
}

/**
 * Settings of this device (docs/ARCHITECTURE.md §5.2, docs/SPEC.md §3б «Режим порций»): apart from
 * the app data, like the theme. Not synced with the group, not in the backup file, the same whichever
 * group is open. Kept in IndexedDB next to the data.
 */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      splitMode: 'people',
      portionCounts: {},
      setSplitMode: (splitMode) => set({ splitMode }),
      setPortionCount: (dishId, n) => set((s) => ({ portionCounts: { ...s.portionCounts, [dishId]: n } })),
    }),
    {
      name: 'split-the-portion:prefs',
      version: 1,
      storage: createJSONStorage(() => idbStorage(null)),
      partialize: (s) => ({ splitMode: s.splitMode, portionCounts: s.portionCounts }),
    },
  ),
)

/** Resolves once the settings are read: the app renders after it, so the calculator opens in the right mode. */
export const prefsReady = new Promise<void>((resolve) => {
  if (usePrefsStore.persist.hasHydrated()) resolve()
  else usePrefsStore.persist.onFinishHydration(() => resolve())
})
