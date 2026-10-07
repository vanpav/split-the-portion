import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { liveTareId, localDay, markUsed, type Company, type Dish, type Id, type Lineup, type Tare } from '@/domain'
import { newId } from './id'
import {
  backupKey,
  CURRENT_VERSION,
  EMPTY_STATE,
  migrate,
  STORAGE_KEY,
  type PersistedState,
} from './migrations'

/** What the dish editor saves; id is absent for a new dish, `cooked` — kept as it is; `usedOn` is the store's. */
export type DishDraft = Omit<Dish, 'id' | 'createdAt' | 'updatedAt' | 'cooked' | 'usedOn'> & { id?: Id; cooked?: Dish['cooked'] }

export interface AppState extends PersistedState {
  /** Stored data could not be read; it was copied to a backup key. Not persisted. */
  loadError: boolean
  dismissLoadError(): void

  /**
   * «Создать» / «Сохранить» in the dish editor; the calculator writes the raw weights and the tare
   * the same way. Without `cooked` the dish keeps the one it has: the editor never touches it.
   * `used` — typed in the calculator: today goes into `usedOn` (docs/SPEC.md §3б «Меню блюд»).
   */
  saveDish(draft: DishDraft, options?: { used?: boolean }): Id
  /** The cooked weight typed in the calculator: the time and the dish's tare go with it; null — erased. A use of the dish. */
  setCooked(dishId: Id, grams: number | null): void
  /** Removes the dish with its «Кто ест». */
  deleteDish(id: Id): void
  /** «Добавить популярные блюда», a popular dish from the search: appended after the user's own. */
  addDishes(dishes: Dish[]): void

  /** createdAt is kept on edit; a new tare gets the current time unless given (undo of a removal). */
  upsertTare(tare: Omit<Tare, 'id' | 'createdAt'> & { id?: Id; createdAt?: string }): Id
  deleteTare(id: Id): void

  /** «Кто ест» of one dish: the company picked and the shares; other dishes keep their own. */
  setLineup(dishId: Id, lineup: Lineup): void
  /** Settings: how long «×» is held before a person is removed. */
  /** «Загрузить из файла»: all the user's data replaced by a backup (already migrated). */
  replaceData(data: PersistedState): void

  /** createdAt is kept on edit; a new company gets the current time unless given (undo of a removal). */
  upsertCompany(company: Omit<Company, 'id' | 'createdAt'> & { id?: Id; createdAt?: string }): Id
  deleteCompany(id: Id): void
}

const nowIso = () => new Date().toISOString()

/** What is stored (and what a backup file holds): the user's input, nothing derived. */
export const storedData = (s: PersistedState): PersistedState => ({
  dishes: s.dishes,
  tares: s.tares,
  companies: s.companies,
  lineups: s.lineups,
  holdMs: s.holdMs,
})

/** Replaces the item with the same id (keeping its createdAt) or appends a new one. */
function upsertById<T extends { id: Id; createdAt: string }>(items: T[], item: Omit<T, 'createdAt'> & { createdAt?: string }): T[] {
  const old = items.find((i) => i.id === item.id)
  const next = { ...item, createdAt: item.createdAt ?? old?.createdAt ?? nowIso() } as T
  return old ? items.map((i) => (i.id === item.id ? next : i)) : [...items, next]
}

