import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { groupsApi } from '@/account/groupsApi'
import { formatInviteCode, parseInviteCode } from '@/account/inviteCode'
import { groupErrorText, groupLimitText } from '@/account/networkText'
import { customName } from '@/account/groupLabel'
import { MAX_GROUPS, type InvitePreview } from '@/account/types'
import { ACCOUNT_PATH, joinPath } from '@/app/paths'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { useAccountStore } from '@/store/account'
import { joinGroup, switchGroup } from '@/sync/session'
import { t } from '@/i18n'

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
      <ScreenHeader title={t('join.title')} back backTo="/" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4 lg:py-8">
        {state.kind === 'loading' && <p className="px-1 text-muted-foreground">{t('join.loading')}</p>}
        {state.kind === 'gone' && <p className="px-1">{t('join.gone')}</p>}
        {state.kind === 'offline' && <p className="px-1">{t('join.offline')}</p>}
        {state.kind === 'found' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 px-1">
              {customName(state.invite.groupName) ? (
                <>
                  <p className="text-2xl font-medium">«{customName(state.invite.groupName)}»</p>
                  <p className="text-muted-foreground">{t('join.invitedBy', { name: state.invite.invitedBy })}</p>
                </>
              ) : (
                // Someone's own group has no name of its own: who invites says what it is.
                <>
                  <p className="text-2xl font-medium">{t('join.invites', { name: state.invite.invitedBy })}</p>
                  <p className="text-muted-foreground">{t('join.shared')}</p>
                </>
              )}
            </div>
            {already ? (
              <Button size="lg" onClick={() => void open(state.invite.groupId)}>
                {t('join.already')}
              </Button>
            ) : me && me.groups.length >= MAX_GROUPS ? (
              <p className="px-1 text-muted-foreground">{groupLimitText()}</p>
            ) : me ? (
              <Button size="lg" disabled={busy} onClick={() => void join()}>
                {t('join.join')}
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to={`${ACCOUNT_PATH}?next=${encodeURIComponent(joinPath(code!))}`}>{t('join.signInToJoin')}</Link>
              </Button>
            )}
          </div>
        )}
        {code && !standalone() && (
          <div className="flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground">
            <p>{t('join.installed')}</p>
            <p className="text-3xl font-medium tracking-widest text-foreground tabular-nums">{formatInviteCode(code)}</p>
          </div>
        )}
      </main>

    </>
  )
}
