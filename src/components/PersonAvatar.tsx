import { initials } from '@/account/profile'
import type { Profile } from '@/account/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface PersonAvatarProps {
  person: Pick<Profile, 'firstName' | 'lastName' | 'nickname' | 'image'> & { email: string }
  className?: string
}

/**
 * A person of the account world (yourself, the people of a group): the photo, else the initials on a
 * frost-step circle. Not a lid: lids belong to the people who eat (DESIGN.md «Color Quarantine»).
 */
export function PersonAvatar({ person, className }: PersonAvatarProps) {
  return (
    <Avatar className={cn('size-10', className)}>
      {person.image && <AvatarImage src={person.image} alt="" />}
      <AvatarFallback className="bg-secondary text-[1em] font-semibold text-secondary-foreground">{initials(person)}</AvatarFallback>
    </Avatar>
  )
}
