import { CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { groupLabel } from '@/account/groupLabel'
import { groupErrorText } from '@/account/networkText'
import { settingsPath } from '@/app/paths'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { switchGroup } from '@/sync/session'
import { GroupMembers } from './GroupMembers'
import { GroupName } from './GroupName'
import { InviteCard } from './InviteCard'
import { LeaveGroupButton } from './LeaveGroupButton'

const HEADING = 'px-1 text-sm font-medium text-muted-foreground'

/**
 * `#/settings/group/:groupId` (docs/UX.md «Аккаунт и группа»), a screen over «Группа» like «Новая
 * группа»: whether it is open (else «Открыть эту группу» under the thumb — open now and at launch),
 * its name for the owner, its people and the invite, leaving. A group the user is no longer in —
 * back to the list.
 */
export function GroupScreen() {
  const { section, groupId } = useParams()
  const me = useAccountStore((s) => s.me)
  const openId = useSyncStore((s) => s.groupId)
  const [busy, setBusy] = useState(false)
  const group = me?.groups.find((g) => g.id === groupId)
  const list = settingsPath('group')
  if (section !== 'group' || !me || !group) return <Navigate to={list} replace />

  const isOpen = group.id === openId
  const openGroup = me.groups.find((g) => g.id === openId)
  const open = async () => {
    setBusy(true)
    try {
      await switchGroup(group.id)
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ScreenHeader title={groupLabel(group, me.user.id)} back backTo={list} backLabel="Группа" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        {me.groups.length > 1 &&
          (isOpen ? (
            <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <CheckIcon aria-hidden className="size-4 shrink-0 text-foreground" />
              Открыта: её блюда сейчас на экране и откроются при запуске
            </p>
          ) : (
            <p className="px-1 text-sm text-muted-foreground">
              Сейчас открыта другая: {openGroup ? groupLabel(openGroup, me.user.id) : '—'}
            </p>
          ))}
        {group.role === 'owner' && (
          <div className="rounded-xl border bg-card p-4">
            <GroupName key={group.id + group.name} group={group} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h2 className={HEADING}>Участники</h2>
          <div className="divide-y overflow-hidden rounded-xl border bg-card">
            <GroupMembers group={group} />
            <InviteCard key={group.id} group={group} />
          </div>
        </div>
        <LeaveGroupButton group={group} />
        {!isOpen && (
          <BottomBar>
            <Button size="lg" className="flex-1 lg:flex-none" disabled={busy} onClick={() => void open()}>
              Открыть эту группу
            </Button>
          </BottomBar>
        )}
      </main>
    </>
  )
}
