import { MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { equalSplit, nudgePercent } from '@/domain'
import { cn } from '@/lib/utils'

interface ShareControlsProps {
  /** Names of the people who split by share, in order. */
  names: string[]
  /** Their split in whole percents, summing to 100. */
  percents: number[]
  /** They split equally already (exact weights, not the rounded percents): «Поровну» is off. */
  equal: boolean
  /** Who ±1 % adjusts. */
  selectedIndex: number
  onChange: (percents: number[]) => void
  /**
   * The chosen person's part of the whole dish, as their row shows it («53,8 %»); null — their whole
   * percent of the sharing people («54 % от делящих»), when own portions or «на завтра» take a part.
   */
  selectedPercent?: string | null
  unit: 'g' | '%'
  /** Without it there is no «г | %» switch. */
  onUnit?: (unit: 'g' | '%') => void
  /** Own portions or «на завтра» take part of the dish: the percents are of the sharing people. */
  partial?: boolean
}

/**
 * Under a share bar, one line: ±1 % for the chosen person on the left; «Поровну» and «г | %» on the right.
 * Nothing to show for one person without the switch.
 */
export function ShareControls({ names, percents, equal, selectedIndex, onChange, selectedPercent, unit, onUnit, partial }: ShareControlsProps) {
  const many = names.length > 1
  if (!many && !onUnit) return null
  const name = names[selectedIndex] ?? ''

  return (
    <div className="flex min-h-11 items-center gap-2 max-[360px]:gap-1">
      {many && (
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label={`${name}: на 1 % меньше`}
            className="max-[360px]:w-9"
            disabled={percents[selectedIndex] <= 1}
            onClick={() => onChange(nudgePercent(percents, selectedIndex, -1))}
          >
            <MinusIcon />
          </Button>
          {/* As wide as its text, so − and + hug it; on a narrow phone it gives way first. */}
          <span className="flex max-w-28 min-w-12 shrink flex-col items-center text-center text-sm leading-tight">
            <span className="w-full truncate text-muted-foreground">{name}</span>
            <span className="w-full truncate font-semibold tabular-nums">
              {/* What ±1 % changes, in percent — the same figure as in the person's row; the grams are on the
                  bar and in the row already. */}
              {!partial && selectedPercent ? `${selectedPercent} %` : `${percents[selectedIndex]} %`}
              {partial && <span className="font-normal text-muted-foreground"> от делящих</span>}
            </span>
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={`${name}: на 1 % больше`}
            className="max-[360px]:w-9"
            onClick={() => onChange(nudgePercent(percents, selectedIndex, 1))}
          >
            <PlusIcon />
          </Button>
          <Button
            variant="ghost"
            // The free space goes before it: ±1 % is one control, «Поровну» another.
            className="ml-auto px-2 max-[360px]:px-1"
            disabled={equal}
            // Exact, not whole percents: 7 portions of 560 g are 80 g each.
            onClick={() => onChange(equalSplit(names.length))}
          >
            Поровну
          </Button>
        </>
      )}
      {onUnit && (
        <div role="group" aria-label="Что показывать" className={cn('flex shrink-0 rounded-lg bg-muted p-0.5 text-sm', !many && 'ml-auto')}>
          {(['g', '%'] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => onUnit(u)}
              className={cn(
                'min-h-10 min-w-9 rounded-md px-2 font-medium max-[360px]:min-w-8 max-[360px]:px-1.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                unit === u ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {u === 'g' ? 'г' : '%'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
