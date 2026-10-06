import { useId, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { groupErrorText } from '@/account/networkText'
import { groupLabel } from '@/account/groupLabel'
import { refreshAccount } from '@/account/refreshAccount'
import type { AccountGroup } from '@/account/types'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/** The group's name: the owner edits it in place (saved on leaving the field), the others read it. */
export function GroupName({ group }: { group: AccountGroup }) {
  const id = useId()
  const [name, setName] = useState(group.name)

  if (group.role !== 'owner') return <p className="px-1 text-base font-medium">{groupLabel(group)}</p>

  const save = async () => {
    const next = name.trim()
    if (!next || next === group.name) return setName(group.name)
    try {
      const { error } = await authClient.organization.update({ organizationId: group.id, data: { name: next } })
      if (error) throw error.status ? new Error() : null
      await refreshAccount()
    } catch (e) {
      setName(group.name)
      toast(groupErrorText(e))
    }
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Название</FieldLabel>
      <Input
        id={id}
        value={name}
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
    </Field>
  )
}
