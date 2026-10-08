import { CheckIcon, CloudOffIcon, LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ACCOUNT_PATH } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useSyncStore } from '@/store/sync'
import { t } from '@/i18n'
import { clockTime } from '@/i18n/format'


/**
 * How the open group's sync is doing, in one line (docs/UX.md «Аккаунт и группа», словарь §6).
 * `withAction={false}` inside a link (the hub's account card): «Войти снова» waits in «Аккаунт».
 */
export function SyncStatusLine({ withAction = true }: { withAction?: boolean }) {
  const status = useSyncStore((s) => s.status)
  const line = (Icon: typeof CheckIcon, text: string, warn = false) => (
    <p className={warn ? 'flex items-center gap-2 text-sm text-warning' : 'flex items-center gap-2 text-sm text-muted-foreground'}>
      <Icon className="size-4 shrink-0" />
      {text}
    </p>
  )

  switch (status.kind) {
    case 'idle':
      return null
    case 'syncing':
      return line(LoaderCircleIcon, t('settings.sync.syncing'))
    case 'synced':
      return line(CheckIcon, t('settings.sync.synced', { time: clockTime(status.at) }))
    case 'offline':
      return line(CloudOffIcon, t('settings.sync.offline'))
    case 'failed':
      return line(CloudOffIcon, t('settings.sync.failed'))
    case 'forbidden':
      return line(TriangleAlertIcon, t('settings.sync.noAccess'), true)
    case 'needsUpdate':
      return line(TriangleAlertIcon, t('settings.sync.update'), true)
    case 'needsLogin':
      if (!withAction) return line(TriangleAlertIcon, t('settings.sync.signIn'), true)
      return (
        <div className="flex flex-col gap-2">
          {line(TriangleAlertIcon, t('settings.sync.signIn'), true)}
          <Button asChild variant="outline" className="self-start">
            <Link to={ACCOUNT_PATH}>{t('settings.sync.signInAction')}</Link>
          </Button>
        </div>
      )
  }
}
