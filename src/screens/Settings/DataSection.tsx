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
import { t } from '@/i18n'

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
      toast(t('settings.data.wrongFile'), { description: t('settings.data.wrongFileHint') })
    }
  }

  const replace = () => {
    if (!pending) return
    const before = storedData(useAppStore.getState())
    replaceData(pending)
    setPending(null)
    toast(t('settings.data.loaded'), {
      duration: 8000,
      action: { label: t('common.undo'), onClick: () => replaceData(before) },
    })
  }

  const action =
    'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60'

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold max-md:sr-only">{t('settings.data.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t(groupName ? 'settings.data.leadGroup' : 'settings.data.leadLocal')}
        </p>
      </div>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        <button type="button" className={action} onClick={download}>
          <DownloadIcon aria-hidden className="mt-0.5 size-5 shrink-0 self-start text-muted-foreground" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{t('settings.data.download')}</span>
            <span className="text-sm text-muted-foreground">{t('settings.data.downloadHint')}</span>
          </span>
        </button>
        <button type="button" className={action} onClick={() => inputRef.current?.click()}>
          <UploadIcon aria-hidden className="mt-0.5 size-5 shrink-0 self-start text-muted-foreground" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{t('settings.data.upload')}</span>
            <span className="text-sm text-muted-foreground">
              {groupName ? t('settings.data.uploadHintGroup', { group: groupName }) : t('settings.data.uploadHint')}
            </span>
          </span>
        </button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={pick} />
      </div>
      {/* Without an account a file is the only way across: an installed app does not share Safari's storage. */}
      {!groupName && (
        <div className="flex flex-col gap-1 px-1">
          <h3 className="text-sm font-medium">{t('settings.data.iphoneTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('settings.data.iphoneText')}
          </p>
        </div>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.data.replaceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending &&
                `${t('settings.data.replaceCounts', { dishes: pending.dishes.length, tares: pending.tares.length, companies: pending.companies.length })} ${groupName ? t('settings.data.replaceGroup', { group: groupName }) : t('settings.data.replaceLocal')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={replace}>{t('settings.data.replace')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
