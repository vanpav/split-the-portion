import { describe, expect, it } from 'vitest'
import { EN, ES, phraseLanguageOf, RU } from '../phraseLanguage'
import { parsePhrase } from '../phrase'
import { looksSpoken, spokenToPhrase } from '../speech'

describe('phraseLanguageOf', () => {
  it('gives the description of each UI language', () => {
    expect(phraseLanguageOf('en')).toBe(EN)
    expect(phraseLanguageOf('es')).toBe(ES)
    expect(phraseLanguageOf('ru')).toBe(RU)
  })

  it('tells the recognizer its locale', () => {
    expect([EN.speechLocale, ES.speechLocale, RU.speechLocale]).toEqual(['en-US', 'es-ES', 'ru-RU'])
  })
})

describe('spokenToPhrase in English', () => {
  it('reads name and weight, numbers from words, units', () => {
    expect(spokenToPhrase('chicken six hundred grams and water two liters and salt', EN)).toMatchObject({
      text: 'Chicken 600, water 2 l, salt',
      count: 3,
    })
  })

  it('takes the name after the quantity with «of», and keeps a multi-word name', () => {
    expect(spokenToPhrase('six hundred grams of chicken and two tablespoons of olive oil', EN).text).toBe(
      'Chicken 600, olive oil 2 spoons',
    )
  })

  it('reads «two and a half», «thirty-five», «one hundred twenty»', () => {
    expect(spokenToPhrase('two and a half kilos of beef', EN).text).toBe('Beef 2,5 kg')
    expect(spokenToPhrase('thirty-five grams of salt', EN).text).toBe('Salt 35')
    expect(spokenToPhrase('one hundred twenty grams of rice', EN).text).toBe('Rice 120')
  })

  it('drops fillers and skips talk', () => {
    const out = spokenToPhrase('so um I put in chicken six hundred and I think it is nice', EN)
    expect(out.text).toBe('Chicken 600')
    expect(out.skipped).toEqual(['think it nice'])
    expect(out.dropped).toEqual(['so', 'um', 'i', 'put', 'in', 'is'])
  })

  it('reads a half before a unit (not «half a kilo» yet)', () => {
    expect(spokenToPhrase('half kilo of beef', EN).text).toBe('Beef 0,5 kg')
  })
})

describe('spokenToPhrase in Spanish', () => {
  it('reads name and weight, numbers from words, «de» and «y»', () => {
    expect(spokenToPhrase('pollo seiscientos gramos y agua dos litros y sal', ES).text).toBe('Pollo 600, agua 2 l, sal')
  })

  it('keeps «de» inside a name and drops it before one', () => {
    expect(spokenToPhrase('seiscientos gramos de pollo y dos cucharadas de aceite de oliva', ES).text).toBe(
      'Pollo 600, aceite de oliva 2 cucharadas',
    )
  })

  it('reads «treinta y cinco», «dos mil», «medio kilo»', () => {
    expect(spokenToPhrase('treinta y cinco gramos de sal', ES).text).toBe('Sal 35')
    expect(spokenToPhrase('arroz dos mil gramos', ES).text).toBe('Arroz 2000')
    expect(spokenToPhrase('medio kilo de arroz', ES).text).toBe('Arroz 0,5 kg')
  })

  it('reads «dos y medio» as a number', () => {
    expect(spokenToPhrase('dos y medio kilos de carne', ES).text).toBe('Carne 2,5 kg')
  })

  it('takes «al gusto» as a product without weight', () => {
    expect(spokenToPhrase('sal al gusto', ES).text).toBe('Sal al gusto')
  })

  it('is recognized as dictated', () => {
    expect(looksSpoken('pollo seiscientos', ES)).toBe(true)
    expect(looksSpoken('Pollo 600, aceite de oliva 2 cucharadas', ES)).toBe(false)
  })
})

describe('parsePhrase in English and Spanish', () => {
  it('excludes the language’s own list of names', () => {
    expect(parsePhrase('Chicken 600, water 2 l, salt to taste', { language: EN }).map((i) => i.excluded)).toEqual([
      false,
      true,
      true,
    ])
    expect(parsePhrase('Pollo 600, agua 2 l, sal al gusto', { language: ES }).map((i) => i.excluded)).toEqual([
      false,
      true,
      true,
    ])
  })

  it('takes «to taste» and «al gusto» as no weight', () => {
    expect(parsePhrase('Salt to taste', { language: EN })[0]).toMatchObject({ name: 'Salt', toTaste: true, rawGrams: null })
    expect(parsePhrase('Sal al gusto', { language: ES })[0]).toMatchObject({ name: 'Sal', toTaste: true, rawGrams: null })
  })

  it('reads pieces and spoons in the language’s words', () => {
    expect(parsePhrase('Eggs 2 pcs', { language: EN })[0].amount).toEqual({ kind: 'pieces', count: 2 })
    expect(parsePhrase('Arroz 2 cucharadas', { language: ES })[0].amount).toEqual({ kind: 'spoons', count: 2 })
  })

  it('keeps Russian as it was', () => {
    expect(parsePhrase('Курица 600, вода 2 л')[0].rawGrams).toBe(600)
  })
})
