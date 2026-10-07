import { Link } from 'react-router'
import { SETTINGS_PATH, settingsPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { CLUSTER_TITLES, SETTINGS_SECTIONS, type SettingsCluster, type SettingsSectionId } from './sections'

interface SettingsMenuProps {
  /** The subsection open by its address. */
  current?: SettingsSectionId
  /** Shown on the right without being in the address (`#/settings`). */
  shown?: SettingsSectionId
  className?: string
}

const CLUSTERS: SettingsCluster[] = ['account', 'kitchen', 'app']

/**
 * From `md`: the menu on the left of the open subsection, in the same clusters as the phone's hub
 * (SettingsHub). Switching replaces the address, so «←» and the system «назад» leave the settings in
 * one step instead of walking through every subsection seen.
 */
export function SettingsMenu({ current, shown, className }: SettingsMenuProps) {
  const inGroup = useSyncStore((s) => s.groupId !== null)
  const signedIn = useAccountStore((s) => s.me !== null)
  const { hasPrevious, noPreviousState } = useBack(SETTINGS_PATH)
  const sections = SETTINGS_SECTIONS.filter((s) => s.id !== 'group' || (signedIn && inGroup))

  return (
    <nav aria-label="Подразделы настроек" className={cn('flex flex-col gap-5', className)}>
      {CLUSTERS.map((cluster) => {
        const title = CLUSTER_TITLES[cluster]
        return (
          <div key={cluster} className="flex flex-col gap-1">
            {title && <h2 className="px-3 pb-1 text-sm font-medium text-muted-foreground">{title}</h2>}
            <ul className="flex flex-col gap-1">
              {sections
                .filter((s) => s.cluster === cluster)
                .map(({ id, title, Icon }) => {
                  const active = id === current || id === shown
                  return (
                    <li key={id}>
                      <Item asChild className={cn('min-h-11 flex-nowrap rounded-lg py-2', active && 'bg-card ring-2 ring-foreground ring-inset')}>
                        <Link
                          to={settingsPath(id)}
                          replace
                          state={hasPrevious ? undefined : noPreviousState}
                          aria-current={id === current ? 'page' : undefined}
                        >
                          <ItemMedia variant="icon">
                            <Icon className={cn('size-5', active ? 'text-foreground' : 'text-muted-foreground')} />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle className={cn('text-base', active && 'font-semibold')}>{title}</ItemTitle>
                          </ItemContent>
                        </Link>
                      </Item>
                    </li>
                  )
                })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
