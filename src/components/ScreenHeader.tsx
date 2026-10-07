import { ArrowLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useBack } from '@/app/useBack'
import { Button } from '@/components/ui/button'

interface ScreenHeaderProps {
  title: string
  /** A quiet line under the title, e.g. the dish. */
  subtitle?: string
  /** Show the back link. */
  back?: boolean
  /** Where the back link leads when there is no previous screen of the app (a direct link). */
  backTo?: string
  /** Names the fallback; with a previous screen the link says «Назад». */
  backLabel?: string
  /** Screen actions on the right, e.g. «История», «Изменить». */
  action?: ReactNode
}

/** On a phone the back link is an arrow only: the title needs the width. */
export function ScreenHeader({ title, subtitle, back, backTo = '/', backLabel = 'Блюда', action }: ScreenHeaderProps) {
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
      <div className="min-w-0 flex-1 px-2">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-sm leading-tight text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
