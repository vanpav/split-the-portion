import { CheckIcon, SmartphoneIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { accountPath } from '@/app/paths'
import { BottomBar } from '@/components/BottomBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { finishWelcome } from '@/onboarding/hints'
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

/** What the app is, in three screens (docs/UX.md §3г); the account comes after them. */
const ABOUT: Step[] = [
  {
    art: <WelcomeBoxes />,
    title: 'Сколько положить каждому',
    text: 'Взвесьте готовое блюдо — и сразу видно, сколько граммов на чью тарелку и сколько это в сухом виде для трекера калорий.',
  },
  {
    art: <WelcomeTiles />,
    title: 'Блюдо помнит всё',
    text: 'Сухой вес, кастрюлю, кто ест и в каких долях. У плиты обычно вводите одно число — вес готового.',
  },
  {
    art: <WelcomeShares />,
    title: 'Делите как хотите',
    text: 'Поровну или по долям, часть — на завтра, для meal prep — на порции без имён. Свою порцию для трекера копируете одним свайпом.',
  },
]

const WITH_ACCOUNT = [
  'Блюда на всех ваших устройствах',
  'Общий учёт с близкими — готовый вес, который ввёл один, сразу у всех',
  'Ничего не пропадёт, если сменить телефон или очистить браузер',
]

/**
 * `#/welcome`: the first screen of a new device (docs/UX.md §3г) — what the app does, then the account
 * against keeping everything here. Steps stay inside the screen; once gone through it leads to `#/`.
 */
export function WelcomeScreen() {
  const signedIn = useAccountStore((s) => s.me !== null)
  // Read when the screen opens: finishing it here must not redirect before its own navigation does.
  const [done] = useState(() => usePrefsStore.getState().hints.welcome)
  const updateHints = usePrefsStore((s) => s.updateHints)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  // Signed in already: nothing to offer, the third screen ends it.
  const count = ABOUT.length + (signedIn ? 0 : 1)
  const onAccount = step === ABOUT.length
  const last = step === count - 1

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
        <div role="img" aria-label={`Шаг ${step + 1} из ${count}`} className="flex flex-1 items-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] motion-reduce:transition-none',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
        {!last && (
          <Button variant="ghost" className="text-muted-foreground" onClick={() => (signedIn ? finish('/', true) : setStep(count - 1))}>
            Пропустить
          </Button>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-4 lg:justify-center lg:pb-12">
        {/* Each step comes in afresh: its picture plays from the start. */}
        <div key={step} className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
          <div className="flex min-h-44 items-center justify-center">{about ? about.art : <WelcomeDevices />}</div>
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
                  Всё хранится только в этом браузере. Войти можно потом в Настройках — данные переедут в аккаунт.
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
            <Button size="lg" className="flex-1" onClick={() => (last ? finish('/', true) : setStep(step + 1))}>
              {last ? 'Начать' : 'Далее'}
            </Button>
          )}
        </BottomBar>
      </main>
    </>
  )
}
