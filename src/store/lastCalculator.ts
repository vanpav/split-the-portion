import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { sameDay, type Id } from '@/domain'
import { idbStorage } from './idbStorage'
import { LAST_CALCULATOR_KEY, LAST_CALCULATOR_VERSION, migrateLastCalculator } from './lastCalculatorMigrations'

export { LAST_CALCULATOR_KEY, LAST_CALCULATOR_VERSION }

/** An own portion typed in the calculator. */
export interface OwnPortion {
  unit: 'g' | '%'
  value: number
  /** Grams typed while «Сухой» or «Сырой» was in focus: raw grams of this ingredient (`RAW_SUM`: of the counted ones together), not cooked. */
  raw?: Id
}

/** What is typed in the calculator of one dish and how it is shown: input only, nothing computed. */
export interface CalculatorInput {
  /** Field texts by row: ingredient ids, `cooked`, `person:<id>`. */
  texts: Record<string, string>
  cookedTouched: boolean
  weightRow: string
  fixed: Record<Id, OwnPortion>
  unit: OwnPortion['unit']
  barUnit: OwnPortion['unit']
  shown: Record<Id, OwnPortion['unit']>
  keep: number
}

/** The calculator open last on this device, as it was: `at` — when it last changed. */
export interface LastCalculator {
  dishId: Id
  at: string
  input: CalculatorInput
}

interface LastCalculatorState {
  last: LastCalculator | null
  remember(last: LastCalculator): void
}

/**
 * The calculator open last (docs/ARCHITECTURE.md §5.2): `#/` opens its dish after a restart or a crash,
 * and the first calculator of the launch comes back as it was, if it was today. Other screens are not
 * remembered. A setting of this device, like prefs: not synced, not in the backup file.
 */
export const useLastCalculatorStore = create<LastCalculatorState>()(
  persist(
    (set) => ({
      last: null,
      remember: (last) => set({ last }),
    }),
    {
      name: LAST_CALCULATOR_KEY,
      version: LAST_CALCULATOR_VERSION,
      migrate: (state, version) => migrateLastCalculator(state, version) as { last: LastCalculator | null },
      storage: createJSONStorage(() => idbStorage(null)),
      partialize: (s) => ({ last: s.last }),
    },
  ),
)

export const lastCalculatorReady = new Promise<void>((resolve) => {
  if (useLastCalculatorStore.persist.hasHydrated()) resolve()
  else useLastCalculatorStore.persist.onFinishHydration(() => resolve())
})

// Only the first calculator of a launch is restored: switching dishes later starts each one afresh.
let launchRestored = false

/** The input to restore in the calculator of `dishId` opening now, if this is the launch's first one. */
export function launchInput(dishId: Id | undefined, now: Date): CalculatorInput | null {
  const last = useLastCalculatorStore.getState().last
  if (launchRestored || !last || last.dishId !== dishId || !sameDay(last.at, now)) return null
  return last.input
}

/** Called once the first calculator is on screen; later ones start afresh. */
export function endLaunch() {
  launchRestored = true
}
