import { TareForm } from '@/components/TareForm'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Tare } from '@/domain'

interface NewTareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The tare just added; the dialog closes by itself. */
  onCreated: (tare: Tare) => void
}

/** «Добавить тару» from a tare select: the settings' form in a dialog. */
export function NewTareDialog({ open, onOpenChange, onCreated }: NewTareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая тара</DialogTitle>
          <DialogDescription>Вес пустой посуды — вычтем его сами.</DialogDescription>
        </DialogHeader>
        <TareForm
          autoFocus
          onCreated={(tare) => {
            onCreated(tare)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
