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
import { ProfileFields } from './ProfileFields'
import { ProfileHeader } from './ProfileHeader'
import { t } from '@/i18n'

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
          <h2 className="text-base font-semibold max-md:sr-only">{t('settings.account.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('settings.account.localLead')}
          </p>
        </div>
        <Button asChild className="self-start">
          <Link to={ACCOUNT_PATH}>
            <LogInIcon data-icon="inline-start" />
            {t('common.signIn')}
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
      toast(t('settings.account.offlineSignOut'))
    } finally {
      setBusy(false)
    }
  }
  const askSignOut = () => (hasUnsentChanges() ? setConfirming(true) : void signOut())

  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">{t('settings.account.title')}</h2>
      <ProfileHeader user={me.user} />
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">{t('settings.account.about')}</h3>
        <ProfileFields key={me.user.id} user={me.user} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">{t('settings.account.signIn')}</h3>
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          <PasskeySetting />
          <button
            type="button"
            disabled={busy}
            onClick={askSignOut}
            className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60 disabled:opacity-50"
          >
            <LogOutIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{t('common.signOut')}</span>
          </button>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.account.unsentTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.account.unsentText')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('settings.account.stay')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void signOut()}>
              {t('common.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
