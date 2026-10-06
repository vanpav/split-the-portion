import { TriangleAlertIcon } from 'lucide-react'
import { Outlet, ScrollRestoration } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { KEYBOARD_PROXY_ID } from '@/lib/domIds'
import { useAppStore } from '@/store/store'
import { LocalDataDialog } from './LocalDataDialog'
import { ScreenTransition } from './ScreenTransition'
import { UpdatePrompt } from './UpdatePrompt'

export function RootLayout() {
  const loadError = useAppStore((s) => s.loadError)
  const dismissLoadError = useAppStore((s) => s.dismissLoadError)

  return (
    // No tab bar: the calculator is home, the dish shelf on top leads everywhere else.
    // Tooltips (with a mouse) wait a moment, so passing over a button does not flash them.
    <TooltipProvider delayDuration={400}>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        {loadError && (
          <div className="mx-auto max-w-3xl p-4 pb-0">
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Не удалось прочитать сохранённые данные</AlertTitle>
              <AlertDescription>
                <p>Копия сохранена в браузере, приложение начато с чистого листа.</p>
                <Button variant="outline" size="sm" onClick={dismissLoadError}>
                  Понятно
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <ScreenTransition>
          <Outlet />
        </ScreenTransition>
        {/* Holds the keyboard open on an iPhone between 🔍 and the dish menu's field (KEYBOARD_PROXY_ID).
            Outside ScreenTransition, so a screen change never remounts it; fixed, so it adds no scroll. 16 px, or the iPhone zooms in on focus; out of the tab order. Not aria-hidden — it does get the focus,
            for a moment — so it is named as the field it stands in for. */}
        <input
          id={KEYBOARD_PROXY_ID}
          aria-label="Найти блюдо"
          tabIndex={-1}
          autoComplete="off"
          className="pointer-events-none fixed top-0 left-0 size-px text-base opacity-0"
        />
        {/* «Назад» returns to the same place on the screen; a new screen opens at the top. */}
        <ScrollRestoration />
        {/* Top: at the bottom a toast would hide under the phone's keyboard. */}
        <Toaster position="top-center" />
        <UpdatePrompt />
        <LocalDataDialog />
      </div>
    </TooltipProvider>
  )
}
