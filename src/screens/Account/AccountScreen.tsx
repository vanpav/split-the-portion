import { Navigate, useNavigate } from 'react-router'
import { refreshAccount } from '@/account/refreshAccount'
import { settingsPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccountStore } from '@/store/account'
import { SignInForm } from './SignInForm'
import { SignUpForm } from './SignUpForm'

const BACK = settingsPath('account')

/** `#/account` (docs/UX.md «Вход»): sign in or create an account, then back to the settings. */
export function AccountScreen() {
  const signedIn = useAccountStore((s) => s.me !== null)
  const navigate = useNavigate()
  if (signedIn) return <Navigate to={BACK} replace />

  const done = async () => {
    await refreshAccount()
    navigate(BACK, { replace: true })
  }

  return (
    <>
      <ScreenHeader title="Аккаунт" back backTo={BACK} backLabel="Настройки" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 lg:py-8">
        <p className="px-1 text-sm text-muted-foreground">
          С аккаунтом блюда и история есть на всех ваших устройствах, а вести их можно вместе с близкими. Без него всё
          хранится только здесь.
        </p>
        <Tabs defaultValue="sign-in" className="gap-6">
          <TabsList className="h-11 w-full">
            <TabsTrigger value="sign-in" className="min-h-10">
              Войти
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="min-h-10">
              Создать аккаунт
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
