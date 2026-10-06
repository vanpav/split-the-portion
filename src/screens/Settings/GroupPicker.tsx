import { StarIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { groupErrorText } from '@/account/networkText'
import { groupLabel } from '@/account/groupLabel'
import type { AccountGroup } from '@/account/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { makeDefaultGroup, openGroup } from '@/sync/session'

interface GroupPickerProps {
  groups: AccountGroup[]
  openId: string
  defaultId: string | null
}

/**
 * Which group is on screen, and which one opens at launch (★). Switching does not change the
 * default (docs/SPEC.md §13.3); the dish list of the group opens.
 */
export function GroupPicker({ groups, openId, defaultId }: GroupPickerProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const pick = async (id: string) => {
    await openGroup(id)
    navigate('/')
  }
  const makeDefault = async () => {
    setBusy(true)
    try {
      await makeDefaultGroup(openId)
      toast('Эта группа будет открываться при запуске')
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.length > 1 && (
        <Select value={openId} onValueChange={(id) => void pick(id)}>
          <SelectTrigger aria-label="Группа" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {groupLabel(g)}
                {g.id === defaultId && <StarIcon className="fill-current" aria-label="открывается при запуске" />}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {openId === defaultId ? (
        <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <StarIcon className="size-4 fill-current" />
          Открывается при запуске
        </p>
      ) : (
        <Button variant="outline" className="self-start" disabled={busy} onClick={() => void makeDefault()}>
          <StarIcon data-icon="inline-start" />
          Открывать при запуске
        </Button>
      )}
    </div>
  )
}
