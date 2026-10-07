import { XIcon } from 'lucide-react'
import { Fragment, useRef, type KeyboardEvent } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { HoldButton } from '@/components/HoldButton'
import { lidFill } from '@/components/lids'
import { SwipeRow, type SwipeRowHandle } from '@/components/SwipeRow'
import { Input } from '@/components/ui/input'
import {
  formatGrams,
  formatPercent,
  portionRawGrams,
  rawAmountsCopyText,
  type Cooking,
  type CookingResult,
  type PortionResult,
} from '@/domain'
import { cn } from '@/lib/utils'
import { DigitsInput } from './DigitsInput'
import { rawWord } from './messages'
import { Recipe } from './Recipe'

interface PersonResultProps {
  cooking: Cooking
  result: CookingResult
  name: string
  /** Place in today's lineup: the person's lid color, the same as on the share bar. */
  place: number
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
  computed: PortionResult
  /** «Сухой» is in focus: grams are dry grams of the product k is counted by, cooked go under the name. */
  dry: boolean
  /** Without it the name is not editable: a portion in «Доли» is named by its place. */
  onRename?: (name: string) => void
  onRemove: () => void
  /** «×» is held this long before the person is removed; 0 — a tap. */
  /** The answer is a field: tap it and type the person's own portion. */
  grams: {
    id: string
    /** The field has focus: it shows what is typed, today's number faded until then. */
    active: boolean
    text: string
    own: boolean
    /** What the number is in — shown and typed: cooked grams or percent of the dish. */
    unit: 'g' | '%'
    /** The «г / %» switch, always in the field. */
    onToggleUnit: () => void
    onFocus: () => void
    onBlur: () => void
    onText: (text: string) => void
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  }
  /** Part of the whole dish, «54» — so the split is readable even where the bar is too narrow. */
  percent: string | null
  /** «своя ×»: the person goes back to splitting by share. */
  onReleaseOwn: () => void
  /** «Состав»: a composite dish with the recipe toggle; `open` — it is on. */
  recipe?: { open: boolean; oneColumn: boolean }
}

/**
 * «Ваня — 168 г»: the answer, large, with its raw counterpart under it. Shares live on the slider.
 * The name is edited in place; × takes the person out of today's lineup. On a touch screen the row is
 * swiped instead: left — out of the lineup, right — copy for the tracker.
 */
