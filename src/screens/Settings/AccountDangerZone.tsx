import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
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
import { restartHints } from '@/onboarding/hints'
import { usePrefsStore } from '@/store/prefs'
import { deleteAccount, resetAccount } from '@/sync/session'
import { t } from '@/i18n'

type Kind = 'reset' | 'delete'

/** The texts of each action, read when shown: in the UI language now. */
const texts = (kind: Kind) => ({
  title: t(`settings.danger.${kind}.title`),
  hint: t(`settings.danger.${kind}.hint`),
  question: t(`settings.danger.${kind}.question`),
  text: t(`settings.danger.${kind}.text`, { shared: t('settings.danger.shared') }),
  hold: t(`settings.danger.${kind}.hold`),
  busy: t(`settings.danger.${kind}.busy`),
})

const ACTIONS = {
  reset: { Icon: RotateCcwIcon, run: resetAccount },
  delete: { Icon: Trash2Icon, run: deleteAccount },
} as const satisfies Record<Kind, unknown>

/**
 * The last box of «Аккаунт» (docs/UX.md «Аккаунт и группа»): «Сбросить аккаунт» and «Удалить
 * аккаунт», each confirmed by holding the button for 5 seconds.
 */
export function AccountDangerZone() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<Kind | null>(null)
  // The dialog keeps its text while it closes.
  const [shown, setShown] = useState<Kind>('reset')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const action = { ...ACTIONS[shown], ...texts(shown) }

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
      if (shown === 'reset') {
        // As on a new device: the welcome, the popular dishes, the calculator tour.
        usePrefsStore.getState().updateHints(restartHints)
        navigate('/', { replace: true })
      }
      // Signed out, the screen looks just like after «Выйти»: say what happened.
      else toast(t('settings.danger.deleted'))
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
          const { Icon } = ACTIONS[kind]
          const { title, hint } = texts(kind)
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
            <AlertDialogDescription>{t('settings.danger.backup')}</AlertDialogDescription>
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
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
