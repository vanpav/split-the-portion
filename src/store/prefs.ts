import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Id, PortionShare, SplitMode } from '@/domain'
import type { HintPrefs } from '@/onboarding/hints'
import { newId } from './id'
import { idbStorage } from './idbStorage'
import { EMPTY_PREFS, migratePrefs, PREFS_KEY, PREFS_VERSION, type PersistedPrefs } from './prefsMigrations'

interface PrefsState extends PersistedPrefs {
  setSplitMode(mode: SplitMode): void
  setPortions(dishId: Id, portions: PortionShare[]): void
  /** Hints for new people change only through the pure steps of `onboarding/hints`. */
  updateHints(step: (hints: HintPrefs) => HintPrefs): void
}

/**
 * Settings of this device (docs/ARCHITECTURE.md §5.2, docs/SPEC.md §3б «Режим долей», hints — docs/UX.md §3в): apart from
 * the app data, like the theme. Not synced with the group, not in the backup file, the same whichever
 * group is open. Kept in IndexedDB next to the data.
 */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      ...EMPTY_PREFS,
      setSplitMode: (splitMode) => set({ splitMode }),
      setPortions: (dishId, portions) => set((s) => ({ portions: { ...s.portions, [dishId]: portions } })),
      updateHints: (step) => set((s) => ({ hints: step(s.hints) })),
    }),
    {
      name: PREFS_KEY,
      version: PREFS_VERSION,
      storage: createJSONStorage(() => idbStorage(null)),
      partialize: (s): PersistedPrefs => ({ splitMode: s.splitMode, portions: s.portions, hints: s.hints }),
      migrate: (state, version) => migratePrefs(state, version, newId),
    },
  ),
)

/** Resolves once the settings are read: the app renders after it, so the calculator opens in the right mode. */
export const prefsReady = new Promise<void>((resolve) => {
  if (usePrefsStore.persist.hasHydrated()) resolve()
  else usePrefsStore.persist.onFinishHydration(() => resolve())
})
