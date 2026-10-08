import { PencilIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { shelfScrollTarget } from '@/app/enterAnimation'
import { dishEditPath, dishPath, DISHES_PATH, newDishPath } from '@/app/paths'
import { DishCategoryIcon } from '@/components/DishCategoryIcon'
import { MoreMenu } from '@/components/MoreMenu'
import { Button, buttonVariants } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { dishCategory, recentDishes, shelfOrder, type Id } from '@/domain'
import { KEYBOARD_PROXY_ID } from '@/lib/domIds'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'
import { t } from '@/i18n'
import { dishTitle } from '@/i18n/format'

/** ⌘ on a Mac (and an iPad with a keyboard), Ctrl elsewhere: how the search shortcut is shown. */
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl '

/**
 * The calculator's header: a shelf of dishes, one tap to switch (docs/UX.md «Калькулятор»).
 * 🔍 — the dish menu — stays at the start, outside the scroll, always within reach; the current dish
 * is ringed, not filled. On the right, «⋯»: editing the dish, adding one, the settings.
 */
/** A chip tapped to switch the dish: the places of the current and the tapped chip, as shown. */
export interface ChipTap {
  id: Id
  /** `null` when the current dish is not on the shelf. */
  from: number | null
  to: number
}

interface DishShelfProps {
  currentId: Id | undefined
  onChipTap?: (tap: ChipTap) => void
  /** Under a screen over the calculator (docs/UX.md §3а): mounted, keeping its scroll, but not shown. */
  hidden?: boolean
  className?: string
}

export function DishShelf({ currentId, onChipTap, hidden, className }: DishShelfProps) {
  const dishes = useAppStore((s) => s.dishes)
  // The order is fixed while the shelf is open: typing a weight makes a dish the latest,
  // and its chip must not jump away under the finger. Dishes added meanwhile go first.
  const [order, setOrder] = useState(() => recentDishes(dishes).map((d) => d.id))
  const shown = shelfOrder(dishes, order)
  // Back in the app after a while (a phone keeps it open for days): the shelf is sorted anew,
  // nobody's finger is on it yet.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setOrder(recentDishes(useAppStore.getState().dishes).map((d) => d.id))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  const currentDish = dishes.find((d) => d.id === currentId)
  const currentRef = useRef<HTMLAnchorElement>(null)
  const shelfRef = useRef<HTMLElement>(null)
  // The current chip comes into sight only if it is out of it, clear of the faded edges: the shelf
  // does not jump under the finger. Opening the screen — at once; another dish on the shelf —
  // smoothly, unless the system asks to reduce motion. Only the shelf scrolls, not the page.
  const shelfShown = useRef(false)
  useEffect(() => {
    const shelf = shelfRef.current
    const chip = currentRef.current
    const smooth = shelfShown.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    shelfShown.current = true
    if (!shelf || !chip) return
    const style = getComputedStyle(shelf)
    const shelfBox = shelf.getBoundingClientRect()
    const chipBox = chip.getBoundingClientRect()
    const itemStart = chipBox.left - shelfBox.left + shelf.scrollLeft
    const left = shelfScrollTarget({
      scrollLeft: shelf.scrollLeft,
      width: shelf.clientWidth,
      itemStart,
      itemEnd: itemStart + chipBox.width,
      padStart: parseFloat(style.paddingLeft),
      padEnd: parseFloat(style.paddingRight),
    })
    if (left !== null) shelf.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' })
  }, [currentId])
  const navigate = useNavigate()
  // From a keyboard: ⌘K / Ctrl+K anywhere (by the key, so a Russian layout works too), or «/» when
  // not typing somewhere — as on most sites. Not while a screen over the calculator covers the shelf.
  useEffect(() => {
    if (hidden) return
    const onKeyDown = (e: KeyboardEvent) => {
      const modK = (e.metaKey || e.ctrlKey) && !e.altKey && e.code === 'KeyK'
      const slash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey
      if (!modK && !slash) return
      if (e.target instanceof HTMLElement && e.target.closest(modK ? '[role=dialog]' : 'input, textarea, [role=dialog]')) return
      e.preventDefault()
      navigate(DISHES_PATH)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, hidden])

  return (
    <header
      hidden={hidden}
      className={cn(
        'sticky top-0 z-10 border-b bg-background/95 pt-[max(0.25rem,env(safe-area-inset-top))] pb-1 backdrop-blur',
        className,
      )}
    >
      {/* The whole width, as every screen header: 🔍 at the left edge where «←» is elsewhere, «⋯» at the
          right one; on a desktop all the chips are in sight without scrolling sideways with a mouse. */}
      <div data-hint="shelf" className="flex min-h-14 w-full items-center gap-1 px-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="size-11 shrink-0 rounded-full" asChild>
              <Link
                to={DISHES_PATH}
                aria-label={t('common.findDish')}
                aria-keyshortcuts="Meta+K Control+K /"
                // An iPhone opens the keyboard only for a field focused in the tap itself: the invisible one
                // takes it now, the dish menu's search field takes it over once the menu is open.
                onClick={() => document.getElementById(KEYBOARD_PROXY_ID)?.focus()}
              >
                <SearchIcon />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            {t('common.findDish')}
            <Kbd>{MOD}K</Kbd>
            <Kbd>/</Kbd>
          </TooltipContent>
        </Tooltip>
        <nav
          ref={shelfRef}
          aria-label={t('common.dishes')}
          // Scrolls sideways under the thumb; the scrollbar would only take height. The edges fade, so a chip
          // running under them reads as «more this way», not as a cut; the padding keeps the ends clear of it.
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 pr-6 pl-3 [mask-image:linear-gradient(to_right,transparent,#000_0.75rem,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shown.map((dish, index) => {
            const current = dish.id === currentId
            return (
              // 44 px to tap, a smaller pill to look at: more dishes fit on the shelf.
              <Link
                key={dish.id}
                ref={current ? currentRef : undefined}
                to={dishPath(dish.id)}
                aria-current={current ? 'page' : undefined}
                onClick={() => {
                  if (current) return
                  const from = shown.findIndex((d) => d.id === currentId)
                  onChipTap?.({ id: dish.id, from: from === -1 ? null : from, to: index })
                }}
                className="group/chip flex h-11 shrink-0 items-center rounded-full outline-none"
              >
                <span
                  className={cn(
                    buttonVariants({ variant: 'secondary' }),
                    'h-9 rounded-full px-3.5 text-sm group-focus-visible/chip:ring-[3px] group-focus-visible/chip:ring-ring/50',
                    // Ringed, not flooded: the same mark as a chosen person.
                    current && 'bg-card font-semibold ring-2 ring-foreground ring-inset hover:bg-card',
                  )}
                >
                  <DishCategoryIcon category={dishCategory(dish)} className={cn('size-4', current && 'text-foreground')} />
                  {dishTitle(dish)}
                </span>
              </Link>
            )
          })}
        </nav>
        <MoreMenu
          items={[
            ...(currentDish ? [{ label: t('calculator.editDish', { name: dishTitle(currentDish) }), to: dishEditPath(currentDish.id), icon: PencilIcon }] : []),
            { label: t('dishes.menu.add'), to: newDishPath(), icon: PlusIcon },
          ]}
        />
      </div>
    </header>
  )
}
