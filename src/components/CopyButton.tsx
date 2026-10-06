import { CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface CopyButtonProps {
  /** Built on click only: the text is not needed on every render. */
  getText: () => string | null
  disabled?: boolean
  label: string
  /** Default — a 44 px icon button; 'sm' — half the height, for a stack of row actions. */
  size?: 'default' | 'sm'
}

/**
 * Copies text for the tracker. Clipboard API needs a secure context; on a phone over LAN http it is
 * missing, so the text is shown in a dialog, already selected.
 */
export function CopyButton({ getText, disabled, label, size = 'default' }: CopyButtonProps) {
  // Text that could not be copied automatically; the dialog is open while it is set.
  const [manualText, setManualText] = useState<string | null>(null)

  const copy = async () => {
    const text = getText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast('Скопировано', { description: text.split('\n')[0] + (text.includes('\n') ? ' …' : '') })
    } catch {
      setManualText(text)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size === 'sm' ? 'icon-sm' : 'icon'}
        className={size === 'sm' ? 'w-10 text-muted-foreground' : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={copy}
      >
        <CopyIcon />
      </Button>
      <Dialog open={manualText !== null} onOpenChange={(open) => !open && setManualText(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Скопируйте вручную</DialogTitle>
            <DialogDescription>Браузер не дал доступ к буферу обмена. Текст уже выделен.</DialogDescription>
          </DialogHeader>
          {manualText !== null && (
            <Textarea
              readOnly
              rows={Math.min(8, manualText.split('\n').length + 1)}
              value={manualText}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
