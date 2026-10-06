import { CookingPotIcon, HistoryIcon, PlusIcon, SettingsIcon, SoupIcon, type LucideIcon } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'
import { dishListPath, HISTORY_PATH, LIST_TAB_PARAM, newDishPath } from './paths'

const ITEM =
  'group/tab flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:flex-none lg:py-2'

const tabLink = (to: string, label: string, Icon: LucideIcon, active: boolean) => {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(ITEM, active ? 'font-semibold text-foreground' : 'font-medium text-foreground/70 hover:text-foreground')}
    >
      {/* The active item is circled: visible at a glance, not only by color. Filled is «Добавить». */}
      <span
        className={cn(
          'flex h-9 w-16 max-[360px]:w-12 items-center justify-center rounded-full border-2 transition-colors',
          active ? 'border-primary' : 'border-transparent group-hover/tab:bg-muted',
        )}
      >
        <Icon className={cn('size-6', active ? 'stroke-[2.25]' : 'stroke-2')} />
      </span>
      {label}
    </Link>
  )
}

/**
 * The app's main navigation, as in mobile apps: dish lists, «Добавить» (the dish form) in the middle,
 * the history of all cookings, settings.
 * Shown on top-level screens only; detail screens keep the bottom for their own actions.
 * From `lg` it is a rail on the left: a bottom bar is a phone pattern.
 */
export function TabBar() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const list = pathname === '/'
  const composite = params.get(LIST_TAB_PARAM) === 'composite'

  return (
    <nav
      aria-label="Разделы"
      className="sticky bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_12px_-6px_rgb(0_0_0/0.12)] lg:shadow-none pb-[env(safe-area-inset-bottom)] backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-24 lg:border-t-0 lg:border-r lg:pb-0"
    >
      <div className="mx-auto flex max-w-2xl items-stretch gap-1 px-2 py-1 lg:h-full lg:flex-col lg:justify-start lg:gap-2 lg:px-2 lg:py-4">
        {tabLink(dishListPath('simple'), 'Простые', CookingPotIcon, list && !composite)}
        {tabLink(dishListPath('composite'), 'Составные', SoupIcon, list && composite)}
        <Link to={newDishPath()} className={cn(ITEM, 'font-medium text-foreground/70 hover:text-foreground')}>
          <span className="flex h-9 w-16 max-[360px]:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity group-hover/tab:opacity-90">
            <PlusIcon className="size-6 stroke-[2.5]" />
          </span>
          Добавить
        </Link>
        {tabLink(HISTORY_PATH, 'История', HistoryIcon, pathname === HISTORY_PATH)}
        {tabLink('/settings', 'Настройки', SettingsIcon, pathname === '/settings')}
      </div>
    </nav>
  )
}
