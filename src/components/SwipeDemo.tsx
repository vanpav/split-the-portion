import { CopyIcon } from 'lucide-react'

/** A row swiped right to «Копировать» and back, as on the calculator. Still when motion is reduced. */
export function SwipeDemo() {
  return (
    <div aria-hidden className="relative h-11 overflow-hidden rounded-lg bg-primary text-primary-foreground">
      <span className="absolute inset-y-0 left-0 flex w-20 flex-col items-center justify-center gap-0.5 text-xs">
        <CopyIcon className="size-4" />
        Копировать
      </span>
      <span className="absolute inset-0 flex items-center gap-2 rounded-lg border bg-background px-3 text-foreground motion-safe:animate-swipe-hint motion-reduce:translate-x-20">
        <span className="size-3 rounded-[4px] bg-muted-foreground/40" />
        <span className="flex-1 font-medium">Ваня</span>
        <span className="font-medium tabular-nums">280 г</span>
      </span>
    </div>
  )
}
