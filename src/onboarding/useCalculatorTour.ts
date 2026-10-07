import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'
import { usePrefsStore } from '@/store/prefs'
import { finishTour, skipHints, tourAt, tourFrom, tourSteps } from './hints'

/** The screen's entrance is 200 ms: the tour starts on a screen at rest. */
const START_MS = 500
/** While something is in the way the tour waits, looking again this often. */
const RETRY_MS = 800

/**
 * Not now: on a touch screen a focused field means the keyboard is up over half the screen; a toast
 * («Блюда добавлены · Отменить») sits over the top of it, where the steps are.
 */
const inTheWay = () =>
  (window.matchMedia('(pointer: coarse)').matches && document.activeElement instanceof HTMLInputElement) ||
  toast.getToasts().some((t) => !('dismiss' in t && t.dismiss))

/** How the tour ended: «Готово», or «Пропустить» (and Esc). Leaving the screen is not an end. */
type Ending = 'done' | 'skip'

interface CalculatorTourProps {
  /** A screen over the calculator is open: the tour waits for it to close. */
  paused: boolean
  /** The dish is composite: «Сырой» instead of «Сухой». */
  composite: boolean
  /** Somebody eats: the third step shows the share bar, not «+ Имя». */
  people: boolean
}

/**
 * The calculator tour (docs/UX.md §3б): four steps over a dimmed screen, by driver.js. Targets are
 * elements with `data-hint`. It goes on from the step it stopped at; «Пропустить» turns every hint off,
 * with «Вернуть» in the toast. Leaving the screen closes it, the step stays for next time.
 */
export function useCalculatorTour({ paused, composite, people }: CalculatorTourProps) {
  const from = usePrefsStore((s) => tourFrom(s.hints))
  const run = from !== null && !paused

  const start = useEffectEvent(() => {
    if (from === null) return null
    const { updateHints } = usePrefsStore.getState()
    const steps = tourSteps({ composite, people })
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Settled at once, not in driver.js's onDestroyed: that one waits for the step's animation frames,
    // which a hidden page never gets.
    // On a desktop the calculator holds the caret in a field: it goes back there after the tour.
    // driver.js would focus whatever had it before the last step — the card's own button, gone by then.
    const focused = document.activeElement
    const end = (how: Ending) => {
      if (focused instanceof HTMLElement && focused !== document.body && focused.isConnected) focused.focus({ preventScroll: true })
      if (how === 'done') return updateHints(finishTour)
      const before = usePrefsStore.getState().hints
      updateHints(skipHints)
      toast('Подсказки выключены', {
        description: 'Включить снова — в Настройках',
        action: { label: 'Вернуть', onClick: () => updateHints(() => before) },
      })
    }

    const tour = driver({
      steps: steps.map((step, index) => ({
        element: `[data-hint="${step.target}"]`,
        popover: { title: step.title, description: step.text },
        data: { index },
      })),
      animate: !still,
      smoothScroll: !still,
      // The dim is a theme color (index.css): the opacity is in it.
      overlayColor: 'var(--scrim)',
      overlayOpacity: 1,
      // At the stove a tap anywhere is easier to hit than the button.
      overlayClickBehavior: 'nextStep',
      stagePadding: 6,
      stageRadius: 20,
      popoverOffset: 12,
      popoverClass: 'hint-popover',
      // A tap on the lit tile must not open the keyboard under the card.
      disableActiveInteraction: true,
      // A step whose element is not there (a dish without one) is passed over.
      skipMissingElement: true,
      showButtons: ['next'],
      showProgress: true,
      progressText: '{{current}} из {{total}}',
      nextBtnText: 'Далее',
      doneBtnText: 'Готово',
      // The step it goes on from next time, as soon as it is chosen.
      onHighlightStarted: (_element, step) => {
        const index: unknown = step.data?.index
        if (typeof index === 'number') updateHints((hints) => tourAt(hints, index))
      },
      // «Пропустить» next to «Далее»; the last step has only «Готово».
      onPopoverRender: (popover, { driver: d }) => {
        // driver.js focuses the first button; Enter should go on, and a finger needs no focus ring.
        window.setTimeout(() => popover.nextButton.focus({ focusVisible: false }))
        if (d.isLastStep()) return
        const skip = document.createElement('button')
        skip.type = 'button'
        skip.className = 'driver-popover-footer-btn hint-skip'
        skip.textContent = 'Пропустить'
        skip.addEventListener('click', () => {
          d.destroy()
          end('skip')
        })
        popover.footerButtons.prepend(skip)
      },
      // Esc, or past the last step («Готово», a tap on the dim): done there, skipped anywhere before.
      onDestroyStarted: (_element, _step, { driver: d }) => {
        const how = d.isLastStep() ? 'done' : 'skip'
        d.destroy()
        end(how)
      },
    })
    tour.drive(Math.min(from, steps.length - 1))
    // Leaving the screen: closed, the step stays for next time.
    return { leave: () => tour.destroy(), active: () => tour.isActive() }
  })

  useEffect(() => {
    if (!run) return
    let tour: ReturnType<typeof start> = null
    let timer = 0
    const tryStart = () => {
      if (inTheWay()) timer = window.setTimeout(tryStart, RETRY_MS)
      else tour = start()
    }
    timer = window.setTimeout(tryStart, START_MS)
    return () => {
      window.clearTimeout(timer)
      if (tour?.active()) tour.leave()
    }
  }, [run])
}
