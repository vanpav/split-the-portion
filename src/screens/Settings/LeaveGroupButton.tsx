import { LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { authClient } from '@/account/authClient'
import { groupErrorText } from '@/account/networkText'
import { groupLabel } from '@/account/groupLabel'
import type { AccountGroup } from '@/account/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { refreshGroups } from '@/sync/session'

/**
 * «Выйти из группы» — for someone who joined it. The owner (whose «Личная» it is) cannot leave;
 * the group's data leaves this device and stays with the others (docs/SPEC.md §13.3).
 */
export function LeaveGroupButton({ group }: { group: AccountGroup }) {
  const navigate = useNavigate()
  if (group.role === 'owner') return null

  const leave = async () => {
    try {
      const { error } = await authClient.organization.leave({ organizationId: group.id })
      if (error) throw error.status ? new Error() : null
      await refreshGroups()
      navigate('/')
    } catch (e) {
      toast(groupErrorText(e))
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="self-start text-destructive">
          <LogOutIcon data-icon="inline-start" />
          Выйти из группы
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Выйти из группы «{groupLabel(group)}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Её блюда и история уйдут с этого устройства, у остальных участников всё останется. Вернуться можно по новому
            приглашению.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Остаться</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void leave()}>
            Выйти
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
