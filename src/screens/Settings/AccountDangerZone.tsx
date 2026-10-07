import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { groupErrorText } from '@/account/networkText'
import { HoldToConfirmButton } from '@/components/HoldToConfirmButton'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteAccount, resetAccount } from '@/sync/session'

type Kind = 'reset' | 'delete'

const SHARED = 'Из общих групп ты выйдешь, у остальных участников всё останется.'
const BACKUP = 'Вернуть ничего не получится. Если нужна копия блюд, скачай её сначала: Настройки → Копия данных.'

const ACTIONS = {
  reset: {
    Icon: RotateCcwIcon,
    title: 'Сбросить аккаунт',
    hint: 'Данные и профиль удалятся, вход останется',
    question: 'Сбросить аккаунт?',
    text: `Группы, где ты один, удалятся вместе с блюдами, тарой и компаниями, а с ними профиль и фото. ${SHARED} Войти можно будет как раньше: паролем или по passkey.`,
    hold: 'Удерживай, чтобы сбросить',
    busy: 'Сбрасываем…',
    run: resetAccount,
  },
  delete: {
    Icon: Trash2Icon,
    title: 'Удалить аккаунт',
    hint: 'Насовсем, вместе с данными и входом',
    question: 'Удалить аккаунт?',
    text: `Удалятся группы, где ты один, с блюдами, тарой и компаниями, профиль, фото, пароль и passkey. ${SHARED}`,
    hold: 'Удерживай, чтобы удалить',
    busy: 'Удаляем…',
    run: deleteAccount,
  },
} as const satisfies Record<Kind, unknown>

/**
 * The last box of «Аккаунт» (docs/UX.md «Аккаунт и группа»): «Сбросить аккаунт» and «Удалить
 * аккаунт», each confirmed by holding the button for 5 seconds.
 */
export function AccountDangerZone() {
  const [open, setOpen] = useState<Kind | null>(null)
  // The dialog keeps its text while it closes.
  const [shown, setShown] = useState<Kind>('reset')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const action = ACTIONS[shown]

  const ask = (kind: Kind) => {
    setShown(kind)
    setError(null)
    setOpen(kind)
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await action.run()
      setOpen(null)
      // Signed out, the screen looks just like after «Выйти»: say what happened.
      if (shown === 'delete') toast('Аккаунт удалён')
    } catch (e) {
      setError(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }

  const row =
    'flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left text-destructive outline-none transition-colors hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/60'

  return (
    <>
      <div className="divide-y overflow-hidden rounded-xl border bg-card">
        {(Object.keys(ACTIONS) as Kind[]).map((kind) => {
          const { Icon, title, hint } = ACTIONS[kind]
          return (
            <button key={kind} type="button" className={row} onClick={() => ask(kind)}>
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 self-start" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">{title}</span>
                <span className="text-sm text-muted-foreground">{hint}</span>
              </span>
            </button>
          )
        })}
      </div>

      <AlertDialog open={open !== null} onOpenChange={(next) => !next && !busy && setOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action.question}</AlertDialogTitle>
            <AlertDialogDescription>{action.text}</AlertDialogDescription>
            <AlertDialogDescription>{BACKUP}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <HoldToConfirmButton label={action.hold} busyLabel={action.busy} busy={busy} onConfirm={() => void run()} />
            {error && (
              <p role="alert" className="text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
