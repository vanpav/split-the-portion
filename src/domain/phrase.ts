import { formatInput, parseGrams } from './numbers'
import { DEFAULT_PHRASE_LANGUAGE, type PhraseLanguage, type PhraseUnit } from './phraseLanguage'
import type { CookingKind, Id, Ingredient } from './types'

/*
 * The dish editor's «Что в блюде»: one line of text, «курица 600, картофель 400, вода 2 л, соль»
 * (docs/SPEC.md §7а). Everything language-specific comes from the PhraseLanguage description.
 */

/** What to tell about one product: an error blocks «Создать», a warning is only shown. */
export type PhraseIssue =
  | { level: 'error'; code: 'noName' }
  | { level: 'error'; code: 'zeroWeight' }
  | { level: 'error'; code: 'badWeight' }
  | { level: 'warning'; code: 'volume'; amount: number; unit: 'l' | 'ml' }
  | { level: 'warning'; code: 'pieces'; count: number }
  | { level: 'warning'; code: 'spoons'; count: number }
  | { level: 'warning'; code: 'tooHeavy'; grams: number }
  | { level: 'warning'; code: 'tooLight'; grams: number }
  | { level: 'warning'; code: 'duplicate'; name: string }

/** One product of the phrase, as the parse list shows it. */
export interface PhraseItem {
  /** `[start, end)` of the product's text in the phrase, separators excluded: the caret's row, «×». */
  start: number
  end: number
  /** First letter capital; `''` when there is none (an error). */
  name: string
  /** Grams for the dish; `null` — no weight (only a name, pieces, spoons, «по вкусу»). */
  rawGrams: number | null
  /** Litres or millilitres taken as grams, 1 ml ≈ 1 g: shown «≈ 2 000 г». */
  approx: boolean
  /** Said in pieces or spoons, shown instead of grams: «2 шт», «ложки». */
  amount: { kind: 'pieces' | 'spoons'; count: number } | null
  /** «по вкусу»: no weight on purpose. */
  toTaste: boolean
  /** «Не учитывать»: the override for this name, else the language's list (вода, соль, специи…). */
  excluded: boolean
  issues: PhraseIssue[]
}

/** «Не учитывать» set by hand, by `phraseKey(name)`; a name not here follows the language's list. */
export type ExcludedOverrides = Readonly<Record<string, boolean>>

export interface PhraseOptions {
  excluded?: ExcludedOverrides
  language?: PhraseLanguage
}

/** The key of a product name in `ExcludedOverrides` and for matching ingredients: case-insensitive. */
export function phraseKey(name: string): string {
  return name.trim().toLocaleLowerCase('ru')
}

/** Quantity first and without a unit: a count below this is pieces («2 яйца»), else grams («200 муки»). */
const PIECES_BELOW = 30
const TOO_HEAVY_GRAMS = 5000
const TOO_LIGHT_GRAMS = 5

// --- Shared with speech.ts (not part of the public API) ---

/** Products of the phrase: split by a comma not before a digit, «;» or a line break; blank ones skipped. */
export function phraseSegments(text: string): { start: number; end: number; raw: string }[] {
  const out: { start: number; end: number; raw: string }[] = []
  const re = /,(?!\d)|;|\n/g
  let last = 0
  const push = (a: number, b: number) => {
    if (text.slice(a, b).trim()) out.push({ start: a, end: b, raw: text.slice(a, b) })
  }
  for (let m = re.exec(text); m; m = re.exec(text)) {
    push(last, m.index)
    last = m.index + m[0].length
  }
  push(last, text.length)
  return out
}

export function capitalize(text: string, language: PhraseLanguage): string {
  return text ? text.charAt(0).toLocaleUpperCase(language.locale) + text.slice(1) : text
}

export function lowerFirst(text: string, language: PhraseLanguage): string {
  return text ? text.charAt(0).toLocaleLowerCase(language.locale) + text.slice(1) : text
}

/** A unit as typed or said («кг», «килограмма», «ст. л.») → its kind; `null` — not a unit. */
export function unitOf(text: string, language: PhraseLanguage): PhraseUnit | null {
  const t = text.toLocaleLowerCase(language.locale).replace(/\.$/, '')
  for (const { unit, pattern } of language.units) if (new RegExp(`^(?:${pattern})$`, 'u').test(t)) return unit
  return null
}

/** «200 г сливочного масла» → «сливочное масло»: the noun and the adjectives before it, by the dictionary. */
export function toNominative(words: readonly string[], language: PhraseLanguage): string[] {
  const last = words[words.length - 1]
  const key = last?.toLocaleLowerCase(language.locale)
  const hit = key !== undefined && Object.hasOwn(language.nouns, key) ? language.nouns[key] : undefined
  if (!hit) return [...words]
  return [
    ...words.slice(0, -1).map((w) => language.adjectiveToNominative(w.toLocaleLowerCase(language.locale), hit.gender)),
    hit.nominative,
  ]
}

