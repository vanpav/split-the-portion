import { DownloadIcon, UploadIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { backupFile, readBackupFile } from '@/store/backupFile'
import { storedData } from '@/store/createAppStore'
import type { PersistedState } from '@/store/migrations'
import { groupLabel } from '@/account/groupLabel'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { useAppStore } from '@/store/store'

/**
 * «Копия данных»: everything lives in this browser; a file outside it survives a cleared browser,
 * a new phone and any later version of the app (it is migrated on load, docs/ARCHITECTURE.md §5).
 */
export function DataSection() {
  const replaceData = useAppStore((s) => s.replaceData)
  // Signed in, the data is a group's: loading a file replaces it for everyone in the group.
  const openId = useSyncStore((s) => s.groupId)
  const openGroup = useAccountStore((s) => s.me?.groups.find((g) => g.id === openId))
  const myId = useAccountStore((s) => s.me?.user.id)
  const groupName = openGroup && groupLabel(openGroup, myId)
  const inputRef = useRef<HTMLInputElement>(null)
  // A file read and migrated, waiting for «Заменить».
  const [pending, setPending] = useState<PersistedState | null>(null)

  const download = () => {
    const { name, text } = backupFile(storedData(useAppStore.getState()), new Date())
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = Object.assign(document.createElement('a'), { href: url, download: name })
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPending(readBackupFile(await file.text()))
    } catch {
      toast('Не тот файл', { description: 'Нужна копия, скачанная в этом приложении: Настройки → Копия данных.' })
    }
  }

  const replace = () => {
    if (!pending) return
    const before = storedData(useAppStore.getState())
    replaceData(pending)
    setPending(null)
    toast('Данные загружены', {
      duration: 8000,
      action: { label: 'Отменить', onClick: () => replaceData(before) },
    })
  }

  const action =
    'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60'

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">Копия данных</h2>
        <p className="text-sm text-muted-foreground">
          {groupName
            ? 'Блюда, тара и компании группы и так хранятся на сервере. Файл — запасная копия на твоём устройстве.'
            : 'Блюда, тара и компании хранятся только в этом браузере. Скачай файл, чтобы не потерять их при смене телефона или очистке браузера.'}
        </p>
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        <button type="button" className={action} onClick={download}>
          <DownloadIcon aria-hidden className="mt-0.5 size-5 shrink-0 self-start text-muted-foreground" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">Скачать копию</span>
            <span className="text-sm text-muted-foreground">Файл со всем, что есть в приложении</span>
          </span>
        </button>
        <button type="button" className={action} onClick={() => inputRef.current?.click()}>
          <UploadIcon aria-hidden className="mt-0.5 size-5 shrink-0 self-start text-muted-foreground" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">Загрузить из файла</span>
            <span className="text-sm text-muted-foreground">
              {groupName ? `Заменит данные группы «${groupName}» у всех её участников` : 'Заменит всё, что сейчас в приложении'}
            </span>
          </span>
        </button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={pick} />
      </div>
      {/* Without an account a file is the only way across: an installed app does not share Safari's storage. */}
      {!groupName && (
        <div className="flex flex-col gap-1 px-1">
          <h3 className="text-sm font-medium">Приложение на экране «Домой» iPhone</h3>
          <p className="text-sm text-muted-foreground">
            У него своё хранилище, не общее с Safari. Скачай копию в Safari и загрузи её в приложении. Или войди в
            аккаунт и там, и там — тогда переносить ничего не нужно.
          </p>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заменить данные из файла?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending &&
                `В файле — блюда: ${pending.dishes.length}, тара: ${pending.tares.length}, компании: ${pending.companies.length}. ${groupName ? `Они заменят данные группы «${groupName}» у всех её участников.` : 'Они заменят то, что сейчас в приложении.'}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={replace}>Заменить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
