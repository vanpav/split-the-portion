import { describe, expect, it } from 'vitest'
import { compareNames, dishMenu, matchRank, parseDishSort, parseKindFilter, presetKind, type DishMenuOptions } from '../menu'
import type { PresetDish } from '../presets'
import type { Dish } from '../types'

const TODAY = '2026-10-06'

const dish = (name: string, parts: Partial<Dish> = {}): Dish => ({
  id: name,
  kind: 'simple',
  name,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ingredients: [{ id: `${name}-i`, name, rawGrams: 100, excluded: false }],
  tareId: null,
  cooked: null,
  usedOn: [],
  ...parts,
})

const soup = (name: string, products: string[], parts: Partial<Dish> = {}): Dish =>
  dish(name, {
    kind: 'composite',
    ingredients: products.map((p, i) => ({ id: `${name}-${i}`, name: p, rawGrams: null, excluded: false })),
    ...parts,
  })

const preset = (name: string, products: string[] = [name]): PresetDish => ({
  name,
  ingredients: products.map((p) => ({ name: p, rawGrams: 100 })),
})

const options = (parts: Partial<DishMenuOptions> = {}): DishMenuOptions => ({ query: '', kind: 'all', sort: 'frequent', today: TODAY, ...parts })
const names = (items: { name: string }[]) => items.map((i) => i.name)

describe('compareNames', () => {
  it('is the Russian alphabet, case and «ё» / «е» alike', () => {
    const sorted = ['Ёжики', 'жаркое', 'Борщ', 'Ещё суп', 'Яичница', 'Евпатий', 'Ёлка'].sort(compareNames)
    expect(sorted).toEqual(['Борщ', 'Евпатий', 'Ёжики', 'Ёлка', 'Ещё суп', 'жаркое', 'Яичница'])
  })
})

describe('matchRank', () => {
  it('an empty query matches everything alike', () => {
    expect(matchRank('  ', 'Гречка', [])).toBe(matchRank('', 'Суп', ['Рис']))
  })

  it('the title before the products, the start of a word before the middle', () => {
    const ranks = [
      matchRank('рис', 'Рис', []),
      matchRank('рис', 'Рис бурый', []),
      matchRank('рис', 'Бурый рис', []),
      matchRank('рис', 'Ирис', []),
      matchRank('рис', 'Суп', ['Рис круглый']),
      matchRank('рис', 'Суп', ['Барис']),
    ]
    expect(ranks[0]).toBeGreaterThan(ranks[1])
    expect(ranks[1]).toBe(ranks[2])
    expect(ranks[2]).toBeGreaterThan(ranks[3])
    expect(ranks[3]).toBeGreaterThan(ranks[4])
    expect(ranks[4]).toBeGreaterThan(ranks[5])
    expect(ranks[5]).toBeGreaterThan(0)
  })

  it('as text, not fuzzy; case and «ё» do not matter', () => {
    expect(matchRank('бул', 'Борщ', ['Свёкла'])).toBe(0)
    expect(matchRank('СВЕК', 'Борщ', ['Свёкла'])).toBeGreaterThan(0)
    expect(matchRank('свёк', 'Свекольник', [])).toBeGreaterThan(0)
  })
})

describe('presetKind', () => {
  it('two counted products make it composite; water and salt do not count', () => {
    expect(presetKind({ name: 'Рис', ingredients: [{ name: 'Рис', rawGrams: 180 }, { name: 'Вода', rawGrams: 400, excluded: true }] })).toBe('simple')
    expect(presetKind(preset('Плов', ['Рис', 'Курица']))).toBe('composite')
  })
})

describe('parse from the address', () => {
  it('anything unknown is the default', () => {
    expect([parseKindFilter('simple'), parseKindFilter('composite'), parseKindFilter(null), parseKindFilter('x')]).toEqual(['simple', 'composite', 'all', 'all'])
    expect([parseDishSort('name'), parseDishSort('frequent'), parseDishSort(null), parseDishSort('x')]).toEqual(['name', 'frequent', 'frequent', 'frequent'])
  })
})

