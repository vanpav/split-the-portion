import { XIcon } from 'lucide-react'
import { Fragment, type KeyboardEvent } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { HoldButton } from '@/components/HoldButton'
import { lidFill } from '@/components/lids'
import { Input } from '@/components/ui/input'
import {
  baseRawGrams,
  formatGrams,
  formatPercent,
  rawAmountsCopyText,
  type Cooking,
  type CookingResult,
  type PortionResult,
} from '@/domain'
import { cn } from '@/lib/utils'
import { DigitsInput } from './DigitsInput'
import { rawWord } from './messages'
import { RawList } from './RawList'

interface PersonResultProps {
  cooking: Cooking
  result: CookingResult
  name: string
  /** Place in today's lineup: the person's lid color, the same as on the share bar. */
  place: number
  /** People eating today: the caret blinks through their lid colors. */
  lids: number
  computed: PortionResult
  onRename: (name: string) => void
  onRemove: () => void
  /** «×» is held this long before the person is removed; 0 — a tap. */
  holdMs: number
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
}

/**
 * «Ваня — 168 г»: the answer, large, with its raw counterpart under it. Shares live on the slider.
 * The name is edited in place; × takes the person out of today's lineup.
 */
export function PersonResult({
  cooking,
  result,
  name,
  place,
  lids,
  computed,
  onRename,
  onRemove,
  holdMs,
  grams,
  percent,
  onReleaseOwn,
}: PersonResultProps) {
  const single = result.baseIngredientId !== null
  const baseRaw = computed.share !== null ? baseRawGrams(result, computed.raw) : null
  // Under the name: own or not, the part of the dish, the raw counterpart.
  const inPercent = grams.unit === '%'
  // Under the name: the other unit of the answer (percent under grams, grams under percent), then raw.
  const subline = [
    inPercent
      ? computed.cookedGrams !== null && `${formatGrams(computed.cookedGrams)} г`
      : percent !== null && `${percent} %`,
    single && baseRaw !== null && `${formatGrams(baseRaw)} г ${rawWord(cooking.kind)}`,
  ].filter((part): part is string => Boolean(part))

  // The answer in the person's unit.
  const shownNumber = inPercent
    ? computed.share !== null ? formatPercent(computed.share) : null
    : computed.cookedGrams !== null ? formatGrams(computed.cookedGrams) : null

  return (
    <li className="flex flex-col gap-1 py-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className={cn('size-3.5 shrink-0 self-start mt-3 rounded-[5px]', lidFill(place))} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Input
            aria-label="Имя"
            placeholder="Имя"
            value={name}
            enterKeyHint="done"
            onChange={(e) => onRename(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="h-9 border-transparent bg-transparent px-1 text-base font-medium shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"
          />
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
                aria-label={`${name || 'Человек'}: своя порция, ${inPercent ? 'проценты' : 'граммы'}`}
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
        {/* Row actions, stacked: each half the row's height, so they stay out of the answer's way. */}
        <div className="flex shrink-0 flex-col">
          <CopyButton
            size="sm"
            label={`Скопировать для трекера: ${name}`}
            disabled={computed.share === null}
            getText={() => rawAmountsCopyText(cooking, computed.raw) || null}
          />
          <HoldButton
            holdMs={holdMs}
            className="w-10 text-muted-foreground"
            label={`Убрать ${name || 'человека'}`}
            hint="Удерживайте ×, чтобы убрать"
            onConfirm={onRemove}
          >
            <XIcon />
          </HoldButton>
        </div>
      </div>
      {!single && computed.share !== null && <RawList cooking={cooking} raw={computed.raw} />}
    </li>
  )
}
