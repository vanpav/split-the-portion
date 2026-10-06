import { describe, expect, it } from 'vitest'
import { dishErrors, dishKind } from '../dish'
import { PRESET_DISHES, presetDishes } from '../presets'
import type { Dish } from '../types'

const ids = () => {
  let n = 0
  return () => `id${++n}`
}
const AT = '2026-10-06T12:00:00.000Z'

describe('PRESET_DISHES', () => {
  const dishes = presetDishes([], ids(), AT)

  it('about 30 simple and 20 composite dishes', () => {
    const simple = dishes.filter((d) => d.kind === 'simple').length
    const composite = dishes.filter((d) => d.kind === 'composite').length
    expect(simple).toBeGreaterThanOrEqual(28)
    expect(simple).toBeLessThanOrEqual(35)
    expect(composite).toBeGreaterThanOrEqual(18)
    expect(composite).toBeLessThanOrEqual(25)
  })

  it('every dish can be saved: a counted product, positive weights, a unique name', () => {
    for (const d of dishes) expect(dishErrors(d), d.name).toEqual([])
    const names = PRESET_DISHES.map((p) => p.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('varies: some with «не учитывать», some without, some with an empty usual weight', () => {
    expect(dishes.some((d) => d.kind === 'simple' && d.ingredients.some((i) => i.excluded))).toBe(true)
    expect(dishes.some((d) => d.kind === 'simple' && d.ingredients.length === 1)).toBe(true)
    expect(dishes.some((d) => d.kind === 'composite' && d.ingredients.some((i) => i.excluded))).toBe(true)
    expect(dishes.some((d) => d.kind === 'composite' && d.ingredients.every((i) => !i.excluded))).toBe(true)
    expect(dishes.some((d) => d.ingredients.some((i) => i.rawGrams === null))).toBe(true)
  })

  it('simple dishes keep the counted product first (it is the base for «Составное на основе»)', () => {
    for (const d of dishes.filter((x) => x.kind === 'simple')) expect(d.ingredients[0].excluded).toBe(false)
  })
})

describe('presetDishes', () => {
  it('fresh ids for dishes and ingredients, the given time, no tare, kind by recipe', () => {
    const dishes = presetDishes([], ids(), AT)
    const all = dishes.flatMap((d) => [d.id, ...d.ingredients.map((i) => i.id)])
    expect(new Set(all).size).toBe(all.length)
    for (const d of dishes) {
      expect(d.createdAt).toBe(AT)
      expect(d.updatedAt).toBe(AT)
      expect(d.tareId).toBeNull()
      expect(d.kind).toBe(dishKind(d.ingredients))
    }
  })

  it('skips dishes the user already has, by title ignoring case', () => {
    const own: Pick<Dish, 'name' | 'ingredients'>[] = [
      { name: ' гречка ', ingredients: [] },
      // No name: titled by its product.
      { name: '', ingredients: [{ id: 'a', name: 'Борщ', rawGrams: 100, excluded: false }] },
    ]
    const names = presetDishes(own, ids(), AT).map((d) => d.name)
    expect(names).not.toContain('Гречка')
    expect(names).not.toContain('Борщ')
    expect(names).toHaveLength(PRESET_DISHES.length - 2)
  })

  it('adds nothing the second time', () => {
    const first = presetDishes([], ids(), AT)
    expect(presetDishes(first, ids(), AT)).toEqual([])
  })
})
