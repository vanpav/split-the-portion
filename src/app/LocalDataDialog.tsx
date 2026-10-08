import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { groupLabel } from '@/account/groupLabel'
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { adoptLocalData, keepLocalDataApart } from '@/sync/session'
import { t } from '@/i18n'

/**
 * First sign-in on a device that has its own data while the group already has some
 * (docs/UX.md «Вход»): add the device's dishes and history to the group, or leave them out.
 * Either way a copy of them stays in the browser.
 */
export function LocalDataDialog() {
  const localData = useSyncStore((s) => s.localData)
  const me = useAccountStore((s) => s.me)
  const group = me?.groups.find((g) => g.id === me.defaultGroupId)
  const groupName = group ? groupLabel(group, me?.user.id) : ''

  return (
    <AlertDialog open={localData !== null} onOpenChange={(open) => !open && keepLocalDataApart()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.localData.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {localData && t('common.localData.text', { count: localData.dishes.length, group: groupName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={keepLocalDataApart}>{t('common.localData.keepApart')}</AlertDialogCancel>
          <AlertDialogAction onClick={adoptLocalData}>{t('common.localData.adopt')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
