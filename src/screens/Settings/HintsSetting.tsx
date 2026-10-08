import { useId } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { hintsAgain, setHintsOff, tourFrom } from '@/onboarding/hints'
import { usePrefsStore } from '@/store/prefs'
import { t } from '@/i18n'

/**
 * Hints for new people (docs/UX.md §3б), one switch: on — the calculator tour from the start, off — no
 * tour. A setting of the device, like the theme. A finished tour reads as off: nothing will be shown.
 */
export function HintsSetting() {
  const id = useId()
  const hints = usePrefsStore((s) => s.hints)
  const updateHints = usePrefsStore((s) => s.updateHints)
  const on = tourFrom(hints) !== null

  const change = (next: boolean) => {
    if (!next) return updateHints((h) => setHintsOff(h, true))
    updateHints(hintsAgain)
    toast(t('settings.hints.on'))
  }

  return (
    // The whole row is the switch's label: easy to hit with a busy hand.
    <label htmlFor={id} className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2.5">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{t('settings.hints.title')}</span>
        <span className="text-sm text-muted-foreground">
          {t(on ? 'settings.hints.onText' : 'settings.hints.offText')}
        </span>
      </span>
      <Switch id={id} checked={on} onCheckedChange={change} />
    </label>
  )
}
