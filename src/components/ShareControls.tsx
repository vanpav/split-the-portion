import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { equalSplit, nudgePercent } from '@/domain'
import { cn } from '@/lib/utils'
import { lidFill } from './lids'

interface ShareControlsProps {
  /** Names of the people who split by share, in order. */
  names: string[]
  /** Their split in whole percents, summing to 100: what ± moves, never shown. */
  percents: number[]
  /** They split equally already (exact weights, not the rounded percents): «Поровну» is off. */
  equal: boolean
  /** Who ± adjusts. */
  selectedIndex: number
  onChange: (percents: number[]) => void
  /** The chosen one's lid between the buttons: a plain square for a person, with the number in «Доли». */
  mark: { place: number; numbered: boolean }
}

/**
 * Under a share bar, one line: − and + for the chosen person on the left with their lid between them (no name,
 * no grams: those are in the row); «Поровну» on the right. No percent (docs/SPEC.md §3б): each press moves 1 % of the dish, unseen.
 * Nothing to show for one person.
 */
export function ShareControls({ names, percents, equal, selectedIndex, onChange, mark }: ShareControlsProps) {
  if (names.length < 2) return null
  const name = names[selectedIndex] ?? ''

  return (
    <div className="flex min-h-11 items-center gap-2 max-[360px]:gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label={`${name}: меньше`}
        className="max-[360px]:w-9"
        disabled={percents[selectedIndex] <= 1}
        onClick={() => onChange(nudgePercent(percents, selectedIndex, -1))}
      >
        <MinusIcon />
      </Button>
      {/* Who is adjusted: their lid, the same mark as on the bar and in the row. */}
      <span aria-hidden className="flex size-11 items-center justify-center max-[360px]:w-8">
        <span
          className={cn(
            'flex items-center justify-center text-chart-foreground tabular-nums',
            lidFill(mark.place),
            mark.numbered ? 'size-7 rounded-[8px] text-sm font-semibold' : 'size-5.5 rounded-[7px]',
          )}
        >
          {mark.numbered && mark.place + 1}
        </span>
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label={`${name}: больше`}
        className="max-[360px]:w-9"
        onClick={() => onChange(nudgePercent(percents, selectedIndex, 1))}
      >
        <PlusIcon />
      </Button>
      <Button
        variant="ghost"
        // The free space goes before it: ± is one control, «Поровну» another.
        className="ml-auto px-2 max-[360px]:px-1"
        disabled={equal}
        // Exact, not whole percents: 7 portions of 560 g are 80 g each.
        onClick={() => onChange(equalSplit(names.length))}
      >
        Поровну
      </Button>
    </div>
  )
}
