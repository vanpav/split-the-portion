import type { KeyboardEvent } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { lidFill } from '@/components/lids'
import { formatGrams, formatPercent, portionRawGrams, rawAmountsCopyText, type Cooking, type CookingResult, type PortionResult } from '@/domain'
import { cn } from '@/lib/utils'
import { DigitsInput } from './DigitsInput'
import { rawWord } from './messages'
import { Recipe } from './Recipe'

interface PortionTileProps {
  cooking: Cooking
  result: CookingResult
  /** Place in today's lineup: the portion's number and its lid, the same as on the share bar. */
  place: number
  /** Portions today: the caret blinks through their lid colors. */
  lids: number
  computed: PortionResult
  /** «Сухой» is in focus: the number is dry grams of the product k is counted by, cooked go under it. */
  dry: boolean
  /** The amount is a field, as in a person's row: tap it and type this portion's own amount. */
  grams: {
    id: string
    active: boolean
    text: string
    own: boolean
    /** What the number is in — the bar's unit, or what it was typed in. */
    unit: 'g' | '%'
    onFocus: () => void
    onBlur: () => void
    onText: (text: string) => void
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  }
  /**
   * Its own ⧉: when the portions differ, or this one is own. Equal ones are copied once, from
   * «по 80 г × 7» above.
   */
  copyable: boolean
  /** «Состав»: this tile carries the recipe under a hairline; `open` — the mode is on. */
  recipe?: { open: boolean; oneColumn: boolean }
  className?: string
}

/**
 * One container of a meal prep in «Доли» (docs/UX.md §3): its number in its lid, the amount large, the
 * other view small under it. Three to a row instead of a person's row each: seven equal portions fit one
 * screen. An own portion is outlined dashed, as on the bar, and goes back to the shares when its number
 * is erased. No swipe here: portions are numbered by place,
 * so «−» beside «Доли» takes one away; ⧉ copies this one for the tracker when it differs from the rest.
 */
export function PortionTile({ cooking, result, place, lids, computed, dry, grams, copyable, recipe, className }: PortionTileProps) {
  const name = `Порция ${place + 1}`
  const baseRaw = computed.share !== null ? portionRawGrams(result, computed.raw) : null
  const inPercent = grams.unit === '%'
  const viewGrams = dry ? baseRaw : computed.cookedGrams
  const shownNumber = inPercent
    ? computed.share !== null ? formatPercent(computed.share) : null
    : viewGrams !== null ? formatGrams(viewGrams) : null
  // Under the amount: grams under percent; otherwise the other view — raw under cooked, cooked under dry.
  const subline = inPercent
    ? viewGrams !== null && `${formatGrams(viewGrams)} г${dry ? ` ${rawWord(cooking.kind)}` : ''}`
    : dry
      ? computed.cookedGrams !== null && `${formatGrams(computed.cookedGrams)} г готового`
      : baseRaw !== null && `${formatGrams(baseRaw)} г ${rawWord(cooking.kind)}`

  return (
    <li
      className={cn(
        'flex min-w-0 flex-col rounded-xl border transition-colors',
        className,
        grams.active
          ? 'border-border bg-card'
          : grams.own
            ? // Own: outlined dashed, the same mark as its segment on the bar.
              'border-transparent outline-2 -outline-offset-2 outline-foreground/25 outline-dashed'
            : 'border-transparent bg-muted/60 dark:bg-muted/20',
      )}
    >
      <div className="flex items-center gap-1 pl-2">
        <span
          aria-hidden
          className={cn('flex size-5.5 shrink-0 items-center justify-center rounded-[6px] text-xs font-semibold text-chart-foreground tabular-nums', lidFill(place))}
        >
          {place + 1}
        </span>
        {/* No «своя ×» here: three to a row there is room for one button. The dashed outline says it, as on the
            bar, and «своя: 5 — 120 г» above the grid; erasing the number gives the portion back to the shares. */}
        {grams.own && <span className="sr-only">своя</span>}
        {copyable ? (
          <CopyButton
            className="ml-auto text-muted-foreground"
            label={`Скопировать для трекера: ${name}`}
            disabled={computed.share === null}
            getText={() => rawAmountsCopyText(cooking, computed.raw) || null}
          />
        ) : (
          // The same height without the button: the amounts line up across the row.
          <span aria-hidden className="h-11" />
        )}
      </div>
      <label htmlFor={grams.id} className="-mt-1.5 flex min-w-0 cursor-text flex-col px-2.5 pb-2.5">
        <span className="flex max-w-full items-baseline text-2xl leading-tight font-medium whitespace-nowrap tabular-nums">
          <DigitsInput
            id={grams.id}
            aria-label={`${name}: своя порция, ${inPercent ? 'проценты' : dry ? `граммы ${rawWord(cooking.kind)}` : 'граммы'}`}
            enterKeyHint="done"
            lids={lids}
            // Until something is typed: today's number, faded — the field keeps its width.
            value={grams.active ? grams.text : (shownNumber ?? '')}
            placeholder={grams.active ? (shownNumber ?? '0') : '—'}
            onFocus={grams.onFocus}
            onBlur={grams.onBlur}
            onChange={(e) => grams.onText(e.target.value)}
            onKeyDown={grams.onKeyDown}
          />
          <span aria-hidden className="ml-0.5 text-sm font-normal text-muted-foreground">
            {inPercent ? '%' : 'г'}
          </span>
        </span>
        {subline && <span className="truncate text-xs text-muted-foreground tabular-nums">{subline}</span>}
      </label>
      {recipe && computed.share !== null && (
        <div className="px-2.5">
          <Recipe
            cooking={cooking}
            raw={computed.raw}
            open={recipe.open}
            oneColumn={recipe.oneColumn}
            className={cn(recipe.open && 'mb-2.5 border-t')}
          />
        </div>
      )}
    </li>
  )
}
