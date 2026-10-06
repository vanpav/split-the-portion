import { CopyIcon } from 'lucide-react'
import { type Ref } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { COPY_TEXT, type CopyTextState } from '@/app/paths'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  /** Built on click only: the text is not needed on every render. */
  getText: () => string | null
  disabled?: boolean
  label: string
  /** Default — a 44 px icon button; 'sm' — half the height, for a stack of row actions. */
  size?: 'default' | 'sm'
  /** The button itself: a swipe right on a touch screen clicks it. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * Copies text for the tracker. Clipboard API needs a secure context; on a phone over LAN http it is
 * missing, so the text is shown on a screen of its own, already selected (docs/UX.md §3а): the
 * `copy` route under the screen the button is on (the calculator, a settings subsection).
 */
export function CopyButton({ getText, disabled, label, size = 'default', ref }: CopyButtonProps) {
  const navigate = useNavigate()

  const copy = async () => {
    const text = getText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast('Скопировано', { description: text.split('\n')[0] + (text.includes('\n') ? ' …' : '') })
    } catch {
      navigate(COPY_TEXT, { state: { copyText: text } satisfies CopyTextState })
    }
  }

  return (
    <Button
      ref={ref}
      variant="ghost"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      className={size === 'sm' ? 'w-10 text-muted-foreground' : undefined}
      aria-label={label}
      disabled={disabled}
      onClick={copy}
    >
      <CopyIcon />
    </Button>
  )
}
