import { describe, expect, it } from 'vitest'
import { hasPhraseErrors, parsePhrase } from '../phrase'
import { looksSpoken, spokenToPhrase } from '../speech'

describe('spokenToPhrase', () => {
  it.each([
    [
      'курица шестьсот грамм картошка четыреста морковь сто шестьдесят лук сто двадцать рис восемьдесят вода два литра и соль по вкусу',
      'Курица 600, картошка 400, морковь 160, лук 120, рис 80, вода 2 л, соль по вкусу',
    ],
    ['полкило фарша макароны триста и две луковицы', 'Фарш 0,5 кг, макароны 300, луковицы 2 шт'],
    ['рис сто восемьдесят вода четыреста миллилитров соль пять грамм', 'Рис 180, вода 400 мл, соль 5'],
    ['полтора килограмма молодой картошки и сливочное масло пятьдесят', 'Молодая картошка 1,5 кг, сливочное масло 50'],
    ['три яйца двести грамм муки сто грамм сахара', 'Яйца 3 шт, мука 200, сахар 100'],
    ['двести грамм сливочного масла триста грамм свежей капусты', 'Сливочное масло 200, свежая капуста 300'],
    ['три яйца и две столовые ложки муки', 'Яйца 3 шт, мука 2 ложки'],
    ['курица шестьсот морковь сто шестьдесят вода две тысячи', 'Курица 600, морковь 160, вода 2000'],
    ['полкило фарша и полтора килограмма картошки', 'Фарш 0,5 кг, картошка 1,5 кг'],
    ['вода два литра молоко триста миллилитров', 'Вода 2 л, молоко 300 мл'],
    ['гречка две тысячи двести', 'Гречка 2200'],
    ['курица шестьсот пятьдесят пять', 'Курица 655'],
    ['полтора литра воды', 'Вода 1,5 л'],
    ['рис два с половиной килограмма', 'Рис 2,5 кг'],
    ['пол литра молока', 'Молоко 0,5 л'],
    ['пол-литра молока', 'Молоко 0,5 л'],
    ['курица 2 000 грамм', 'Курица 2000'],
    ['курица 600г, вода 1,5 литра', 'Курица 600, вода 1,5 л'],
  ])('%s', (said, text) => {
    expect(spokenToPhrase(said).text).toBe(text)
  })

  it('drops filler words, each once, in order', () => {
    expect(spokenToPhrase('ну значит так гречка двести грамм')).toEqual({ text: 'Гречка 200', count: 1, dropped: ['ну', 'значит', 'так'] })
    expect(spokenToPhrase('ну вот ну рис сто').dropped).toEqual(['ну', 'вот'])
  })

  it('counts products', () => {
    expect(spokenToPhrase('курица шестьсот картошка четыреста вода и соль').count).toBe(4)
    expect(spokenToPhrase('').count).toBe(0)
  })

  it('keeps a number without a name, which the phrase then reports', () => {
    const out = spokenToPhrase('э курица шестьсот потом двести и вода')
    expect(out.text).toBe('Курица 600, 200, вода')
    expect(out.dropped).toEqual(['э'])
    const items = parsePhrase(out.text)
    expect(items[1].issues).toEqual([{ level: 'error', code: 'noName' }])
    expect(hasPhraseErrors(items)).toBe(true)
  })

  it('gives a phrase the parser checks like a typed one', () => {
    const out = spokenToPhrase('гречка восемь килограмм гречка двести')
    expect(out.text).toBe('Гречка 8 кг, гречка 200')
    const [first, second] = parsePhrase(out.text)
    expect(first.issues).toEqual([{ level: 'warning', code: 'tooHeavy', grams: 8000 }])
    expect(second.issues).toEqual([{ level: 'warning', code: 'duplicate', name: 'Гречка' }])
  })
})

describe('looksSpoken', () => {
  it('sees number words', () => {
    expect(looksSpoken('курица шестьсот')).toBe(true)
    expect(looksSpoken('Курица 600, полкило фарша')).toBe(true)
    expect(looksSpoken('вода две тысячи')).toBe(true)
  })

  it('sees more products than separators', () => {
    expect(looksSpoken('курица 600 картошка 400')).toBe(true)
  })

  it('leaves a typed phrase alone', () => {
    expect(looksSpoken('')).toBe(false)
    expect(looksSpoken('Курица 600, картофель 400, вода 2 л, соль')).toBe(false)
    expect(looksSpoken('Рис — 300 г\nБедро куриное — 0,5 кг\nСоль по вкусу')).toBe(false)
    expect(looksSpoken('200 г муки, 3 яйца')).toBe(false)
    expect(looksSpoken('Фарш 0,5 кг, луковицы 2 шт, мука 2 ложки')).toBe(false)
  })

  it('agrees with the normalized phrase', () => {
    const out = spokenToPhrase('курица шестьсот грамм картошка четыреста и соль по вкусу')
    expect(looksSpoken(out.text)).toBe(false)
  })
})
