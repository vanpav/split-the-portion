import type { Company, Cooking, Dish, Id, Lineup, Tare } from '@/domain'

export const STORAGE_KEY = 'split-the-portion'
export const CURRENT_VERSION = 9

export interface PersistedState {
  dishes: Dish[]
  cookings: Cooking[]
  tares: Tare[]
  companies: Company[]
  /** «Кто ест» of each dish, by dish id; a dish not here starts with the first company (docs/SPEC.md §3б). */
  lineups: Record<Id, Lineup>
  /** How long to hold «×» before a person is removed, ms; 0 — at once (docs/SPEC.md §3б). */
  holdMs: number
}

/** Hold to remove: long enough not to happen by accident, short enough to wait for. */
export const DEFAULT_HOLD_MS = 1500

export const EMPTY_STATE: PersistedState = {
  dishes: [],
  cookings: [],
  tares: [],
  companies: [],
  lineups: {},
  holdMs: DEFAULT_HOLD_MS,
}

/**
 * migrations[n] upgrades a state of version n to version n + 1.
 * Adding a version: bump CURRENT_VERSION, add a step here and a test on a fixture of the old version.
 */
export const migrations: Record<number, (state: unknown) => unknown> = {
  // v2: PortionInput gets basis 'default'. Empty portions of v1 were meant to follow the dish.
  1: (state) => {
    const s = state as { cookings?: { portions?: { input?: { grams?: unknown } }[] }[] }
    return {
      ...s,
      cookings: (s.cookings ?? []).map((c) => ({
        ...c,
        portions: (c.portions ?? []).map((p) =>
          p.input?.grams === null ? { ...p, input: { basis: 'default', grams: null } } : p,
        ),
      })),
    }
  },
  // v3: cookings get a kind. One ingredient that counts is a simple dish, anything else is composite.
  2: (state) => {
    const s = state as { cookings?: { ingredients?: { excluded?: boolean }[] }[] }
    return {
      ...s,
      cookings: (s.cookings ?? []).map((c) => {
        const ingredients = c.ingredients ?? []
        const simple = ingredients.length <= 1 && !ingredients[0]?.excluded
        return { ...c, kind: simple ? 'simple' : 'composite' }
      }),
    }
  },
  // v4: dishes (recipes) and companies. Old cookings are dropped (agreed: a prototype, clean slate);
  // tares are kept, the default people become one company with equal shares.
  3: (state) => {
    const s = state as { tares?: unknown[]; settings?: { defaultPeople?: string[] } }
    const people = s.settings?.defaultPeople ?? []
    return {
      dishes: [],
      cookings: [],
      tares: s.tares ?? [],
      companies:
        people.length > 0
          ? [{ id: 'default', name: 'Обычно', members: people.map((name, i) => ({ id: `m${i}`, name, weight: 1 })) }]
          : [],
    }
  },
  // v5: the lineup edited in the calculator is remembered; nothing chosen yet.
  4: (state) => ({ ...(state as object), lineup: null }),
  // v6: a dish is no longer tied to people; who eats is chosen in the calculator.
  5: (state) => {
    const s = state as { dishes?: Record<string, unknown>[] }
    return {
      ...s,
      dishes: (s.dishes ?? []).map((d) => {
        const { companyId: _companyId, ...dish } = d
        return dish
      }),
    }
  },
  // v7: a cooking may set part of the dish aside «на завтра»; old ones did not.
  6: (state) => {
    const s = state as { cookings?: Record<string, unknown>[] }
    return { ...s, cookings: (s.cookings ?? []).map((c) => ({ ...c, keepPercent: null })) }
  },
  // v8: removing a person takes a hold of «×»; how long is a setting.
  7: (state) => ({ ...(state as object), holdMs: DEFAULT_HOLD_MS }),
  // v9: «Кто ест» is remembered per dish. The lineup shared by all dishes becomes each dish's own;
  // no company is picked (the picker shows the matching one).
  8: (state) => {
    const { lineup, ...s } = state as { lineup?: unknown; dishes?: { id: string }[] }
    const members = Array.isArray(lineup) ? lineup : null
    return {
      ...s,
      lineups: members ? Object.fromEntries((s.dishes ?? []).map((d) => [d.id, { companyId: null, members }])) : {},
    }
  },
}

function assertShape(state: unknown): asserts state is PersistedState {
  const s = state as Partial<PersistedState> | null
  if (
    typeof s !== 'object' ||
    s === null ||
    !Array.isArray(s.dishes) ||
    !Array.isArray(s.cookings) ||
    !Array.isArray(s.tares) ||
    !Array.isArray(s.companies) ||
    typeof s.lineups !== 'object' ||
    s.lineups === null ||
    Array.isArray(s.lineups) ||
    typeof s.holdMs !== 'number'
  ) {
    throw new Error('Stored state has an unexpected shape')
  }
}

/** Used as zustand persist `migrate`. Throws on unknown or future versions; the store then backs up the raw data. */
export function migrate(persisted: unknown, fromVersion: number): PersistedState {
  if (!Number.isInteger(fromVersion) || fromVersion < 1 || fromVersion > CURRENT_VERSION) {
    throw new Error(`Cannot migrate stored state from version ${fromVersion}`)
  }
  let state = persisted
  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    const step = migrations[v]
    if (!step) throw new Error(`Missing migration from version ${v}`)
    state = step(state)
  }
  assertShape(state)
  return state
}

/** Key of a copy of the stored data: before a migration from `version`, or of data that could not be read. */
export function backupKey(now: Date, version?: number): string {
  return `${STORAGE_KEY}:backup:${version !== undefined ? `v${version}:` : ''}${now.toISOString()}`
}
