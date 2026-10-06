import { cn } from '@/lib/utils'

/** One blink per lid: `animate-caret-N` in index.css. Literal names, so Tailwind generates them. */
const BLINK = [
  'motion-safe:animate-caret-1',
  'motion-safe:animate-caret-2',
  'motion-safe:animate-caret-3',
  'motion-safe:animate-caret-4',
  'motion-safe:animate-caret-5',
] as const

interface CaretProps {
  /** How many people eat today: each time the caret comes back, it takes the next one's lid color. */
  lids: number
  /** Not typing here: the caret keeps its place, unseen, so choosing the field moves nothing. */
  hidden?: boolean
}

/** The calculator's caret. Without people (or with reduced motion) it stays in the primary color. */
export function Caret({ lids, hidden }: CaretProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'ml-0.5 inline-block h-[0.9em] w-[3px] self-center rounded-full',
        hidden ? 'bg-transparent' : 'bg-primary',
        !hidden && lids > 0 && BLINK[Math.min(lids, BLINK.length) - 1],
      )}
    />
  )
}
