import { formatGrams, ingredientNames, type Cooking, type RawAmount } from '@/domain'
import { cn } from '@/lib/utils'

interface RecipeProps {
  cooking: Cooking
  /** Raw grams of the counted ingredients in this portion. */
  raw: RawAmount[]
  /** «Состав» is on: the recipe is open. */
  open: boolean
  /** One column: some ingredient name of the dish is long, or the place is narrow. */
  oneColumn: boolean
  className?: string
}

/**
 * «Состав» (docs/UX.md §3): what a portion is made of, «название … граммы» in raw grams of the counted
 * ingredients. Always in the page, opened by a grid-rows reveal; closed, it is out of the way of the
 * keyboard and the screen reader. A name wraps up to two lines (the full one in the title), the grams never.
 */
export function Recipe({ cooking, raw, open, oneColumn, className }: RecipeProps) {
  const names = ingredientNames(cooking)
  return (
    <div
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'grid grid-rows-[0fr] transition-[grid-template-rows] duration-220 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none',
        open && 'grid-rows-[1fr]',
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <ul className={cn('grid gap-x-4 gap-y-1 pt-2 text-sm leading-snug', oneColumn ? 'grid-cols-1' : 'grid-cols-2')}>
          {raw.map((r) => (
            <li key={r.ingredientId} className="flex min-w-0 items-baseline justify-between gap-2.5">
              <span title={names.get(r.ingredientId)} className="line-clamp-2 min-w-0 text-muted-foreground hyphens-auto wrap-anywhere">
                {names.get(r.ingredientId)}
              </span>
              <span className="shrink-0 whitespace-nowrap tabular-nums">{formatGrams(r.grams)} г</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