describe('dishMenu', () => {
  it('«Частые»: more distinct days in the last 60 days go higher', () => {
    const thrice = dish('Гречка', { usedOn: ['2026-09-01', '2026-09-20', '2026-10-05'] })
    const once = dish('Макароны', { usedOn: ['2026-10-06'] })
    const old = dish('Рис', { usedOn: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-10-01'] })
    expect(names(dishMenu([once, old, thrice], [], options()).own)).toEqual(['Гречка', 'Макароны', 'Рис'])
  })

  it('«Частые»: ties by the latest use, then by updatedAt, then by name', () => {
    const a = dish('Б', { usedOn: ['2026-10-01'] })
    const b = dish('А', { usedOn: ['2026-10-03'] })
    const c = dish('В', { usedOn: ['2026-10-03'], updatedAt: '2026-10-03T19:00:00.000Z' })
    const d = dish('Г')
    const e = dish('Ая')
    expect(names(dishMenu([a, b, c, d, e], [], options()).own)).toEqual(['В', 'А', 'Б', 'Ая', 'Г'])
  })

  it('«По названию»: the Russian alphabet, «Ёжики» among «Е»', () => {
    const list = [dish('Яйца'), dish('Ёжики'), dish('Гречка'), dish('Енчилада'), dish('Ешь')]
    expect(names(dishMenu(list, [], options({ sort: 'name' })).own)).toEqual(['Гречка', 'Ёжики', 'Енчилада', 'Ешь', 'Яйца'])
  })

  it('the kind filter works on the own dishes and the popular ones', () => {
    const own = [dish('Гречка'), soup('Суп', ['Курица', 'Картофель'])]
    const popular = [preset('Булгур'), preset('Плов', ['Рис', 'Курица'])]
    const composite = dishMenu(own, popular, options({ kind: 'composite' }))
    expect([names(composite.own), names(composite.popular)]).toEqual([['Суп'], ['Плов']])
    const simple = dishMenu(own, popular, options({ kind: 'simple' }))
    expect([names(simple.own), names(simple.popular)]).toEqual([['Гречка'], ['Булгур']])
  })

  it('while typing: only matches, better matches first, the sort among equals', () => {
    const own = [
      soup('Суп', ['Гречка', 'Курица'], { usedOn: ['2026-10-01', '2026-10-02', '2026-10-03'] }),
      dish('Гречка'),
      dish('Гренки', { usedOn: ['2026-10-05'] }),
      dish('Макароны'),
    ]
    expect(names(dishMenu(own, [], options({ query: 'гре' })).own)).toEqual(['Гренки', 'Гречка', 'Суп'])
    expect(names(dishMenu(own, [], options({ query: 'гре', sort: 'name' })).own)).toEqual(['Гренки', 'Гречка', 'Суп'])
    expect(names(dishMenu(own, [], options({ query: 'гречка' })).own)).toEqual(['Гречка', 'Суп'])
  })

  it('the popular dishes keep the catalogue order with «Частые», the alphabet with «По названию»', () => {
    const popular = [preset('Рис'), preset('Булгур'), preset('Рис бурый'), preset('Плов', ['Рис', 'Курица'])]
    expect(names(dishMenu([], popular, options()).popular)).toEqual(['Рис', 'Булгур', 'Рис бурый', 'Плов'])
    expect(names(dishMenu([], popular, options({ sort: 'name' })).popular)).toEqual(['Булгур', 'Плов', 'Рис', 'Рис бурый'])
    expect(names(dishMenu([], popular, options({ query: 'рис' })).popular)).toEqual(['Рис', 'Рис бурый', 'Плов'])
  })

  it('a dish without a name is found and sorted by its title', () => {
    const unnamed = dish('', { ingredients: [{ id: 'i', name: 'Овсянка', rawGrams: 80, excluded: false }] })
    expect(dishMenu([unnamed, dish('Гречка')], [], options({ sort: 'name' })).own.map((d) => d.ingredients[0].name)).toEqual(['Гречка', 'Овсянка'])
    expect(dishMenu([unnamed], [], options({ query: 'овс' })).own).toEqual([unnamed])
  })
})
