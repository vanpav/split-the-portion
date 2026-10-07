import { GripVerticalIcon, PlusIcon } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  isEqualSplit,
  keepAt,
  moveBoundary,
  toPercents,
  type CompanyMember,
  type Id,
} from '@/domain'
import { cn } from '@/lib/utils'
import { lidFill, lidPale } from './lids'
import { ShareControls } from './ShareControls'

export interface DishSegment {
  id: Id
  /** Place in today's lineup: the person's lid color. */
  place: number
  name: string
  /** Part of the whole dish, 0..1. */
  share: number
  /** Grams of the view once weighed: only for the segment's `aria-label`, the bar itself shows no grams. */
  label: string | null
}

interface ShareSliderProps {
  /** People who split by share, in lineup order: their borders can be dragged. */
  sharing: CompanyMember[]
  /** Dish part of each sharing person, by id (computed). */
  sharingSegments: DishSegment[]
  /** People with an own portion in grams: shown, not draggable. */
  own: DishSegment[]
  /** What stays in the pot; null when everything is given out. */
  rest: { share: number; label: string | null } | null
  /**
   * New split of the sharing people in the order of `sharing`, in percent: whole after a drag or ±1 %,
   * exact after «Поровну».
   */
  onChange: (percents: number[]) => void
  /** «На завтра»: percent of the dish set aside, pulled in from the right edge. */
  keep?: number
  /** The most that can be set aside now (`keepLimit`); 0 — nothing to cut. */
  keepMost?: number
  /** Without it there is no «на завтра» edge (a company in the settings). */
  onKeep?: (percent: number) => void
  /**
   * Segments are titled by number, not by name: «3» fits a segment far narrower than «Порция 3», and it
   * tells two portions apart when there are more of them than lids. «Доли».
   */
  numbered?: boolean
  /**
   * Nobody yet: an empty bar with this text keeps the bar's place, so the screen does not jump when the
   * first person comes or «Доли» is picked. It is the label of the «+ Имя»
   * field (`fieldId`): a tap puts the cursor there. Without it — nothing.
   */
  empty?: { label: string; fieldId: string }
  /** `data-hint` of the bar: the calculator tour points at it (docs/UX.md §3б). */
  hint?: string
  /** Who − and + adjust: one of `sharing`, or null (then the first one). Chosen by the screen, so rows can choose too. */
  chosenId: Id | null
  onChoose: (id: Id) => void
}

/** Index of the «на завтра» border among the draggable ones (the others are 0..n-2). */
const KEEP = -1

const SEGMENT =
  '@container absolute inset-y-0 flex flex-col items-center justify-center overflow-hidden text-xs leading-tight outline-none'

/**
 * A grip covers about 2rem; next to a segment narrower than 4rem it hides the grams. For each border the
 * bar width (rem) under which it no longer fits, as literal container classes Tailwind can find, every
 * 2rem: with many people or portions on a phone only the chosen one's borders keep their grips, on a wide
 * bar all of them (docs/UX.md §3).
 */
const GRIP_ROOM = [
  [16, ''],
  [18, '@max-[18rem]/bar:hidden'],
  [20, '@max-[20rem]/bar:hidden'],
  [22, '@max-[22rem]/bar:hidden'],
  [24, '@max-[24rem]/bar:hidden'],
  [26, '@max-[26rem]/bar:hidden'],
  [28, '@max-[28rem]/bar:hidden'],
  [30, '@max-[30rem]/bar:hidden'],
  [32, '@max-[32rem]/bar:hidden'],
  [34, '@max-[34rem]/bar:hidden'],
  [36, '@max-[36rem]/bar:hidden'],
  [38, '@max-[38rem]/bar:hidden'],
  [40, '@max-[40rem]/bar:hidden'],
  [42, '@max-[42rem]/bar:hidden'],
  [44, '@max-[44rem]/bar:hidden'],
  [46, '@max-[46rem]/bar:hidden'],
  [48, '@max-[48rem]/bar:hidden'],
] as const
/**
 * `narrowest` — the narrower of the two segments by a border, in percent of the bar. A hair of rounding
 * must not move a border to the next width: nine equal portions need 36rem whether their parts add up to
 * 99,999… or 100,000…, so all their grips show or hide together.
 */
const gripRoom = (narrowest: number) => {
  const needed = narrowest > 0 ? 400 / narrowest - 0.01 : Infinity
  return GRIP_ROOM.find(([rem]) => needed <= rem)?.[1] ?? 'hidden'
}

