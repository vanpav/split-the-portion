import type { Language } from '@/domain'
import en from './locales/en'
import es from './locales/es'
import ru from './locales/ru'

/**
 * All texts, bundled: the app works offline and in a store wrapper without fetching them. Russian is
 * the source the keys are typed from (`i18next.d.ts`); every language has the same keys (tested).
 */
export const resources = {
  en: { translation: en },
  ru: { translation: ru },
  es: { translation: es },
} satisfies Record<Language, { translation: unknown }>
