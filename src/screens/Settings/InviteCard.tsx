import { Share2Icon, UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { formatInviteCode } from '@/account/inviteCode'
import { groupErrorText } from '@/account/networkText'
import type { AccountGroup, Invite } from '@/account/types'
import { joinPath } from '@/app/paths'
import { CopyButton } from '@/components/CopyButton'
import { Button } from '@/components/ui/button'

const until = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

/**
 * «Пригласить»: the group's code and a link with it, to send in a messenger (docs/UX.md
 * «Аккаунт и группа»). The code works 7 days for anyone who has it; the owner can revoke it.
 */
export function InviteCard({ group }: { group: AccountGroup }) {
  const [invite, setInvite] = useState<Invite | null>(null)
  const [busy, setBusy] = useState(false)
  const link = invite ? `${location.origin}/#${joinPath(invite.code)}` : ''

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }
  const share = () =>
    void navigator.share({ title: 'Порции', text: `Вступай в группу «${group.name}»: код ${formatInviteCode(invite!.code)}`, url: link }).catch(() => undefined)

  if (!invite) {
    return (
      <Button className="self-start" disabled={busy} onClick={() => void run(async () => setInvite(await groupsApi.invite(group.id)))}>
        <UserPlusIcon data-icon="inline-start" />
        Пригласить
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">Код приглашения в «{group.name}»</p>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-3xl font-medium tracking-widest tabular-nums">{formatInviteCode(invite.code)}</span>
        <CopyButton label="Скопировать ссылку-приглашение" getText={() => link} />
        {'share' in navigator && (
          <Button variant="ghost" size="icon" aria-label="Поделиться приглашением" onClick={share}>
            <Share2Icon />
          </Button>
        )}
      </div>
      <p className="break-all text-sm text-muted-foreground">{link}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm text-muted-foreground">Действует до {until.format(new Date(invite.expiresAt))}</span>
        {group.role === 'owner' && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await groupsApi.revoke(group.id, invite.code)
                setInvite(null)
                toast('Код отозван')
              })
            }
          >
            Отозвать
          </Button>
        )}
      </div>
    </div>
  )
}
