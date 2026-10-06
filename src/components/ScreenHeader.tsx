import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

interface ScreenHeaderProps {
  title: string
  /** Show the back link. */
  back?: boolean
  /** Where the back link leads. */
  backTo?: string
  backLabel?: string
  /** Screen actions on the right, e.g. «История», «Изменить». */
  action?: ReactNode
}

/** On a phone the back link is an arrow only: the title needs the width. Settings live in the tab bar. */
export function ScreenHeader({ title, back, backTo = '/', backLabel = 'Блюда', action }: ScreenHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-1 border-b bg-background/95 px-2 pt-[max(0.25rem,env(safe-area-inset-top))] pb-1 backdrop-blur">
      {back && (
        <Button variant="ghost" className="max-sm:size-11 max-sm:px-0" asChild>
          <Link to={backTo} aria-label={backLabel}>
            <ArrowLeftIcon data-icon="inline-start" />
            <span className="max-w-32 truncate max-sm:hidden">{backLabel}</span>
          </Link>
        </Button>
      )}
      <h1 className="min-w-0 flex-1 truncate px-2 text-lg font-semibold">{title}</h1>
      {action}
    </header>
  )
}
