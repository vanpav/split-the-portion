import { describe, expect, it } from 'vitest'
import {
  appendToPhrase,
  excludedOverrides,
  hasPhraseErrors,
  ingredientsToPhrase,
  parsePhrase,
  phraseIngredients,
  phraseSummary,
  removePhraseItem,
  type PhraseItem,
} from '../phrase'

const one = (text: string, excluded?: Record<string, boolean>): PhraseItem => {
  const items = parsePhrase(text, { excluded })
  expect(items).toHaveLength(1)
  return items[0]
}

describe('parsePhrase', () => {
  it('splits products by commas and gives their place in the text', () => {
    const text = 'Курица 600, картофель 400 ,  вода 2 л, соль'
    const items = parsePhrase(text)
    expect(items.map((i) => i.name)).toEqual(['Курица', 'Картофель', 'Вода', 'Соль'])
    expect(items.map((i) => text.slice(i.start, i.end))).toEqual(['Курица 600', 'картофель 400', 'вода 2 л', 'соль'])
    expect(items.map((i) => i.rawGrams)).toEqual([600, 400, 2000, null])
  })

  it('does not split a decimal comma', () => {
    expect(one('Фарш 0,5 кг')).toMatchObject({ name: 'Фарш', rawGrams: 500, issues: [] })
    expect(parsePhrase('фарш 0,5 кг,лук 100').map((i) => i.rawGrams)).toEqual([500, 100])
  })

  it('splits by line breaks and semicolons, skips blank products', () => {
    const items = parsePhrase('Рис — 300 г\nБедро куриное — 0,5 кг\n\nМорковь: 200; лук 150,, ')
    expect(items.map((i) => [i.name, i.rawGrams])).toEqual([
      ['Рис', 300],
      ['Бедро куриное', 500],
      ['Морковь', 200],
      ['Лук', 150],
    ])
  })

  it('reads the quantity first and puts the name in the nominative', () => {
    expect(one('200 г муки')).toMatchObject({ name: 'Мука', rawGrams: 200 })
    expect(one('200 г сливочного масла')).toMatchObject({ name: 'Сливочное масло', rawGrams: 200 })
    expect(one('0,5 кг фарша')).toMatchObject({ name: 'Фарш', rawGrams: 500 })
    expect(one('300 гречневой лапши')).toMatchObject({ name: 'Гречневая лапша', rawGrams: 300 })
    expect(one('100 г киноа')).toMatchObject({ name: 'Киноа', rawGrams: 100 })
  })

  it('reads numbers with spaces and dots', () => {
    expect(one('Курица 2 000').rawGrams).toBe(2000)
    expect(one('Курица 1240.5').rawGrams).toBe(1240.5)
    expect(one('Курица 600 гр.').rawGrams).toBe(600)
    expect(one('курица 1,2кг').rawGrams).toBe(1200)
    expect(one('Курица 600 граммов').rawGrams).toBe(600)
  })

  it('a name only has no weight', () => {
    expect(one('соль')).toMatchObject({ name: 'Соль', rawGrams: null, amount: null, toTaste: false, issues: [] })
    expect(one('Лавровый лист')).toMatchObject({ rawGrams: null, excluded: true })
  })

  it('«по вкусу» has no weight and is not counted', () => {
    expect(one('соль по вкусу')).toMatchObject({ name: 'Соль', rawGrams: null, toTaste: true, excluded: true, issues: [] })
    expect(one('Сахар по вкусу')).toMatchObject({ name: 'Сахар', toTaste: true, excluded: true })
    expect(one('Сахар по вкусу', { сахар: false }).excluded).toBe(false)
  })

  it('marks «не учитывать» by name, the override first', () => {
    expect(parsePhrase('Курица 600, вода 2 л, Соль 10, специи, перец 2').map((i) => i.excluded)).toEqual([false, true, true, true, true])
    expect(parsePhrase('Курица 600, вода 2 л', { excluded: { вода: false, курица: true } }).map((i) => i.excluded)).toEqual([true, false])
  })

  it('keeps an override across weight, case and order changes', () => {
    const excluded = { вода: false }
    expect(parsePhrase('Курица 600, вода 2 л', { excluded })[1].excluded).toBe(false)
    expect(parsePhrase('ВОДА 3 л, курица 700', { excluded })[0].excluded).toBe(false)
  })

  describe('issues', () => {
    it('noName: a number alone', () => {
      expect(one('200').issues).toEqual([{ level: 'error', code: 'noName' }])
      expect(one('200').rawGrams).toBe(200)
      expect(one('по вкусу').issues).toEqual([{ level: 'error', code: 'noName' }])
    })

    it('zeroWeight', () => {
      expect(one('Курица 0').issues).toEqual([{ level: 'error', code: 'zeroWeight' }])
      expect(one('Курица 0 кг').issues).toEqual([{ level: 'error', code: 'zeroWeight' }])
      expect(one('Яйца 0 шт').issues).toEqual([{ level: 'error', code: 'zeroWeight' }])
    })

    it('badWeight', () => {
      expect(one('Курица 1.240,5')).toMatchObject({ rawGrams: null, issues: [{ level: 'error', code: 'badWeight' }] })
      expect(one('Курица 6..0').issues).toEqual([{ level: 'error', code: 'badWeight' }])
    })

    it('volume: litres and millilitres as grams', () => {
      expect(one('Вода 2 л')).toMatchObject({ rawGrams: 2000, approx: true, issues: [{ level: 'warning', code: 'volume', amount: 2, unit: 'l' }] })
      expect(one('молоко 300 мл')).toMatchObject({ rawGrams: 300, approx: true, issues: [{ level: 'warning', code: 'volume', amount: 300, unit: 'ml' }] })
      expect(one('Вода 1,5 литра').rawGrams).toBe(1500)
      expect(one('Курица 600').approx).toBe(false)
    })

    it('pieces: a unit, or a small count first without a unit', () => {
      expect(one('Яйца 3 шт')).toMatchObject({ name: 'Яйца', rawGrams: null, amount: { kind: 'pieces', count: 3 }, issues: [{ level: 'warning', code: 'pieces', count: 3 }] })
      expect(one('3 яйца')).toMatchObject({ name: 'Яйца', rawGrams: null, amount: { kind: 'pieces', count: 3 } })
      expect(one('2 штуки лука')).toMatchObject({ name: 'Лук', amount: { kind: 'pieces', count: 2 } })
      expect(one('29 муки').amount).toEqual({ kind: 'pieces', count: 29 })
      expect(one('30 муки')).toMatchObject({ rawGrams: 30, amount: null })
    })

    it('spoons, checked before litres', () => {
      expect(one('Мука 2 ложки')).toMatchObject({ rawGrams: null, approx: false, amount: { kind: 'spoons', count: 2 }, issues: [{ level: 'warning', code: 'spoons', count: 2 }] })
      expect(one('2 ст. л. муки')).toMatchObject({ name: 'Мука', amount: { kind: 'spoons', count: 2 } })
      expect(one('Сахар 1 ч.л.').amount).toEqual({ kind: 'spoons', count: 1 })
      expect(one('Масло 3 ложек').amount).toEqual({ kind: 'spoons', count: 3 })
    })

    it('«л» is a unit only on its own', () => {
      expect(one('2 лука')).toMatchObject({ name: 'Лук', amount: { kind: 'pieces', count: 2 } })
    })

    it('tooHeavy above 5 kg', () => {
      expect(one('Гречка 8 кг').issues).toEqual([{ level: 'warning', code: 'tooHeavy', grams: 8000 }])
      expect(one('Гречка 5000').issues).toEqual([])
      expect(one('Вода 6 л').issues).toEqual([
        { level: 'warning', code: 'volume', amount: 6, unit: 'l' },
        { level: 'warning', code: 'tooHeavy', grams: 6000 },
      ])
    })

    it('tooLight only without a unit, for a counted product', () => {
      expect(one('Курица 3').issues).toEqual([{ level: 'warning', code: 'tooLight', grams: 3 }])
      expect(one('Курица 5').issues).toEqual([])
      expect(one('Курица 3 г').issues).toEqual([])
      expect(one('Соль 3').issues).toEqual([])
      expect(one('Курица 3', { курица: true }).issues).toEqual([])
    })

    it('duplicate on the second occurrence, any case', () => {
      const items = parsePhrase('Гречка 200, рис 100, гречка 300, ГРЕЧКА')
      expect(items[0].issues).toEqual([])
      expect(items[2].issues).toEqual([{ level: 'warning', code: 'duplicate', name: 'Гречка' }])
      expect(items[3].issues).toEqual([{ level: 'warning', code: 'duplicate', name: 'ГРЕЧКА' }])
    })
  })

  it('hasPhraseErrors: errors only', () => {
    expect(hasPhraseErrors(parsePhrase('Курица 600, гречка 8 кг, вода 2 л'))).toBe(false)
    expect(hasPhraseErrors(parsePhrase('Курица 600, 200'))).toBe(true)
  })
})

