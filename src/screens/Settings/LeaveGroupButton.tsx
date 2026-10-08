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
import { useAccountStore } from '@/store/account'
import { refreshGroups } from '@/sync/session'
import { t } from '@/i18n'

/**
 * «Выйти из группы» — for someone who joined it. The owner (whose «Личная» it is) cannot leave;
 * the group's data leaves this device and stays with the others (docs/SPEC.md §13.3).
 */
export function LeaveGroupButton({ group }: { group: AccountGroup }) {
  const navigate = useNavigate()
  const myId = useAccountStore((s) => s.me?.user.id)
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
        <button
          type="button"
          className="flex min-h-14 w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-destructive outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-muted/60"
        >
          <LogOutIcon aria-hidden className="size-5 shrink-0" />
          <span className="font-medium">{t('settings.groups.leave')}</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('settings.groups.leaveTitle', { group: groupLabel(group, myId) })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('settings.groups.leaveText')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('settings.account.stay')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => void leave()}>
            {t('common.signOut')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
