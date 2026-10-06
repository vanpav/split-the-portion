import { cn } from '@/lib/utils'
import { displayRowBox } from './displayRowBox'

interface DisplayRowProps {
  label: string
  text: string
  active: boolean
  onActivate: () => void
  /** Several rows (a composite dish): smaller digits so they fit. */
  compact?: boolean
}

/** One value of the calculator display: tap to make it the one the keypad types into. */
export function DisplayRow({ label, text, active, onActivate, compact }: DisplayRowProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}: ${text || 'не введено'} г`}
      onClick={onActivate}
      className={cn(
        'flex w-full items-start justify-between gap-3 rounded-xl px-4 text-left outline-none transition-colors',
        displayRowBox(compact),
        'focus-visible:ring-[3px] focus-visible:ring-ring/50',
        active ? 'bg-muted' : 'hover:bg-muted/50',
      )}
    >
      <span className={cn('truncate text-sm leading-tight', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span
        className={cn(
          'flex items-baseline leading-tight font-semibold whitespace-nowrap tabular-nums',
          compact ? 'text-2xl' : 'text-4xl',
          !text && 'text-muted-foreground/50',
        )}
      >
        {text || '0'}
        {active && (
          <span aria-hidden className="ml-0.5 inline-block h-[0.9em] w-0.5 self-center bg-primary motion-safe:animate-pulse" />
        )}
        <span className="ml-1 text-base font-normal text-muted-foreground">г</span>
      </span>
    </button>
  )
}
