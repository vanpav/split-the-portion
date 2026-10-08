import * as domain from '@/domain'
import { currentLanguage, currentLocale, t } from '.'

/*
 * The domain's formatters, in the UI language now. Components use these; the domain stays pure and
 * takes the locale as an argument. Changing the language remounts the app (`I18nRoot`), so nothing
 * keeps a stale text.
 */

export const formatGrams = (grams: number) => domain.formatGrams(grams, currentLocale())
export const formatK = (k: number) => domain.formatK(k, currentLocale())
export const formatPercent = (share: number) => domain.formatPercent(share, currentLocale())
export const formatTyped = (text: string) => domain.formatTyped(text, currentLocale())
export const formatInput = (value: number | null) => domain.formatInput(value, currentLocale())
export const decimalSeparator = () => domain.decimalSeparator(currentLocale())
export const shortDate = (at: Date | string) => domain.shortDate(at, currentLocale())
export const clockTime = (at: Date | string) => domain.clockTime(at, currentLocale())
export const lineupName = (lineup: domain.CompanyMember[]) => domain.lineupName(lineup, currentLocale())

/** A category's name in the UI language. */
export const categoryLabel = (category: domain.DishCategory) => domain.CATEGORY_LABELS[currentLanguage()][category]

/** The domain's title, or the placeholder for a dish with nothing to show. */
export const dishTitle = (recipe: domain.Recipe) => domain.dishTitle(recipe) || t('common.untitled')

/** An ingredient's name, or the placeholder for an unnamed one. */
export const ingredientDisplayName = (ingredient: domain.Ingredient) => domain.ingredientDisplayName(ingredient) || t('common.untitled')

/** A dish list row in the UI language; a dish with nothing to show gets the placeholder title. */
export function dishRow(recipe: domain.Categorized, query: string, options?: { pick?: boolean; underCategory?: boolean }): domain.DishRow {
  const row = domain.dishRow(recipe, query, currentLanguage(), options)
  return row.title ? row : { ...row, title: t('common.untitled') }
}

/** «200 г»: grams with their unit. */
export const gramsText = (grams: number) => t('common.grams', { value: formatGrams(grams) })

/** Lines for the tracker: «Гречка (сырой вес) — 89 г», one per line. */
export const copyText = (lines: readonly domain.CopyLine[]) =>
  lines.map((l) => t('calculator.copyLine', { name: l.name || t('common.untitled'), grams: formatGrams(l.grams) })).join('\n')

/** Keypad text while it is being typed: as typed, with the locale's separator in place of the comma. */
export const typedText = (text: string) => text.replace(',', decimalSeparator())
