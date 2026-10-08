import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { isLanguage, LANGUAGES, type Language, type Locale } from '@/domain'
import { resources } from './resources'

/** Where the language picked in Settings is kept; absent — follow the device (docs/ARCHITECTURE.md §11). */
export const LANGUAGE_STORAGE_KEY = 'language'

/** Locale for numbers and dates of each UI language. */
const LOCALES: Record<Language, Locale> = { en: 'en-US', ru: 'ru-RU', es: 'es-ES' }

/**
 * Stage 1 of docs/roadmap/21-i18n.md: only Russian is written yet, so the app stays Russian whatever
 * the device says. Stage 2 drops this and lets the detector choose.
 */
const FORCED_LANGUAGE: Language | undefined = 'ru'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: FORCED_LANGUAGE,
    supportedLngs: LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [],
    },
  })

/** The UI language now: one of `LANGUAGES`. */
export function currentLanguage(): Language {
  const lang = i18n.resolvedLanguage ?? i18n.language
  return lang && isLanguage(lang) ? lang : 'en'
}

/** BCP 47 locale for numbers and dates in the UI language now. */
export function currentLocale(): Locale {
  return LOCALES[currentLanguage()]
}

const syncHtmlLang = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = currentLanguage()
}
syncHtmlLang()
i18n.on('languageChanged', syncHtmlLang)

/**
 * The text of a key in the UI language now. Usable anywhere (components, toasts, hints): changing the
 * language remounts the app (`I18nRoot`), so a text read during render never goes stale.
 */
export const t = i18n.t.bind(i18n)

export { i18n }
