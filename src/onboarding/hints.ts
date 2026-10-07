/**
 * Hints for new people (docs/UX.md §3в, §3г): the welcome screen, the calculator tour and the cards
 * in place. Pure: what to show next is decided here, the screens only render it. What was shown
 * and skipped is a setting of this device (docs/ARCHITECTURE.md §5.2).
 */

/** Cards shown in place, one at a time; the first that fits wins. */
export type HintCardId = 'install' | 'copy'
const CARD_ORDER: readonly HintCardId[] = ['install', 'copy']

export interface HintPrefs {
  /** The first launch with hints is sorted out: a device that already had dishes skips them. */
  settled: boolean
  /** «Пропустить» or «Не показывать»: no tour, no cards. */
  off: boolean
  /** The welcome screen is gone through. */
  welcome: boolean
  /** The calculator tour: done, or the step it goes on from. */
  tour: 'done' | number
  /** Cards not shown again: dismissed, or what they ask for is done. */
  done: HintCardId[]
  /** In how many launches each card was shown. */
  shown: Partial<Record<HintCardId, number>>
}

export const EMPTY_HINTS: HintPrefs = { settled: false, off: false, welcome: false, tour: 0, done: [], shown: {} }

/** A card shown in this many launches is not shown again: it has had its chance. */
export const SHOWS_PER_CARD = 3

/**
 * Once, on the first launch with hints: they are for new people, so a device that already has dishes
 * goes past the welcome and the tour. Cards stay — each goes away by itself.
 */
export function settleHints(hints: HintPrefs, hasDishes: boolean): HintPrefs {
  if (hints.settled) return hints
  return hasDishes ? { ...hints, settled: true, welcome: true, tour: 'done' } : { ...hints, settled: true }
}

/** `#/` opens the welcome screen instead of the empty dish list. */
export const showWelcome = (hints: HintPrefs, hasDishes: boolean) => !hints.welcome && !hasDishes

export const finishWelcome = (hints: HintPrefs): HintPrefs => ({ ...hints, welcome: true })

/** The step the calculator tour starts from; null — no tour. */
export const tourFrom = (hints: HintPrefs): number | null => (hints.off || hints.tour === 'done' ? null : hints.tour)

export const tourAt = (hints: HintPrefs, step: number): HintPrefs => ({ ...hints, tour: step })
export const finishTour = (hints: HintPrefs): HintPrefs => ({ ...hints, tour: 'done' })

/** «Пропустить»: everything off, the tour keeps its step for «Вернуть». */
export const skipHints = (hints: HintPrefs): HintPrefs => ({ ...hints, off: true })

export const setHintsOff = (hints: HintPrefs, off: boolean): HintPrefs => ({ ...hints, off })

/** «Показать заново»: the tour from the start and every card again. The welcome stays gone through. */
export const hintsAgain = (hints: HintPrefs): HintPrefs => ({ ...hints, off: false, tour: 0, done: [], shown: {} })

export const cardDone = (hints: HintPrefs, id: HintCardId): HintPrefs =>
  hints.done.includes(id) ? hints : { ...hints, done: [...hints.done, id] }

export const cardShown = (hints: HintPrefs, id: HintCardId): HintPrefs => ({
  ...hints,
  shown: { ...hints.shown, [id]: (hints.shown[id] ?? 0) + 1 },
})

export interface CardPlace {
  place: 'dishes' | 'calculator'
  /** iPhone or iPad Safari, not opened from the home screen. */
  safari: boolean
  /** The calculator shows portions: somebody eats and the cooked weight is in; no field in focus. */
  portions: boolean
  /** Cards already shown in this launch: they stay for the launch, whatever the count says now. */
  shownNow: readonly HintCardId[]
}

/** The card for this place, if any: one at a time, never before the calculator tour is over. */
export function pickCard(hints: HintPrefs, at: CardPlace): HintCardId | null {
  if (hints.off) return null
  if (at.place === 'calculator' && tourFrom(hints) !== null) return null
  const fits: Record<HintCardId, boolean> = {
    install: at.safari,
    copy: at.place === 'calculator' && at.portions,
  }
  return (
    CARD_ORDER.find(
      (id) => fits[id] && !hints.done.includes(id) && (at.shownNow.includes(id) || (hints.shown[id] ?? 0) < SHOWS_PER_CARD),
    ) ?? null
  )
}

/** Hint prefs read back from storage: anything unexpected becomes the default. */
export function readHints(value: unknown): HintPrefs {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY_HINTS
  const v = value as Record<string, unknown>
  const isCard = (id: unknown): id is HintCardId => typeof id === 'string' && (CARD_ORDER as readonly string[]).includes(id)
  const shown: Partial<Record<HintCardId, number>> = {}
  if (typeof v.shown === 'object' && v.shown !== null) {
    for (const [id, n] of Object.entries(v.shown)) if (isCard(id) && Number.isInteger(n) && (n as number) > 0) shown[id] = n as number
  }
  return {
    settled: v.settled === true,
    off: v.off === true,
    welcome: v.welcome === true,
    tour: v.tour === 'done' ? 'done' : Number.isInteger(v.tour) && (v.tour as number) >= 0 ? (v.tour as number) : 0,
    done: Array.isArray(v.done) ? [...new Set(v.done.filter(isCard))] : [],
    shown,
  }
}

/** What a tour step points at: the element with `data-hint` of this value. */
export type TourTarget = 'tiles' | 'tare' | 'who' | 'bar' | 'shelf'

export interface TourStep {
  target: TourTarget
  title: string
  /** Short text; `<b>` marks the words seen on the screen. */
  text: string
}

/**
 * The calculator tour (docs/UX.md §3в): the two weights, the tare, who eats, the dish shelf.
 * A composite dish says «Сырой»; with people on the dish the bar is shown, without — «+ Имя».
 */
export function tourSteps({ composite, people }: { composite: boolean; people: boolean }): TourStep[] {
  return [
    {
      target: 'tiles',
      title: 'Два веса',
      text: composite
        ? '<b>Сырой</b> — все продукты блюда. <b>Готовый</b> — вес после готовки: его и вводите каждый раз. Продукты блюдо запомнит.'
        : '<b>Сухой</b> — сколько продукта взяли. <b>Готовый</b> — сколько вышло после готовки: его и вводите каждый раз. Сухой вес блюдо запомнит.',
    },
    {
      target: 'tare',
      title: 'В чём взвешиваете?',
      text: 'Если в кастрюле — выберите её здесь. Вес пустой посуды вычтем сами.',
    },
    people
      ? {
          target: 'bar',
          title: 'Кто ест',
          text: 'Тяните границу на полосе — доли запомнятся у этого блюда. Ещё человек — <b>+ Имя</b> внизу.',
        }
      : {
          target: 'who',
          title: 'Кто ест',
          text: 'Впишите имя и нажмите Enter — и так каждого. Готовое разделим поровну, доли потом можно поменять.',
        },
    {
      target: 'shelf',
      title: 'Другие блюда',
      text: 'Нажмите на название — откроется это блюдо. Поиск слева находит ваши блюда и добавляет популярные с обычным весом.',
    },
  ]
}
