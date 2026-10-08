import { HintsSetting } from './HintsSetting'
import { ThemeSetting } from './ThemeSetting'
import { t } from '@/i18n'
import { LanguageSetting } from './LanguageSetting'

/**
 * «Оформление»: the theme, the language and the hints, all settings of this device (docs/UX.md «Настройки»).
 * On a phone the hub shows the same controls in place.
 */
export function AppearanceSection() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold">{t('settings.appearance.theme')}</h2>
          <p className="text-sm text-muted-foreground">{t('settings.appearance.lead')}</p>
        </div>
        <ThemeSetting />
      </section>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        <LanguageSetting />
        <HintsSetting />
      </div>
    </div>
  )
}
