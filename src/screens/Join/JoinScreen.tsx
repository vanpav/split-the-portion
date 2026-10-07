import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { formatInviteCode, parseInviteCode } from '@/account/inviteCode'
import { GROUP_LIMIT_TEXT, groupErrorText } from '@/account/networkText'
import { customName } from '@/account/groupLabel'
import { MAX_GROUPS, type InvitePreview } from '@/account/types'
import { ACCOUNT_PATH, joinPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { joinGroup, switchGroup } from '@/sync/session'

type Loaded = { kind: 'loading' } | { kind: 'found'; invite: InvitePreview } | { kind: 'gone' } | { kind: 'offline' }

/** Running as the app on the home screen, not in Safari. */
const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/**
 * `#/join/:code` (docs/UX.md «Вступить по ссылке»): which group, who invites, «Вступить»; the group
 * joined opens, now and at launch. In Safari the code is shown big as well: a link from
 * a messenger never opens the app installed on the home screen.
 */
export function JoinScreen() {
  const code = parseInviteCode(useParams().code ?? '')
  const navigate = useNavigate()
  const me = useAccountStore((s) => s.me)
  const [loaded, setLoaded] = useState<Loaded>({ kind: 'loading' })
  const [busy, setBusy] = useState(false)

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
      if (groupId) await open(groupId)
      else setLoaded({ kind: 'gone' })
    } catch (e) {
      toast(groupErrorText(e))
    } finally {
      setBusy(false)
    }
  }
  // The group joined is the one opened, now and at launch (switchGroup).
  const open = async (groupId: string) => {
    await switchGroup(groupId)
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
              {customName(state.invite.groupName) ? (
                <>
                  <p className="text-2xl font-medium">«{customName(state.invite.groupName)}»</p>
                  <p className="text-muted-foreground">Пригласил: {state.invite.invitedBy}</p>
                </>
              ) : (
                // Someone's own group has no name of its own: who invites says what it is.
                <>
                  <p className="text-2xl font-medium">{state.invite.invitedBy} зовёт тебя</p>
                  <p className="text-muted-foreground">Блюда, тара и компании станут общими</p>
                </>
              )}
            </div>
            {already ? (
              <Button size="lg" onClick={() => void open(state.invite.groupId)}>
                Ты уже в этой группе — открыть
              </Button>
            ) : me && me.groups.length >= MAX_GROUPS ? (
              <p className="px-1 text-muted-foreground">{GROUP_LIMIT_TEXT}</p>
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

    </>
  )
}
