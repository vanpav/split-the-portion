import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { settingsPath } from '@/app/paths'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { SETTINGS_SECTIONS, type SettingsSectionId } from './sections'

interface SettingsMenuProps {
  /** The subsection open by its address. */
  current?: SettingsSectionId
  /** Shown on the right from `md` without being in the address (`#/settings`): highlighted from `md` only. */
  shown?: SettingsSectionId
  className?: string
}

/**
 * Settings subsections. On a phone a list of rows leading to their screens;
 * from `md` a menu on the left of the open subsection.
 */
export function SettingsMenu({ current, shown, className }: SettingsMenuProps) {
  const email = useAccountStore((s) => s.me?.user.email)
  return (
    <nav aria-label="Подразделы настроек" className={className}>
      <ul className="divide-y overflow-hidden rounded-xl border md:flex md:flex-col md:gap-1 md:divide-y-0 md:rounded-none md:border-0">
        {SETTINGS_SECTIONS.map(({ id, title, description, Icon }) => (
          <li key={id}>
            <Item
              asChild
              className={cn(
                'min-h-14 flex-nowrap rounded-none md:min-h-11 md:rounded-lg',
                id === current && 'bg-muted',
                id === shown && 'md:bg-muted',
              )}
            >
              <Link to={settingsPath(id)} aria-current={id === current ? 'page' : undefined}>
                <ItemMedia variant="icon">
                  <Icon className="size-5 text-muted-foreground" />
                </ItemMedia>
                <ItemContent className="min-w-0 gap-0.5">
                  <ItemTitle className={cn('text-base', (id === current || id === shown) && 'md:font-semibold')}>
                    {title}
                  </ItemTitle>
                  <ItemDescription className="truncate md:hidden">
                    {id === 'account' && email ? email : description}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="md:hidden">
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </ItemActions>
              </Link>
            </Item>
          </li>
        ))}
      </ul>
    </nav>
  )
}
