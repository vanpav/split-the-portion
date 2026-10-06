import { TriangleAlertIcon } from 'lucide-react'
import { Outlet } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store/store'
import { LocalDataDialog } from './LocalDataDialog'
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
        <Outlet />
        {/* Top: at the bottom a toast would cover the calculator keypad. */}
        <Toaster position="top-center" />
        <UpdatePrompt />
        <LocalDataDialog />
      </div>
    </TooltipProvider>
  )
}
