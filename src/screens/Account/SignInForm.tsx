import { KeyRoundIcon } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PASSWORD_RESET_PATH } from '@/app/paths'
import { t } from '@/i18n'

type AuthCall = () => Promise<{ error: { code?: string; status?: number } | null }>

/** «Войти»: email and password, or a passkey; «Не помнишь пароль?» asks for a reset link. */
export function SignInForm({ onSignedIn }: { onSignedIn(): void }) {
  const emailId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // No emails yet: the reset link is passed on by the owner of the app (docs/CLOUDFLARE.md §10).
  const [resetAsked, setResetAsked] = useState(false)

  const run = async (call: AuthCall, then: () => void) => {
    setBusy(true)
    setError(null)
    try {
      const { error } = await call()
      if (error) setError(authErrorText(error))
      else then()
    } catch {
      setError(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => authClient.signIn.email({ email: email.trim(), password }), onSignedIn)
  }

  const askReset = () => {
    if (!email.trim()) return setError(t('account.enterEmail'))
    void run(
      () => authClient.requestPasswordReset({ email: email.trim(), redirectTo: `/#${PASSWORD_RESET_PATH}` }),
      () => setResetAsked(true),
    )
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={emailId}>{t('account.email')}</FieldLabel>
        <Input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          enterKeyHint="next"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={passwordId}>{t('account.password')}</FieldLabel>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          enterKeyHint="go"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <FieldError>{error}</FieldError>}
        {resetAsked && (
          <FieldDescription>{t('account.resetAsked')}</FieldDescription>
        )}
      </Field>
      <Button type="submit" size="lg" disabled={busy}>
        {t('account.signIn')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={busy}
        onClick={() => void run(() => authClient.signIn.passkey(), onSignedIn)}
      >
        <KeyRoundIcon data-icon="inline-start" />
        {t('account.signInPasskey')}
      </Button>
      <Button type="button" variant="link" className="self-start px-1" disabled={busy} onClick={askReset}>
        {t('account.forgotPassword')}
      </Button>
    </form>
  )
}
