import { CopyIcon, LightbulbIcon, ShareIcon, XIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cardDone, cardShown, pickCard, type HintCardId } from '@/onboarding/hints'
import { usePrefsStore } from '@/store/prefs'
import { SwipeDemo } from './SwipeDemo'

/** Cards counted in this launch: a card counts once per launch, however often it renders. */
const shownNow = new Set<HintCardId>()

/** iPhone or iPad Safari, not opened from the home screen: only Safari there has `navigator.standalone`. */
const inSafari = () => (navigator as { standalone?: boolean }).standalone === false && navigator.maxTouchPoints > 0

interface HintCardProps {
  place: 'dishes' | 'calculator'
  /** The calculator shows portions: somebody eats, the cooked weight is in, no field in focus. */
  portions?: boolean
  className?: string
}

/**
 * A hint in place (docs/UX.md §3в): a quiet card at the end of the screen, one at a time. Which one,
 * if any, is `pickCard`'s choice; «Понятно» and × put it away for good.
 */
export function HintCard({ place, portions = false, className }: HintCardProps) {
  const hints = usePrefsStore((s) => s.hints)
  const updateHints = usePrefsStore((s) => s.updateHints)
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [safari] = useState(inSafari)
  const id = pickCard(hints, { place, safari, portions, shownNow: [...shownNow] })

  useEffect(() => {
    if (!id || shownNow.has(id)) return
    shownNow.add(id)
    updateHints((h) => cardShown(h, id))
  }, [id, updateHints])

  if (!id) return null
  const card: Record<HintCardId, { title: string; text: ReactNode; demo?: ReactNode }> = {
    install: {
      title: 'Добавьте на экран «Домой»',
      text: (
        <>
          Поделиться <ShareIcon aria-label="значок «Поделиться»" className="inline size-4 align-[-2px]" /> → «На экран „Домой“».
          Приложение будет открываться сразу и работать без сети. Лучше сейчас: без аккаунта данные из Safari туда не
          переедут.
        </>
      ),
    },
    copy: touch
      ? {
          title: 'Скопировать для трекера',
          text: 'Смахните строку вправо — порция для трекера скопируется. Влево — убрать человека на сегодня.',
          demo: <SwipeDemo />,
        }
      : {
          title: 'Скопировать для трекера',
          text: (
            <>
              <CopyIcon aria-label="Значок копирования" className="inline size-4 align-[-2px]" /> у строки — скопировать
              порцию для трекера.
            </>
          ),
        },
  }
  const { title, text, demo } = card[id]
  const dismiss = () => updateHints((h) => cardDone(h, id))

  return (
    <Alert role="status" className={cn('px-3 py-3 has-data-[slot=alert-action]:pr-11', className)}>
      <LightbulbIcon className="text-primary!" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-pretty">
        <div>{text}</div>
        {demo}
        <Button variant="outline" className="self-start" onClick={dismiss}>
          Понятно
        </Button>
      </AlertDescription>
      <AlertAction className="top-0 right-0">
        <Button variant="ghost" size="icon" aria-label="Скрыть подсказку" onClick={dismiss}>
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  )
}
