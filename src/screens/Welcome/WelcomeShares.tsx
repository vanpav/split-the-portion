const BOX = 'flex h-11 flex-1 items-end justify-center rounded-lg pb-1.5 text-sm font-medium text-chart-foreground motion-safe:animate-box-drop'

/**
 * The share bar with its border slowly pulled one way and back, and under it the lunchboxes it fills:
 * one per eater in their lid color, one for tomorrow.
 */
export function WelcomeShares() {
  return (
    <div aria-hidden className="flex w-full max-w-80 flex-col gap-4">
      <div className="flex h-14 overflow-hidden rounded-xl text-base font-semibold text-chart-foreground">
        <div className="flex w-1/2 items-center justify-center bg-chart-1 motion-safe:animate-share-tug">Ваня</div>
        <div className="flex flex-1 items-center justify-center border-l-2 border-background bg-chart-2">Ксюша</div>
      </div>
      <div className="flex gap-2 px-2">
        <div className={`${BOX} bg-chart-1 [animation-delay:200ms]`}>Ваня</div>
        <div className={`${BOX} bg-chart-2 [animation-delay:350ms]`}>Ксюша</div>
        <div className={`${BOX} border border-dashed bg-muted text-muted-foreground [animation-delay:500ms]`}>на завтра</div>
      </div>
    </div>
  )
}
