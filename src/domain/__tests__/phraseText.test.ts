import { describe, expect, it } from 'vitest'
import { phraseIssueText, phraseSummaryText, phraseWeightText } from '../phraseText'

const NBSP = '\u00a0'

const plain = { rawGrams: 600, approx: false, amount: null, toTaste: false }

describe('phraseIssueText', () => {
  it('names errors', () => {
    expect(phraseIssueText({ level: 'error', code: 'noName' })).toBe('нет названия')
    expect(phraseIssueText({ level: 'error', code: 'zeroWeight' })).toBe('вес 0')
    expect(phraseIssueText({ level: 'error', code: 'badWeight' })).toBe('не понял вес')
  })

  it('tells warnings with their amounts', () => {
    expect(phraseIssueText({ level: 'warning', code: 'volume', amount: 2, unit: 'l' })).toBe('из 2 л: считаем 1 мл ≈ 1 г')
    expect(phraseIssueText({ level: 'warning', code: 'volume', amount: 0.5, unit: 'l' })).toBe('из 0,5 л: считаем 1 мл ≈ 1 г')
    expect(phraseIssueText({ level: 'warning', code: 'volume', amount: 200, unit: 'ml' })).toBe('из 200 мл: считаем 1 мл ≈ 1 г')
    expect(phraseIssueText({ level: 'warning', code: 'pieces', count: 3 })).toBe('3 шт — нужен вес в граммах')
    expect(phraseIssueText({ level: 'warning', code: 'spoons', count: 2 })).toBe('ложки — нужен вес в граммах')
    expect(phraseIssueText({ level: 'warning', code: 'tooHeavy', grams: 8000 })).toBe('8 кг — точно?')
    expect(phraseIssueText({ level: 'warning', code: 'tooHeavy', grams: 5500 })).toBe('5,5 кг — точно?')
    expect(phraseIssueText({ level: 'warning', code: 'tooLight', grams: 2 })).toBe('2 г — может, это штуки?')
    expect(phraseIssueText({ level: 'warning', code: 'duplicate', name: 'Гречка' })).toBe('«Гречка» уже есть выше')
  })
})

describe('phraseWeightText', () => {
  it('shows grams, approximate grams and what has no weight', () => {
    expect(phraseWeightText(plain)).toBe('600 г')
    expect(phraseWeightText({ ...plain, rawGrams: 2000, approx: true })).toBe(`≈ 2${NBSP}000 г`)
    expect(phraseWeightText({ ...plain, rawGrams: null, amount: { kind: 'pieces', count: 2 } })).toBe('2 шт')
    expect(phraseWeightText({ ...plain, rawGrams: null, amount: { kind: 'spoons', count: 2 } })).toBe('ложки')
    expect(phraseWeightText({ ...plain, rawGrams: null, toTaste: true })).toBe('по вкусу')
    expect(phraseWeightText({ ...plain, rawGrams: null })).toBe('без веса')
  })
})

describe('phraseSummaryText', () => {
  it('says the kind and the weights', () => {
    expect(phraseSummaryText({ kind: 'simple', countedGrams: 200, excludedGrams: 0 })).toEqual({ kind: 'Простое', details: 'сухой 200 г' })
    expect(phraseSummaryText({ kind: 'composite', countedGrams: 1360, excludedGrams: 2016 })).toEqual({
      kind: 'Составное',
      details: `сырой 1${NBSP}360 г · не в счёт 2${NBSP}016 г`,
    })
  })
})
