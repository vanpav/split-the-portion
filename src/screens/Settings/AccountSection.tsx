import { LogInIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { ACCOUNT_PATH } from '@/app/paths'
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
import { useAccountStore } from '@/store/account'
import { hasUnsentChanges } from '@/sync/runner'
import { leaveAccount } from '@/sync/session'
import { PasskeySetting } from './PasskeySetting'
import { SyncStatusLine } from './SyncStatusLine'

/** Settings → «Аккаунт» (docs/UX.md «Настройки»): sign in, or who is signed in, passkeys and «Выйти». */
export function AccountSection() {
  const me = useAccountStore((s) => s.me)
  const [busy, setBusy] = useState(false)
  // «Выйти» with changes that have not reached the server: asked first.
  const [confirming, setConfirming] = useState(false)

  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold">Аккаунт</h2>
          <p className="text-sm text-muted-foreground">
            Данные только на этом устройстве. Войдите, чтобы данные были на всех устройствах и в общей группе.
          </p>
        </div>
        <Button asChild className="self-start">
          <Link to={ACCOUNT_PATH}>
            <LogInIcon data-icon="inline-start" />
            Войти
          </Link>
        </Button>
      </section>
    )
  }

  // Online only: the session must end on the server, not just be forgotten here. The groups' data
  // then leaves the device; it stays on the server (docs/SPEC.md §13.2).
  const signOut = async () => {
    setConfirming(false)
    setBusy(true)
    try {
      const { error } = await authClient.signOut()
      // No answer at all: the session still lives on the server. Any answer (even «no session») is enough.
      if (error && !error.status) throw new Error('offline')
      await leaveAccount()
    } catch {
      toast('Нет сети — выйти можно, когда она появится')
    } finally {
      setBusy(false)
    }
  }
  const askSignOut = () => (hasUnsentChanges() ? setConfirming(true) : void signOut())

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold">Аккаунт</h2>
        <p className="truncate text-base">{me.user.email}</p>
        <SyncStatusLine />
      </div>
      <PasskeySetting />
      <Button variant="ghost" className="self-start" disabled={busy} onClick={askSignOut}>
        <LogOutIcon data-icon="inline-start" />
        Выйти
      </Button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Не все изменения отправлены</AlertDialogTitle>
            <AlertDialogDescription>
              Часть правок есть только на этом устройстве. После выхода они пропадут. Выйти всё равно?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Остаться</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void signOut()}>
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
