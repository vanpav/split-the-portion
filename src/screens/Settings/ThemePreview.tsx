import { cn } from '@/lib/utils'

/**
 * The calculator in miniature, drawn by the theme's own tokens: `.light` / `.dark` scope them, so the
 * preview shows that theme whatever the screen is in.
 */
export function ThemePreview({ theme, className }: { theme: 'light' | 'dark'; className?: string }) {
  return (
    <div aria-hidden className={cn(theme, 'flex flex-col gap-1 bg-background p-1.5', className)}>
      <div className="flex gap-1">
        <span className="h-2 w-5 rounded-full bg-secondary" />
        <span className="h-2 w-4 rounded-full bg-secondary" />
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="h-5 rounded-[5px] bg-muted/60" />
        <span className="h-5 rounded-[5px] border bg-card" />
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-[4px]">
        <span className="w-[54%] bg-chart-1" />
        <span className="flex-1 bg-chart-2" />
      </div>
    </div>
  )
}
