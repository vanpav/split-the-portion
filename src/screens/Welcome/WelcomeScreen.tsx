import { useDrag } from '@use-gesture/react'
import { CheckIcon, SmartphoneIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { accountPath } from '@/app/paths'
import { BottomBar } from '@/components/BottomBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { finishWelcome, stepAfterSwipe } from '@/onboarding/hints'
import { useAccountStore } from '@/store/account'
import { usePrefsStore } from '@/store/prefs'
import { WelcomeBoxes } from './WelcomeBoxes'
import { WelcomeDevices } from './WelcomeDevices'
import { WelcomeShares } from './WelcomeShares'
import { WelcomeTiles } from './WelcomeTiles'

interface Step {
  art: ReactNode
  title: string
  text: string
}

/** What the app is, in three screens (docs/UX.md §3в); the account comes after them. */
const ABOUT: Step[] = [
  {
    art: <WelcomeBoxes />,
    title: 'Сколько положить каждому',
    text: 'Взвесь готовое блюдо — и сразу видно, сколько граммов на чью тарелку и сколько это в сухом виде для трекера калорий.',
  },
  {
    art: <WelcomeTiles />,
    title: 'Вводи один вес',
    text: 'Сухой вес, тару, компанию и доли блюдо запоминает. У плиты остаётся ввести вес готового.',
  },
  {
    art: <WelcomeShares />,
    title: 'Поровну или по долям',
    text: 'Часть можно отложить на завтра, а на неделю вперёд разделить на порции без имён. Порцию для трекера копируй свайпом.',
  },
]

/** A step dot: the current one long and in the primary color. */
const dot = (current: boolean) =>
  cn(
    'h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none',
    current ? 'w-6 bg-primary' : 'w-1.5 bg-border',
  )

const WITH_ACCOUNT = [
  'Блюда на всех твоих устройствах, в том числе после смены телефона',
  'Общий учёт с близкими: готовый вес, который ввёл один, сразу у всех',
]

/**
 * `#/welcome`: the first screen of a new device (docs/UX.md §3в) — what the app does, then the account
 * against keeping everything here. Steps stay inside the screen; once gone through it leads to `#/`.
 * A finger swipes between the steps; with a mouse the dots and ← / → do.
 */
export function WelcomeScreen() {
  const signedIn = useAccountStore((s) => s.me !== null)
  // Read when the screen opens: finishing it here must not redirect before its own navigation does.
  const [done] = useState(() => usePrefsStore.getState().hints.welcome)
  const updateHints = usePrefsStore((s) => s.updateHints)
  const navigate = useNavigate()
  // Touch screen or mouse: decided by the input, as for the swipeable rows (UX §3).
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  // The step and the side it came from: forward from the right, back from the left; the first one just fades in.
  const [move, setMove] = useState<{ step: number; way: -1 | 0 | 1 }>({ step: 0, way: 0 })
  const step = move.step
  // Signed in already: nothing to offer, the third screen ends it.
  const count = ABOUT.length + (signedIn ? 0 : 1)
  const onAccount = step === ABOUT.length
  const last = step === count - 1
  const go = (next: number) => {
    if (next !== step && next >= 0 && next < count) setMove({ step: next, way: next > step ? 1 : -1 })
  }

  // A finger: swipe left for the next step, right for the one before. Vertical scrolling stays the page's.
  const bind = useDrag(
    ({ last: released, movement: [dx], swipe: [flick] }) => {
      if (released) go(stepAfterSwipe(step, count, dx, flick))
    },
    { enabled: touch, axis: 'x', filterTaps: true },
  )
  // A keyboard: ← / → walk the steps, as in the calculator tour.
  useEffect(() => {
    if (touch) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // Gone through (or back here from the sign-up): the app itself.
  if (done) return <Navigate to="/" replace />

  // Into the app, or on to signing in; «назад» from there does not bring the welcome back.
  const finish = (to: string, replace: boolean) => {
    navigate(to, { replace })
    updateHints(finishWelcome)
  }
  const about = ABOUT[step]

  return (
    <>
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-background/95 pt-[max(0.25rem,env(safe-area-inset-top))] pr-2 pb-1 pl-5 backdrop-blur">
        {touch ? (
          // A finger swipes: the dots only show where it is.
          <div role="img" aria-label={`Шаг ${step + 1} из ${count}`} className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
              <span key={i} className={dot(i === step)} />
            ))}
          </div>
        ) : (
          // A mouse: each dot opens its step.
          <nav aria-label="Шаги" className="-ml-1 flex flex-1 items-center">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Шаг ${i + 1} из ${count}`}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
                className="group/dot flex h-8 cursor-pointer items-center rounded-full px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className={cn(dot(i === step), i !== step && 'group-hover/dot:bg-muted-foreground/50')} />
              </button>
            ))}
          </nav>
        )}
        {/* On every step, the account one too: straight into the app, without an account. */}
        <Button variant="ghost" className="text-muted-foreground" onClick={() => finish('/', true)}>
          Пропустить
        </Button>
      </header>
      <main
        {...bind()}
        className={cn('mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 lg:justify-center lg:pb-12', touch && 'touch-pan-y')}
      >
        {/* Each step comes in afresh: its picture plays from the start. */}
        <div
          key={step}
          className={cn(
            'flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
            move.way === 1 && 'motion-safe:slide-in-from-right-4',
            move.way === -1 && 'motion-safe:slide-in-from-left-4',
          )}
        >
          <div className={cn('flex items-center justify-center', about && 'min-h-52')}>{about ? about.art : <WelcomeDevices />}</div>
          {about ? (
            <div className="flex flex-col gap-2 px-1">
              <h1 className="text-[1.75rem] leading-tight font-semibold text-balance">{about.title}</h1>
              <p className="text-pretty text-muted-foreground">{about.text}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-1">
              <h1 className="text-[1.75rem] leading-tight font-semibold text-balance">Аккаунт или это устройство</h1>
              <section aria-label="С аккаунтом" className="flex flex-col gap-2">
                <h2 className="font-semibold">С аккаунтом</h2>
                <ul className="flex flex-col gap-1.5">
                  {WITH_ACCOUNT.map((line) => (
                    <li key={line} className="flex gap-2 text-pretty">
                      <CheckIcon className="mt-1 size-4 shrink-0 text-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="Без аккаунта" className="flex flex-col gap-2">
                <h2 className="font-semibold">Без аккаунта</h2>
                <p className="flex gap-2 text-pretty text-muted-foreground">
                  <SmartphoneIcon className="mt-1 size-4 shrink-0" />
                  Данные хранятся только в этом браузере. Войти можно потом в Настройках — данные переедут в аккаунт.
                </p>
              </section>
              <p className="text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link
                  to={accountPath({ next: '/' })}
                  onClick={() => updateHints(finishWelcome)}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Войти
                </Link>
              </p>
            </div>
          )}
        </div>
        <BottomBar className={onAccount ? 'flex-col' : undefined}>
          {onAccount ? (
            <>
              <Button size="lg" onClick={() => finish(accountPath({ signUp: true, next: '/' }), false)}>
                Создать аккаунт
              </Button>
              <Button size="lg" variant="outline" onClick={() => finish('/', true)}>
                Без аккаунта
              </Button>
            </>
          ) : (
            <Button size="lg" className="flex-1" onClick={() => (last ? finish('/', true) : go(step + 1))}>
              {last ? 'Начать' : 'Далее'}
            </Button>
          )}
        </BottomBar>
      </main>
    </>
  )
}
