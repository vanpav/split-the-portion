import { describe, expect, it } from 'vitest'
import type { StateStorage } from 'zustand/middleware'
import { cookingDraft, type CalculatorInput, type Id } from '@/domain'
import { createAppStore, type DishDraft } from '../createAppStore'
import { CURRENT_VERSION, migrate, migrations, STORAGE_KEY, type PersistedState } from '../migrations'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const storage: StateStorage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
  return { data, storage }
}

const tare = { id: 't1', name: 'Кастрюля', grams: 850 }

/** Shape of versions 1–3. */
const v1 = {
  cookings: [{ id: 'old', ingredients: [], weighings: [], portions: [] }],
  tares: [tare],
  settings: { defaultPeople: ['Аня', 'Борис'] },
}

const v4 = { dishes: [], cookings: [], tares: [tare], companies: [] }
const v5 = { ...v4, lineup: null }
const v8: PersistedState = { ...v5, holdMs: 1500 }

const backups = (data: Map<string, string>) => [...data.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}:backup:`))

describe('migrate', () => {
  it('accepts the current version', () => {
    expect(migrate(v8, CURRENT_VERSION)).toEqual(v8)
  })

  it.each([0, CURRENT_VERSION + 1, 1.5])('rejects version %s', (version) => {
    expect(() => migrate(v5, version)).toThrow()
  })

  it('v4 → v5: no lineup chosen yet, the rest kept', () => {
    expect(migrations[4](v4)).toEqual(v5)
  })

  it('v5 → v6: dishes lose companyId, the rest kept', () => {
    const dish = { id: 'd', kind: 'simple', name: 'Макароны', ingredients: [], tareId: null, companyId: 'c' }
    const migrated = migrate({ ...v5, dishes: [dish] }, 5)
    expect(migrated.dishes).toEqual([{ id: 'd', kind: 'simple', name: 'Макароны', ingredients: [], tareId: null }])
    expect(migrated.lineup).toBeNull()
  })

  it('v6 → v7: cookings set nothing aside, the rest kept', () => {
    const old = { id: 'c', dishId: 'd', portions: [], weighings: [] }
    const migrated = migrate({ ...v5, cookings: [old] }, 6)
    expect(migrated.cookings).toEqual([{ ...old, keepPercent: null }])
    expect(migrated.tares).toEqual([tare])
  })

  it('v7 → v8: removing a person takes a 1,5 s hold, the rest kept', () => {
    expect(migrate(v5, 7)).toEqual(v8)
  })

  it('v1 → v2: empty portions follow the dish, filled ones are kept', () => {
    const portion = (id: string, input: object) => ({ id, name: id, weighingId: 'w0', input })
    const old = {
      cookings: [
        {
          portions: [
            portion('empty', { basis: 'raw', ingredientId: 'i1', grams: null }),
            portion('filled', { basis: 'raw', ingredientId: 'i1', grams: 80 }),
          ],
        },
      ],
    }
    const migrated = migrations[1](old) as { cookings: { portions: { input: unknown }[] }[] }
    expect(migrated.cookings[0].portions.map((p) => p.input)).toEqual([
      { basis: 'default', grams: null },
      { basis: 'raw', ingredientId: 'i1', grams: 80 },
    ])
  })

  it('v2 → v3: one counted ingredient is a simple dish, the rest are composite', () => {
    const ingredient = (id: string, excluded = false) => ({ id, name: id, rawGrams: 100, excluded })
    const old = {
      cookings: [
        { id: 'buckwheat', ingredients: [ingredient('b')] },
        { id: 'empty', ingredients: [] },
        { id: 'salted', ingredients: [ingredient('b'), ingredient('salt', true)] },
        { id: 'water', ingredients: [ingredient('water', true)] },
        { id: 'soup', ingredients: [ingredient('a'), ingredient('b')] },
      ],
    }
    const migrated = migrations[2](old) as { cookings: { id: string; kind: string }[] }
    expect(migrated.cookings.map((c) => [c.id, c.kind])).toEqual([
      ['buckwheat', 'simple'],
      ['empty', 'simple'],
      ['salted', 'composite'],
      ['water', 'composite'],
      ['soup', 'composite'],
    ])
  })

  it('v3 → v4: clean slate for cookings, tares kept, default people become a company', () => {
    const migrated = migrate(v1, 3)
    expect(migrated).toMatchObject({ dishes: [], cookings: [], tares: [tare], lineup: null })
    expect(migrated.companies).toEqual([
      {
        id: 'default',
        name: 'Обычно',
        members: [
          { id: 'm0', name: 'Аня', weight: 1 },
          { id: 'm1', name: 'Борис', weight: 1 },
        ],
      },
    ])
    expect(migrate({ ...v1, settings: { defaultPeople: [] } }, 1).companies).toEqual([])
  })

  it('rejects an unexpected shape', () => {
    expect(() => migrate({ cookings: 'nope' }, CURRENT_VERSION)).toThrow()
  })
})

describe('store hydration', () => {
  it('empty storage → empty state, no error', () => {
    const { storage, data } = memoryStorage()
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ dishes: [], cookings: [], tares: [], loadError: false })
    expect(backups(data)).toEqual([])
  })

  it('v1 is migrated on load', () => {
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: v1, version: 1 }) })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ tares: [tare], cookings: [], loadError: false })
  })

  it('broken JSON → empty state, load error, raw data backed up', () => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: '{oops' })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ cookings: [], loadError: true })
    const [key] = backups(data)
    expect(data.get(key)).toBe('{oops')
  })

  it('version from the future → load error, backup kept after the next write', () => {
    const raw = JSON.stringify({ state: v5, version: CURRENT_VERSION + 1 })
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: raw })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ tares: [], loadError: true })

    store.getState().upsertTare({ name: 'Миска', grams: 300 })
    const [key] = backups(data)
    expect(data.get(key)).toBe(raw)
    expect(JSON.parse(data.get(STORAGE_KEY)!).state.tares).toHaveLength(1)
  })

  it('an older version is copied aside before it is migrated', () => {
    const raw = { state: v5, version: 5 }
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(raw) })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ holdMs: 1500, loadError: false })
    const [key] = backups(data)
    expect(key).toContain(':backup:v5:')
    expect(JSON.parse(data.get(key)!)).toEqual(raw)
  })

  it('async storage (IndexedDB): ready resolves once the data is in', async () => {
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: v8, version: CURRENT_VERSION }) })
    const slow: StateStorage = {
      getItem: (k) => new Promise((resolve) => setTimeout(() => resolve(storage.getItem(k) as string | null), 5)),
      setItem: (k, v) => Promise.resolve(storage.setItem(k, v)),
      removeItem: (k) => Promise.resolve(storage.removeItem(k)),
    }
    const store = createAppStore(() => slow)
    expect(store.getState().tares).toEqual([])
    await store.ready
    expect(store.getState()).toMatchObject({ tares: [tare], loadError: false })
  })

  it('async storage with unreadable data: ready still resolves, with the load error', async () => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: '{oops' })
    const slow: StateStorage = {
      getItem: (k) => Promise.resolve(storage.getItem(k) as string | null),
      setItem: (k, v) => Promise.resolve(storage.setItem(k, v)),
      removeItem: (k) => Promise.resolve(storage.removeItem(k)),
    }
    const store = createAppStore(() => slow)
    await store.ready
    expect(store.getState().loadError).toBe(true)
    expect(backups(data)).toHaveLength(1)
  })

  it('replaceData swaps in a backup and persists it', () => {
    const { storage, data } = memoryStorage()
    const store = createAppStore(() => storage)
    store.getState().replaceData({ ...v8, holdMs: 0 })
    expect(store.getState()).toMatchObject({ tares: [tare], holdMs: 0 })
    expect(JSON.parse(data.get(STORAGE_KEY)!).state.tares).toEqual([tare])
  })

  it('persists only user input', () => {
    const { storage, data } = memoryStorage()
    const store = createAppStore(() => storage)
    store.getState().upsertCompany({ name: 'Мы', members: [] })
    const saved = JSON.parse(data.get(STORAGE_KEY)!)
    expect(saved.version).toBe(CURRENT_VERSION)
    expect(Object.keys(saved.state).sort()).toEqual(['companies', 'cookings', 'dishes', 'holdMs', 'lineup', 'tares'])
  })
})

const pasta: DishDraft = {
  kind: 'simple',
  name: 'Макароны',
  ingredients: [{ id: 'p', name: 'Макароны', rawGrams: 130, excluded: false }],
  tareId: null,
}

function setup() {
  const store = createAppStore(() => memoryStorage().storage)
  const { getState } = store
  const cooking = (id: string) => getState().cookings.find((c) => c.id === id)!
  const us = getState().upsertCompany({
    name: 'Ваня и Ксюша',
    members: [
      { id: 'v', name: 'Ваня', weight: 70 },
      { id: 'k', name: 'Ксюша', weight: 60 },
    ],
  })
  /** What «Сохранить» in the calculator does: the dish's draft with today's numbers. */
  const start = (dishId: Id, input: Partial<CalculatorInput> = {}) => {
    const st = getState()
    const dish = st.dishes.find((d) => d.id === dishId)!
    const draft = cookingDraft(
      dish,
      {
        rawGrams: {},
        scaleGrams: null,
        tare: st.tares.find((t) => t.id === dish.tareId) ?? null,
        // The calculator starts with the first company until the lineup is changed.
        people: st.companies[0]?.members ?? [],
        companyId: st.companies[0]?.id ?? null,
        ...input,
      },
      '2026-10-05T12:00:00.000Z',
    )
    return st.saveCooking(draft)
  }
  return { getState, cooking, us, start }
}

describe('dishes and cookings', () => {
  it('saveDish creates, then updates in place keeping createdAt', () => {
    const { getState } = setup()
    const id = getState().saveDish(pasta)
    const created = getState().dishes[0]
    getState().saveDish({ ...pasta, id, name: 'Спагетти' })
    expect(getState().dishes).toHaveLength(1)
    expect(getState().dishes[0]).toMatchObject({ id, name: 'Спагетти', createdAt: created.createdAt })
  })

  it('nothing is stored until «Сохранить»; the draft gets fresh ids', () => {
    const { getState, cooking, us, start } = setup()
    const tareId = getState().upsertTare({ name: 'Кастрюля', grams: 850 })
    const dishId = getState().saveDish({ ...pasta, tareId })
    expect(getState().cookings).toEqual([])

    const c = cooking(start(dishId, { rawGrams: { p: 150 }, scaleGrams: 1210 }))
    expect(c).toMatchObject({ dishId, kind: 'simple', title: 'Макароны', companyId: us })
    expect(c.id).not.toBe('draft')
    expect(c.ingredients[0].rawGrams).toBe(150)
    expect(c.weighings[0]).toMatchObject({ kind: 'withTare', grams: 1210, tare: { id: tareId, grams: 850 } })
    expect(c.portions.map((p) => [p.name, p.input])).toEqual([
      ['Ваня', { basis: 'share', weight: 70 }],
      ['Ксюша', { basis: 'share', weight: 60 }],
    ])
    expect(c.portions.every((p) => p.weighingId === c.weighings[0].id && p.id !== 'v' && p.id !== 'k')).toBe(true)

    // Today's weight does not change the recipe.
    expect(getState().dishes[0].ingredients[0].rawGrams).toBe(130)
  })

  it('setCookingCompany replaces the portions of the current phase only', () => {
    const { getState, cooking, start } = setup()
    const withMom = getState().upsertCompany({
      name: 'С тёщей',
      members: [
        { id: 'v', name: 'Ваня', weight: 70 },
        { id: 'k', name: 'Ксюша', weight: 60 },
        { id: 'm', name: 'Тёща', weight: 60 },
      ],
    })
    const id = start(getState().saveDish(pasta))
    const firstPhase = cooking(id).weighings[0].id
    getState().addReweighing(id)
    getState().setCookingCompany(id, withMom)
    const c = cooking(id)
    expect(c.companyId).toBe(withMom)
    expect(c.portions.filter((p) => p.weighingId === firstPhase).map((p) => p.name)).toEqual(['Ваня', 'Ксюша'])
    expect(c.portions.filter((p) => p.weighingId !== firstPhase).map((p) => p.name)).toEqual(['Ваня', 'Ксюша', 'Тёща'])
  })

  it('deleteDish removes its cookings', () => {
    const { getState, start } = setup()
    const dishId = getState().saveDish(pasta)
    start(dishId)
    getState().deleteDish(dishId)
    expect(getState().cookings).toEqual([])
  })
})

describe('re-weighing', () => {
  it('copies the mode and tare of the previous weighing; removing it removes its portions', () => {
    const { getState, cooking, start } = setup()
    const id = start(getState().saveDish(pasta))
    const first = cooking(id).weighings[0]
    getState().setWeighing(id, { id: first.id, at: first.at, kind: 'withTare', grams: 1410, tare })
    const second = getState().addReweighing(id)
    expect(cooking(id).weighings[1]).toMatchObject({ kind: 'withTare', grams: null, tare })

    getState().addPortion(id, 'Борис', { basis: 'cooked', grams: 155 })
    expect(cooking(id).portions.at(-1)!.weighingId).toBe(second)
    getState().removeWeighing(id, second)
    expect(cooking(id).weighings.map((w) => w.id)).toEqual([first.id])
    expect(cooking(id).portions.map((p) => p.name)).toEqual(['Ваня', 'Ксюша'])

    getState().removeWeighing(id, first.id)
    expect(cooking(id).weighings).toHaveLength(1)
  })
})

describe('undo of a portion removal', () => {
  it('puts the portion back at its position, once', () => {
    const { getState, cooking, start } = setup()
    const id = start(getState().saveDish(pasta))
    const before = cooking(id).portions
    getState().removePortion(id, before[0].id)
    getState().restorePortion(id, before[0], 0)
    getState().restorePortion(id, before[0], 0)
    expect(cooking(id).portions).toEqual(before)
  })
})

describe('lineup', () => {
  it('is remembered across reloads', () => {
    const { storage } = memoryStorage()
    createAppStore(() => storage).getState().setLineup([{ id: 'g', name: 'Гость', weight: 1 }])
    expect(createAppStore(() => storage).getState().lineup).toEqual([{ id: 'g', name: 'Гость', weight: 1 }])
  })
})
