import { XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { groupErrorText } from '@/account/networkText'
import { refreshAccount } from '@/account/refreshAccount'
import type { AccountGroup } from '@/account/types'
import { HoldButton } from '@/components/HoldButton'
import { useAccountStore } from '@/store/account'
import { useAppStore } from '@/store/store'

/** Who keeps this group's records; the owner removes people by holding × (like people in a company). */
export function GroupMembers({ group }: { group: AccountGroup }) {
  const myId = useAccountStore((s) => s.me?.user.id)
  const holdMs = useAppStore((s) => s.holdMs)

  const remove = async (memberId: string, email: string) => {
    try {
      const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId, organizationId: group.id })
      if (error) return void toast(error.status ? 'Не получилось — попробуйте ещё раз' : groupErrorText(null))
      await refreshAccount()
      toast(`${email} больше не в группе`)
    } catch (e) {
      toast(groupErrorText(e))
    }
  }

  return (
    <ul className="divide-y rounded-xl border">
      {group.members.map((m) => (
        <li key={m.memberId} className="flex min-h-11 items-center gap-2 px-3 py-1">
          <span className="min-w-0 flex-1 truncate">{m.email}</span>
          {m.role === 'owner' && <span className="text-sm text-muted-foreground">владелец</span>}
          {group.role === 'owner' && m.userId !== myId && (
            <HoldButton
              holdMs={holdMs}
              label={`Убрать ${m.email} из группы`}
              hint="Удерживайте ×, чтобы убрать из группы"
              onConfirm={() => void remove(m.memberId, m.email)}
            >
              <XIcon />
            </HoldButton>
          )}
        </li>
      ))}
    </ul>
  )
}
