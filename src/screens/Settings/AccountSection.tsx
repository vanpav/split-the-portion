import { LogInIcon, LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { ACCOUNT_PATH } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { PasskeySetting } from './PasskeySetting'

/** Settings → «Аккаунт» (docs/UX.md «Настройки»): sign in, or who is signed in, Face ID and «Выйти». */
export function AccountSection() {
  const me = useAccountStore((s) => s.me)
  const setMe = useAccountStore((s) => s.setMe)
  const [busy, setBusy] = useState(false)

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

  // Online only: the session must end on the server, not just be forgotten here.
  const signOut = async () => {
    setBusy(true)
    try {
      const { error } = await authClient.signOut()
      if (error) toast(authErrorText(error))
      else setMe(null)
    } catch {
      toast('Нет сети — выйти можно, когда она появится')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-base font-semibold">Аккаунт</h2>
        <p className="truncate text-base">{me.user.email}</p>
        {/* Sync comes with stage 13 (docs/roadmap/13-sync.md). */}
        <p className="text-sm text-muted-foreground">Блюда и история пока хранятся только на этом устройстве.</p>
      </div>
      <PasskeySetting />
      <Button variant="ghost" className="self-start" disabled={busy} onClick={() => void signOut()}>
        <LogOutIcon data-icon="inline-start" />
        Выйти
      </Button>
    </section>
  )
}
