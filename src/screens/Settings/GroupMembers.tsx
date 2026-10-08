import { XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { groupErrorText } from '@/account/networkText'
import { fullName, shortName } from '@/account/profile'
import { refreshAccount } from '@/account/refreshAccount'
import type { AccountGroup } from '@/account/types'
import { HoldButton } from '@/components/HoldButton'
import { PersonAvatar } from '@/components/PersonAvatar'
import { useAccountStore } from '@/store/account'
import { t } from '@/i18n'

/**
 * Who keeps this group's records: the photo, the short name (yours as «ты»), the full name or the
 * email under it. The owner removes people by holding × (like people in a company). Rows of the
 * «Участники» box; «Пригласить» follows them.
 */
export function GroupMembers({ group }: { group: AccountGroup }) {
  const myId = useAccountStore((s) => s.me?.user.id)

  const remove = async (memberId: string, name: string) => {
    try {
      const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId: group.id })
      if (error) return void toast(groupErrorText(error))
      await refreshAccount()
      toast(t('settings.groups.memberLeft', { name }))
    } catch (e) {
      toast(groupErrorText(e))
    }
  }

  return group.members.map((m) => {
    const me = m.userId === myId
    const name = shortName(m)
    return (
      <div key={m.memberId} className="flex min-h-16 items-center gap-3 py-2.5 pr-2 pl-4">
        <PersonAvatar person={m} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">
            {name}
            {me && <span className="font-normal text-muted-foreground">{t('settings.groups.you')}</span>}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {[fullName(m) || m.email, m.role === 'owner' && t('settings.groups.owner')].filter(Boolean).join(' · ')}
          </span>
        </span>
        {group.role === 'owner' && !me && (
          <HoldButton label={t('settings.groups.removeMember', { name })} onConfirm={() => void remove(m.memberId, name)}>
            <XIcon />
          </HoldButton>
        )}
      </div>
    )
  })
}
