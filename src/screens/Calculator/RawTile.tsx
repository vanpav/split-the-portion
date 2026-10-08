import { ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { formatGrams } from '@/i18n/format'

interface RawTileProps {
  /** Raw weight of what counts, summed; null — nothing weighed yet. */
  total: number | null
  /** «5 ингредиентов,» and «не в счёт: Вода, Соль» (or «без веса: …»). */
  lines: string[]
  /** The raw view is chosen: the people are shown in raw grams of the sum. */
  selected: boolean
  onSelect: () => void
  /** «›»: the screen with every ingredient's weight. */
  onOpen: () => void
  /** Id of the «›» button: focus comes back to it from the screen. */
  knobId: string
}

/**
 * «Сырой» of a composite dish, next to «Готовый» in the same tile: the raw weight of what counts and what
 * is not counted under it. The body picks the raw view of the portions; the round knob in the corner opens
 * the ingredients. The two are siblings: a button inside a button is not allowed.
 */
export function RawTile({ total, lines, selected, onSelect, onOpen, knobId }: RawTileProps) {
  const shown = total !== null ? formatGrams(total) : null
  return (
    <div
      className={cn(
        'relative flex min-w-0 rounded-xl border transition-colors',
        selected ? 'border-border bg-card' : 'border-transparent bg-muted/60 hover:bg-card/60 dark:bg-muted/20 dark:hover:bg-card/60',
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="flex w-full min-w-0 flex-col items-start justify-start gap-0.5 rounded-xl px-4 py-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 max-[360px]:px-3"
      >
        <span className={cn('max-w-full truncate pr-9 text-sm leading-tight', selected ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {t('calculator.raw.title')}
        </span>
        <span className="flex items-baseline text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">
          {shown ?? <span className="text-muted-foreground/50">0</span>}
          <span className="ml-1 text-base font-normal text-muted-foreground">{t('common.gramsUnit')}</span>
        </span>
        <span className="text-xs leading-tight text-muted-foreground">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </button>
      {/* 36 px to look at, 44 to hit: the pseudo-element reaches out. */}
      <Button
        id={knobId}
        type="button"
        variant="secondary"
        size="icon"
        aria-label={t('calculator.ingredients')}
        onClick={onOpen}
        className="absolute top-1.5 right-1.5 size-9 rounded-full after:absolute after:-inset-1 after:content-['']"
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}
