import type { KeyboardEvent } from 'react'
import { formatTyped } from '@/domain'
import { cn } from '@/lib/utils'
import { DigitsInput } from './DigitsInput'

interface DisplayRowProps {
  id: string
  label: string
  /** What is typed, as typed: «1240», «12,5». */
  text: string
  /** The field has focus: the raised box, the digits as typed; otherwise grouped («1 240»). */
  active: boolean
  onFocus: () => void
  onBlur: () => void
  onText: (text: string) => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  /** «Готовый»: Enter closes the keyboard instead of moving on. */
  last?: boolean
  autoFocus?: boolean
  /** Something wrong with the weight («вес меньше тары»): an outline in the error color. */
  invalid?: boolean
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
  className?: string
}

/**
 * One value of the calculator display, a tile: label above the number, the whole tile a field.
 * The one being typed into is a lidded box on the frosted ground.
 */
export function DisplayRow({
  id,
  label,
  text,
  active,
  onFocus,
  onBlur,
  onText,
  onKeyDown,
  last,
  autoFocus,
  invalid,
  lids,
  className,
}: DisplayRowProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex w-full min-w-0 cursor-text flex-col items-start justify-start gap-0.5 rounded-xl border px-4 text-left transition-colors max-[360px]:px-3',
        'py-2.5',
        // The one being typed into is the only raised box; in dark the idle tiles sink toward the ground.
        active ? 'border-border bg-card' : 'border-transparent bg-muted/60 hover:bg-card/60 dark:bg-muted/20 dark:hover:bg-card/60',
        invalid && 'border-destructive',
        className,
      )}
    >
      <span className={cn('max-w-full truncate text-sm leading-tight', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span
        className={cn(
          'flex max-w-full items-baseline text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl',
        )}
      >
        <DigitsInput
          id={id}
          aria-label={`${label}, граммы`}
          aria-invalid={invalid || undefined}
          enterKeyHint={last ? 'done' : 'next'}
          autoFocus={autoFocus}
          lids={lids}
          value={active ? text : formatTyped(text)}
          placeholder="0"
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <span aria-hidden className="ml-1 text-base font-normal text-muted-foreground">
          г
        </span>
      </span>
    </label>
  )
}
