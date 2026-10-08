import type { Language } from '@/domain'
import ru from './locales/ru'

/**
 * All texts, bundled: the app works offline and in a store wrapper without fetching them. Russian is
 * the source the keys are typed from (`i18next.d.ts`); a language without a text falls back to English.
 */
export const resources = {
  ru: { translation: ru },
} satisfies Partial<Record<Language, { translation: unknown }>>
