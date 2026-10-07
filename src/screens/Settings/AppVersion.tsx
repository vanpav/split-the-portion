import { cn } from '@/lib/utils'

/** The build version under the «Приложение» cluster, to paste into a bug report (scripts/appVersion.ts). */
export function AppVersion({ className }: { className?: string }) {
  return <p className={cn('px-1 text-xs text-muted-foreground tabular-nums select-text', className)}>Версия&nbsp;{__APP_VERSION__}</p>
}
