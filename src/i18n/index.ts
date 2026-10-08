import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { isLanguage, LANGUAGES, type Language, type Locale } from '@/domain'
import { resources } from './resources'

/** Where the language picked in Settings is kept; absent — follow the device (docs/ARCHITECTURE.md §11). */
export const LANGUAGE_STORAGE_KEY = 'language'

/** Locale for numbers and dates of each UI language. */
const LOCALES: Record<Language, Locale> = { en: 'en-US', ru: 'ru-RU', es: 'es-ES' }

/** Each language by its own name: the same in every UI language, so anyone finds theirs. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', ru: 'Русский', es: 'Español' }

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
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

/** The language picked in Settings on this device; null — follow the device. */
export function storedLanguage(): Language | null {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return value && isLanguage(value) ? value : null
  } catch {
    return null
  }
}

/** Pick a language for this device, or (null) follow the device's own again. */
export function setLanguage(lang: Language | null): void {
  try {
    if (lang) localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    else localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  // Without an argument i18next asks the detector again: the device's language.
  void i18n.changeLanguage(lang ?? undefined)
}

const syncHtmlLang = () => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = currentLanguage()
  document.title = i18n.t('common.appName')
}
syncHtmlLang()
i18n.on('languageChanged', syncHtmlLang)

/**
 * The text of a key in the UI language now. Usable anywhere (components, toasts, hints): changing the
 * language remounts the app (`I18nRoot`), so a text read during render never goes stale.
 */
export const t = i18n.t.bind(i18n)

export { i18n }
