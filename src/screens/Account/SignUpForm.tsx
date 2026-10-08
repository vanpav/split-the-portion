import { useId, useState, type FormEvent } from 'react'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'

const MIN_PASSWORD = 8

/** «Создать аккаунт»: email and a new password; the server creates the group «Личная» with it. */
export function SignUpForm({ onSignedIn }: { onSignedIn(): void }) {
  const emailId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    // Our own messages, in Russian, instead of the browser's validation bubbles (`noValidate`).
    if (password.length < MIN_PASSWORD) return setError(authErrorText({ code: 'PASSWORD_TOO_SHORT', status: 400 }))
    setBusy(true)
    setError(null)
    try {
      const trimmed = email.trim()
      // Better Auth wants a name; the part before @ is enough to tell people apart in a group.
      const { error } = await authClient.signUp.email({ email: trimmed, password, name: trimmed.split('@')[0] })
      if (error) setError(authErrorText(error))
      else onSignedIn()
    } catch {
      setError(authErrorText(null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void submit(e)}>
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
          autoComplete="new-password"
          enterKeyHint="go"
          minLength={MIN_PASSWORD}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{t('account.passwordHint')}</FieldDescription>}
      </Field>
      <Button type="submit" size="lg" disabled={busy}>
        {t('account.signUp')}
      </Button>
    </form>
  )
}
