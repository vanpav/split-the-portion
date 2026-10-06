import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { GroupMembers } from './GroupMembers'
import { GroupName } from './GroupName'
import { GroupPicker } from './GroupPicker'
import { InviteCard } from './InviteCard'
import { JoinByCodeDialog } from './JoinByCodeDialog'
import { LeaveGroupButton } from './LeaveGroupButton'

/**
 * Settings → «Группа» (docs/UX.md «Аккаунт и группа»): which group is open and opens at launch,
 * its name and people, an invite, joining another one, leaving.
 */
export function GroupSection() {
  const me = useAccountStore((s) => s.me)
  const openId = useSyncStore((s) => s.groupId)
  const group = me?.groups.find((g) => g.id === openId)
  if (!me || !group) return null

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold">Группа</h2>
          <p className="text-sm text-muted-foreground">
            Блюда, история, тара и компании — общие для всех в группе.
          </p>
        </div>
        <GroupPicker groups={me.groups} openId={group.id} defaultId={me.defaultGroupId} />
        {/* The owner renames it; for the others the picker above already says its name. */}
        {(group.role === 'owner' || me.groups.length === 1) && <GroupName key={group.id + group.name} group={group} />}
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="px-1 text-sm font-semibold">Участники</h3>
        <GroupMembers group={group} />
        <InviteCard key={group.id} group={group} />
      </div>
      <div className="flex flex-col gap-1">
        <JoinByCodeDialog />
        <LeaveGroupButton group={group} />
      </div>
    </section>
  )
}