/** A count in the phrase: «2», «0,5», «1,25». */
export function formatAmount(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',')
}

// --- Parsing ---

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

interface Patterns {
  qtyOnly: RegExp
  nameFirst: RegExp
  qtyFirst: RegExp
  toTaste: RegExp
  excluded: Set<string>
}

const patternCache = new WeakMap<PhraseLanguage, Patterns>()

function patternsOf(language: PhraseLanguage): Patterns {
  const cached = patternCache.get(language)
  if (cached) return cached
  const unit = language.units.map((u) => u.pattern).join('|')
  // Loose on purpose: «1.240,5» is caught here and reported as «не понял вес» by parseGrams.
  const num = '(\\d[\\d\\s.,]*)'
  const qty = `${num}\\s*(?:(${unit})\\.?)?`
  const patterns: Patterns = {
    qtyOnly: new RegExp(`^${qty}$`, 'iu'),
    nameFirst: new RegExp(`^(.*?[${language.letters}].*?)[\\s:—–-]*${qty}$`, 'iu'),
    qtyFirst: new RegExp(`^${qty}\\s+(.+)$`, 'iu'),
    toTaste: new RegExp(`(?:^|\\s+)${language.toTaste.split(' ').map(escapeRe).join('\\s+')}$`, 'iu'),
    excluded: new Set(language.excludedNames),
  }
  patternCache.set(language, patterns)
  return patterns
}

function isExcluded(name: string, toTaste: boolean, options: PhraseOptions | undefined, language: PhraseLanguage): boolean {
  const key = phraseKey(name)
  const override = options?.excluded?.[key]
  if (override !== undefined) return override
  return toTaste || patternsOf(language).excluded.has(key)
}

function parseSegment(raw: string, options: PhraseOptions | undefined, language: PhraseLanguage): Omit<PhraseItem, 'start' | 'end'> {
  const p = patternsOf(language)
  let seg = raw.trim().replace(/\s+/g, ' ')
  const toTaste = p.toTaste.test(seg)
  if (toTaste) seg = seg.replace(p.toTaste, '')

  let name = seg
  let number: string | null = null
  let unitText: string | null = null
  let quantityFirst = false
  let m: RegExpMatchArray | null
  if ((m = seg.match(p.qtyOnly))) {
    name = ''
    number = m[1]
    unitText = m[2] ?? null
    quantityFirst = true
  } else if ((m = seg.match(p.nameFirst))) {
    name = m[1]
    number = m[2]
    unitText = m[3] ?? null
  } else if ((m = seg.match(p.qtyFirst))) {
    number = m[1]
    unitText = m[2] ?? null
    name = toNominative(m[3].split(' '), language).join(' ')
    quantityFirst = true
  }
  name = capitalize(name.replace(/[\s:—–-]+$/, '').trim(), language)

  const excluded = isExcluded(name, toTaste, options, language)
  const item: Omit<PhraseItem, 'start' | 'end'> = { name, rawGrams: null, approx: false, amount: null, toTaste, excluded, issues: [] }
  if (!name) item.issues.push({ level: 'error', code: 'noName' })
  if (number === null) return item

  const parsed = parseGrams(number)
  if (!parsed.ok || parsed.value === null) {
    item.issues.push({ level: 'error', code: 'badWeight' })
    return item
  }
  const n = parsed.value
  const unit = unitText === null ? null : unitOf(unitText, language)
  if (n === 0) item.issues.push({ level: 'error', code: 'zeroWeight' })

  if (unit === 'pieces' || (unit === null && quantityFirst && n < PIECES_BELOW)) {
    item.amount = { kind: 'pieces', count: n }
    if (n > 0) item.issues.push({ level: 'warning', code: 'pieces', count: n })
    return item
  }
  if (unit === 'spoons') {
    item.amount = { kind: 'spoons', count: n }
    if (n > 0) item.issues.push({ level: 'warning', code: 'spoons', count: n })
    return item
  }
  if (unit === 'l' || unit === 'ml') {
    item.rawGrams = unit === 'l' ? n * 1000 : n
    item.approx = true
    if (n > 0) item.issues.push({ level: 'warning', code: 'volume', amount: n, unit })
  } else {
    item.rawGrams = unit === 'kg' ? n * 1000 : n
  }
  const grams = item.rawGrams
  if (grams > TOO_HEAVY_GRAMS) item.issues.push({ level: 'warning', code: 'tooHeavy', grams })
  else if (grams > 0 && grams < TOO_LIGHT_GRAMS && unit === null && name && !excluded) {
    item.issues.push({ level: 'warning', code: 'tooLight', grams })
  }
  return item
}

