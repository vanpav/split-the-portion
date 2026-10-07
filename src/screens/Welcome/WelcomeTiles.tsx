/**
 * The calculator's two readouts: the dry weight the dish remembers, the cooked one typed today —
 * it rises in, then the quiet line under the tiles. Same look as the calculator, smaller.
 */
export function WelcomeTiles() {
  return (
    <div aria-hidden className="flex w-full max-w-72 flex-col gap-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-muted px-3.5 py-2.5">
          <div className="text-sm text-muted-foreground">Сухой</div>
          <div className="text-[1.75rem] leading-tight font-medium tabular-nums">
            200 <span className="text-base text-muted-foreground">г</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card px-3.5 py-2.5">
          <div className="text-sm text-muted-foreground">Готовый</div>
          <div className="text-[1.75rem] leading-tight font-medium tabular-nums">
            <span className="inline-block motion-safe:animate-rise motion-safe:[animation-delay:500ms]">560</span>{' '}
            <span className="text-base text-muted-foreground">г</span>
          </div>
        </div>
      </div>
      <div className="px-2 py-1.5 text-sm text-muted-foreground tabular-nums motion-safe:animate-rise motion-safe:[animation-delay:900ms]">
        Без тары · k = 2,8
      </div>
    </div>
  )
}
