import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { refreshAccount } from '@/account/refreshAccount'
import { enterAccount } from '@/sync/session'
import { settingsPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'
import { t } from '@/i18n'

const BACK = settingsPath('account')

/** `#/account` (docs/UX.md «Вход»): sign in or create an account, then back to the settings. */
export function AccountScreen() {
  // Signed in, unless the session ran out: then this is «Войти снова».
  const hasAccount = useAccountStore((s) => s.me !== null)
  const sessionGone = useSyncStore((s) => s.status.kind === 'needsLogin')
  const signedIn = hasAccount && !sessionGone
  const navigate = useNavigate()
  // Where to go after signing in: back to the settings, or to the join screen that sent us here.
  const [params] = useSearchParams()
  const next = params.get('next')
  // From the welcome screen: «Создать аккаунт» opens on its tab.
  const tab = params.get('tab') === 'sign-up' ? 'sign-up' : 'sign-in'
  const after = next?.startsWith('/') ? next : BACK
  if (signedIn) return <Navigate to={after} replace />

  const done = async () => {
    await refreshAccount()
    // The data on the device moves into the group and sync starts (docs/SPEC.md §13.2).
    await enterAccount()
    navigate(after, { replace: true })
  }

  return (
    <>
      <ScreenHeader title={t('account.title')} back backTo={BACK} backLabel={t('common.settings')} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 lg:py-8">
        <p className="px-1 text-sm text-muted-foreground">
          {t('account.lead')}
        </p>
        <Tabs defaultValue={tab} className="gap-6">
          <TabsList className="h-11 w-full">
            <TabsTrigger value="sign-in" className="min-h-10">
              {t('account.signIn')}
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="min-h-10">
              {t('account.signUp')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <SignInForm onSignedIn={() => void done()} />
          </TabsContent>
          <TabsContent value="sign-up">
            <SignUpForm onSignedIn={() => void done()} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}
