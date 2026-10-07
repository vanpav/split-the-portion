import { CheckIcon, PlusIcon } from 'lucide-react'
import { useEffect } from 'react'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { Highlight } from '@/components/DishSearch/Highlight'
import { NumberField } from '@/components/NumberField'
import { dishCategory, dishRow, type PresetDish } from '@/domain'
import { cn } from '@/lib/utils'

interface PopularRowProps {
  preset: PresetDish
  query: string
  picked: boolean
  /** The user has a dish with this title already: «уже есть» instead of the weight and the mark. */
  taken: boolean
  grams: number | null
  /** DOM id of the weight field: «Добавить» and Enter move the focus by it. */
  fieldId: string
  onPick: () => void
  onUnpick: () => void
  onGrams: (grams: number | null) => void
  onInvalid: (invalid: boolean) => void
  onEnter: () => void
}

/** The weight must be a number above zero or empty. */
const positive = (value: number | null) => (value !== null && value <= 0 ? 'Введи число больше нуля' : null)

/**
 * One popular dish (docs/UX.md §3г): category icon, title with the products of a composite one, the
 * weight field and a round mark. A tap on the row or on the weight ticks it; the mark ticks and unticks.
 */
export function PopularRow({ preset, query, picked, taken, grams, fieldId, onPick, onUnpick, onGrams, onInvalid, onEnter }: PopularRowProps) {
  const row = dishRow(preset, query)
  const toggle = picked ? onUnpick : onPick
  // A row that leaves the list (another filter) takes the text typed in its field along: it is not invalid any more.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => onInvalid(false), [])
  return (
    <li
      data-picked={picked || undefined}
      onClick={(e) => {
        // The field and the mark have their own taps.
        if (taken || (e.target as HTMLElement).closest('input, button')) return
        toggle()
      }}
      className={cn('flex min-h-14 items-center gap-3 rounded-lg px-3 py-1', !taken && 'cursor-pointer hover:bg-muted/50')}
    >
      <DishCategoryIcon category={dishCategory(preset)} className={cn('size-[18px]', picked && 'text-foreground')} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('line-clamp-2 text-base', picked && 'font-medium', taken && 'text-muted-foreground')}>
          {row.foundBy ? row.title : <Highlight text={row.title} query={query} />}
        </span>
        {row.second && (
          <span className="truncate text-xs text-muted-foreground">
            {row.foundBy ? <Highlight text={row.second} query={query} /> : row.second}
          </span>
        )}
      </span>
      {taken ? (
        <span className="shrink-0 pr-1 text-sm text-muted-foreground">уже есть</span>
      ) : (
        <>
          <NumberField
            id={fieldId}
            ariaLabel={`Вес: ${row.title}`}
            value={grams}
            onValueChange={onGrams}
            validate={positive}
            onInvalidChange={onInvalid}
            hideError
            keepInvalid
            selectOnFocus
            placeholder="—"
            onFocus={onPick}
            onEnter={onEnter}
            className="w-[88px] shrink-0"
            groupClassName={cn(picked ? 'bg-card dark:bg-card' : 'border-transparent bg-transparent dark:bg-transparent')}
            inputClassName={cn('text-right tabular-nums', picked ? 'font-medium' : 'text-muted-foreground')}
          />
          <button
            type="button"
            aria-label={`${picked ? 'Снять' : 'Отметить'}: ${row.title}`}
            aria-pressed={picked}
            onClick={toggle}
            className="-mr-1.5 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full',
                picked ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground',
              )}
            >
              {picked ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
            </span>
          </button>
        </>
      )}
    </li>
  )
}
