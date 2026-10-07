import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { formatInviteCode, parseInviteCode } from '@/account/inviteCode'
import { groupErrorText } from '@/account/networkText'
import type { InvitePreview } from '@/account/types'
import { ACCOUNT_PATH, joinPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { joinGroup, makeDefaultGroup, openGroup } from '@/sync/session'

type Loaded = { kind: 'loading' } | { kind: 'found'; invite: InvitePreview } | { kind: 'gone' } | { kind: 'offline' }

/** Running as the app on the home screen, not in Safari. */
const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/**
 * `#/join/:code` (docs/UX.md «Вступить по ссылке»): which group, who invites, «Вступить»;
 * afterwards — whether it opens at launch. In Safari the code is shown big as well: a link from
 * a messenger never opens the app installed on the home screen.
 */
export function JoinScreen() {
  const code = parseInviteCode(useParams().code ?? '')
  const navigate = useNavigate()
  const me = useAccountStore((s) => s.me)
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [busy, setBusy] = useState(false)
  // Joined: asking whether this group opens at launch.
  const [joined, setJoined] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    let live = true
    groupsApi
      .preview(code)
      .then((invite) => live && setLoaded(invite ? { kind: 'found', invite } : { kind: 'gone' }))
      .catch(() => live && setLoaded({ kind: 'offline' }))
    return () => void (live = false)
  }, [code])

  const join = async () => {
    if (!code) return
    setBusy(true)
    try {
      const groupId = await joinGroup(code)
      if (groupId) setJoined(groupId)
      else setLoaded({ kind: 'gone' })
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }
  const open = async (groupId: string, asDefault: boolean) => {
    setJoined(null)
    try {
      if (asDefault) await makeDefaultGroup(groupId)
    } catch (e) {
      toast(groupErrorText(e))
    }
    await openGroup(groupId)
    navigate('/', { replace: true })
  }

  const state = code ? loaded : ({ kind: 'gone' } as const)
  const already = state.kind === 'found' && me?.groups.some((g) => g.id === state.invite.groupId)

  return (
    <>
      <ScreenHeader title="Вступить в группу" back backTo="/" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 lg:py-8">
        {state.kind === 'loading' && <p className="px-1 text-muted-foreground">Проверяем код…</p>}
        {state.kind === 'gone' && <p className="px-1">Код не найден или устарел. Попроси новый.</p>}
        {state.kind === 'offline' && <p className="px-1">Нет сети — вступить можно, когда она появится.</p>}
        {state.kind === 'found' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 px-1">
              <p className="text-2xl font-medium">«{state.invite.groupName}»</p>
              <p className="text-muted-foreground">Пригласил: {state.invite.invitedBy}</p>
            </div>
            {already ? (
              <Button size="lg" onClick={() => void open(state.invite.groupId, false)}>
                Ты уже в этой группе — открыть
              </Button>
            ) : me ? (
              <Button size="lg" disabled={busy} onClick={() => void join()}>
                Вступить
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to={`${ACCOUNT_PATH}?next=${encodeURIComponent(joinPath(code!))}`}>Войти, чтобы вступить</Link>
              </Button>
            )}
          </div>
        )}
        {code && !standalone() && (
          <div className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground">
            <p>Приложение уже на экране «Домой»? Открой его: Настройки → Группа → Вступить по коду.</p>
            <p className="text-3xl font-medium tracking-widest text-foreground tabular-nums">{formatInviteCode(code)}</p>
          </div>
        )}
      </main>

      <AlertDialog open={joined !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Открывать эту группу при запуске?</AlertDialogTitle>
            <AlertDialogDescription>Это можно поменять: Настройки → Группа.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => void open(joined!, false)}>Не открывать</AlertDialogCancel>
            <AlertDialogAction onClick={() => void open(joined!, true)}>Открывать</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
