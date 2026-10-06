import { TriangleAlertIcon } from 'lucide-react'
import { Outlet, useLocation } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/store'
import { LocalDataDialog } from './LocalDataDialog'
import { HISTORY_PATH, isSettingsPath } from './paths'
import { TabBar } from './TabBar'
import { UpdatePrompt } from './UpdatePrompt'

export function RootLayout() {
  const loadError = useAppStore((s) => s.loadError)
  const dismissLoadError = useAppStore((s) => s.dismissLoadError)
  // Top-level screens get the tab bar; detail screens use the bottom for their own actions.
  const { pathname } = useLocation()
  const topLevel = pathname === '/' || pathname === HISTORY_PATH || isSettingsPath(pathname)

  return (
    <div className={cn('flex min-h-svh flex-col bg-background text-foreground', topLevel && 'lg:pl-24')}>
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
      {topLevel && <TabBar />}
      {/* Top: at the bottom a toast would cover the calculator keypad. */}
      <Toaster position="top-center" />
      <UpdatePrompt />
      <LocalDataDialog />
    </div>
  )
}
