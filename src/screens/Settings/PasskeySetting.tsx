import { KeyRoundIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
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
import { t } from '@/i18n'
import { shortDate } from '@/i18n/format'

type Passkey = { id: string; name?: string | null; createdAt: Date | string }

/** The server names a passkey after its password manager; an unknown one is just «Passkey». */
const label = (passkey: Passkey) => passkey.name || 'Passkey'

/**
 * «Passkey»: every passkey of the account, one per device or password manager, each can be
 * removed; «Добавить passkey» adds this device's (docs/UX.md «Аккаунт и группа»).
 */
export function PasskeySetting() {
  const { data: passkeys } = authClient.useListPasskeys()
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<Passkey | null>(null)

  const add = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.passkey.addPasskey()
      if (!error) toast(t('settings.passkey.added'))
      // A closed prompt is the user's choice, not an error worth a message.
      else if (
        !error.status ||
        ('code' in error && (error.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' || error.code === 'SESSION_NOT_FRESH'))
      )
        toast(authErrorText(error))
    } catch {
      toast(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (passkey: Passkey) => {
    setBusy(true)
    try {
      const { error } = await authClient.passkey.deletePasskey({ id: passkey.id })
      toast(error ? authErrorText(error) : t('settings.passkey.removed'))
    } catch {
      toast(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  return (
    // Rows of the «Вход» box in «Аккаунт»: each passkey, then «Добавить passkey».
    <>
      {passkeys?.map((passkey) => (
        <div key={passkey.id} className="flex min-h-14 items-center gap-3 py-2 pr-2 pl-4">
          <KeyRoundIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium">{label(passkey)}</span>
            <span className="text-sm text-muted-foreground">{t('settings.passkey.addedAt', { date: shortDate(passkey.createdAt) })}</span>
          </span>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={t('settings.passkey.remove', { name: label(passkey) })}
            disabled={busy}
            onClick={() => setRemoving(passkey)}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <button
        type="button"
        disabled={busy}
        onClick={() => void add()}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60 disabled:opacity-50"
      >
        <PlusIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">{t('settings.passkey.add')}</span>
          <span className="text-sm text-muted-foreground">{t('settings.passkey.addHint')}</span>
        </span>
      </button>
      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.passkey.removeTitle', { name: removing ? label(removing) : '' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.passkey.removeText')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => removing && void remove(removing)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
