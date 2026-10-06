import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { parseInviteCode } from '@/account/inviteCode'
import { joinPath } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/**
 * «Вступить по коду»: a link from a messenger opens in Safari, not in the app on the home screen,
 * so the code is typed here and leads to the same join screen (docs/UX.md «Вступить по ссылке»).
 */
export function JoinByCodeDialog() {
  const navigate = useNavigate()
  const inputId = useId()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = parseInviteCode(text)
    if (!code) return setError('8 букв и цифр, например K7MR-Q2XD')
    navigate(joinPath(code))
  }

  return (
    <Dialog onOpenChange={() => (setText(''), setError(null))}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="self-start">
          Вступить по коду
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Вступить по коду</DialogTitle>
          <DialogDescription>Код пришлёт тот, кто зовёт в группу.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor={inputId}>Код</FieldLabel>
            <Input
              id={inputId}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="K7MR-Q2XD"
              className="text-lg tracking-widest uppercase"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="submit">Дальше</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
