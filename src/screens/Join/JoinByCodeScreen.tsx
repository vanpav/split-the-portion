import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { parseInviteCode } from '@/account/inviteCode'
import { joinPath, settingsPath } from '@/app/paths'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'

/**
 * `#/join` — «Вступить по коду» from Settings → «Группа»: a link from a messenger opens in Safari,
 * not in the app on the home screen, so the code is typed here (docs/UX.md «Аккаунт и группа», §3а).
 * «Дальше» replaces this screen with the join screen of that code: «назад» from it goes to «Группа».
 */
export function JoinByCodeScreen() {
  const navigate = useNavigate()
  const { hasPrevious, noPreviousState } = useBack(settingsPath('group'))
  const formId = useId()
  const inputId = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = parseInviteCode(text)
    if (!code) return setError(t('join.byCode.invalid'))
    navigate(joinPath(code), { replace: true, state: hasPrevious ? undefined : noPreviousState })
  }

  return (
    <>
      <ScreenHeader title={t('join.byCode.title')} back backTo={settingsPath('group')} backLabel={t('join.groupBack')} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <form id={formId} noValidate onSubmit={submit}>
          <Field data-invalid={error !== null || undefined}>
            <FieldLabel htmlFor={inputId}>{t('join.byCode.code')}</FieldLabel>
            <Input
              id={inputId}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="K7MR-Q2XD"
              aria-invalid={error !== null || undefined}
              className="h-14 text-lg tracking-widest uppercase md:text-lg"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError(null)
              }}
            />
            {error ? <FieldError>{error}</FieldError> : <FieldDescription>{t('join.byCode.hint')}</FieldDescription>}
          </Field>
        </form>
        <BottomBar>
          <Button type="submit" form={formId} size="lg" className="flex-1 lg:flex-none">
            {t('join.byCode.check')}
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
