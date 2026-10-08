import { t } from '@/i18n'
import { formatK } from '@/i18n/format'
/**
 * The calculator's two readouts: the dry weight the dish remembers, the cooked one typed today —
 * it rises in, then the quiet line under the tiles. Same look as the calculator, smaller.
 */
export function WelcomeTiles() {
  return (
    <div aria-hidden className="flex w-full max-w-80 flex-col gap-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted px-4 py-3">
          <div className="text-[0.9375rem] text-muted-foreground">{t('welcome.demo.dry')}</div>
          <div className="text-[2rem] leading-tight font-medium tabular-nums">
            200 <span className="text-base text-muted-foreground">{t('common.gramsUnit')}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3">
          <div className="text-[0.9375rem] text-muted-foreground">{t('welcome.demo.cooked')}</div>
          <div className="text-[2rem] leading-tight font-medium tabular-nums">
            <span className="inline-block motion-safe:animate-rise motion-safe:[animation-delay:500ms]">560</span>{' '}
            <span className="text-base text-muted-foreground">{t('common.gramsUnit')}</span>
          </div>
        </div>
      </div>
      <div className="px-2 py-1.5 text-[0.9375rem] text-muted-foreground tabular-nums motion-safe:animate-rise motion-safe:[animation-delay:900ms]">
        {t('welcome.demo.noTare', { k: formatK(2.8) })}
      </div>
    </div>
  )
}
