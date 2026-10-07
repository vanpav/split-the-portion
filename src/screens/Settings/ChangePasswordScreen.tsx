import { useId, useState, type FormEvent } from 'react'
import { useResolvedPath } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { authErrorText } from '@/account/authErrors'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAccountStore } from '@/store/account'

const MIN_PASSWORD = 8

/**
 * `#/settings/account/password` (docs/UX.md «Аккаунт и группа»): the current password and a new one;
 * the other devices can be signed out at the same time. Settings stay mounted under it.
 */
export function ChangePasswordScreen() {
  const { pathname: from } = useResolvedPath('..')
  const { back } = useBack(from)
  const email = useAccountStore((s) => s.me?.user.email ?? '')
  const id = useId()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [signOutOthers, setSignOutOthers] = useState(false)
  // Each error under the field it is about.
  const [error, setError] = useState<{ field: 'current' | 'next'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!current) return setError({ field: 'current', text: 'Введи текущий пароль' })
    if (next.length < MIN_PASSWORD) return setError({ field: 'next', text: authErrorText({ code: 'PASSWORD_TOO_SHORT', status: 400 }) })
    setBusy(true)
    setError(null)
    try {
      const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: signOutOthers })
      if (error) return setError({ field: error.code?.startsWith('PASSWORD_TOO_') ? 'next' : 'current', text: authErrorText(error) })
      toast(signOutOthers ? 'Пароль изменён, на других устройствах войди с ним' : 'Пароль изменён')
      back()
    } catch {
      setError({ field: 'current', text: authErrorText(null) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Сменить пароль" back backTo={from} backLabel="Аккаунт" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4">
        <form id={id} className="flex flex-col gap-4" noValidate onSubmit={(e) => void submit(e)}>
          {/* For the password manager: which account the new password belongs to. */}
          <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
          <Field data-invalid={error?.field === 'current' || undefined}>
            <FieldLabel htmlFor={`${id}-current`}>Текущий пароль</FieldLabel>
            <Input
              id={`${id}-current`}
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={error?.field === 'current' || undefined}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            {error?.field === 'current' && <FieldError>{error.text}</FieldError>}
          </Field>
          <Field data-invalid={error?.field === 'next' || undefined}>
            <FieldLabel htmlFor={`${id}-next`}>Новый пароль</FieldLabel>
            <Input
              id={`${id}-next`}
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD}
              required
              aria-invalid={error?.field === 'next' || undefined}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            {error?.field === 'next' && <FieldError>{error.text}</FieldError>}
          </Field>
          {/* The whole row is the switch's label, as in «Подсказки». */}
          <label
            htmlFor={`${id}-others`}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-2.5"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium">Выйти на других устройствах</span>
              <span className="text-sm text-muted-foreground">Там придётся войти с новым паролем</span>
            </span>
            <Switch id={`${id}-others`} checked={signOutOthers} onCheckedChange={setSignOutOthers} />
          </label>
        </form>
        <BottomBar>
          <Button size="lg" variant="outline" className="flex-1 lg:flex-none" onClick={back}>
            Отмена
          </Button>
          <Button type="submit" form={id} size="lg" className="flex-1 lg:flex-none" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
