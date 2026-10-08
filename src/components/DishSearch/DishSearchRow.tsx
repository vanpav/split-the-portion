import { PlusIcon } from 'lucide-react'
import { CommandItem } from '@/components/ui/command'
import { type DishCategory, type DishRow } from '@/domain'
import { cn } from '@/lib/utils'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { Highlight } from './Highlight'
import { t } from '@/i18n'
import { formatGrams } from '@/i18n/format'

interface DishSearchRowProps {
  /** Unique in the list: cmdk keeps the selection by it. */
  value: string
  row: Pick<DishRow, 'title' | 'second' | 'foundBy'> & { weight?: number | null }
  query: string
  /** The dish's category: its icon stands at the start of the row; none (the create row) — no icon. */
  category?: DishCategory
  /** «+»: a tap adds something (a popular dish, a pick for the form, a new dish). */
  mark?: 'add' | 'create'
  onSelect: () => void
}

/**
 * One row of every dish list («Блюда», «Из блюда»; docs/UX.md «Меню блюд»): the title, a quiet second
 * line, the usual weight on the right, «+» when a tap adds. 48 px and more. The query is marked in the
 * title, or in the second line when the dish was found by a product or by its category.
 */
export function DishSearchRow({ value, row, query, category, mark, onSelect }: DishSearchRowProps) {
  const create = mark === 'create'
  return (
    <CommandItem value={value} onSelect={onSelect} className="min-h-12 gap-3 px-3 py-2 text-base [&>svg]:hidden">
      {category && <DishCategoryIcon category={category} className="size-[18px]" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate', create && 'text-primary')}>
          {row.foundBy || create ? row.title : <Highlight text={row.title} query={query} />}
        </span>
        {row.second && (
          <span className="truncate text-xs text-muted-foreground">
            {row.foundBy ? <Highlight text={row.second} query={query} /> : row.second}
          </span>
        )}
      </span>
      {row.weight != null && (
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{t('common.grams', { value: formatGrams(row.weight) })}</span>
      )}
      {mark && (
        <span
          aria-hidden
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            create ? 'border border-dashed border-primary text-primary' : 'bg-secondary text-secondary-foreground',
          )}
        >
          <PlusIcon className="size-4" />
        </span>
      )}
    </CommandItem>
  )
}