export function parsePhrase(text: string, options?: PhraseOptions): PhraseItem[] {
  const language = options?.language ?? DEFAULT_PHRASE_LANGUAGE
  const seen = new Set<string>()
  return phraseSegments(text).map((s) => {
    const lead = s.raw.length - s.raw.trimStart().length
    const trail = s.raw.length - s.raw.trimEnd().length
    const item: PhraseItem = { start: s.start + lead, end: s.end - trail, ...parseSegment(s.raw, options, language) }
    const key = phraseKey(item.name)
    if (key) {
      if (seen.has(key)) item.issues.push({ level: 'warning', code: 'duplicate', name: item.name })
      seen.add(key)
    }
    return item
  })
}

export function hasPhraseErrors(items: readonly PhraseItem[]): boolean {
  return items.some((item) => item.issues.some((issue) => issue.level === 'error'))
}

/** The phrase without product `index` (as `parsePhrase` numbers them), its comma or line break too. */
export function removePhraseItem(text: string, index: number, options?: PhraseOptions): string {
  const language = options?.language ?? DEFAULT_PHRASE_LANGUAGE
  const segs = phraseSegments(text)
  const seg = segs[index]
  if (!seg) return text
  const next = segs[index + 1]
  const prev = segs[index - 1]
  if (next) {
    const rest = (text.slice(0, seg.start) + text.slice(next.start)).replace(/^[\s,;]+/, '')
    const first = text.trim().charAt(0)
    const wasCapital = index === 0 && first !== first.toLocaleLowerCase(language.locale)
    return wasCapital ? capitalize(rest, language) : rest
  }
  if (prev) return text.slice(0, prev.end) + text.slice(seg.end)
  return ''
}

/** `addition` at the end after «, », its first letter lower-cased; an empty text takes it as it is. */
export function appendToPhrase(text: string, addition: string): string {
  if (!text.trim()) return addition
  return `${text.replace(/[\s,;]+$/, '')}, ${lowerFirst(addition, DEFAULT_PHRASE_LANGUAGE)}`
}

/** A dish's ingredients as a phrase for editing: «Курица 600, картофель 400, соль». */
export function ingredientsToPhrase(ingredients: readonly Pick<Ingredient, 'name' | 'rawGrams'>[], options?: PhraseOptions): string {
  const language = options?.language ?? DEFAULT_PHRASE_LANGUAGE
  return ingredients
    .filter((i) => i.name.trim())
    .map((i, n) => {
      const name = n === 0 ? capitalize(i.name.trim(), language) : lowerFirst(i.name.trim(), language)
      return i.rawGrams === null ? name : `${name} ${formatInput(i.rawGrams)}`
    })
    .join(', ')
}

/** Overrides that keep a dish's own «не учитывать» marks where they differ from the language's list. */
export function excludedOverrides(
  ingredients: readonly Pick<Ingredient, 'name' | 'excluded'>[],
  options?: PhraseOptions,
): ExcludedOverrides {
  const language = options?.language ?? DEFAULT_PHRASE_LANGUAGE
  const out: Record<string, boolean> = {}
  for (const i of ingredients) {
    const key = phraseKey(i.name)
    if (!key || key in out) continue
    if (i.excluded !== patternsOf(language).excluded.has(key)) out[key] = i.excluded
  }
  return out
}

/**
 * Ingredients to save, in the phrase's order. A product named like an ingredient of the dish keeps its
 * id (portions «в сыром: курица» point to it), repeated names in order; `id: null` — a new one, the
 * caller gives it `newId()`. Not for items with errors.
 */
export function phraseIngredients(
  items: readonly PhraseItem[],
  existing: readonly Pick<Ingredient, 'id' | 'name'>[],
): (Omit<Ingredient, 'id'> & { id: Id | null })[] {
  const ids = new Map<string, Id[]>()
  for (const e of existing) {
    const key = phraseKey(e.name)
    ids.set(key, [...(ids.get(key) ?? []), e.id])
  }
  return items.map((item) => ({
    id: ids.get(phraseKey(item.name))?.shift() ?? null,
    name: item.name,
    rawGrams: item.rawGrams,
    excluded: item.excluded,
  }))
}

/** The summary line «Составное · сырой 1 360 г · не учит. 2 016 г»; `null` — no named products yet. */
export function phraseSummary(items: readonly PhraseItem[]): { kind: CookingKind; countedGrams: number; excludedGrams: number } | null {
  const named = items.filter((i) => i.name.trim())
  if (named.length === 0) return null
  const counted = named.filter((i) => !i.excluded)
  const sum = (list: PhraseItem[]) => list.reduce((total, i) => total + (i.rawGrams ?? 0), 0)
  return {
    // Same rule as dishKind: two or more counted products make the dish composite.
    kind: counted.length > 1 ? 'composite' : 'simple',
    countedGrams: sum(counted),
    excludedGrams: sum(named.filter((i) => i.excluded)),
  }
}

/** «1 продукт», «3 продукта», «5 продуктов» — for «Добавлено голосом: …». */
export function productCount(count: number): string {
  const language = DEFAULT_PHRASE_LANGUAGE
  const rule = new Intl.PluralRules(language.locale).select(count)
  return `${count} ${language.productWords[rule] ?? language.productWords.other}`
}
