import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { equalSplit, nudgePercent } from '@/domain'

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
  /** The chosen person's grams, «168 г», the same figure as their row; null before weighing. */
  selectedLabel?: string | null
}

/**
 * Under a share bar, one line: − and + for the chosen person on the left, their name over their grams;
 * «Поровну» on the right. No percent (docs/SPEC.md §3б): each press moves 1 % of the dish, unseen.
 * Nothing to show for one person.
 */
export function ShareControls({ names, percents, equal, selectedIndex, onChange, selectedLabel }: ShareControlsProps) {
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
      {/* As wide as its text, so − and + hug it; on a narrow phone it gives way first. Who is also ringed on
          the bar right above. */}
      <span className="flex max-w-28 min-w-12 shrink flex-col items-center text-center text-sm leading-tight">
        <span className="w-full truncate text-muted-foreground">{name}</span>
        {selectedLabel && <span className="w-full truncate font-semibold tabular-nums">{selectedLabel}</span>}
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
