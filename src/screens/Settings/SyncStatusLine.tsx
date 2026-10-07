import { CheckIcon, CloudOffIcon, LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'
import { ACCOUNT_PATH } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useSyncStore } from '@/store/sync'

const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** How the open group's sync is doing, in one line (docs/UX.md «Аккаунт и группа», словарь §6). */
export function SyncStatusLine() {
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
      return line(LoaderCircleIcon, 'Синхронизация…')
    case 'synced':
      return line(CheckIcon, `Синхронизировано · ${time.format(new Date(status.at))}`)
    case 'offline':
      return line(CloudOffIcon, 'Нет сети — изменения сохранены на устройстве')
    case 'failed':
      return line(CloudOffIcon, 'Не удалось синхронизировать — попробуем ещё раз')
    case 'forbidden':
      return line(TriangleAlertIcon, 'Нет доступа к группе — попроси новое приглашение', true)
    case 'needsUpdate':
      return line(TriangleAlertIcon, 'Обнови приложение, чтобы синхронизировать: закрой его и открой снова', true)
    case 'needsLogin':
      return (
        <div className="flex flex-col gap-2">
          {line(TriangleAlertIcon, 'Войди снова, чтобы синхронизировать', true)}
          <Button asChild variant="outline" className="self-start">
            <Link to={ACCOUNT_PATH}>Войти снова</Link>
          </Button>
        </div>
      )
  }
}
