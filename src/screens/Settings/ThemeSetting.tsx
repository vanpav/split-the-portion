import { useTheme } from 'next-themes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ThemePreview } from './ThemePreview'
import { t } from '@/i18n'

const OPTIONS = ['system', 'light', 'dark'] as const

/**
 * Light or dark (docs/UX.md «Настройки»). next-themes keeps the choice in this browser: it is a
 * setting of the device, not app data, so it stays out of the store and the backup.
 */
export function ThemeSetting() {
  const { theme = 'system', setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      aria-label={t('settings.appearance.theme')}
      value={theme}
      onValueChange={(v) => v && setTheme(v)}
      spacing={2}
      className="grid w-full grid-cols-3 items-start md:max-w-md"
    >
      {OPTIONS.map((o) => (
        <ToggleGroupItem
          key={o}
          value={o}
          className="group h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-xl p-1 pb-2 whitespace-normal hover:bg-transparent aria-pressed:bg-transparent data-[state=on]:bg-transparent"
        >
          <span className="relative flex overflow-hidden rounded-lg border group-data-[state=on]:ring-2 group-data-[state=on]:ring-foreground group-data-[state=on]:ring-offset-2 group-data-[state=on]:ring-offset-background">
            {o === 'system' ? (
              <>
                {/* Both at once, cut on the diagonal: day and night, whichever the phone says. */}
                <ThemePreview theme="light" className="flex-1" />
                <ThemePreview theme="dark" className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
              </>
            ) : (
              <ThemePreview theme={o} className="flex-1" />
            )}
          </span>
          <span className="text-center text-sm leading-tight text-muted-foreground group-data-[state=on]:font-medium group-data-[state=on]:text-foreground">
            {t(`settings.appearance.${o}`)}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