export function createAppStore(storage: () => StateStorage) {
  // Sync hydration runs inside create() and its result replaces anything set during it,
  // so a read failure is remembered here and applied once the store exists.
  let loadFailed = false

  // Resolves once stored data is read (or found unreadable): the app renders after it, so nothing
  // typed early can overwrite what is still loading.
  let markReady = () => {}
  const ready = new Promise<void>((resolve) => (markReady = resolve))
  // With a sync storage (tests) hydration finishes inside create(), before `store` exists.
  let store: ReturnType<typeof makeStore> | undefined
  const failed = () => (store ? store.setState({ loadError: true }) : (loadFailed = true))

  const makeStore = () => create<AppState>()(
    persist(
      (set) => {
        return {
          ...EMPTY_STATE,
          loadError: false,
          dismissLoadError: () => set({ loadError: false }),

          saveDish: ({ id: existingId, ...draft }, options) => {
            const now = new Date()
            const id = existingId ?? newId()
            set((s) => {
              const old = s.dishes.find((d) => d.id === id)
              const usedOn = old?.usedOn ?? []
              // A draft built from a stored dish carries its `usedOn`: the store's copy wins.
              const { usedOn: _ignored, ...input } = draft as DishDraft & { usedOn?: unknown }
              const dish: Dish = {
                ...input,
                id,
                cooked: draft.cooked !== undefined ? draft.cooked : (old?.cooked ?? null),
                usedOn: options?.used ? markUsed(usedOn, localDay(now)) : usedOn,
                createdAt: old?.createdAt ?? now.toISOString(),
                updatedAt: now.toISOString(),
              }
              return { dishes: old ? s.dishes.map((d) => (d.id === id ? dish : d)) : [dish, ...s.dishes] }
            })
            return id
          },

          setCooked: (dishId, grams) => {
            const now = new Date()
            const at = now.toISOString()
            set((s) => ({
              dishes: s.dishes.map((d) =>
                d.id === dishId
                  ? {
                      ...d,
                      // Weighed in the tare shown: none, if the dish's tare was deleted (docs/SPEC.md §8).
                      cooked: grams !== null && grams > 0 ? { grams, tareId: liveTareId(d.tareId, s.tares), at } : null,
                      updatedAt: at,
                      usedOn: markUsed(d.usedOn, localDay(now)),
                    }
                  : d,
              ),
            }))
          },

          deleteDish: (id) =>
            set((s) => {
              const { [id]: _removed, ...lineups } = s.lineups
              return { dishes: s.dishes.filter((d) => d.id !== id), lineups }
            }),

          addDishes: (dishes) => set((s) => ({ dishes: [...s.dishes, ...dishes] })),

          upsertTare: (tare) => {
            const id = tare.id ?? newId()
            set((s) => ({ tares: upsertById(s.tares, { ...tare, id }) }))
            return id
          },

          deleteTare: (id) => set((s) => ({ tares: s.tares.filter((t) => t.id !== id) })),

          setLineup: (dishId, lineup) => set((s) => ({ lineups: { ...s.lineups, [dishId]: lineup } })),
          replaceData: (data) => set({ ...data }),

          upsertCompany: (company) => {
            const id = company.id ?? newId()
            set((s) => ({ companies: upsertById(s.companies, { ...company, id }) }))
            return id
          },

          deleteCompany: (id) => set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),
        }
      },
      {
        name: STORAGE_KEY,
        version: CURRENT_VERSION,
        storage: createJSONStorage(storage),
        partialize: (s): PersistedState => storedData(s),
        // An older version is copied aside before it is migrated: a bad step never costs the data.
        migrate: (persisted, version) => {
          if (version !== CURRENT_VERSION) {
            void storage().setItem(backupKey(new Date(), version), JSON.stringify({ state: persisted, version }))
          }
          return migrate(persisted, version)
        },
        onRehydrateStorage: () => (_state, error) => {
          if (!error) return markReady()
          failed()
          // Keep the unreadable data before the first write overwrites it.
          // The app renders only after the copy is made (`ready`).
          const target = storage()
          const keep = (raw: string | null) => {
            if (typeof raw === 'string') return target.setItem(backupKey(new Date()), raw)
          }
          const raw = target.getItem(STORAGE_KEY)
          if (raw instanceof Promise) void raw.then(keep).finally(markReady)
          else {
            void keep(raw)
            markReady()
          }
        },
      },
    ),
  )

  store = makeStore()
  if (loadFailed) store.setState({ loadError: true })
  return Object.assign(store, { ready })
}
