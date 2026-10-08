import { capitalize, formatAmount, phraseSegments, toNominative, unitOf } from './phrase'
import { DEFAULT_PHRASE_LANGUAGE, type PhraseLanguage, type PhraseUnit } from './phraseLanguage'

/*
 * What was said (the mic button or the phone keyboard's dictation) → the phrase «курица 600, вода 2 л»
 * (docs/SPEC.md §7а «Сказанное → фраза»). Everything language-specific comes from the PhraseLanguage.
 */

export interface SpokenPhrase {
  /** The phrase, first letter capital: «Курица 600, картошка 400, вода 2 л, соль по вкусу». */
  text: string
  /** Products in it, for «Добавлено голосом: 4 продукта». */
  count: number
  /** Filler words thrown away («ну», «значит»), each once, in order. */
  dropped: string[]
  /** Said parts that are not products («я что-то говорю»), as said in lower case, in order. */
  skipped: string[]
}

/** Quantity first and without a unit: a count below this is pieces («две луковицы»). */
const PIECES_BELOW = 30
/** A said part without a quantity and longer than this is talk, not a product name. */
const MAX_NAME_WORDS = 3

/** Lower case words, a «,» token for punctuation, decimals kept («1,5»), «600г» split. */
function tokensOf(said: string, language: PhraseLanguage): string[] {
  const half = language.halfPrefix
  return said
    .toLocaleLowerCase(language.locale)
    .replace(/(\d)[.,](\d)/g, '$1\uE000$2')
    .replace(/[\n,;.!?]+/g, ' , ')
    .replace(/\uE000/g, ',')
    .replace(/[«»"“”()—–:]/g, ' ')
    .replace(/\s-\s/g, ' ')
    .replaceAll(`${half}-`, half)
    .replace(new RegExp(`(\\d)([${language.letters}])`, 'gu'), '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * A word after a quantity that ends the name: a noun, or any word that is not an adjective. Without
 * adjective endings nothing ends it: «two tablespoons of olive oil» stays one product.
 */
function closesName(word: string, language: PhraseLanguage): boolean {
  if (language.adjectiveEnding === null) return false
  return Object.hasOwn(language.nouns, word) || !language.adjectiveEnding.test(word)
}

/** The order of a number word, so «сто шестьдесят» adds up and «сто сто» does not. */
const magnitude = (x: number) => (x >= 100 ? 100 : x >= 20 ? 10 : 1)

/** «сто шестьдесят», «две тысячи двести», «полтора», «два с половиной», «1,5», «2 000» from token `i`. */
function readNumber(ts: readonly string[], i: number, language: PhraseLanguage): { value: number; next: number } | null {
  let j = i
  let total = 0
  let cur = 0
  let last = Infinity
  let seen = false
  while (j < ts.length) {
    const t = ts[j]
    if (/^\d+(?:,\d+)?$/.test(t)) {
      if (seen && cur !== 0) break
      cur = Number(t.replace(',', '.'))
      seen = true
      j++
      // «2 000»: a recognizer's thousands separator.
      if (cur <= 99 && Number.isInteger(cur) && /^\d{3}$/.test(ts[j] ?? '')) {
        cur = cur * 1000 + Number(ts[j])
        j++
      }
      last = 1
      continue
    }
    const n = Object.hasOwn(language.numberWords, t) ? language.numberWords[t] : undefined
    if (n !== undefined) {
      if (seen && cur !== 0 && !(n < magnitude(last))) break
      cur += n
      last = n
      seen = true
      j++
      continue
    }
    if (seen && Object.hasOwn(language.multipliers, t)) {
      total += (cur || 1) * language.multipliers[t]
      cur = 0
      last = Infinity
      j++
      continue
    }
    if (seen && language.andHalf.length > 0 && language.andHalf.every((w, k) => ts[j + k] === w)) {
      cur += 0.5
      j += language.andHalf.length
      continue
    }
    // «treinta y cinco»: the units after the tens word and the joiner.
    const units = ts[j + 1] !== undefined && Object.hasOwn(language.numberWords, ts[j + 1]) ? language.numberWords[ts[j + 1]] : undefined
    if (seen && t === language.tensJoiner && last === cur && cur >= 20 && cur <= 90 && cur % 10 === 0 && units !== undefined && units < 10) {
      cur += units
      last = units
      j += 2
      continue
    }
    break
  }
  return seen ? { value: total + cur, next: j } : null
}

interface SpokenItem {
  words: string[]
  n: number | null
  unit: PhraseUnit | null
  quantityFirst: boolean
  /** Quantity first: the noun after the number is there, the next word starts a new product. */
  closed: boolean
  toTaste: boolean
}

function phraseOf(item: SpokenItem, language: PhraseLanguage): string {
  const words = item.quantityFirst && item.words.length ? toNominative(item.words, language) : item.words
  const name = words.join(' ')
  if (item.n === null) return item.toTaste && name ? `${name} ${language.toTaste}` : name
  let unit = item.unit
  if (unit === null && item.quantityFirst && item.n < PIECES_BELOW) unit = 'pieces'
  const short = unit === null || unit === 'g' ? '' : language.unitShort[unit]
  return [name, formatAmount(item.n) + (short ? ` ${short}` : '')].filter(Boolean).join(' ')
}

/**
 * What was said → the phrase the field understands: numbers from words, units shortened, the order
 * «название вес», a comma between products. A number closes a product; after «600 грамм» the name
 * follows until its noun.
 */
export function spokenToPhrase(said: string, language: PhraseLanguage = DEFAULT_PHRASE_LANGUAGE): SpokenPhrase {
  const ts = tokensOf(said, language)
  const [tasteFirst, tasteSecond] = language.toTaste.split(' ')
  const items: SpokenItem[] = []
  const dropped: string[] = []
  const skipped: string[] = []
  const isStop = (w: string) => language.stopWords.includes(w)
  const fresh = (): SpokenItem => ({ words: [], n: null, unit: null, quantityFirst: false, closed: false, toTaste: false })
  let cur = fresh()
  const flush = () => {
    if (cur.n === null && !cur.toTaste && (cur.words.some(isStop) || cur.words.length > MAX_NAME_WORDS)) {
      skipped.push(cur.words.join(' '))
    } else {
      // A quantity keeps the product, nameless if nothing else is left: the phrase reports it.
      cur.words = cur.words.filter((w) => !isStop(w))
      if (cur.words.length || cur.n !== null) items.push(cur)
    }
    cur = fresh()
  }
  for (let i = 0; i < ts.length; i++) {
    const t = ts[i]
    if (t === ',' || language.separators.includes(t)) {
      flush()
      continue
    }
    if (t === tasteFirst && (tasteSecond === undefined || ts[i + 1] === tasteSecond)) {
      cur.toTaste = true
      if (tasteSecond !== undefined) i++
      flush()
      continue
    }
    let num: number | null = null
    let unit: PhraseUnit | null = null
    const halfUnit = Object.hasOwn(language.halfWords, t) ? language.halfWords[t] : undefined
    if (halfUnit !== undefined) {
      num = 0.5
      unit = halfUnit
    } else if (t === language.halfPrefix && ts[i + 1] !== undefined && unitOf(ts[i + 1], language) !== null) {
      num = 0.5
    } else {
      const read = readNumber(ts, i, language)
      if (read) {
        num = read.value
        i = read.next - 1
      }
    }
    if (num !== null) {
      if (unit === null) {
        const next = ts[i + 1]
        const afterNext = ts[i + 2]
        if (next !== undefined && language.spoonAdjectives.includes(next) && afterNext !== undefined && unitOf(afterNext, language) === 'spoons') {
          unit = 'spoons'
          i += 2
        } else if (next !== undefined && unitOf(next, language) !== null) {
          unit = unitOf(next, language)
          i++
        }
      }
      if (cur.words.length && cur.n === null) {
        cur.n = num
        cur.unit = unit
        flush()
      } else {
        flush()
        cur.n = num
        cur.unit = unit
        cur.quantityFirst = true
      }
      continue
    }
    if (unitOf(t, language) !== null || language.spoonAdjectives.includes(t) || language.fillers.includes(t)) {
      dropped.push(t)
      continue
    }
    const link = language.linkWords.includes(t)
    if (cur.quantityFirst && cur.closed && !link) flush()
    // «двести грамм я …»: talk right after the quantity does not take the product's place.
    if (cur.quantityFirst && isStop(t)) continue
    // «200 грамм муки», «200 grams of rice»: the link word before the name is not a part of it.
    if (link && cur.words.length === 0) continue
    cur.words.push(t)
    if (cur.quantityFirst) cur.closed = !link && closesName(t, language)
  }
  flush()
  return {
    text: capitalize(items.map((item) => phraseOf(item, language)).join(', '), language),
    count: items.length,
    dropped: [...new Set(dropped)],
    skipped,
  }
}

/** The field's text looks dictated (number words, more products than separators): normalize on blur. */
export function looksSpoken(text: string, language: PhraseLanguage = DEFAULT_PHRASE_LANGUAGE): boolean {
  if (!text.trim()) return false
  const numberWord = tokensOf(text, language).some(
    (t) => Object.hasOwn(language.numberWords, t) || Object.hasOwn(language.halfWords, t) || Object.hasOwn(language.multipliers, t),
  )
  return numberWord || spokenToPhrase(text, language).count > phraseSegments(text).length
}
