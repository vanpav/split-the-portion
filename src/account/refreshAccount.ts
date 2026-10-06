import { useAccountStore } from '@/store/account'
import { useSyncStore } from '@/store/sync'
import type { Me } from './types'

/**
 * Asks the server who is signed in. Offline (or the server is down) the cached account stays.
 * 401 — the session is gone (expired or ended elsewhere): the account and its data stay on the
 * device, sync waits for «Войти снова» (docs/SPEC.md §13.4).
 */
export async function refreshAccount(): Promise<void> {
  const { setMe } = useAccountStore.getState()
  let res: Response
  try {
    res = await fetch('/api/me', { credentials: 'same-origin' })
  } catch {
    return
  }
  if (res.status === 401) useSyncStore.setState({ status: { kind: 'needsLogin' } })
  else if (res.ok) setMe((await res.json()) as Me)
}
