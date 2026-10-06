import { cn } from '@/lib/utils'
import { Caret } from './Caret'

interface DisplayRowProps {
  label: string
  text: string
  active: boolean
  onActivate: () => void
  /** An ingredient of a composite dish: smaller digits, two tiles to a row. */
  small?: boolean
  /** Something wrong with the weight («вес меньше тары»): an outline in the error color. */
  invalid?: boolean
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
  className?: string
}

/**
 * One value of the calculator display, a tile: label above the number. Tap to make it the one
 * the keypad types into; the one being typed into is a lidded box on the frosted ground.
 */
export function DisplayRow({ label, text, active, onActivate, small, invalid, lids, className }: DisplayRowProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-invalid={invalid || undefined}
      aria-label={`${label}: ${text || 'не введено'} г`}
      onClick={onActivate}
      className={cn(
        'flex w-full min-w-0 flex-col items-start justify-start gap-0.5 rounded-xl border px-4 text-left outline-none transition-colors max-[360px]:px-3',
        small ? 'py-1.5' : 'py-2.5',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active ? 'border-border bg-card' : 'border-transparent bg-muted/60 hover:bg-card/60',
        invalid && 'border-destructive',
        className,
      )}
    >
      <span className={cn('max-w-full truncate text-sm leading-tight', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'flex items-baseline leading-tight font-medium whitespace-nowrap tabular-nums',
          small ? 'text-xl' : 'text-3xl max-[360px]:text-2xl',
          !text && 'text-muted-foreground/50',
        )}
      >
        {text || '0'}
        {active && <Caret lids={lids} />}
        <span className="ml-1 text-base font-normal text-muted-foreground">г</span>
      </span>
    </button>
  )
}
