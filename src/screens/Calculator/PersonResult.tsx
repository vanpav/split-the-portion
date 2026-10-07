import { XIcon } from 'lucide-react'
import { Fragment, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { HoldButton } from '@/components/HoldButton'
import { lidFill } from '@/components/lids'
import { SwipeRow, type SwipeRowHandle } from '@/components/SwipeRow'
import { Input } from '@/components/ui/input'
import {
  formatGrams,
  portionRawGrams,
  rawAmountsCopyText,
  type Cooking,
  type CookingResult,
  type PortionResult,
} from '@/domain'
import { cn } from '@/lib/utils'
import { DigitsInput } from './DigitsInput'
import { rawWord } from './messages'
import { PortionRecipe } from './PortionRecipe'

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
    onFocus: () => void
    onBlur: () => void
    onText: (text: string) => void
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  }
  /** «своя ×»: the person goes back to splitting by share. */
  onReleaseOwn: () => void
  /** «Состав»: a composite dish with the recipe toggle; `open` — it is on. */
  recipe?: { open: boolean; oneColumn: boolean }
  /** The person ± adjusts: a frosted plate, the lid ringed. */
  chosen?: boolean
  /** A tap on the row (not on its field or buttons) chooses the person; absent for an own portion. */
  onChoose?: () => void
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
  onReleaseOwn,
  recipe,
  chosen = false,
  onChoose,
}: PersonResultProps) {
  // Raw grams of the portion: the only counted ingredient's, or all counted ones together.
  const baseRaw = computed.share !== null ? portionRawGrams(result, computed.raw) : null
  // Under the name: the other view — raw under cooked, cooked under dry. Grams only, no percent.
  const subline = (
    dry
      ? [computed.cookedGrams !== null && `${formatGrams(computed.cookedGrams)} г готового`]
      : [baseRaw !== null && `${formatGrams(baseRaw)} г ${rawWord(cooking.kind)}`]
  ).filter((part): part is string => Boolean(part))

  // The answer in the view's grams. Not weighed yet: no answer at all, only the name (docs/SPEC.md §3б).
  const viewGrams = dry ? baseRaw : computed.cookedGrams
  const shownNumber = viewGrams !== null ? formatGrams(viewGrams) : null
  const answered = shownNumber !== null || grams.own || grams.active
  const copyRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<SwipeRowHandle>(null)

  // A tap anywhere on the row but its fields and buttons chooses who «− +» adjust.
  const choose = (e: MouseEvent<HTMLElement>) => {
    if (onChoose && !(e.target as HTMLElement).closest('input, button, label')) onChoose()
  }

  return (
    <SwipeRow
      ref={rowRef}
      as="li"
      itemId={computed.portionId}
      className={cn('flex flex-col gap-1 rounded-xl px-2 py-3 transition-colors', chosen && 'bg-[color-mix(in_oklab,var(--muted)_60%,var(--background))] dark:bg-[color-mix(in_oklab,var(--muted)_20%,var(--background))]', onChoose && 'cursor-pointer')}
      onRemove={onRemove}
      onCopy={computed.share !== null ? () => copyRef.current?.click() : null}
    >
      <div className="flex items-center gap-2" onClick={choose}>
        {/* The lid sits on the name's line, not on the row's top: with or without a line under the name, the
            two stay level, and the name block is centred on the answer. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className={cn('size-3.5 shrink-0 rounded-[5px]', lidFill(place), chosen && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}
            />
            {onRename ? (
              <Input
                aria-label="Имя"
                placeholder="Имя"
                value={name}
                enterKeyHint="done"
                onChange={(e) => onRename(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                // As wide as the name, not the row: the free space beside it chooses the person.
                size={Math.max(name.length, 3)}
                className={cn(
                  'h-9 w-auto max-w-full min-w-12 border-transparent bg-transparent px-1 text-base font-medium shadow-none field-sizing-content hover:border-input focus-visible:border-input dark:bg-transparent',
                  chosen && 'font-semibold',
                )}
              />
            ) : (
              // The same place as the name field, without the field.
              <span className={cn('flex h-9 items-center px-1 text-base font-medium', chosen && 'font-semibold')}>{name}</span>
            )}
          </div>
          {(subline.length > 0 || grams.own) && (
            // Each part stays whole («13 г сухого»); the line wraps only between parts. Under the name, past the lid.
            <span className="pr-1 pl-[26px] text-sm leading-snug text-muted-foreground tabular-nums">
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
        {/* Right: what to put on the plate, in grams. Tap the number to type an own portion. */}
        {answered && (
          <label
            htmlFor={grams.id}
            className={cn(
              'flex min-h-14 shrink-0 cursor-text items-center rounded-xl border px-2 py-1 transition-colors',
              grams.active ? 'border-border bg-card' : 'border-transparent hover:bg-muted/50',
            )}
          >
            <span className="flex items-baseline text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">
              <DigitsInput
                id={grams.id}
                aria-label={`${name || 'Человек'}: своя порция, ${dry ? `граммы ${rawWord(cooking.kind)}` : 'граммы'}`}
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
              <span aria-hidden className="ml-1 text-base font-normal text-muted-foreground">
                г
              </span>
            </span>
          </label>
        )}
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
        // The recipe is part of the row: a tap on it chooses the person too.
        <div onClick={choose}>
          <PortionRecipe cooking={cooking} raw={computed.raw} open={recipe.open} oneColumn={recipe.oneColumn} className="pr-12 pl-[26px]" />
        </div>
      )}
    </SwipeRow>
  )
}
