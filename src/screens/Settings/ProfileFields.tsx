import { useId, useState } from 'react'
import { toast } from 'sonner'
import { groupErrorText } from '@/account/networkText'
import { parseProfile } from '@/account/profile'
import { profileApi } from '@/account/profileApi'
import { refreshAccount } from '@/account/refreshAccount'
import { PROFILE_LIMITS, type Me } from '@/account/types'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { t } from '@/i18n'

type Draft = { firstName: string; lastName: string; nickname: string }

/**
 * «Имя», «Фамилия», «Короткое имя»: all optional, saved on leaving a field (like a group's name).
 * The nickname is what the others see in the group; empty — the part of the email before @.
 */
export function ProfileFields({ user }: { user: Me['user'] }) {
  const id = useId()
  const saved: Draft = { firstName: user.firstName, lastName: user.lastName, nickname: user.nickname }
  const [draft, setDraft] = useState(saved)

  const save = async () => {
    const next = parseProfile(draft)
    if (!next) return setDraft(saved)
    setDraft(next)
    if (next.firstName === saved.firstName && next.lastName === saved.lastName && next.nickname === saved.nickname) return
    try {
      await profileApi.save(next)
      await refreshAccount()
    } catch (e) {
      setDraft(saved)
      toast(groupErrorText(e))
    }
  }

  const field = (key: keyof Draft, label: string, max: number, autoComplete: string, description?: string) => (
    <Field>
      <FieldLabel htmlFor={`${id}-${key}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${key}`}
        value={draft[key]}
        maxLength={max}
        autoComplete={autoComplete}
        enterKeyHint="done"
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        onBlur={() => void save()}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      {field('firstName', t('settings.profile.firstName'), PROFILE_LIMITS.name, 'given-name')}
      {field('lastName', t('settings.profile.lastName'), PROFILE_LIMITS.name, 'family-name')}
      {field(
        'nickname',
        t('settings.profile.nickname'),
        PROFILE_LIMITS.nickname,
        'nickname',
        t('settings.profile.nicknameHint', { fallback: user.email.split('@')[0] }),
      )}
    </div>
  )
}
