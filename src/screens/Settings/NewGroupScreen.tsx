import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { groupErrorText } from '@/account/networkText'
import { MAX_GROUP_NAME } from '@/account/types'
import { settingsPath } from '@/app/paths'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createGroup, switchGroup } from '@/sync/session'

/**
 * `#/groups/new` — «Создать группу» from Settings → «Группа» (docs/UX.md §3а): the name is typed
 * on a screen of its own; the new group opens empty, its owner invites people from «Группа».
 */
export function NewGroupScreen() {
  const navigate = useNavigate()
  const formId = useId()
  const inputId = useId()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      const id = await createGroup(trimmed)
      await switchGroup(id)
      navigate(settingsPath('group'), { replace: true })
    } catch (err) {
      toast(groupErrorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title="Новая группа" back backTo={settingsPath('group')} backLabel="Группа" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        <form id={formId} noValidate onSubmit={(e) => void submit(e)}>
          <Field>
            <FieldLabel htmlFor={inputId}>Название</FieldLabel>
            <Input
              id={inputId}
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              maxLength={MAX_GROUP_NAME}
              placeholder="Семья"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <FieldDescription>Блюда и тара в новой группе свои. Позвать людей можно после.</FieldDescription>
          </Field>
        </form>
        <BottomBar>
          <Button type="submit" form={formId} size="lg" className="flex-1 lg:flex-none" disabled={busy || !name.trim()}>
            Создать
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