export function PersonResult({
  cooking,
  result,
  name,
  place,
  lids,
  computed,
  dry,
  onRename,
  onRemove,
  grams,
  percent,
  onReleaseOwn,
  recipe,
}: PersonResultProps) {
  // Raw grams of the portion: the only counted ingredient's, or all counted ones together.
  const baseRaw = computed.share !== null ? portionRawGrams(result, computed.raw) : null
  const inPercent = grams.unit === '%'
  const rawText = baseRaw !== null && `${formatGrams(baseRaw)} г ${rawWord(cooking.kind)}`
  // Under the name: the other unit of the answer (percent under grams, grams under percent), then the
  // other view — raw under cooked, cooked under dry.
  const subline = (
    dry
      ? [
          inPercent ? rawText : percent !== null && `${percent} %`,
          computed.cookedGrams !== null && `${formatGrams(computed.cookedGrams)} г готового`,
        ]
      : [
          inPercent
            ? computed.cookedGrams !== null && `${formatGrams(computed.cookedGrams)} г`
            : percent !== null && `${percent} %`,
          rawText,
        ]
  ).filter((part): part is string => Boolean(part))

  // The answer in the person's unit and view.
  const viewGrams = dry ? baseRaw : computed.cookedGrams
  const shownNumber = inPercent
    ? computed.share !== null ? formatPercent(computed.share) : null
    : viewGrams !== null ? formatGrams(viewGrams) : null
  const copyRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<SwipeRowHandle>(null)

  return (
    <SwipeRow
      ref={rowRef}
      as="li"
      itemId={computed.portionId}
      className="flex flex-col gap-1 py-3"
      onRemove={onRemove}
      onCopy={computed.share !== null ? () => copyRef.current?.click() : null}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn('size-3.5 shrink-0 self-start mt-3 rounded-[5px]', lidFill(place))} />
        <div className="flex min-w-0 flex-1 flex-col">
          {onRename ? (
            <Input
              aria-label="Имя"
              placeholder="Имя"
              value={name}
              enterKeyHint="done"
              onChange={(e) => onRename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="h-9 border-transparent bg-transparent px-1 text-base font-medium shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
            />
          ) : (
            // The same place as the name field, without the field.
            <span className="flex h-9 items-center px-1 text-base font-medium">{name}</span>
          )}
          {(subline.length > 0 || grams.own) && (
            // Each part stays whole («13 г сухого»); the line wraps only between parts.
            <span className="px-1 text-sm leading-snug text-muted-foreground tabular-nums">
              {grams.own && (
                <button
                  type="button"
                  onClick={onReleaseOwn}
                  aria-label={`${name || 'Человек'}: вернуть к доле`}
                  // Small to look at, 44 px to hit: the padding reaches out, the margin pulls it back.
                  className="-my-3 mr-1 inline-flex items-center gap-0.5 rounded-full py-3 whitespace-nowrap outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <span className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px">
                    своя
                    <XIcon className="size-3" />
                  </span>
                </button>
              )}
              {subline.map((part, i) => (
                <Fragment key={part}>
                  {i > 0 && ' '}
                  <span className="whitespace-nowrap">
                    {i > 0 && '· '}
                    {part}
                  </span>
                </Fragment>
              ))}
            </span>
          )}
        </div>
        {/* Right: what to put on the plate. Tap the number to type an own portion; the unit next to it
            is a switch, always there, so nothing moves when the field is chosen. */}
        <div
          className={cn(
            'flex min-h-14 shrink-0 items-center rounded-xl border transition-colors',
            grams.active ? 'border-border bg-card' : 'border-transparent',
          )}
        >
          <label
            htmlFor={grams.id}
            className={cn(
              'flex min-h-14 cursor-text items-center rounded-xl py-1 pl-2 transition-colors',
              !grams.active && 'hover:bg-muted/50',
            )}
          >
            <span className="flex items-baseline text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">
              <DigitsInput
                id={grams.id}
                aria-label={`${name || 'Человек'}: своя порция, ${inPercent ? 'проценты' : dry ? `граммы ${rawWord(cooking.kind)}` : 'граммы'}`}
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
            </span>
          </label>
          <button
            type="button"
            aria-label={`${name || 'Человек'}: показывать в ${inPercent ? 'граммах' : 'процентах'}`}
            onClick={grams.onToggleUnit}
            // The number keeps focus: switched while typing, what is typed is converted.
            onMouseDown={(e) => e.preventDefault()}
            // Small to look at, 44 px to hit.
            className="group/unit flex min-h-11 min-w-11 items-center justify-center rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                'min-w-7 rounded-md border px-1.5 py-0.5 text-center text-base leading-tight text-muted-foreground tabular-nums transition-colors group-hover/unit:text-foreground',
                grams.active ? 'border-border bg-background' : 'border-transparent bg-muted',
              )}
            >
              {inPercent ? '%' : 'г'}
            </span>
          </button>
        </div>
        {/* Row actions, stacked: each half the row's height, so they stay out of the answer's way.
            On a touch screen the row is swiped instead; the buttons stay for the keyboard and a screen reader. */}
        <div className="flex shrink-0 flex-col pointer-coarse:sr-only">
          <CopyButton
            ref={copyRef}
            size="sm"
            label={`Скопировать для трекера: ${name}`}
            disabled={computed.share === null}
            getText={() => rawAmountsCopyText(cooking, computed.raw) || null}
          />
          <HoldButton
            className="w-10 text-muted-foreground"
            label={name ? `Убрать: ${name}` : 'Убрать человека'}
            // The row slides out and folds up, as after a swipe.
            onConfirm={() => rowRef.current?.remove()}
          >
            <XIcon />
          </HoldButton>
        </div>
      </div>
      {recipe && computed.share !== null && (
        // From the name to the answer, not under the actions; always per person.
        <Recipe cooking={cooking} raw={computed.raw} open={recipe.open} oneColumn={recipe.oneColumn} className="pr-12 pl-[22px]" />
      )}
    </SwipeRow>
  )
}
