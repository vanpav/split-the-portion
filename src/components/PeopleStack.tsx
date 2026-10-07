import type { GroupMember } from '@/account/types'
import { AvatarGroup } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { PersonAvatar } from './PersonAvatar'

/** Enough faces to recognise a group; the rest are counted. */
const SHOWN = 3

/** A group's people as overlapping avatars, like the lids of a company stacked on the hub. */
export function PeopleStack({ members, className }: { members: GroupMember[]; className?: string }) {
  const rest = members.length - SHOWN
  return (
    <AvatarGroup aria-hidden className={cn('shrink-0 *:data-[slot=avatar]:ring-card', className)}>
      {members.slice(0, SHOWN).map((m) => (
        <PersonAvatar key={m.memberId} person={m} className="size-8 text-xs" />
      ))}
      {rest > 0 && (
        <span className="relative flex size-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground ring-2 ring-card tabular-nums">
          +{rest}
        </span>
      )}
    </AvatarGroup>
  )
}
