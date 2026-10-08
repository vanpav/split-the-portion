import { describe, expect, it } from 'vitest'
import { dishErrors, dishKind } from '../dish'
import { missingPresets, pickedDishes, PRESET_DISHES, presetDish, presetDishes, presetWeight, scalePreset } from '../presets'
import { shelfOrder } from '../dish'
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

describe('missingPresets', () => {
  it('the catalog without the titles the user has, ignoring case and spaces', () => {
    const own: Pick<Dish, 'name' | 'ingredients'>[] = [{ name: 'ГРЕЧКА ', ingredients: [] }]
    const names = missingPresets(own).map((p) => p.name)
    expect(names).not.toContain('Гречка')
    expect(names).toContain('Булгур')
    expect(missingPresets([])).toEqual(PRESET_DISHES)
  })
})

describe('presetDish', () => {
  it('one popular dish as the user\'s own: its weights, fresh ids, the given time, no tare', () => {
    const bulgur = PRESET_DISHES.find((p) => p.name === 'Булгур')!
    const dish = presetDish(bulgur, ids(), AT)
    expect(dish).toMatchObject({ name: 'Булгур', kind: 'simple', createdAt: AT, updatedAt: AT, tareId: null })
    expect(dish.ingredients.map((i) => [i.name, i.rawGrams, i.excluded])).toEqual([
      ['Булгур', 150, false],
      ['Вода', 300, true],
    ])
    expect(new Set([dish.id, ...dish.ingredients.map((i) => i.id)]).size).toBe(3)
  })
})

const preset = (name: string) => PRESET_DISHES.find((p) => p.name === name)!
const grams = (p: { ingredients: { name: string; rawGrams: number | null }[] }) => p.ingredients.map((i) => [i.name, i.rawGrams])

describe('presetWeight', () => {
  it('simple: the counted product; composite: the sum of the counted ones; none weighed: null', () => {
    expect(presetWeight(preset('Гречка'))).toBe(200)
    expect(presetWeight(preset('Рис'))).toBe(180)
    expect(presetWeight(preset('Борщ'))).toBe(600 + 400 + 400 + 400 + 150 + 150 + 40 + 30)
    expect(presetWeight(preset('Шампиньоны'))).toBeNull()
  })
})

describe('scalePreset', () => {
  it('simple: the counted product gets the typed weight as it is, the rest stays', () => {
    expect(grams(scalePreset(preset('Рис'), 250.5))).toEqual([['Рис', 250.5], ['Вода', 400], ['Соль', 5]])
  })

  it('composite: everything, «не учитывать» too, times new ÷ catalogue weight, whole grams', () => {
    const borsch = preset('Борщ')
    const base = presetWeight(borsch)!
    const scaled = scalePreset(borsch, base / 2)
    expect(grams(scaled)).toEqual(borsch.ingredients.map((i) => [i.name, Math.round(i.rawGrams! / 2)]))
    expect(scaled.ingredients.find((i) => i.name === 'Вода')?.rawGrams).toBe(1500)
    expect(scaled.ingredients.every((i, n) => i.excluded === borsch.ingredients[n].excluded)).toBe(true)
  })

  it('composite: the same weight changes nothing; an ingredient without a weight stays without', () => {
    const pasta = preset('Паста болоньезе')
    expect(scalePreset(pasta, presetWeight(pasta))).toEqual(pasta)
    expect(scalePreset(pasta, 2 * presetWeight(pasta)!).ingredients.find((i) => i.name === 'Пармезан')?.rawGrams).toBeNull()
  })

  it('composite: the counted whole grams add up to the typed weight, each within a gram of exact', () => {
    for (const name of ['Борщ', 'Плов с курицей', 'Котлеты домашние']) {
      const base = presetWeight(preset(name))!
      for (const typed of [1000, 777, 1234.6]) {
        const scaled = scalePreset(preset(name), typed)
        expect(presetWeight(scaled)).toBe(Math.round(typed))
        scaled.ingredients.forEach((i, n) => {
          const exact = preset(name).ingredients[n].rawGrams! * (typed / base)
          expect(Number.isInteger(i.rawGrams)).toBe(true)
          expect(Math.abs(i.rawGrams! - exact)).toBeLessThan(1)
        })
      }
    }
  })

  it('empty field: no weights, the recipe stays', () => {
    for (const name of ['Гречка', 'Борщ']) {
      const scaled = scalePreset(preset(name), null)
      expect(scaled.ingredients.every((i) => i.rawGrams === null)).toBe(true)
      expect(scaled.ingredients.map((i) => [i.name, i.excluded])).toEqual(preset(name).ingredients.map((i) => [i.name, i.excluded]))
    }
  })

  it('a simple dish with no usual weight takes the typed one', () => {
    expect(grams(scalePreset(preset('Шампиньоны'), 300))).toEqual([['Шампиньоны', 300]])
  })

  it('does not touch the catalogue', () => {
    const before = JSON.stringify(PRESET_DISHES)
    scalePreset(preset('Борщ'), 1000)
    expect(JSON.stringify(PRESET_DISHES)).toBe(before)
  })
})

describe('pickedDishes', () => {
  const picked = (...names: string[]) => names.map((n) => ({ preset: preset(n), grams: presetWeight(preset(n)) }))

  it('in the order ticked, with the weight typed', () => {
    const dishes = pickedDishes([], [{ preset: preset('Борщ'), grams: 1000 }, { preset: preset('Гречка'), grams: 150 }], ids(), AT)
    expect(dishes.map((d) => d.name)).toEqual(['Борщ', 'Гречка'])
    expect(dishes[1].ingredients[0].rawGrams).toBe(150)
    expect(Math.abs(dishes[0].ingredients.find((i) => i.name === 'Говядина')!.rawGrams! - (600 * 1000) / 2170)).toBeLessThan(1)
    expect(dishes[0].ingredients.filter((i) => !i.excluded).reduce((sum, i) => sum + i.rawGrams!, 0)).toBe(1000)
    expect(dishes.every((d) => d.createdAt === AT && d.tareId === null && d.cooked === null)).toBe(true)
  })

  it('the first ticked is first on the shelf', () => {
    const dishes = pickedDishes([], picked('Гречка', 'Рис', 'Борщ'), ids(), AT)
    expect(shelfOrder(dishes, []).map((d) => d.name)).toEqual(['Гречка', 'Рис', 'Борщ'])
    expect(dishes[0].updatedAt).toBe(AT)
  })

  it('skips titles the user has, ignoring case and «ё», and repeats', () => {
    const own: Pick<Dish, 'name' | 'ingredients'>[] = [{ name: 'гречка', ingredients: [] }, { name: 'свёкла запечённая', ingredients: [] }]
    const names = pickedDishes(own, picked('Гречка', 'Свёкла запечённая', 'Рис', 'Рис'), ids(), AT).map((d) => d.name)
    expect(names).toEqual(['Рис'])
  })

  it('fresh ids', () => {
    const all = pickedDishes([], picked('Борщ', 'Гречка'), ids(), AT).flatMap((d) => [d.id, ...d.ingredients.map((i) => i.id)])
    expect(new Set(all).size).toBe(all.length)
  })
})
