import { Link } from 'react-router'
import { toast } from 'sonner'
import { GROUP_LIMIT_TEXT } from '@/account/networkText'
import { MAX_GROUPS } from '@/account/types'
import { JOIN_PATH, NEW_GROUP_PATH } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { GroupMembers } from './GroupMembers'
import { GroupName } from './GroupName'
import { GroupPicker } from './GroupPicker'
import { InviteCard } from './InviteCard'
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
  const full = me.groups.length >= MAX_GROUPS

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-semibold max-md:sr-only">Группа</h2>
          <p className="text-sm text-muted-foreground">
            Блюда, тара и компании — общие для всех в группе.
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
        {/* A screen of its own (docs/UX.md §3а): the code is typed there. */}
        {/* At the limit the buttons stay and say why, instead of vanishing. */}
        <Button variant="ghost" className="self-start" asChild>
          <Link to={NEW_GROUP_PATH} onClick={(e) => full && (e.preventDefault(), toast(GROUP_LIMIT_TEXT))}>
            Создать группу
          </Link>
        </Button>
        <Button variant="ghost" className="self-start" asChild>
          <Link to={JOIN_PATH} onClick={(e) => full && (e.preventDefault(), toast(GROUP_LIMIT_TEXT))}>
            Вступить по коду
          </Link>
        </Button>
        <LeaveGroupButton group={group} />
      </div>
    </section>
  )
}
