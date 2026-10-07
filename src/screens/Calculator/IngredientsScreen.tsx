import { useLocation, useOutletContext, useResolvedPath } from 'react-router'
import { ScreenHeader } from '@/components/ScreenHeader'
import { NumberField } from '@/components/NumberField'
import { formatGrams, formatInput, ingredientDisplayName, parseGrams, type Ingredient } from '@/domain'
import { calculatorFieldId, focusOrBlur } from '@/lib/domIds'
import { cn } from '@/lib/utils'
import type { CalculatorOutlet } from './calculatorOutlet'

/**
 * `#/d/:id/ingredients` — the raw weights of a composite dish on a screen of its own (docs/UX.md §3а):
 * «Сырой» above, the counted ingredients, then «Не в счёт». A weight typed here goes into the dish at once,
 * as it did on the calculator's tiles; the calculator under this screen stays as it was.
 */
export function IngredientsScreen() {
  const { ingredients, backLabel } = useOutletContext<CalculatorOutlet>()
  const { search } = useLocation()
  const backTo = useResolvedPath('..').pathname + search
  const { list, texts, total, onText, dishName } = ingredients
  const counted = list.filter((i) => !i.excluded)
  const uncounted = list.filter((i) => i.excluded)
  const order = [...counted, ...uncounted]
  // Enter moves to the next weight; from the last one the keyboard closes.
  const next = (id: string) => {
    const at = order.findIndex((i) => i.id === id)
    focusOrBlur(at !== -1 && at < order.length - 1 ? calculatorFieldId(order[at + 1].id) : null)
  }

  const row = (i: Ingredient) => {
    const parsed = parseGrams(texts[i.id] ?? '')
    return (
      <li key={i.id} className="flex min-h-14 items-center gap-3 border-t py-1 pr-2 pl-4 first:border-t-0">
        <span className={cn('min-w-0 flex-1 truncate', i.excluded && 'text-muted-foreground')} title={ingredientDisplayName(i)}>
          {ingredientDisplayName(i)}
        </span>
        <NumberField
          id={calculatorFieldId(i.id)}
          ariaLabel={`${ingredientDisplayName(i)}, граммы`}
          className="w-32 shrink-0"
          align="end"
          placeholder="0"
          value={parsed.ok ? parsed.value : null}
          onValueChange={(value) => onText(i.id, value === null ? '' : formatInput(value))}
          onEnter={() => next(i.id)}
        />
      </li>
    )
  }

  return (
    <>
      <ScreenHeader title="Ингредиенты" subtitle={dishName} back backTo={backTo} backLabel={backLabel} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 px-3 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <p className="flex items-baseline justify-between px-1">
          <span className="text-sm text-muted-foreground">Сырой</span>
          <span className="text-3xl leading-tight font-medium tabular-nums">
            {total !== null ? formatGrams(total) : <span className="text-muted-foreground/50">0</span>}
            <span className="ml-1 text-base font-normal text-muted-foreground">г</span>
          </span>
        </p>
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul>{counted.map(row)}</ul>
          {uncounted.length > 0 && (
            <>
              <div className="flex items-baseline justify-between border-t px-4 pt-3.5 pb-1.5 text-xs font-medium text-muted-foreground">
                <h2>Не в счёт</h2>
                <span>в порции не попадают</span>
              </div>
              <ul>{uncounted.map(row)}</ul>
            </>
          )}
        </div>
        <p className="px-1 text-sm text-muted-foreground">Блюдо запомнит эти веса. Поменять сам состав — «⋯» → «Изменить блюдо».</p>
      </main>
    </>
  )
}
