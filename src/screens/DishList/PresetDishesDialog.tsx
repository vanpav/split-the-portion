import { useState } from 'react'
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

interface PresetDishesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  simple: number
  composite: number
  onAdd: () => void
}

/** With dishes already there, «Добавить популярные блюда» asks first: how many, and that nothing of theirs changes. */
export function PresetDishesDialog({ open, onOpenChange, simple, composite, onAdd }: PresetDishesDialogProps) {
  // Counts kept while the dialog closes: the list changes under it on «Добавить».
  const [counts, setCounts] = useState({ simple, composite })
  if (open && (counts.simple !== simple || counts.composite !== composite)) setCounts({ simple, composite })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Добавить популярные блюда?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Добавятся простые блюда: ${counts.simple}, составные: ${counts.composite}. Твои блюда не изменятся, блюда с такими же названиями пропустим.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onAdd}>Добавить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
