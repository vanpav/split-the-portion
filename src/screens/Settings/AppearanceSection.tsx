import { useTheme } from 'next-themes'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const OPTIONS = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

/**
 * Light or dark theme (docs/UX.md «Настройки»). next-themes keeps the choice in this browser:
 * it is a setting of the device, not app data, so it stays out of the store and the backup.
 */
export function AppearanceSection() {
  const { theme = 'system', setTheme } = useTheme()

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold">Тема</h2>
        <p className="text-sm text-muted-foreground">По умолчанию — как в настройках телефона или компьютера.</p>
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="Тема"
        value={theme}
        onValueChange={(v) => v && setTheme(v)}
        className="w-full"
      >
        {OPTIONS.map((o) => (
          <ToggleGroupItem key={o.value} value={o.value} className="min-h-11 flex-1">
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </section>
  )
}
