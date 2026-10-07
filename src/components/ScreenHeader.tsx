import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useBack } from '@/app/useBack'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScreenHeaderProps {
  title: string
  /** Show the back link. */
  back?: boolean
  /** Where the back link leads when there is no previous screen of the app (a direct link). */
  backTo?: string
  /** Names the fallback; with a previous screen the link says «Назад». */
  backLabel?: string
  /** Screen actions on the right, e.g. «История», «Изменить». */
  action?: ReactNode
  /** A long title next to a wide text action: less air around the title so it keeps its width. */
  compactTitle?: boolean
}

/** On a phone the back link is an arrow only: the title needs the width. */
export function ScreenHeader({ title, back, backTo = '/', backLabel = 'Блюда', action, compactTitle }: ScreenHeaderProps) {
  const { hasPrevious, back: goBack } = useBack(backTo)
  // The previous screen can be any, so it is named only when «←» leads to the fallback.
  const label = hasPrevious ? 'Назад' : backLabel
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-1 border-b bg-background/95 px-2 pt-[max(0.25rem,env(safe-area-inset-top))] pb-1 backdrop-blur">
      {back && (
        <Button variant="ghost" className="max-sm:size-11 max-sm:px-0" asChild>
          {/* A link to the fallback, so a new tab still works; a plain click steps back in history instead. */}
          <Link
            to={backTo}
            aria-label={label}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
              e.preventDefault()
              goBack()
            }}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            <span className="max-w-32 truncate max-sm:hidden">{label}</span>
          </Link>
        </Button>
      )}
      <h1 className={cn('min-w-0 flex-1 truncate px-2 text-lg font-semibold', compactTitle && 'px-0.5')}>{title}</h1>
      {action}
    </header>
  )
}
