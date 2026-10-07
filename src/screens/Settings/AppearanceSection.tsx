import { RotateCcwIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { hintsAgain, setHintsOff } from '@/onboarding/hints'
import { usePrefsStore } from '@/store/prefs'

const OPTIONS = [
  { value: 'system', label: 'Как в системе' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

const HINTS = [
  { value: 'on', label: 'Показывать' },
  { value: 'off', label: 'Не показывать' },
]

/**
 * Light or dark theme (docs/UX.md «Настройки»). next-themes keeps the choice in this browser:
 * it is a setting of the device, not app data, so it stays out of the store and the backup.
 * Hints for new people (docs/UX.md §3б) are a setting of the device too: on, off, or all over again.
 */
export function AppearanceSection() {
  const { theme = 'system', setTheme } = useTheme()
  const hintsOff = usePrefsStore((s) => s.hints.off)
  const updateHints = usePrefsStore((s) => s.updateHints)

  return (
    <div className="flex flex-col gap-10">
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
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold">Подсказки</h2>
          <p className="text-sm text-muted-foreground">Короткие подсказки для новых: какой вес вводить, тара, кто ест.</p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-label="Подсказки"
          value={hintsOff ? 'off' : 'on'}
          onValueChange={(v) => v && updateHints((hints) => setHintsOff(hints, v === 'off'))}
          className="w-full"
        >
          {HINTS.map((o) => (
            <ToggleGroupItem key={o.value} value={o.value} className="min-h-11 flex-1">
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button
          variant="outline"
          onClick={() => {
            updateHints(hintsAgain)
            toast('Подсказки включены', { description: 'Тур начнётся на калькуляторе' })
          }}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Показать заново
        </Button>
      </section>
    </div>
  )
}
