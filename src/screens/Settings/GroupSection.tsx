import { PlusIcon, TicketIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { groupLimitText } from '@/account/networkText'
import { MAX_GROUPS } from '@/account/types'
import { JOIN_PATH, NEW_GROUP_PATH, settingsPath } from '@/app/paths'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { GroupList } from './GroupList'
import { t } from '@/i18n'

const HEADING = 'px-1 text-sm font-medium text-muted-foreground'
const ROW =
  'flex min-h-14 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60'

/**
 * Settings → «Группа» (docs/UX.md «Аккаунт и группа»): what a group is, the user's groups (each
 * leads to its own screen: open it, its people, invite, leave), then a new group or joining one —
 * screens of their own as well.
 */
export function GroupSection() {
  const me = useAccountStore((s) => s.me)
  const openId = useSyncStore((s) => s.groupId)
  if (!me || !openId) return null
  const full = me.groups.length >= MAX_GROUPS
  // At the limit the rows stay and say why, instead of vanishing.
  const atLimit = (e: { preventDefault(): void }) => full && (e.preventDefault(), toast(groupLimitText()))

  return (
    <section className="flex flex-col gap-6">
      <p className="px-1 text-sm text-muted-foreground">
        {t('settings.groups.lead')}{' '}
        <Link to={settingsPath('companies')} className="text-foreground underline underline-offset-4">
          {t('settings.groups.leadLink')}
        </Link>
        .
      </p>
      <div className="flex flex-col gap-2">
        <h2 className={HEADING}>{t('settings.groups.yours')}</h2>
        <GroupList groups={me.groups} openId={openId} myId={me.user.id} />
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        <Link to={NEW_GROUP_PATH} onClick={atLimit} className={cn(ROW)}>
          <PlusIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{t('settings.groups.create')}</span>
        </Link>
        <Link to={JOIN_PATH} onClick={atLimit} className={cn(ROW)}>
          <TicketIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{t('settings.groups.joinByCode')}</span>
        </Link>
      </div>
    </section>
  )
}
