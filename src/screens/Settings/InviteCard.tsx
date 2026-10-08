import { Share2Icon, UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { customName } from '@/account/groupLabel'
import { formatInviteCode } from '@/account/inviteCode'
import { groupErrorText } from '@/account/networkText'
import type { AccountGroup, Invite } from '@/account/types'
import { joinPath } from '@/app/paths'
import { CopyButton } from '@/components/CopyButton'
import { Button } from '@/components/ui/button'
import { t } from '@/i18n'
import { shortDate } from '@/i18n/format'

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
    void navigator
      .share({
        title: t('common.appName'),
        text: customName(group.name)
          ? t('settings.invite.shareNamed', { group: customName(group.name), code: formatInviteCode(invite!.code) })
          : t('settings.invite.share', { code: formatInviteCode(invite!.code) }),
        url: link,
      })
      .catch(() => undefined)

  if (!invite) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(async () => setInvite(await groupsApi.invite(group.id)))}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60 disabled:opacity-50"
      >
        <UserPlusIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">{t('settings.invite.title')}</span>
          <span className="text-sm text-muted-foreground">{t('settings.invite.hint')}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 bg-muted/40 px-4 py-4">
      <p className="text-sm text-muted-foreground">{t('settings.invite.code')}</p>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-3xl font-medium tracking-widest tabular-nums">{formatInviteCode(invite.code)}</span>
        <CopyButton label={t('settings.invite.copyLink')} getText={() => link} />
        {'share' in navigator && (
          <Button variant="ghost" size="icon" aria-label={t('settings.invite.shareAction')} onClick={share}>
            <Share2Icon />
          </Button>
        )}
      </div>
      <p className="text-sm break-all text-muted-foreground">{link}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 text-sm text-muted-foreground">{t('settings.invite.until', { date: shortDate(invite.expiresAt) })}</span>
        {group.role === 'owner' && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await groupsApi.revoke(group.id, invite.code)
                setInvite(null)
                toast(t('settings.invite.revoked'))
              })
            }
          >
            {t('settings.invite.revoke')}
          </Button>
        )}
      </div>
    </div>
  )
}
