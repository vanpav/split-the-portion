import { CopyButton } from '@/components/CopyButton'
import {
  baseRawGrams,
  formatGrams,
  formatPercent,
  portionGrams,
  rawAmountsCopyText,
  splitSummary,
  type Cooking,
  type CookingResult,
  type Id,
  type PortionResult,
} from '@/domain'
import { portionsWord, rawWord } from './messages'

interface PortionSummaryProps {
  cooking: Cooking
  result: CookingResult
  /** Today's portions, in lineup order. */
  portions: PortionResult[]
  /** Portions with an own amount: they are said apart, «своя: 5 — 120 г». */
  ownIds: Id[]
  /** «Сухой» is in focus: dry grams of this ingredient. */
  rawOf: Id | null
  /** The bar's unit: grams of the view or percent of the dish. */
  unit: 'g' | '%'
  /** A portion's number: its place in the lineup. */
  numberOf: (id: Id) => number
}

/**
 * «по 80 г × 7 · 29 г сухого» over the grid of portions in «Доли» (docs/UX.md §3): what goes into each
 * container, said once, with ⧉ for the tracker when they are all the same. Portions that differ get the
 * range; own ones are named under it.
 */
export function PortionSummary({ cooking, result, portions, ownIds, rawOf, unit, numberOf }: PortionSummaryProps) {
  const sharing = portions.filter((p) => !ownIds.includes(p.portionId))
  const own = portions.filter((p) => ownIds.includes(p.portionId))
  // Grams of the view once weighed; percent of the dish before that, or when asked for.
  const inPercent = unit === '%' || sharing.some((p) => portionGrams(p, rawOf) === null)
  const amount = (p: PortionResult) => (inPercent ? (p.share !== null ? p.share * 100 : null) : portionGrams(p, rawOf))
  const summary = splitSummary(sharing.map(amount), inPercent ? 1 : 0)
  if (!summary) return null

  const shown = (value: number) => (inPercent ? `${formatPercent(value / 100)} %` : `${formatGrams(value)} г`)
  const first = sharing[0]
  // Beside it: the other view of one of them, the way a portion's tile has it.
  const other = (() => {
    if (summary.same === null) return null
    if (inPercent) {
      // Grams of the view under percent, as in a portion's tile: dry ones with their word.
      const grams = portionGrams(first, rawOf)
      return grams !== null ? `${formatGrams(grams)} г${rawOf !== null ? ` ${rawWord(cooking.kind)}` : ''}` : null
    }
    if (rawOf !== null) return first.cookedGrams !== null ? `${formatGrams(first.cookedGrams)} г готового` : null
    const raw = result.baseIngredientId !== null ? baseRawGrams(result, first.raw) : null
    return raw !== null ? `${formatGrams(raw)} г ${rawWord(cooking.kind)}` : null
  })()
  const head = summary.same !== null ? `по ${shown(summary.same)}` : `${shown(summary.least).replace(/ [г%]$/, '')}–${shown(summary.most)}`
  const tail = summary.same !== null ? [`× ${summary.count}`, other].filter(Boolean).join(' · ') : `${summary.count} ${portionsWord(summary.count)} по долям`
  const ownAmount = (p: PortionResult) => {
    const value = amount(p)
    return value !== null ? shown(value) : '—'
  }
  const ownLine =
    own.length > 0 &&
    `${own.length === 1 ? 'своя' : 'свои'}: ${own.map((p) => `${numberOf(p.portionId)} — ${ownAmount(p)}`).join(', ')}`

  return (
    <div className="flex items-center gap-2">
      <p aria-live="polite" className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 px-1">
        <span className="text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">{head}</span>
        <span className="text-sm text-muted-foreground tabular-nums">{tail}</span>
        {ownLine && <span className="basis-full text-sm text-muted-foreground tabular-nums">{ownLine}</span>}
      </p>
      {summary.same !== null && (
        <CopyButton
          className="text-muted-foreground"
          label="Скопировать для трекера: одна порция"
          getText={() => rawAmountsCopyText(cooking, first.raw) || null}
        />
      )}
    </div>
  )
}
