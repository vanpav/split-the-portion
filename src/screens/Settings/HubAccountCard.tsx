import { ChevronRightIcon, HouseIcon, LogInIcon, SmartphoneIcon } from 'lucide-react'
import { Link } from 'react-router'
import { groupLabel } from '@/account/groupLabel'
import { fullName, shortName } from '@/account/profile'
import { ACCOUNT_PATH, settingsPath } from '@/app/paths'
import { PeopleStack } from '@/components/PeopleStack'
import { PersonAvatar } from '@/components/PersonAvatar'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { SyncStatusLine } from './SyncStatusLine'
import { t } from '@/i18n'

const ROW =
  'flex min-h-16 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60'

/**
 * The top of the phone's hub: where the data lives. Signed out — only here, and «Войти».
 * Signed in — who, how the sync is doing, and the group: the people the dishes are shared with
 * (not who eats: that is «Компании»).
 */
export function HubAccountCard() {
  const me = useAccountStore((s) => s.me)
  const openId = useSyncStore((s) => s.groupId)

  if (!me) {
    return (
      <section aria-label={t('settings.account.title')} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
            <SmartphoneIcon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-medium">{t('settings.account.localOnly')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('settings.account.localOnlyText')}
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link to={ACCOUNT_PATH}>
            <LogInIcon data-icon="inline-start" />
            {t('common.signIn')}
          </Link>
        </Button>
      </section>
    )
  }

  const group = me.groups.find((g) => g.id === openId)
  const name = fullName(me.user)

  return (
    <section aria-label={t('settings.account.title')} className="divide-y overflow-hidden rounded-xl border bg-card">
      <Link to={settingsPath('account')} className={ROW}>
        <PersonAvatar person={me.user} className="size-11 text-base" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">{name || shortName(me.user)}</span>
          <span className="truncate text-sm text-muted-foreground">{me.user.email}</span>
          <SyncStatusLine withAction={false} />
        </span>
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </Link>
      {group && (
        <Link to={settingsPath('group')} className={ROW}>
          {group.members.length > 1 ? (
            <PeopleStack members={group.members} />
          ) : (
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center">
              <HouseIcon className="size-5 text-muted-foreground" />
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium">{groupLabel(group, me.user.id)}</span>
            <span className="text-sm text-muted-foreground">
              {t(group.members.length > 1 || me.groups.length > 1 ? 'settings.group.membersShared' : 'settings.group.membersInvite')}
            </span>
          </span>
          <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}
    </section>
  )
}
