import { useRef, useState, type ReactNode } from 'react'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DISH_CATEGORIES, type DishCategory } from '@/domain'
import { t } from '@/i18n'
import { categoryLabel } from '@/i18n/format'
import { cn } from '@/lib/utils'

/**
 * The category field on a phone: a button that opens a bottom sheet with the list. The list scrolls inside
 * the sheet when it does not fit. Same choice as the desktop `Select` next to it (`null` = «По названию»).
 */
export function CategorySheet({
  id,
  labelId,
  value,
  detected,
  onChange,
  className,
}: {
  id: string
  labelId: string
  value: DishCategory | null
  detected: DishCategory
  onChange: (category: DishCategory | null) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const shown = value ?? detected

  const pick = (category: DishCategory | null) => {
    onChange(category)
    setOpen(false)
  }

  // On open the chosen row is moved to the middle of the screen (or as close as the list allows), so a row
  // below the fold is not hidden. Offsets are layout offsets, so the slide-in animation does not skew them.
  // Focus goes to that row without scrolling the page: the list has already been moved there.
  const focusChosen = (event: Event) => {
    event.preventDefault()
    const list = listRef.current
    const chosen = list?.querySelector<HTMLElement>('[aria-checked="true"]')
    const sheet = list?.closest<HTMLElement>('[data-slot="sheet-content"]')
    if (!list || !chosen || !sheet) return
    const rowCentre = sheet.offsetTop + list.offsetTop + chosen.offsetTop + chosen.offsetHeight / 2
    list.scrollTop = rowCentre - window.innerHeight / 2
    chosen.focus({ preventScroll: true })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button id={id} variant="outline" aria-labelledby={`${labelId} ${id}`} className={cn('h-11 w-full justify-between px-2.5 font-normal', className)}>
          <span className="flex min-w-0 items-center gap-2">
            <DishCategoryIcon category={shown} className="size-4" />
            <span className="truncate">{categoryLabel(shown)}</span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{t(value ? 'editor.categoryManual' : 'editor.categoryAuto')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" onOpenAutoFocus={focusChosen} className="max-h-[85dvh] gap-0 p-0 pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>{t('editor.category')}</SheetTitle>
        </SheetHeader>
        <div ref={listRef} role="radiogroup" aria-label={t('editor.category')} className="relative overflow-y-auto overscroll-contain px-2 pb-4">
          <CategoryOption checked={value === null} onSelect={() => pick(null)}>
            <DishCategoryIcon category={detected} className="size-5 text-muted-foreground" />
            <span>
              {t('editor.categoryAutoItem')} <span className="text-muted-foreground">· {categoryLabel(detected)}</span>
            </span>
          </CategoryOption>
          <div role="separator" className="my-1 h-px bg-border" />
          {DISH_CATEGORIES.map((c) => (
            <CategoryOption key={c} checked={value === c} onSelect={() => pick(c)}>
              <DishCategoryIcon category={c} className="size-5 text-muted-foreground" />
              <span>{categoryLabel(c)}</span>
            </CategoryOption>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** One row of the sheet: at least 48 px tall for a finger, the chosen one is outlined (UX §3а). */
function CategoryOption({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        checked ? 'bg-card font-medium ring-2 ring-foreground ring-inset' : 'hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}
