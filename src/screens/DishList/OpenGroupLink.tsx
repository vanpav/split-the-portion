import { HouseIcon } from 'lucide-react'
import { Link } from 'react-router'
import { groupLabel } from '@/account/groupLabel'
import { settingsPath } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { t } from '@/i18n'

/** In more than one group, the list says whose dishes these are; a tap leads to switching. */
export function OpenGroupLink() {
  // The selector returns what the store holds: a fresh `[]` on each call would re-render forever (React #185).
  const groups = useAccountStore((s) => s.me?.groups) ?? []
  const openId = useSyncStore((s) => s.groupId)
  const myId = useAccountStore((s) => s.me?.user.id)
  const group = groups.find((g) => g.id === openId)
  if (groups.length < 2 || !group) return null
  return (
    <Button variant="ghost" asChild className="max-w-40 text-muted-foreground">
      <Link to={settingsPath('group')} aria-label={t('dishes.menu.groupSwitch', { group: groupLabel(group, myId) })}>
        <HouseIcon data-icon="inline-start" />
        <span className="truncate">{groupLabel(group, myId)}</span>
      </Link>
    </Button>
  )
}
