import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { ACCOUNT_PATH } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'

/**
 * `/?token=…#/account/reset`: a new password by the link the owner passed on (docs/CLOUDFLARE.md §10).
 * Better Auth puts the token into the real query string, before the hash, so it is read from there.
 */
export function ResetPasswordScreen() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token'))
  const navigate = useNavigate()
  const passwordId = useId()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(token ? null : authErrorText({ code: 'INVALID_TOKEN', status: 400 }))
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (password.length < 8) return setError(authErrorText({ code: 'PASSWORD_TOO_SHORT', status: 400 }))
    setBusy(true)
    setError(null)
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token })
      if (error) return setError(authErrorText(error))
      toast(t('account.reset.done'))
      // The used token leaves the address, so a reload does not try it again.
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
      navigate(ACCOUNT_PATH, { replace: true })
    } catch {
      setError(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title={t('account.reset.title')} back backTo={ACCOUNT_PATH} backLabel={t('account.signInTitle')} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4 lg:py-8">
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void submit(e)}>
          <Field>
            <FieldLabel htmlFor={passwordId}>{t('account.reset.title')}</FieldLabel>
            <Input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <Button type="submit" size="lg" disabled={busy || !token}>
            {t('account.reset.save')}
          </Button>
        </form>
      </main>
    </>
  )
}
