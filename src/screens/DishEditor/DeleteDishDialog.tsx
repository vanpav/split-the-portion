import { useNavigate } from 'react-router'
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
import type { Dish } from '@/domain'
import { useAppStore } from '@/store/store'
import { t } from '@/i18n'
import { dishTitle } from '@/i18n/format'

interface DeleteDishDialogProps {
  dish: Dish
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** «Удалить блюдо» from the editor's «⋯»: asks first, then removes it and goes to the calculator. */
export function DeleteDishDialog({ dish, open, onOpenChange }: DeleteDishDialogProps) {
  const navigate = useNavigate()
  const deleteDish = useAppStore((s) => s.deleteDish)

  const remove = () => {
    deleteDish(dish.id)
    navigate('/', { replace: true })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('editor.deleteTitle', { name: dishTitle(dish) })}</AlertDialogTitle>
          <AlertDialogDescription>{t('editor.deleteText')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
