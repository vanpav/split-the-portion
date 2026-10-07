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
import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import { adoptLocalData, keepLocalDataApart } from '@/sync/session'

/**
 * First sign-in on a device that has its own data while the group already has some
 * (docs/UX.md «Вход»): add the device's dishes and history to the group, or leave them out.
 * Either way a copy of them stays in the browser.
 */
export function LocalDataDialog() {
  const localData = useSyncStore((s) => s.localData)
  const groupName = useAccountStore((s) => s.me?.groups.find((g) => g.id === s.me?.defaultGroupId)?.name ?? '')

  return (
    <AlertDialog open={localData !== null} onOpenChange={(open) => !open && keepLocalDataApart()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Перенести данные этого устройства?</AlertDialogTitle>
          <AlertDialogDescription>
            {localData &&
              `На этом устройстве блюд: ${localData.dishes.length}. ` +
                `В группе «${groupName}» уже есть другие блюда. Перенести эти в группу? Одинаковые могут продублироваться.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={keepLocalDataApart}>Не переносить</AlertDialogCancel>
          <AlertDialogAction onClick={adoptLocalData}>Перенести</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