describe('removePhraseItem', () => {
  const text = 'Курица 600, картофель 400, соль'

  it('removes the first, middle and last product with its separator', () => {
    expect(removePhraseItem(text, 0)).toBe('Картофель 400, соль')
    expect(removePhraseItem(text, 1)).toBe('Курица 600, соль')
    expect(removePhraseItem(text, 2)).toBe('Курица 600, картофель 400')
  })

  it('removes the only product', () => {
    expect(removePhraseItem('Соль', 0)).toBe('')
  })

  it('keeps line breaks and a lower-case start', () => {
    const lines = 'Рис — 300 г\nЛук — 150 г\nСоль'
    expect(removePhraseItem(lines, 0)).toBe('Лук — 150 г\nСоль')
    expect(removePhraseItem(lines, 1)).toBe('Рис — 300 г\nСоль')
    expect(removePhraseItem(lines, 2)).toBe('Рис — 300 г\nЛук — 150 г')
    expect(removePhraseItem('курица 600, картофель 400', 0)).toBe('картофель 400')
  })

  it('numbers products like parsePhrase', () => {
    expect(removePhraseItem('Фарш 0,5 кг,, лук', 1)).toBe('Фарш 0,5 кг')
    expect(removePhraseItem(text, 3)).toBe(text)
  })
})

