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
import { Button } from '@/components/ui/button'
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
  const groupName = openGroup && groupLabel(openGroup)
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

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">Копия данных</h2>
        <p className="text-sm text-muted-foreground">
          Всё хранится в этом браузере. Копия в файле выручит, если браузер очистит данные или ты сменишь телефон.
        </p>
        {/* Without an account a file is the only way across: an installed app does not share Safari's storage. */}
        {!groupName && (
          <p className="text-sm text-muted-foreground">
            У приложения на экране «Домой» iPhone своё хранилище, не общее с Safari. Проще всего войти в аккаунт и там, и
            там. Без аккаунта — скачай копию в Safari и загрузи её в приложении.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" aria-label="Скачать копию данных" onClick={download}>
          <DownloadIcon data-icon="inline-start" />
          Скачать
        </Button>
        <Button variant="outline" aria-label="Загрузить данные из файла" onClick={() => inputRef.current?.click()}>
          <UploadIcon data-icon="inline-start" />
          Загрузить
        </Button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={pick} />
      </div>

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
