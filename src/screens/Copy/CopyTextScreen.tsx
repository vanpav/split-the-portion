import { Navigate, useLocation, useResolvedPath } from 'react-router'
import { useBack } from '@/app/useBack'
import { BottomBar } from '@/components/BottomBar'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const textOf = (state: unknown) =>
  typeof state === 'object' && state !== null && 'copyText' in state && typeof state.copyText === 'string'
    ? state.copyText
    : null

/**
 * `…/copy` under the calculator or a settings subsection: the browser refused the clipboard (a phone
 * over LAN http), so the text is shown selected, to copy by hand (docs/UX.md §3а). The screen it was
 * opened from stays mounted under it. Without the text (typed in by hand) — back to that screen.
 */
export function CopyTextScreen() {
  const text = textOf(useLocation().state)
  const { pathname: from } = useResolvedPath('..')
  const { back } = useBack(from)
  if (text === null) return <Navigate to={from} replace />

  return (
    <>
      <ScreenHeader title="Скопируйте вручную" back backTo={from} />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <p className="px-1 text-sm text-muted-foreground">Браузер не дал доступ к буферу обмена. Текст уже выделен.</p>
        <Textarea
          readOnly
          // Selected as it opens, and again on every tap.
          ref={(el) => el?.select()}
          aria-label="Текст для копирования"
          rows={Math.min(12, text.split('\n').length + 1)}
          value={text}
          onFocus={(e) => e.currentTarget.select()}
        />
        <BottomBar>
          <Button size="lg" className="flex-1 lg:flex-none" onClick={back}>
            Готово
          </Button>
        </BottomBar>
      </main>
    </>
  )
}
