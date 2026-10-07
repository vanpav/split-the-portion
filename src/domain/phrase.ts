import type { PhraseLanguage } from './phraseLanguage'
import type { CookingKind, Id, Ingredient } from './types'

/*
 * The dish editor's «Что в блюде»: one line of text, «курица 600, картофель 400, вода 2 л, соль»
 * (docs/SPEC.md §7а). Contract for the editor (stage 18); the bodies are filled in with tests.
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

export function parsePhrase(text: string, options?: PhraseOptions): PhraseItem[] {
  void text
  void options
  throw new Error('parsePhrase: not implemented yet')
}

export function hasPhraseErrors(items: readonly PhraseItem[]): boolean {
  return items.some((item) => item.issues.some((issue) => issue.level === 'error'))
}

/** The phrase without product `index` (as `parsePhrase` numbers them), its comma or line break too. */
export function removePhraseItem(text: string, index: number, options?: PhraseOptions): string {
  void text
  void index
  void options
  throw new Error('removePhraseItem: not implemented yet')
}

/** `addition` at the end after «, », its first letter lower-cased; an empty text takes it as it is. */
export function appendToPhrase(text: string, addition: string): string {
  void text
  void addition
  throw new Error('appendToPhrase: not implemented yet')
}

/** A dish's ingredients as a phrase for editing: «Курица 600, картофель 400, соль». */
export function ingredientsToPhrase(ingredients: readonly Pick<Ingredient, 'name' | 'rawGrams'>[], options?: PhraseOptions): string {
  void ingredients
  void options
  throw new Error('ingredientsToPhrase: not implemented yet')
}

/** Overrides that keep a dish's own «не учитывать» marks where they differ from the language's list. */
export function excludedOverrides(
  ingredients: readonly Pick<Ingredient, 'name' | 'excluded'>[],
  options?: PhraseOptions,
): ExcludedOverrides {
  void ingredients
  void options
  throw new Error('excludedOverrides: not implemented yet')
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
  void items
  void existing
  throw new Error('phraseIngredients: not implemented yet')
}

/** The summary line «Составное · сырой 1 360 г · не учит. 2 016 г»; `null` — no named products yet. */
export function phraseSummary(items: readonly PhraseItem[]): { kind: CookingKind; countedGrams: number; excludedGrams: number } | null {
  void items
  throw new Error('phraseSummary: not implemented yet')
}

/** «1 продукт», «3 продукта», «5 продуктов» — for «Добавлено голосом: …». */
export function productCount(count: number): string {
  void count
  throw new Error('productCount: not implemented yet')
}
