import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { SETTINGS_PATH, settingsPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { groupLabel } from '@/account/groupLabel'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
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
  const me = useAccountStore((s) => s.me)
  const openId = useSyncStore((s) => s.groupId)
  const openGroup = me?.groups.find((g) => g.id === openId)
  const groupName = openGroup && groupLabel(openGroup)
  const { hasPrevious, noPreviousState } = useBack(SETTINGS_PATH)
  // From an open subsection (the menu beside it, from `md`) switching replaces it, so «←» leaves
  // the settings instead of walking through every subsection seen.
  const replace = current !== undefined
  // What is said under a title: the account's email and the open group instead of the defaults.
  const said = (id: SettingsSectionId, description: string) =>
    (id === 'account' && me?.user.email) || (id === 'group' && groupName) || description
  return (
    <nav aria-label="Подразделы настроек" className={className}>
      <ul className="divide-y overflow-hidden rounded-xl border md:flex md:flex-col md:gap-1 md:divide-y-0 md:rounded-none md:border-0">
        {SETTINGS_SECTIONS.filter((s) => s.id !== 'group' || groupName).map(({ id, title, description, Icon }) => (
          <li key={id}>
            <Item
              asChild
              className={cn(
                'min-h-14 flex-nowrap rounded-none md:min-h-11 md:rounded-lg',
                id === current && 'bg-muted',
                id === shown && 'md:bg-muted',
              )}
            >
              <Link
                to={settingsPath(id)}
                replace={replace}
                state={replace && !hasPrevious ? noPreviousState : undefined}
                aria-current={id === current ? 'page' : undefined}
              >
                <ItemMedia variant="icon">
                  <Icon className="size-5 text-muted-foreground" />
                </ItemMedia>
                <ItemContent className="min-w-0 gap-0.5">
                  <ItemTitle className={cn('text-base', (id === current || id === shown) && 'md:font-semibold')}>
                    {title}
                  </ItemTitle>
                  <ItemDescription className="truncate md:hidden">
                    {said(id, description)}
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
