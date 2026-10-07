import { EllipsisIcon, SettingsIcon, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { SETTINGS_PATH } from '@/app/paths'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { needsAttention, useSyncStore } from '@/store/sync'

export type MoreMenuItem = {
  label: string
  icon: LucideIcon
  /** Red, like the action it starts (e.g. «Удалить блюдо»). */
  destructive?: boolean
} & ({ to: string; onSelect?: never } | { onSelect: () => void; to?: never })

/** 44 px to tap with a busy hand, text as in the rest of the app. */
const ITEM = 'min-h-11 gap-2.5 px-2.5 text-base'

/** «Нужно внимание»: the same warning dot the settings have always had. */
const DOT = 'size-2.5 rounded-full bg-warning ring-2 ring-background'

/**
 * «⋯» at the right of a screen's header: the screen's rare actions, then «Настройки» — the same menu
 * everywhere, so the header keeps its width for what is used at the stove. When the user has to act
 * (sign in again, update the app), a dot on «⋯» and on «Настройки», where the status is.
 */
export function MoreMenu({ items = [] }: { items?: MoreMenuItem[] }) {
  const attention = useSyncStore((s) => needsAttention(s.status))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="relative size-11 shrink-0 rounded-full" aria-label={attention ? 'Ещё: в настройках нужно внимание' : 'Ещё'}>
          <EllipsisIcon />
          {attention && <span aria-hidden className={cn('absolute top-2 right-2', DOT)} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {items.map((item) =>
          item.to !== undefined ? (
            <DropdownMenuItem key={item.label} asChild className={ITEM} variant={item.destructive ? 'destructive' : 'default'}>
              <Link to={item.to}>
                <item.icon />
                <span className="truncate">{item.label}</span>
              </Link>
            </DropdownMenuItem>
          ) : (
            // The menu closes first, then the action opens what it opens (docs/UX.md §3а).
            <DropdownMenuItem key={item.label} className={ITEM} variant={item.destructive ? 'destructive' : 'default'} onSelect={item.onSelect}>
              <item.icon />
              <span className="truncate">{item.label}</span>
            </DropdownMenuItem>
          ),
        )}
        {items.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild className={ITEM}>
          <Link to={SETTINGS_PATH}>
            <SettingsIcon />
            Настройки
            {attention && <span aria-label="нужно внимание" className={cn('ml-auto', DOT)} />}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
