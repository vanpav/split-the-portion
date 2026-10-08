import { CopyButton } from '@/components/CopyButton'
import {
  portionGrams,
  portionRawGrams,
  rawAmountsCopyLines,
  splitAmounts,
  splitSummary,
  type Cooking,
  type CookingResult,
  type Id,
  type PortionResult,
} from '@/domain'
import { cn } from '@/lib/utils'
import { rawWord } from './messages'
import { PortionRecipe } from './PortionRecipe'
import { t } from '@/i18n'
import { copyText, formatGrams, gramsText } from '@/i18n/format'

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

  const shown = (value: number) => gramsText(value)
  const first = sharing[0]
  // Beside it: the other view of one of them, the way a portion's tile has it.
  const other = (() => {
    if (summary.same === null) return null
    if (rawOf !== null) return first.cookedGrams !== null ? t('calculator.cookedGrams', { grams: formatGrams(first.cookedGrams) }) : null
    const raw = portionRawGrams(result, first.raw)
    return raw !== null ? t('calculator.rawGrams', { grams: formatGrams(raw), raw: rawWord(cooking.kind) }) : null
  })()
  const head =
    summary.same !== null
      ? t('calculator.summary.each', { grams: shown(summary.same) })
      : t('calculator.summary.range', { least: formatGrams(summary.least), most: shown(summary.most) })
  const tail = summary.same !== null ? [`× ${summary.count}`, other].filter(Boolean).join(' · ') : t('calculator.summary.byShares', { count: summary.count })
  const ownAmount = (p: PortionResult) => {
    const value = portionGrams(p, rawOf)
    return value !== null ? shown(value) : '—'
  }
  const ownLine =
    own.length > 0 &&
    t('calculator.summary.own', {
      own: t('calculator.own', { count: own.length }),
      list: own.map((p) => `${numberOf(p.portionId)} — ${ownAmount(p)}`).join(', '),
    })

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
          label={t('calculator.copyOne')}
          getText={() => (summary.same !== null && copyText(rawAmountsCopyLines(cooking, first.raw))) || null}
        />
      </div>
      {recipe && summary.same !== null && (
        <PortionRecipe cooking={cooking} raw={first.raw} open={recipe.open} oneColumn={recipe.oneColumn} className="px-1" />
      )}
    </div>
  )
}
