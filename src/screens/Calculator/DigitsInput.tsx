import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * The caret takes today's lids in turn (`animate-caret-N` in index.css, N people; after ten they
 * repeat); nobody — the primary color. Reduced motion — the primary color. Literal names, so Tailwind
 * generates them.
 */
const LIDS = [
  '',
  'motion-safe:animate-caret-1',
  'motion-safe:animate-caret-2',
  'motion-safe:animate-caret-3',
  'motion-safe:animate-caret-4',
  'motion-safe:animate-caret-5',
  'motion-safe:animate-caret-6',
  'motion-safe:animate-caret-7',
  'motion-safe:animate-caret-8',
  'motion-safe:animate-caret-9',
  'motion-safe:animate-caret-10',
] as const

interface DigitsInputProps extends Omit<ComponentProps<typeof Input>, 'value'> {
  value: string
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
}

/**
 * A calculator number as a plain field, decimal keyboard on a phone. It takes the font around it and is
 * as wide as what it shows, so «г» stays right after the digits: a hidden copy of the text sets the width.
 * Focused, the number is selected: the first key replaces it, as on a calculator.
 */
export function DigitsInput({ value, placeholder, lids, className, onFocus, ...props }: DigitsInputProps) {
  return (
    <span className="inline-grid min-w-0">
      <span aria-hidden className="invisible col-start-1 row-start-1 pr-0.5 whitespace-pre">
        {value || placeholder || ' '}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onFocus={(e) => {
          const input = e.currentTarget
          // After the render that swaps «1 240» for «1240». A range, not select(): iOS ignores select().
          setTimeout(() => {
            if (document.activeElement === input) input.setSelectionRange(0, input.value.length)
          })
          onFocus?.(e)
        }}
        className={cn(
          // No width of its own: the hidden copy sets the column, the field fills it.
          'col-start-1 row-start-1 h-auto w-0 min-w-full rounded-none border-0 bg-transparent p-0 text-[length:inherit] leading-[inherit] caret-primary shadow-none',
          'placeholder:text-muted-foreground/50 focus-visible:ring-0 aria-invalid:ring-0 md:text-[length:inherit] dark:bg-transparent',
          LIDS[Math.min(lids, LIDS.length - 1)],
          className,
        )}
        {...props}
      />
    </span>
  )
}
