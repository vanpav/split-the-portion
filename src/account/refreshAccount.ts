import { useAccountStore } from '@/store/account'
import type { Me } from './types'

/**
 * Asks the server who is signed in. Offline (or the server is down) the cached account stays;
 * 401 — the session is gone (signed out elsewhere or expired).
 */
export async function refreshAccount(): Promise<void> {
  const { setMe } = useAccountStore.getState()
  let res: Response
  try {
    res = await fetch('/api/me', { credentials: 'same-origin' })
  } catch {
    return
  }
  if (res.status === 401) setMe(null)
  else if (res.ok) setMe((await res.json()) as Me)
}
