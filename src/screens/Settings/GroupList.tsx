import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { customName, groupLabel, peopleLabel } from '@/account/groupLabel'
import type { AccountGroup } from '@/account/types'
import { groupPath } from '@/app/paths'
import { PeopleStack } from '@/components/PeopleStack'
import { t } from '@/i18n'

interface GroupListProps {
  groups: AccountGroup[]
  openId: string
  myId: string
}

/**
 * «Твои группы»: each group named by its people («Ваня и ты») or by the name it was given, with
 * the people under it; the open one says so. A row leads to the group's own screen, like «Создать
 * группу» leads to its own: nothing unfolds in the list.
 */
export function GroupList({ groups, openId, myId }: GroupListProps) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {groups.map((g) => {
        const isOpen = g.id === openId
        return (
          <li key={g.id}>
            <Link
              to={groupPath(g.id)}
              aria-current={isOpen || undefined}
              className="flex min-h-16 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60"
            >
              <PeopleStack members={g.members} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{groupLabel(g, myId)}</span>
                {customName(g.name) && (
                  <span className="truncate text-sm text-muted-foreground">{peopleLabel(g.members, myId)}</span>
                )}
              </span>
              {/* With one group, «open» tells nothing. */}
              {isOpen && groups.length > 1 && (
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground">
                  {t('settings.groupScreen.openBadge')}
                </span>
              )}
              <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