describe('appendToPhrase', () => {
  it('adds after a comma with a lower-case first letter', () => {
    expect(appendToPhrase('Курица 600', 'Вода 2 л')).toBe('Курица 600, вода 2 л')
    expect(appendToPhrase('Курица 600, \n', 'Соль')).toBe('Курица 600, соль')
  })

  it('an empty text takes the addition as it is', () => {
    expect(appendToPhrase('', 'Соль по вкусу')).toBe('Соль по вкусу')
    expect(appendToPhrase('  ', 'Соль')).toBe('Соль')
  })
})

describe('ingredientsToPhrase', () => {
  it('joins names and grams', () => {
    expect(
      ingredientsToPhrase([
        { name: 'Курица', rawGrams: 600 },
        { name: 'Картофель', rawGrams: 400 },
        { name: 'Вода', rawGrams: 2000 },
        { name: 'Соль', rawGrams: null },
      ]),
    ).toBe('Курица 600, картофель 400, вода 2000, соль')
  })

  it('capitalizes the first name, keeps fractions, skips nameless rows', () => {
    expect(
      ingredientsToPhrase([
        { name: '', rawGrams: 100 },
        { name: 'курица', rawGrams: 12.5 },
        { name: ' Соль ', rawGrams: 3 },
      ]),
    ).toBe('Курица 12,5, соль 3')
    expect(ingredientsToPhrase([])).toBe('')
  })

  it('parses back to the same ingredients', () => {
    const items = parsePhrase(ingredientsToPhrase([{ name: 'Курица', rawGrams: 1240.5 }, { name: 'Вода', rawGrams: 2000 }]))
    expect(items.map((i) => [i.name, i.rawGrams])).toEqual([
      ['Курица', 1240.5],
      ['Вода', 2000],
    ])
  })
})

describe('excludedOverrides', () => {
  it('keeps marks that differ from the language list', () => {
    expect(
      excludedOverrides([
        { name: 'Курица', excluded: true },
        { name: 'Вода', excluded: false },
        { name: 'Соль', excluded: true },
        { name: 'Рис', excluded: false },
        { name: '', excluded: true },
      ]),
    ).toEqual({ курица: true, вода: false })
  })

  it('the overrides bring back the dish marks', () => {
    const ingredients = [
      { name: 'Курица', rawGrams: 600, excluded: false },
      { name: 'Вода', rawGrams: 2000, excluded: false },
    ]
    const excluded = excludedOverrides(ingredients)
    expect(parsePhrase(ingredientsToPhrase(ingredients), { excluded }).map((i) => i.excluded)).toEqual([false, false])
  })
})

describe('phraseIngredients', () => {
  const existing = [
    { id: 'a', name: 'Курица' },
    { id: 'b', name: 'Вода' },
    { id: 'c', name: 'Курица' },
  ]

  it('keeps ids by name in any case, repeats in order, null for new', () => {
    const items = parsePhrase('курица 600, КУРИЦА 300, лук 100, Курица 50, вода 1 л, соль')
    expect(phraseIngredients(items, existing)).toEqual([
      { id: 'a', name: 'Курица', rawGrams: 600, excluded: false },
      { id: 'c', name: 'КУРИЦА', rawGrams: 300, excluded: false },
      { id: null, name: 'Лук', rawGrams: 100, excluded: false },
      { id: null, name: 'Курица', rawGrams: 50, excluded: false },
      { id: 'b', name: 'Вода', rawGrams: 1000, excluded: true },
      { id: null, name: 'Соль', rawGrams: null, excluded: true },
    ])
  })

  it('pieces and spoons are saved without weight', () => {
    expect(phraseIngredients(parsePhrase('3 яйца, мука 2 ложки'), []).map((i) => i.rawGrams)).toEqual([null, null])
  })
})

describe('phraseSummary', () => {
  it('composite: two counted products', () => {
    expect(phraseSummary(parsePhrase('Курица 600, картофель 400, вода 2 л, соль 16, перец'))).toEqual({
      kind: 'composite',
      countedGrams: 1000,
      excludedGrams: 2016,
    })
  })

  it('simple: one counted product, even with water', () => {
    expect(phraseSummary(parsePhrase('Гречка 200, вода 400'))).toEqual({ kind: 'simple', countedGrams: 200, excludedGrams: 400 })
    expect(phraseSummary(parsePhrase('Гречка'))).toEqual({ kind: 'simple', countedGrams: 0, excludedGrams: 0 })
  })

  it('follows the overrides, ignores nameless products', () => {
    expect(phraseSummary(parsePhrase('Гречка 200, вода 400, 100', { excluded: { вода: false } }))).toEqual({
      kind: 'composite',
      countedGrams: 600,
      excludedGrams: 0,
    })
  })

  it('null without named products', () => {
    expect(phraseSummary(parsePhrase(''))).toBeNull()
    expect(phraseSummary(parsePhrase('200'))).toBeNull()
  })
})
