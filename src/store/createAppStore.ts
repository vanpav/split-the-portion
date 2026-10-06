import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { Company, Cooking, Dish, Id, Ingredient, Lineup, Portion, PortionInput, Tare, Weighing } from '@/domain'
import { newId } from './id'
import {
  backupKey,
  CURRENT_VERSION,
  EMPTY_STATE,
  migrate,
  STORAGE_KEY,
  type PersistedState,
} from './migrations'

/** What the dish editor saves; id is absent for a new dish. */
export type DishDraft = Omit<Dish, 'id' | 'createdAt' | 'updatedAt'> & { id?: Id }

export interface AppState extends PersistedState {
  /** Stored data could not be read; it was copied to a backup key. Not persisted. */
  loadError: boolean
  dismissLoadError(): void

  /** «Создать» / «Сохранить» in the dish editor. Past cookings keep their own copy of ingredients. */
  saveDish(draft: DishDraft): Id
  /** Removes the dish with its cookings. */
  deleteDish(id: Id): void
  /** «Добавить популярные блюда»: appended after the user's own dishes, which stay as they are. */
  addDishes(dishes: Dish[]): void

  /**
   * «Сохранить» in the calculator: stores its draft (domain `cookingDraft`) under fresh ids.
   * Nothing is stored before it (docs/SPEC.md §3б).
   */
  saveCooking(draft: Cooking): Id
  updateCooking(id: Id, patch: Partial<Pick<Cooking, 'equalSplitN'>>): void
  deleteCooking(id: Id): void
  /** Today's weights: only the raw weight of an ingredient changes in a cooking. */
  updateIngredient(cookingId: Id, ingredientId: Id, patch: Partial<Omit<Ingredient, 'id'>>): void
  /** Who eats today: replaces the portions of the current phase with the company's members. */
  setCookingCompany(cookingId: Id, companyId: Id | null): void

  setWeighing(cookingId: Id, weighing: Weighing): void
  /** New phase: an empty weighing with the mode and tare of the previous one. */
  addReweighing(cookingId: Id): Id
  /** Removes a re-weighing together with the portions of its phase (docs/SPEC.md §4.3). */
  removeWeighing(cookingId: Id, weighingId: Id): void

  addPortion(cookingId: Id, name: string, input: PortionInput): Id
  updatePortion(cookingId: Id, portionId: Id, patch: Partial<Omit<Portion, 'id' | 'weighingId'>>): void
  removePortion(cookingId: Id, portionId: Id): void
  /** Undo of a removal: puts the portion back at its old position. */
  restorePortion(cookingId: Id, portion: Portion, index: number): void

  upsertTare(tare: Omit<Tare, 'id'> & { id?: Id }): Id
  deleteTare(id: Id): void

  /** «Кто ест» of one dish: the company picked and the shares; other dishes keep their own. */
  setLineup(dishId: Id, lineup: Lineup): void
  /** Settings: how long «×» is held before a person is removed. */
  setHoldMs(ms: number): void
  /** «Загрузить из файла»: all the user's data replaced by a backup (already migrated). */
  replaceData(data: PersistedState): void

  upsertCompany(company: Omit<Company, 'id'> & { id?: Id }): Id
  deleteCompany(id: Id): void
}

const nowIso = () => new Date().toISOString()

/** What is stored (and what a backup file holds): the user's input, nothing derived. */
export const storedData = (s: PersistedState): PersistedState => ({
  dishes: s.dishes,
  cookings: s.cookings,
  tares: s.tares,
  companies: s.companies,
  lineups: s.lineups,
  holdMs: s.holdMs,
})

/** Inserts unless an item with the same id is already there (undo pressed twice). */
function insertAt<T extends { id: Id }>(items: T[], item: T, index: number): T[] {
  if (items.some((i) => i.id === item.id)) return items
  return [...items.slice(0, index), item, ...items.slice(index)]
}

