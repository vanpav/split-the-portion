/** Languages the UI is translated into; `en` is the default (docs/ARCHITECTURE.md §11). */
export const LANGUAGES = ['en', 'ru', 'es'] as const

export type Language = (typeof LANGUAGES)[number]

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}
