import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StateStorage } from 'zustand/middleware'
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
const v8 = { ...v5, holdMs: 1500 }
const v9 = { ...v4, lineups: {}, holdMs: 1500 }
/** v10: tares and companies ordered by createdAt; old ones 1 ms apart from the epoch. */
const at = (i: number) => new Date(i).toISOString()
const v10 = { ...v9, tares: [{ ...tare, createdAt: at(0) }] }
/** v11: no cookings; dishes remember their last cooked weight. */
const v11 = { dishes: [], tares: v10.tares, companies: [], lineups: {}, holdMs: 1500 }
/** v12: dishes remember the days they were used. */
const v12: PersistedState = v11

const backups = (data: Map<string, string>) => [...data.keys()].filter((k) => k.startsWith(`${STORAGE_KEY}:backup:`))

describe('migrate', () => {
  it('accepts the current version', () => {
    expect(migrate(v12, CURRENT_VERSION)).toEqual(v12)
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
    expect(migrated.dishes).toEqual([{ id: 'd', kind: 'simple', name: 'Макароны', ingredients: [], tareId: null, cooked: null, usedOn: [] }])
    expect(migrated.lineups).toEqual({})
  })

  it('v6 → v7: cookings set nothing aside, the rest kept', () => {
    const old = { id: 'c', dishId: 'd', portions: [], weighings: [] }
    const migrated = migrations[6]({ ...v5, cookings: [old] }) as typeof v5
    expect(migrated.cookings).toEqual([{ ...old, keepPercent: null }])
    expect(migrated.tares).toEqual(v5.tares)
  })

  it('v7 → v8: removing a person takes a 1,5 s hold, the rest kept', () => {
    expect(migrations[7](v5)).toEqual(v8)
  })

  it('v8 → v9: the lineup shared by all dishes becomes each dish\'s own, no company picked', () => {
    const dish = (id: string) => ({ id, kind: 'simple', name: id, ingredients: [], tareId: null })
    const lineup = [{ id: 'g', name: 'Гость', weight: 1 }]
    const migrated = migrate({ ...v8, dishes: [dish('a'), dish('b')], lineup }, 8)
    expect(migrated.lineups).toEqual({ a: { companyId: null, members: lineup }, b: { companyId: null, members: lineup } })
    expect(migrated).not.toHaveProperty('lineup')
    expect(migrate({ ...v8, dishes: [dish('a')] }, 8)).toEqual({ ...v12, dishes: [{ ...dish('a'), cooked: null, usedOn: [] }] })
  })

  it('v9 → v10: tares and companies keep their order through createdAt, the rest kept', () => {
    const company = (id: string) => ({ id, name: id, members: [] })
    const pan = { id: 't2', name: 'Сковорода', grams: 900 }
    const migrated = migrate({ ...v9, tares: [tare, pan], companies: [company('us'), company('mom')] }, 9)
    expect(migrated.tares).toEqual([
      { ...tare, createdAt: at(0) },
      { ...pan, createdAt: at(1) },
    ])
    expect(migrated.companies.map((c) => [c.id, c.createdAt])).toEqual([
      ['us', at(0)],
      ['mom', at(1)],
    ])
    expect(migrated.lineups).toEqual({})
  })

  it('v10 → v11: cookings go, dishes are not weighed yet, the rest kept', () => {
    const dish = { id: 'd', kind: 'simple', name: 'Гречка', createdAt: at(5), updatedAt: at(5), ingredients: [], tareId: 't1' }
    const old = { id: 'c', dishId: 'd', portions: [], weighings: [] }
    const migrated = migrations[10]({ ...v10, dishes: [dish], cookings: [old], lineups: { d: { companyId: null, members: [] } } })
    expect(migrated).toEqual({ ...v11, dishes: [{ ...dish, cooked: null }], lineups: { d: { companyId: null, members: [] } } })
    expect(migrated).not.toHaveProperty('cookings')
  })

  it('v11 → v12: a dish was used on the local day of its updatedAt, the rest kept', () => {
    // Local noon: the same day in any time zone the tests run in.
    const noon = new Date(2026, 9, 5, 12).toISOString()
    const dish = { id: 'd', kind: 'simple', name: 'Гречка', createdAt: at(5), updatedAt: noon, ingredients: [], tareId: 't1', cooked: null }
    const broken = { ...dish, id: 'x', updatedAt: 'nope' }
    const lineups = { d: { companyId: null, members: [] } }
    const migrated = migrate({ ...v11, dishes: [dish, broken], lineups }, 11)
    expect(migrated).toEqual({ ...v12, dishes: [{ ...dish, usedOn: ['2026-10-05'] }, { ...broken, usedOn: [] }], lineups })
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
    expect(migrated).toMatchObject({ dishes: [], tares: [tare], lineups: {} })
    expect(migrated).not.toHaveProperty('cookings')
    expect(migrated.companies).toEqual([
      {
        id: 'default',
        name: 'Обычно',
        members: [
          { id: 'm0', name: 'Аня', weight: 1 },
          { id: 'm1', name: 'Борис', weight: 1 },
        ],
        createdAt: at(0),
      },
    ])
    expect(migrate({ ...v1, settings: { defaultPeople: [] } }, 1).companies).toEqual([])
  })

  it('rejects an unexpected shape', () => {
    expect(() => migrate({ dishes: 'nope' }, CURRENT_VERSION)).toThrow()
  })
})

