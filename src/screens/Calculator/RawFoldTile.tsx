import { ChevronDownIcon } from 'lucide-react'
import { formatGrams } from '@/domain'

interface RawFoldTileProps {
  /** Raw weight of what counts, summed; null — nothing weighed yet. */
  total: number | null
  /** «не учит.: Вода 2 000 г, Соль 5 г»; empty — nothing to say. */
  note: string
  /** Shows every product of the dish, each a readout of its own. */
  onExpand: () => void
}

/**
 * A composite dish folded: its raw weight as one tile next to «Готовый», what is not counted
 * in a quiet line under it. At the stove only the cooked weight is new; a tap unfolds the products.
 */
export function RawFoldTile({ total, note, onExpand }: RawFoldTileProps) {
  const shown = total !== null ? formatGrams(total) : null
  return (
    <button
      type="button"
      aria-expanded={false}
      aria-label={`Сырой: ${shown !== null ? `${shown} г` : 'не введено'}${note ? `, ${note}` : ''}. Показать продукты`}
      onClick={onExpand}
      className="group/fold flex w-full min-w-0 flex-col items-start justify-start gap-0.5 rounded-xl border border-transparent bg-muted/60 px-4 py-2.5 dark:bg-muted/20 text-left outline-none transition-colors hover:bg-card/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 max-[360px]:px-3"
    >
      <span className="flex w-full items-center justify-between gap-1 text-sm leading-tight text-muted-foreground">
        Сырой
        <ChevronDownIcon aria-hidden className="size-4 transition-transform group-hover/fold:translate-y-0.5" />
      </span>
      <span className="flex items-baseline text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">
        {shown ?? <span className="text-muted-foreground/50">0</span>}
        <span className="ml-1 text-base font-normal text-muted-foreground">г</span>
      </span>
      {note && <span className="line-clamp-2 max-w-full text-xs leading-tight text-muted-foreground">{note}</span>}
    </button>
  )
}
