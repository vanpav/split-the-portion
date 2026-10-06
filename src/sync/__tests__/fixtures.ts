import type { Company, Cooking, Dish, Tare } from '@/domain'
import { EMPTY_STATE, type PersistedState } from '@/store/migrations'

export const AT = '2026-10-06T12:00:00.000Z'

export const tare = (id: string, grams = 850, createdAt = AT): Tare => ({ id, name: id, grams, createdAt })
export const company = (id: string, createdAt = AT): Company => ({ id, name: id, members: [], createdAt })
export const dish = (id: string): Dish => ({
  id,
  kind: 'simple',
  name: id,
  createdAt: AT,
  updatedAt: AT,
  ingredients: [{ id: `${id}-i`, name: id, rawGrams: 130, excluded: false }],
  tareId: null,
})
export const cooking = (id: string, dishId: string, grams: number | null = null): Cooking => ({
  id,
  dishId,
  kind: 'simple',
  title: dishId,
  createdAt: AT,
  updatedAt: AT,
  ingredients: [{ id: `${dishId}-i`, name: dishId, rawGrams: 130, excluded: false }],
  weighings: [{ id: `${id}-w`, at: AT, kind: 'food', grams }],
  portions: [],
  equalSplitN: null,
  keepPercent: null,
  companyId: null,
})

export const state = (patch: Partial<PersistedState> = {}): PersistedState => ({ ...EMPTY_STATE, ...patch })
