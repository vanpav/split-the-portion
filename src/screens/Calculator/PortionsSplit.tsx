import { MinusIcon, PlusIcon } from 'lucide-react'
import { CopyButton } from '@/components/CopyButton'
import { Button } from '@/components/ui/button'
import {
  formatGrams,
  MAX_SPLIT_PORTIONS,
  nudgePortions,
  portionsLabel,
  rawAmountsCopyText,
  splitDish,
  type Cooking,
} from '@/domain'
import { rawWord } from './messages'
import { RawList } from './RawList'

interface PortionsSplitProps {
  /** Today's dish in the calculator; its people do not count here, the whole dish is split. */
  cooking: Cooking
  /** How many portions: remembered per dish on this device. */
  count: number
  onCount: (n: number) => void
}

/**
 * «Режим порций» (docs/SPEC.md §3б): the whole dish in equal portions instead of people — meal prep
 * for six days, then five. − and + take one portion away or add one; each row is what goes in a box.
 */
export function PortionsSplit({ cooking, count, onCount }: PortionsSplitProps) {
  const split = splitDish(cooking, count)
  if (!split) return null
  const single = split.baseRaw !== null
  const copyText = rawAmountsCopyText(cooking, split.raw) || null

  return (
    <section aria-label="Порции" className="flex flex-col gap-2 px-1">
      <div className="flex min-h-11 items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Меньше порций"
          disabled={count <= 1}
          onClick={() => onCount(nudgePortions(count, -1))}
        >
          <MinusIcon />
        </Button>
        <span className="text-base font-semibold tabular-nums" aria-live="polite">
          {portionsLabel(count)}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Больше порций"
          disabled={count >= MAX_SPLIT_PORTIONS}
          onClick={() => onCount(nudgePortions(count, 1))}
        >
          <PlusIcon />
        </Button>
      </div>
      <ul className="flex flex-col divide-y">
        {Array.from({ length: count }, (_, index) => {
          const name = `Порция ${index + 1}`
          const cooked = split.cookedGrams?.[index] ?? null
          return (
            <li key={index} className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-col px-1">
                  <span className="text-base font-medium">{name}</span>
                  {single && split.baseRaw !== null && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatGrams(split.baseRaw)} г {rawWord(cooking.kind)}
                    </span>
                  )}
                </div>
                <span className="text-3xl leading-tight font-medium whitespace-nowrap tabular-nums max-[360px]:text-2xl">
                  {cooked !== null ? `${formatGrams(cooked)} г` : <span className="text-muted-foreground/50">—</span>}
                </span>
                <CopyButton label={`Скопировать для трекера: ${name}`} disabled={!copyText} getText={() => copyText} />
              </div>
              {!single && <RawList cooking={cooking} raw={split.raw} />}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
