import { CheckIcon, SearchIcon, XIcon } from 'lucide-react'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { buttonVariants } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { type PopularFilter, type PopularView } from '@/domain'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { categoryLabel } from '@/i18n/format'

interface PopularFiltersProps {
  query: string
  onQueryChange: (query: string) => void
  filter: PopularFilter
  onFilterChange: (filter: PopularFilter) => void
  counts: PopularView['counts']
  /** Whether anything was ever ticked: «Отмечено» appears with the first tick and stays while chosen. */
  anyPicked: boolean
}

/** The search field and the filter chips (docs/UX.md §3г); the chips scroll sideways. */
export function PopularFilters({ query, onQueryChange, filter, onFilterChange, counts, anyPicked }: PopularFiltersProps) {
  const typed = query.trim() !== ''
  const chip = (key: PopularFilter, label: string, count: number, icon?: React.ReactNode) => {
    const chosen = filter === key
    // With text, a category with no match is dimmed and cannot be chosen.
    const empty = typed && count === 0 && !chosen
    return (
      <button
        key={key}
        type="button"
        aria-pressed={chosen}
        disabled={empty}
        onClick={() => onFilterChange(key)}
        className="group/chip flex h-11 shrink-0 items-center rounded-full outline-none disabled:pointer-events-none"
      >
        <span
          className={cn(
            buttonVariants({ variant: 'secondary' }),
            'h-9 rounded-full px-3.5 text-sm group-focus-visible/chip:ring-[3px] group-focus-visible/chip:ring-ring/50',
            chosen && 'bg-card font-semibold ring-2 ring-foreground ring-inset hover:bg-card',
            empty && 'opacity-50',
          )}
        >
          {icon}
          {label}
          <span className="font-normal text-muted-foreground tabular-nums">{count}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <InputGroup className="h-12">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Escape' || !query) return
            e.preventDefault()
            onQueryChange('')
          }}
          placeholder={t('common.searchPlaceholder')}
          aria-label={t('common.findDish')}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="text-base md:text-base"
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              className="size-10 rounded-full"
              aria-label={t('common.clear')}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onQueryChange('')}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      <div
        role="group"
        aria-label={t('dishes.popular.filter')}
        className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chip('all', t('dishes.popular.all'), counts.all)}
        {(anyPicked || filter === 'picked') && chip('picked', t('dishes.popular.picked'), counts.picked, <CheckIcon className="size-4" />)}
        {counts.categories.map(({ category, count }) =>
          chip(category, categoryLabel(category), count, <DishCategoryIcon category={category} className={cn('size-4', filter === category && 'text-foreground')} />),
        )}
      </div>
    </div>
  )
}