/**
 * The whole dish as one bar (docs/SPEC.md §3б): a segment per person in the size of what they get,
 * own portions outlined, what stays in the pot hatched. Borders between people who split by share
 * can be dragged; ±1 % and «Поровну» below act on those people. The labels follow each segment's
 * width: a name (or number), or nothing; never grams and never percent. A company in the settings uses it too, without «на завтра» and without grams
 * (docs/UX.md §3).
 */
export function ShareSlider({
  sharing,
  sharingSegments,
  own,
  rest,
  onChange,
  keep = 0,
  keepMost = 0,
  onKeep,
  numbered = false,
  empty,
  hint,
  chosenId,
  onChoose,
}: ShareSliderProps) {
  const barRef = useRef<HTMLDivElement>(null)
  // The border being dragged: a ref answers at once (moves arrive before a re-render), state paints it.
  const dragRef = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  // A tap on the «на завтра» edge lights it up for a moment: touch has no hover to say «pull me».
  const [edgeLit, setEdgeLit] = useState(false)
  useEffect(() => {
    if (!edgeLit) return
    const timer = setTimeout(() => setEdgeLit(false), 2000)
    return () => clearTimeout(timer)
  }, [edgeLit])

  const total =
    sharingSegments.reduce((a, s) => a + s.share, 0) + own.reduce((a, s) => a + s.share, 0) + (rest?.share ?? 0)
  if (sharingSegments.length + own.length === 0 && empty) {
    return (
      <div className="flex flex-col gap-3">
        {/* A label, not a button: the browser itself moves the focus to «+ Имя», and on a phone the keyboard
            opens within the tap. From the keyboard «+ Имя» is the next field anyway. */}
        <label
          htmlFor={empty.fieldId}
          className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border px-3 text-sm text-muted-foreground transition-colors select-none hover:border-input hover:bg-muted/50 hover:text-foreground active:bg-muted"
        >
          <PlusIcon aria-hidden className="size-4" />
          {empty.label}
        </label>
      </div>
    )
  }
  if (total <= 0 || sharingSegments.length + own.length === 0) return null

  // Bar geometry in percent of its width: sharing people first (a block whose inside is draggable),
  // then own portions, then the pot.
  const width = (share: number) => (share / total) * 100
  const groupWidth = width(sharingSegments.reduce((a, s) => a + s.share, 0))
  // Dragging and ±1 % work in whole percents; the segments are as wide as the exact shares, so seven equal
  // portions are seven equal segments, not 15, 15, 14… wide.
  const percents = toPercents(sharing.map((p) => p.weight))
  const weightTotal = sharing.reduce((a, p) => a + Math.max(p.weight, 0), 0)
  const sharingWidths = sharing.map((p) => (weightTotal > 0 ? Math.max(p.weight, 0) / weightTotal : 1 / sharing.length) * groupWidth)
  const sharingStarts = sharingWidths.map((_, i) => sharingWidths.slice(0, i).reduce((a, b) => a + b, 0))
  const ownStarts = own.map((_, i) => groupWidth + own.slice(0, i).reduce((a, s) => a + width(s.share), 0))
  const restStart = groupWidth + own.reduce((a, s) => a + width(s.share), 0)

  const selectedIndex = Math.max(0, sharing.findIndex((p) => p.id === chosenId))
  const name = (index: number) => sharing[index]?.name.trim() || 'Без имени'
  const segmentFor = (id: Id) => sharingSegments.find((s) => s.id === id)

  // Percent of the bar under the pointer; inside the sharing block when `inGroup`.
  const atPointer = (e: PointerEvent, inGroup = true) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const atBar = ((e.clientX - rect.left) / rect.width) * 100
    if (!inGroup) return (atBar / 100) * total * 100
    return groupWidth > 0 ? (atBar / groupWidth) * 100 : 0
  }
  const canKeep = onKeep !== undefined && keepMost > 0
  // A grip is 44 px wide: at the very ends it stops half a grip in, so it never sticks out of the page.
  const gripAt = (percent: number) => `clamp(1.375rem, ${percent}%, calc(100% - 1.375rem))`
  const keepStart = 100 - width(rest?.share ?? 0)
  const startDrag = (index: number) => (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    // Keeps the moves coming when the finger leaves the grip; not every pointer can be captured.
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* the drag still works while the pointer stays over the grip */
    }
    dragRef.current = index
    setDragging(index)
  }
  const endDrag = () => {
    dragRef.current = null
    setDragging(null)
  }
  const drag = (index: number) => (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current !== index) return
    if (index === KEEP) {
      const next = keepAt(atPointer(e, false), keepMost)
      if (next !== keep) onKeep?.(next)
      return
    }
    const next = moveBoundary(percents, index, atPointer(e))
    if (next.some((p, i) => p !== percents[i])) onChange(next)
  }
  const borderPercent = (index: number) => percents.slice(0, index + 1).reduce((a, b) => a + b, 0)
  const arrowStep = (e: KeyboardEvent) =>
    e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
  const keyStep = (index: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    const step = arrowStep(e)
    if (!step) return
    e.preventDefault()
    if (index === KEEP) onKeep?.(keepAt(100 - keep + step, keepMost))
    else onChange(moveBoundary(percents, index, borderPercent(index) + step))
  }
  const lastIndex = sharing.length + own.length + (rest ? 1 : 0) - 1
  const rounding = (index: number) =>
    cn(index === 0 && 'rounded-l-xl', index === lastIndex && 'rounded-r-xl', index > 0 && 'shadow-[inset_2px_0_0_var(--color-background)]')
  // The title over the grams: a name, or in «Доли» the portion's number (its place in the lineup).
  const titleOf = (title: string, place: number | null) => (numbered && place !== null ? String(place + 1) : title)
  // A segment says who it is, never how much: the width shows the share, the grams are in the row or container.
  // A name is dropped from a segment narrower than 2.5rem, a number from one narrower than 1rem.
  const labels = (title: string, place: number | null = null) => (
    <span
      className={cn(
        'w-full truncate text-center text-sm font-semibold',
        numbered && place !== null ? 'px-0.5 @max-[1rem]:hidden' : 'px-2 @max-[2.5rem]:hidden',
      )}
    >
      {titleOf(title, place)}
    </span>
  )
  const restTitle = keep > 0 ? 'На завтра' : 'Остаток'

  return (
    // A little air between the bar and the controls under it: the knobs need room to be grabbed.
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2" data-hint={hint}>
        <div ref={barRef} className="@container/bar relative h-12 min-w-0 flex-1 touch-none select-none">
          {sharing.map((person, index) => {
            const segment = segmentFor(person.id)
            return (
              <button
                key={person.id}
                type="button"
                aria-pressed={sharing.length > 1 && index === selectedIndex}
                aria-label={segment?.label ? `${name(index)}: ${segment.label}` : name(index)}
                onClick={() => onChoose(person.id)}
                // Placed by percent, not by flex: padding must not move a border away from its grip.
                style={{ left: `${sharingStarts[index]}%`, width: `${sharingWidths[index]}%` }}
                className={cn(
                  SEGMENT,
                  'transition-[left,width,background-color,color] ease-out focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset',
                  dragging === null ? 'duration-300' : 'duration-0',
                  rounding(index),
                  // Each person in their lid color; the one the ±1 % buttons adjust is ringed, keeping it.
                  'text-chart-foreground',
                  lidFill(segment?.place ?? index),
                  sharing.length > 1 && index === selectedIndex && 'font-semibold ring-2 ring-foreground ring-inset',
                )}
              >
                {labels(name(index), segment?.place ?? index)}
              </button>
            )
          })}

          {/* An own portion is fixed in grams: outlined, not dragged. */}
          {own.map((segment, i) => (
            <div
              key={segment.id}
              role="img"
              aria-label={`${segment.name.trim() || 'Без имени'}: своя порция${segment.label ? `, ${segment.label}` : ''}`}
              style={{ left: `${ownStarts[i]}%`, width: `${width(segment.share)}%` }}
              className={cn(
                SEGMENT,
                // Dashed in its own text color: ink at 25% on the pale lid, the lid itself in dark.
                'border-2 border-dashed border-current/25 transition-[left,width] duration-300 ease-out dark:border-current/60',
                lidPale(segment.place),
                rounding(sharing.length + i),
              )}
            >
              {labels(segment.name.trim() || 'Без имени', segment.place)}
            </div>
          ))}

          {/* What stays in the pot: hatched, so it reads as «not taken» rather than as a person. */}
          {rest && (
            <div
              role="img"
              aria-label={rest.label ? `${restTitle}: ${rest.label}` : restTitle}
              style={{ left: `${restStart}%`, width: `${width(rest.share)}%` }}
              className={cn(
                SEGMENT,
                'bg-[repeating-linear-gradient(135deg,var(--color-muted)_0_6px,var(--color-background)_6px_12px)] text-muted-foreground transition-[left,width] duration-300 ease-out',
                rounding(lastIndex),
              )}
            >
              {labels(restTitle)}
            </div>
          )}

          {sharing.slice(0, -1).map((person, index) => (
            <div
              key={person.id}
              role="slider"
              tabIndex={0}
              aria-label={`Граница: ${name(index)} и ${name(index + 1)}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={borderPercent(index)}
              aria-valuetext={`${name(index)} ${percents[index]} %, ${name(index + 1)} ${percents[index + 1]} %`}
              onPointerDown={startDrag(index)}
              onPointerMove={drag(index)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={keyStep(index)}
              style={{ left: gripAt(sharingStarts[index + 1]) }}
              // Centred on the border, 44 px to hit; a round knob that stands out of the bar says «drag me».
              // Above the unseen «на завтра» strip: a border pushed to the edge can still be pulled back.
              className={cn(
                'group/grip absolute top-1/2 z-20 flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center outline-none active:cursor-grabbing',
                dragging === null && 'transition-[left] duration-300 ease-out',
                // The chosen one's borders and the one in the hand always keep their grips.
                index !== selectedIndex &&
                  index + 1 !== selectedIndex &&
                  dragging !== index &&
                  gripRoom(Math.min(sharingWidths[index], sharingWidths[index + 1])),
              )}
            >
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground',
                  'shadow-[0_2px_6px_rgb(0_0_0/0.18)] transition-transform duration-150 ease-out',
                  'group-focus-visible/grip:ring-[3px] group-focus-visible/grip:ring-ring/50',
                  dragging === index && 'scale-110 shadow-[0_4px_12px_rgb(0_0_0/0.22)]',
                )}
              >
                <GripVerticalIcon className="size-4" />
              </span>
            </div>
          ))}

          {/* «На завтра»: an unseen strip on the right edge; pulled in, it becomes a border with a knob. */}
          {canKeep && (
            <div
              role="slider"
              tabIndex={0}
              aria-label="Отложить на завтра"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={keep}
              aria-valuetext={`На завтра ${keep} % блюда`}
              data-lit={(keep === 0 && edgeLit) || undefined}
              onPointerDown={(e) => {
                startDrag(KEEP)(e)
                if (e.pointerType !== 'mouse') setEdgeLit(true)
              }}
              onPointerMove={drag(KEEP)}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={keyStep(KEEP)}
              style={keep > 0 ? { left: gripAt(keepStart) } : undefined}
              className={cn(
                'group/grip absolute top-1/2 z-10 flex -translate-y-1/2 cursor-ew-resize items-center justify-center outline-none',
                keep > 0
                  ? 'size-11 -translate-x-1/2 cursor-grab active:cursor-grabbing'
                  : // Half over the bar's end, half over the page margin: easy to catch, no scroll.
                    '-right-3 h-12 w-8',
                keep > 0 && dragging === null && 'transition-[left] duration-300 ease-out',
              )}
            >
              {keep === 0 && (
                // Hover (a mouse) or a tap (touch): a hatched sliver of the bar's end and a knob on its edge —
                // the same look as «На завтра» and as the other borders, before anything is cut.
                <>
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute inset-y-0 left-0 w-5 rounded-r-xl opacity-0 transition-opacity duration-200 ease-out',
                      'bg-[repeating-linear-gradient(135deg,var(--color-muted)_0_6px,var(--color-background)_6px_12px)]',
                      'group-hover/grip:opacity-100 group-focus-visible/grip:opacity-100 group-data-lit/grip:opacity-100',
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute top-1/2 left-5 flex size-8 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full border border-border bg-background text-foreground opacity-0',
                      'shadow-[0_2px_6px_rgb(0_0_0/0.18)] transition-[opacity,scale] duration-200 ease-out',
                      'group-hover/grip:scale-100 group-hover/grip:opacity-100 group-focus-visible/grip:scale-100 group-focus-visible/grip:opacity-100',
                      'group-data-lit/grip:scale-100 group-data-lit/grip:opacity-100',
                    )}
                  >
                    <GripVerticalIcon className="size-4" />
                  </span>
                </>
              )}
              {keep > 0 && (
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground',
                    'shadow-[0_2px_6px_rgb(0_0_0/0.18)] transition-transform duration-150 ease-out',
                    'group-focus-visible/grip:ring-[3px] group-focus-visible/grip:ring-ring/50',
                    dragging === KEEP && 'scale-110 shadow-[0_4px_12px_rgb(0_0_0/0.22)]',
                  )}
                >
                  <GripVerticalIcon className="size-4" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <ShareControls
        names={sharing.map((_, i) => name(i))}
        percents={percents}
        equal={isEqualSplit(sharing.map((p) => p.weight))}
        selectedIndex={selectedIndex}
        onChange={onChange}
        mark={{ place: segmentFor(sharing[selectedIndex]?.id ?? '')?.place ?? selectedIndex, numbered }}
      />
    </div>
  )
}
