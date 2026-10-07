import { CopyButton } from '@/components/CopyButton'
import {
  formatGrams,
  portionGrams,
  portionRawGrams,
  rawAmountsCopyText,
  splitAmounts,
  splitSummary,
  type Cooking,
  type CookingResult,
  type Id,
  type PortionResult,
} from '@/domain'
import { cn } from '@/lib/utils'
import { portionsWord, rawWord } from './messages'
import { PortionRecipe } from './PortionRecipe'

interface PortionSummaryProps {
  cooking: Cooking
  result: CookingResult
  /** Today's portions, in lineup order. */
  portions: PortionResult[]
  /** Portions with an own amount: they are said apart, «своя: 5 — 120 г». */
  ownIds: Id[]
  /** «Сухой» is in focus: dry grams of this ingredient. */
  rawOf: Id | null
  /** A portion's number: its place in the lineup. */
  numberOf: (id: Id) => number
  /** «Состав»: equal portions show one recipe under the line; `open` — the mode is on. */
  recipe?: { open: boolean; oneColumn: boolean }
}

/**
 * «по 80 г × 7 · 29 г сухого» over the grid of portions in «Доли» (docs/UX.md §3): what goes into each
 * container, said once, with ⧉ for the tracker when they are all the same. Portions that differ get the
 * range; own ones are named under it.
 */
export function PortionSummary({ cooking, result, portions, ownIds, rawOf, numberOf, recipe }: PortionSummaryProps) {
  const sharing = portions.filter((p) => !ownIds.includes(p.portionId))
  const own = portions.filter((p) => ownIds.includes(p.portionId))
  // Grams of the view; not weighed yet, there is nothing to say — the tiles show their numbers.
  const { inPercent, values } = splitAmounts(sharing, rawOf, 'g')
  const summary = inPercent ? null : splitSummary(values)
  if (!summary) return null

  const shown = (value: number) => `${formatGrams(value)} г`
  const first = sharing[0]
  // Beside it: the other view of one of them, the way a portion's tile has it.
  const other = (() => {
    if (summary.same === null) return null
    if (rawOf !== null) return first.cookedGrams !== null ? `${formatGrams(first.cookedGrams)} г готового` : null
    const raw = portionRawGrams(result, first.raw)
    return raw !== null ? `${formatGrams(raw)} г ${rawWord(cooking.kind)}` : null
  })()
  const head = summary.same !== null ? `по ${shown(summary.same)}` : `${formatGrams(summary.least)}–${shown(summary.most)}`
  const tail = summary.same !== null ? [`× ${summary.count}`, other].filter(Boolean).join(' · ') : `${summary.count} ${portionsWord(summary.count)} по долям`
  const ownAmount = (p: PortionResult) => {
    const value = portionGrams(p, rawOf)
    return value !== null ? shown(value) : '—'
  }
  const ownLine =
    own.length > 0 &&
    `${own.length === 1 ? 'своя' : 'свои'}: ${own.map((p) => `${numberOf(p.portionId)} — ${ownAmount(p)}`).join(', ')}`

  return (
    <div>
      <div className="flex items-center gap-2">
        <p aria-live="polite" className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 px-1">
          <span className="text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">{head}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{tail}</span>
          {ownLine && <span className="basis-full text-sm text-muted-foreground tabular-nums">{ownLine}</span>}
        </p>
        {/* Hidden, not removed, while the portions differ (each tile has its own ⧉ then): the line keeps its
            height when they turn equal or unequal. */}
        <CopyButton
          className={cn('text-muted-foreground', summary.same === null && 'invisible')}
          label="Скопировать для трекера: одна порция"
          getText={() => (summary.same !== null && rawAmountsCopyText(cooking, first.raw)) || null}
        />
      </div>
      {recipe && summary.same !== null && (
        <PortionRecipe cooking={cooking} raw={first.raw} open={recipe.open} oneColumn={recipe.oneColumn} className="px-1" />
      )}
    </div>
  )
}
