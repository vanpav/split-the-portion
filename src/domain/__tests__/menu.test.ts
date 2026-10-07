import { describe, expect, it } from 'vitest'
import { compareNames, createDishText, dishMenu, dishPicks, matchRank, type DishMenuOptions } from '../menu'
import { missingPresets, type PresetDish } from '../presets'
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

const options = (parts: Partial<DishMenuOptions> = {}): DishMenuOptions => ({ query: '', today: TODAY, ...parts })
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

describe('dishMenu without a query', () => {
  it('«Часто готовите»: two or more distinct days in the last 60; more days higher', () => {
    const thrice = dish('Гречка', { usedOn: ['2026-09-01', '2026-09-20', '2026-10-05'] })
    const twice = dish('Макароны', { usedOn: ['2026-10-05', '2026-10-06'] })
    const once = dish('Пшено', { usedOn: ['2026-10-06'] })
    const old = dish('Рис', { usedOn: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-10-01'] })
    const menu = dishMenu([once, old, twice, thrice], [], options())
    expect(names(menu.often)).toEqual(['Гречка', 'Макароны'])
    expect(names(menu.rest)).toEqual(['Пшено', 'Рис'])
  })

  it('ties by the latest use, then updatedAt, then the name', () => {
    const a = dish('Б', { usedOn: ['2026-10-01', '2026-10-02'] })
    const b = dish('А', { usedOn: ['2026-10-01', '2026-10-03'] })
    const c = dish('В', { usedOn: ['2026-10-01', '2026-10-03'], updatedAt: '2026-10-03T19:00:00.000Z' })
    const d = dish('Ая', { usedOn: ['2026-10-01', '2026-10-02'] })
    expect(names(dishMenu([a, b, c, d], [], options()).often)).toEqual(['В', 'А', 'Ая', 'Б'])
  })

  it('at most five go to «Часто готовите»; the sixth waits in the alphabet with the rest', () => {
    const list = ['Ж', 'Е', 'Д', 'Г', 'В', 'Б'].map((n, i) =>
      dish(n, { usedOn: i === 5 ? ['2026-10-01', '2026-10-02'] : ['2026-10-01', '2026-10-02', '2026-10-03'] }),
    )
    const menu = dishMenu(list, [], options())
    expect(menu.often).toHaveLength(5)
    expect(names(menu.rest)).toEqual(['Б'])
  })

  it('the rest is alphabetical, «Ёжики» among «Е»', () => {
    const list = [dish('Яйца'), dish('Ёжики'), dish('Гречка'), dish('Енчилада'), dish('Ешь')]
    const menu = dishMenu(list, [], options())
    expect(names(menu.rest)).toEqual(['Гречка', 'Ёжики', 'Енчилада', 'Ешь', 'Яйца'])
    expect(menu.often).toEqual([])
  })

  it('the popular dishes keep the catalogue order', () => {
    const popular = [preset('Рис'), preset('Булгур'), preset('Рис бурый')]
    expect(names(dishMenu([], popular, options()).popular)).toEqual(['Рис', 'Булгур', 'Рис бурый'])
  })

  it('a dish without a name is sorted by its title', () => {
    const unnamed = dish('', { ingredients: [{ id: 'i', name: 'Овсянка', rawGrams: 80, excluded: false }] })
    expect(dishMenu([unnamed, dish('Гречка')], [], options()).rest.map((d) => d.ingredients[0].name)).toEqual(['Гречка', 'Овсянка'])
  })
})

describe('dishMenu with a query', () => {
  it('only matches, better first, the «Часто готовите» order among equals; nothing in «Часто готовите»', () => {
    const own = [
      soup('Суп', ['Гречка', 'Курица'], { usedOn: ['2026-10-01', '2026-10-02', '2026-10-03'] }),
      dish('Гречка'),
      dish('Гренки', { usedOn: ['2026-10-05'] }),
      dish('Макароны'),
    ]
    const menu = dishMenu(own, [], options({ query: 'гре' }))
    expect(menu.often).toEqual([])
    expect(names(menu.rest)).toEqual(['Гренки', 'Гречка', 'Суп'])
    expect(names(dishMenu(own, [], options({ query: 'гречка' })).rest)).toEqual(['Гречка', 'Суп'])
  })

  it('«ё» and «е» alike, case does not matter', () => {
    expect(names(dishMenu([dish('Свёкла')], [], options({ query: 'СВЕК' })).rest)).toEqual(['Свёкла'])
    expect(names(dishMenu([dish('Свекольник')], [], options({ query: 'свёк' })).rest)).toEqual(['Свекольник'])
  })

  it('an untitled composite dish is found by its products', () => {
    const unnamed = soup('', ['Курица', 'Рис'])
    expect(dishMenu([unnamed], [], options({ query: 'рис' })).rest).toEqual([unnamed])
    expect(dishMenu([unnamed], [], options({ query: 'гречка' })).rest).toEqual([])
  })

  it('a match by a product comes below a title match', () => {
    const own = [soup('Плов', ['Рис', 'Курица']), dish('Рис')]
    expect(names(dishMenu(own, [], options({ query: 'рис' })).rest)).toEqual(['Рис', 'Плов'])
  })

  it('the popular ones: better matches first, the catalogue order among equals', () => {
    const popular = [preset('Рис'), preset('Булгур'), preset('Рис бурый'), preset('Плов', ['Рис', 'Курица'])]
    expect(names(dishMenu([], popular, options({ query: 'рис' })).popular)).toEqual(['Рис', 'Рис бурый', 'Плов'])
  })
})

describe('dishPicks', () => {
  const own = [
    dish('Гречка', { usedOn: ['2026-10-01', '2026-10-02'] }),
    soup('Суп', ['Гречка', 'Курица']),
    dish('Рис'),
    dish('Куриная грудка', { ingredients: [{ id: 'k', name: 'Куриное филе', rawGrams: 500, excluded: false }] }),
  ]

  it('only simple dishes, own then popular, each with what is inserted', () => {
    const picks = dishPicks(own, [preset('Булгур'), preset('Плов', ['Рис', 'Курица'])], options())
    expect(picks.own.map((p) => p.dish.name)).toEqual(['Гречка', 'Куриная грудка', 'Рис'])
    expect(picks.own[1].source).toEqual({ name: 'Куриное филе', rawGrams: 500 })
    expect(picks.popular.map((p) => p.preset.name)).toEqual(['Булгур'])
    expect(picks.popular[0].source).toEqual({ name: 'Булгур', rawGrams: 100 })
  })

  it('a popular dish the user has already is not offered (missingPresets, ignoring case)', () => {
    const mine = [dish('гречка')]
    const picks = dishPicks(mine, missingPresets(mine), options())
    expect(picks.popular.map((p) => p.preset.name)).not.toContain('Гречка')
    expect(picks.popular.map((p) => p.preset.name)).toContain('Рис')
    expect(picks.popular.every((p) => p.source.name.length > 0)).toBe(true)
  })

  it('with a query: better matches first, a match by the product counts', () => {
    const picks = dishPicks(own, [preset('Куриные бёдра', ['Куриное бедро'])], options({ query: 'кури' }))
    expect(picks.own.map((p) => p.dish.name)).toEqual(['Куриная грудка'])
    expect(picks.popular.map((p) => p.preset.name)).toEqual(['Куриные бёдра'])
    expect(dishPicks(own, [], options({ query: 'суп' })).own).toEqual([])
  })
})

describe('createDishText', () => {
  it('trimmed, with a capital letter', () => {
    expect(createDishText([], '  хачапури ')).toBe('Хачапури')
  })

  it('nothing typed or an own dish of that name — null, case and «ё» aside', () => {
    expect(createDishText([], '   ')).toBeNull()
    expect(createDishText([dish('Свёкла')], 'свекла')).toBeNull()
    expect(createDishText([soup('', ['Курица', 'Рис'])], 'курица, рис')).toBeNull()
    expect(createDishText([dish('Гречка')], 'греч')).toBe('Греч')
  })
})