describe('store hydration', () => {
  it('empty storage → empty state, no error', () => {
    const { storage, data } = memoryStorage()
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ dishes: [], tares: [], loadError: false })
    expect(backups(data)).toEqual([])
  })

  it('v1 is migrated on load', () => {
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: v1, version: 1 }) })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ tares: [tare], loadError: false })
    expect(store.getState()).not.toHaveProperty('cookings')
  })

  it('broken JSON → empty state, load error, raw data backed up', () => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: '{oops' })
    const store = createAppStore(() => storage)
    expect(store.getState()).toMatchObject({ dishes: [], loadError: true })
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
    const { storage } = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: v12, version: CURRENT_VERSION }) })
    const slow: StateStorage = {
      getItem: (k) => new Promise((resolve) => setTimeout(() => resolve(storage.getItem(k) as string | null), 5)),
      setItem: (k, v) => Promise.resolve(storage.setItem(k, v)),
      removeItem: (k) => Promise.resolve(storage.removeItem(k)),
    }
    const store = createAppStore(() => slow)
    expect(store.getState().tares).toEqual([])
    await store.ready
    expect(store.getState()).toMatchObject({ tares: v12.tares, loadError: false })
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
    store.getState().replaceData({ ...v12, holdMs: 0 })
    expect(store.getState()).toMatchObject({ tares: v12.tares, holdMs: 0 })
    expect(JSON.parse(data.get(STORAGE_KEY)!).state.tares).toEqual(v12.tares)
  })

  it('persists only user input', () => {
    const { storage, data } = memoryStorage()
    const store = createAppStore(() => storage)
    store.getState().upsertCompany({ name: 'Мы', members: [] })
    const saved = JSON.parse(data.get(STORAGE_KEY)!)
    expect(saved.version).toBe(CURRENT_VERSION)
    expect(Object.keys(saved.state).sort()).toEqual(['companies', 'dishes', 'holdMs', 'lineups', 'tares'])
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
  return { getState: store.getState }
}

describe('dishes', () => {
  it('saveDish creates, then updates in place keeping createdAt', () => {
    const { getState } = setup()
    const id = getState().saveDish(pasta)
    const created = getState().dishes[0]
    expect(created.cooked).toBeNull()
    getState().saveDish({ ...pasta, id, name: 'Спагетти' })
    expect(getState().dishes).toHaveLength(1)
    expect(getState().dishes[0]).toMatchObject({ id, name: 'Спагетти', createdAt: created.createdAt })
  })

  it('setCooked: the weight with the dish\'s tare and the time; null erases it', () => {
    const { getState } = setup()
    const tareId = getState().upsertTare({ name: 'Кастрюля', grams: 850 })
    const id = getState().saveDish({ ...pasta, tareId })
    getState().setCooked(id, 1210)
    const { cooked, updatedAt } = getState().dishes[0]
    expect(cooked).toEqual({ grams: 1210, tareId, at: updatedAt })
    getState().setCooked(id, null)
    expect(getState().dishes[0].cooked).toBeNull()
    getState().setCooked(id, 0)
    expect(getState().dishes[0].cooked).toBeNull()
  })

  it('setCooked after the dish\'s tare was deleted: weighed without tare, the dish keeps its tare id', () => {
    const { getState } = setup()
    const tareId = getState().upsertTare({ name: 'Кастрюля', grams: 850 })
    const id = getState().saveDish({ ...pasta, tareId })
    getState().deleteTare(tareId)
    getState().setCooked(id, 360)
    expect(getState().dishes[0].cooked).toMatchObject({ grams: 360, tareId: null })
    // Undoing the removal brings the tare back to the dish.
    expect(getState().dishes[0].tareId).toBe(tareId)
  })

  it('the editor never touches the cooked weight: a draft without it keeps the dish\'s', () => {
    const { getState } = setup()
    const id = getState().saveDish(pasta)
    getState().setCooked(id, 360)
    const cooked = getState().dishes[0].cooked
    getState().saveDish({ ...pasta, id, name: 'Спагетти' })
    expect(getState().dishes[0].cooked).toEqual(cooked)
    getState().saveDish({ ...pasta, id, cooked: null })
    expect(getState().dishes[0].cooked).toBeNull()
  })
  describe('usedOn', () => {
    afterEach(() => vi.useRealTimers())
    const on = (day: number, hour = 12) => vi.setSystemTime(new Date(2026, 9, day, hour))

    it('the editor does not mark a use; the calculator marks the day once', () => {
      vi.useFakeTimers()
      on(5)
      const { getState } = setup()
      const id = getState().saveDish(pasta)
      getState().saveDish({ ...pasta, id, name: 'Спагетти' })
      expect(getState().dishes[0].usedOn).toEqual([])
      getState().saveDish({ ...getState().dishes[0], tareId: null }, { used: true })
      on(5, 20)
      getState().setCooked(id, 360)
      expect(getState().dishes[0].usedOn).toEqual(['2026-10-05'])
      on(6)
      getState().setCooked(id, 370)
      expect(getState().dishes[0].usedOn).toEqual(['2026-10-05', '2026-10-06'])
      // A draft carrying an old copy of usedOn does not overwrite the store's.
      getState().saveDish({ ...pasta, id, usedOn: [] } as DishDraft)
      expect(getState().dishes[0].usedOn).toEqual(['2026-10-05', '2026-10-06'])
    })

    it('survives a reload', () => {
      vi.useFakeTimers()
      on(5)
      const { storage } = memoryStorage()
      const id = createAppStore(() => storage).getState().saveDish(pasta)
      createAppStore(() => storage).getState().setCooked(id, 360)
      expect(createAppStore(() => storage).getState().dishes[0].usedOn).toEqual(['2026-10-05'])
    })
  })
})

describe('lineups', () => {
  const guest = { companyId: null, members: [{ id: 'g', name: 'Гость', weight: 1 }] }

  it('are remembered per dish across reloads', () => {
    const { storage } = memoryStorage()
    createAppStore(() => storage).getState().setLineup('pasta', guest)
    expect(createAppStore(() => storage).getState().lineups).toEqual({ pasta: guest })
  })

  it('setting one dish leaves the others as they were', () => {
    const { getState } = setup()
    getState().setLineup('pasta', guest)
    getState().setLineup('soup', { companyId: 'x', members: [] })
    expect(getState().lineups.pasta).toBe(guest)
  })

  it('go away with their dish', () => {
    const { getState } = setup()
    const id = getState().saveDish(pasta)
    getState().setLineup(id, guest)
    getState().deleteDish(id)
    expect(getState().lineups).toEqual({})
  })
})
