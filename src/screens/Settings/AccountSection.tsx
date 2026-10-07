import { ChevronRightIcon, LockKeyholeIcon, LogInIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { ACCOUNT_PATH, CHANGE_PASSWORD, settingsPath } from '@/app/paths'
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
import { AccountDangerZone } from './AccountDangerZone'
import { PasskeySetting } from './PasskeySetting'
import { ProfileFields } from './ProfileFields'
import { ProfileHeader } from './ProfileHeader'

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
          <h2 className="text-base font-semibold max-md:sr-only">Аккаунт</h2>
          <p className="text-sm text-muted-foreground">
            Данные хранятся только на этом устройстве. Войди — они появятся на всех устройствах и в общей группе.
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
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">Аккаунт</h2>
      <ProfileHeader user={me.user} />
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">О себе</h3>
        {/* The first group is the account's own: a new one after «Сбросить аккаунт» starts the fields afresh. */}
        <ProfileFields key={`${me.user.id}:${me.groups[0]?.id}`} user={me.user} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">Вход</h3>
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          <PasskeySetting />
          <Link
            to={`${settingsPath('account')}/${CHANGE_PASSWORD}`}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60"
          >
            <LockKeyholeIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">Сменить пароль</span>
            <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={askSignOut}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60 disabled:opacity-50"
          >
            <LogOutIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </div>

      <AccountDangerZone />

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Не все изменения отправлены</AlertDialogTitle>
            <AlertDialogDescription>
              Часть правок есть только на этом устройстве. После выхода они пропадут.
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