/** Members of a company as share portions on a weighing. */
const sharePortions = (company: Company | undefined, weighingId: Id): Portion[] =>
  (company?.members ?? []).map((m) => ({
    id: newId(),
    name: m.name,
    weighingId,
    input: { basis: 'share', weight: m.weight },
  }))

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
      (set, get) => {
        /** Immutable update of one cooking; bumps updatedAt. */
        const patchCooking = (id: Id, fn: (c: Cooking) => Cooking) =>
          set((s) => ({
            cookings: s.cookings.map((c) => (c.id === id ? { ...fn(c), updatedAt: nowIso() } : c)),
          }))

        return {
          ...EMPTY_STATE,
          loadError: false,
          dismissLoadError: () => set({ loadError: false }),

          saveDish: ({ id: existingId, ...draft }) => {
            const now = nowIso()
            const id = existingId ?? newId()
            set((s) => {
              const old = s.dishes.find((d) => d.id === id)
              const dish: Dish = { ...draft, id, createdAt: old?.createdAt ?? now, updatedAt: now }
              return { dishes: old ? s.dishes.map((d) => (d.id === id ? dish : d)) : [dish, ...s.dishes] }
            })
            return id
          },

          deleteDish: (id) =>
            set((s) => {
              const { [id]: _removed, ...lineups } = s.lineups
              return {
                dishes: s.dishes.filter((d) => d.id !== id),
                cookings: s.cookings.filter((c) => c.dishId !== id),
                lineups,
              }
            }),

          addDishes: (dishes) => set((s) => ({ dishes: [...s.dishes, ...dishes] })),

          saveCooking: (draft) => {
            const now = nowIso()
            // The draft's ids are local to the calculator; stored records get their own.
            const weighingIds = new Map(draft.weighings.map((w) => [w.id, newId()]))
            const cooking: Cooking = {
              ...draft,
              id: newId(),
              createdAt: now,
              updatedAt: now,
              weighings: draft.weighings.map((w) => ({ ...w, id: weighingIds.get(w.id)!, at: now })),
              portions: draft.portions.map((p) => ({
                ...p,
                id: newId(),
                weighingId: weighingIds.get(p.weighingId) ?? p.weighingId,
              })),
            }
            set((s) => ({ cookings: [cooking, ...s.cookings] }))
            return cooking.id
          },

          updateCooking: (id, patch) => patchCooking(id, (c) => ({ ...c, ...patch })),

          deleteCooking: (id) => set((s) => ({ cookings: s.cookings.filter((c) => c.id !== id) })),

          updateIngredient: (cookingId, ingredientId, patch) =>
            patchCooking(cookingId, (c) => ({
              ...c,
              ingredients: c.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i)),
            })),

          setCookingCompany: (cookingId, companyId) => {
            const company = get().companies.find((c) => c.id === companyId)
            patchCooking(cookingId, (c) => {
              const weighingId = c.weighings[c.weighings.length - 1].id
              return {
                ...c,
                companyId,
                portions: [...c.portions.filter((p) => p.weighingId !== weighingId), ...sharePortions(company, weighingId)],
              }
            })
          },

          setWeighing: (cookingId, weighing) =>
            patchCooking(cookingId, (c) => ({
              ...c,
              weighings: c.weighings.map((w) => (w.id === weighing.id ? weighing : w)),
            })),

          addReweighing: (cookingId) => {
            const id = newId()
            patchCooking(cookingId, (c) => {
              const prev = c.weighings[c.weighings.length - 1]
              const at = nowIso()
              const next: Weighing =
                prev.kind === 'withTare'
                  ? { id, at, kind: 'withTare', grams: null, tare: prev.tare }
                  : { id, at, kind: 'food', grams: null }
              return { ...c, weighings: [...c.weighings, next] }
            })
            return id
          },

          removeWeighing: (cookingId, weighingId) =>
            patchCooking(cookingId, (c) => {
              // The first weighing always stays: portions and the "after cooking" section rely on it.
              if (c.weighings.length <= 1 || c.weighings[0].id === weighingId) return c
              return {
                ...c,
                weighings: c.weighings.filter((w) => w.id !== weighingId),
                portions: c.portions.filter((p) => p.weighingId !== weighingId),
              }
            }),

          addPortion: (cookingId, name, input) => {
            const id = newId()
            patchCooking(cookingId, (c) => {
              const weighingId = c.weighings[c.weighings.length - 1].id
              return { ...c, portions: [...c.portions, { id, name, weighingId, input }] }
            })
            return id
          },

          updatePortion: (cookingId, portionId, patch) =>
            patchCooking(cookingId, (c) => ({
              ...c,
              portions: c.portions.map((p) => (p.id === portionId ? { ...p, ...patch } : p)),
            })),

          removePortion: (cookingId, portionId) =>
            patchCooking(cookingId, (c) => ({
              ...c,
              portions: c.portions.filter((p) => p.id !== portionId),
            })),

          restorePortion: (cookingId, portion, index) =>
            patchCooking(cookingId, (c) => ({ ...c, portions: insertAt(c.portions, portion, index) })),

          upsertTare: (tare) => {
            const id = tare.id ?? newId()
            set((s) => ({
              tares: s.tares.some((t) => t.id === id)
                ? s.tares.map((t) => (t.id === id ? { ...tare, id } : t))
                : [...s.tares, { ...tare, id }],
            }))
            return id
          },

          deleteTare: (id) => set((s) => ({ tares: s.tares.filter((t) => t.id !== id) })),

          setLineup: (dishId, lineup) => set((s) => ({ lineups: { ...s.lineups, [dishId]: lineup } })),
          setHoldMs: (holdMs) => set({ holdMs }),
          replaceData: (data) => set({ ...data }),

          upsertCompany: (company) => {
            const id = company.id ?? newId()
            set((s) => ({
              companies: s.companies.some((c) => c.id === id)
                ? s.companies.map((c) => (c.id === id ? { ...company, id } : c))
                : [...s.companies, { ...company, id }],
            }))
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
