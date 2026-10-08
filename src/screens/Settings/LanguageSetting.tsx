import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LANGUAGES, isLanguage } from '@/domain'
import { LANGUAGE_NAMES, setLanguage, storedLanguage, t } from '@/i18n'

const SYSTEM = 'system'

/**
 * The UI language (docs/UX.md «Настройки»): as on the device, or one picked by hand. A setting of the
 * device, like the theme: kept in this browser, not in the store or the backup.
 */
export function LanguageSetting() {
  const id = useId()
  // Re-render on a change: the stored choice is read during render.
  useTranslation()
  const stored = storedLanguage()

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <label htmlFor={id} className="min-w-0 flex-1 font-medium">
        {t('settings.appearance.language')}
      </label>
      <Select value={stored ?? SYSTEM} onValueChange={(v) => setLanguage(isLanguage(v) ? v : null)}>
        <SelectTrigger id={id} className="w-auto min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SYSTEM}>{t('settings.appearance.system')}</SelectItem>
          <SelectSeparator />
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang} lang={lang}>
              {LANGUAGE_NAMES[lang]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
