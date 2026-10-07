import { useId, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { groupErrorText } from '@/account/networkText'
import { refreshAccount } from '@/account/refreshAccount'
import { customName, peopleLabel } from '@/account/groupLabel'
import { MAX_GROUP_NAME, PERSONAL_GROUP_NAME, type AccountGroup } from '@/account/types'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAccountStore } from '@/store/account'

/**
 * The group's name, for its owner: saved on leaving the field. Empty — the group is named by its
 * people («Ты и Ксю», shown as the placeholder); stored as «Личная», which reads as no name.
 */
export function GroupName({ group }: { group: AccountGroup }) {
  const id = useId()
  const myId = useAccountStore((s) => s.me?.user.id)
  const given = customName(group.name) ?? ''
  const [name, setName] = useState(given)

  const save = async () => {
    const next = name.trim()
    setName(next)
    if (next === given) return
    try {
      const data = { name: next || PERSONAL_GROUP_NAME }
      const { error } = await authClient.organization.update({ organizationId: group.id, data })
      if (error) throw error.status ? new Error() : null
      await refreshAccount()
    } catch (e) {
      setName(given)
      toast(groupErrorText(e))
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Название</FieldLabel>
      <Input
        id={id}
        value={name}
        maxLength={MAX_GROUP_NAME}
        placeholder={peopleLabel(group.members, myId)}
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <FieldDescription>Пусто — группа называется по людям. Название видят все в группе</FieldDescription>
    </Field>
  )
}
