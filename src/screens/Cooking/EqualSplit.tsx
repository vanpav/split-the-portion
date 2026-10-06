import { CopyButton } from '@/components/CopyButton'
import { NumberField } from '@/components/NumberField'
import {
  isValidSplitN,
  MAX_SPLIT_PORTIONS,
  rawAmountsCopyText,
  splitLeftover,
  type Cooking,
  type CookingResult,
} from '@/domain'
import { useAppStore } from '@/store/store'
import { focusOrBlur } from '@/lib/domIds'
import { RawList } from './RawList'

const nError = (n: number | null) =>
  n === null || isValidSplitN(n) ? null : `Целое число от 1 до ${MAX_SPLIT_PORTIONS}`

/** «Разделить на N»: what is left in the pot (the whole dish if nothing was taken) into equal parts. */
export function EqualSplit({ cooking, result }: { cooking: Cooking; result: CookingResult }) {
  const updateCooking = useAppStore((s) => s.updateCooking)
  const n = cooking.equalSplitN
  const split = n !== null ? splitLeftover(result, n) : null
  const allEqual = split !== null && split.cookedGrams.every((g) => g === split.cookedGrams[0])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <NumberField
          className="w-32 shrink-0"
          label="Разделить на"
          suffix="порц."
          value={n}
          validate={nError}
          onEnter={() => focusOrBlur(null)}
          onValueChange={(equalSplitN) => updateCooking(cooking.id, { equalSplitN })}
        />
        {split && (
          <div className="flex min-w-0 flex-1 items-end justify-between gap-2 self-end">
            <p className="min-h-11 content-center text-base">
              {allEqual ? (
                <>по <span className="font-medium">{split.cookedGrams[0]} г</span></>
              ) : (
                <span className="font-medium">{split.cookedGrams.join(' · ')} г</span>
              )}
            </p>
            <CopyButton
              label="Скопировать одну порцию для трекера"
              getText={() => rawAmountsCopyText(cooking, split.rawPerPortion) || null}
            />
          </div>
        )}
      </div>
      {split && <RawList cooking={cooking} raw={split.rawPerPortion} />}
    </div>
  )
}
