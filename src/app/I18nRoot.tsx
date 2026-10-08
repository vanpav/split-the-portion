import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Remounts the app when the UI language changes, so every text and number read during render is in
 * the new language (docs/ARCHITECTURE.md §11). The router keeps its place: it lives outside React.
 */
export function I18nRoot({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  return <Fragment key={i18n.resolvedLanguage}>{children}</Fragment>
}
