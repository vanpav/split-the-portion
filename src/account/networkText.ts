import { MAX_GROUPS } from './types'
import { GroupsApiError, OfflineError } from './groupsApi'
import { t } from '@/i18n'

/** One text per cause of a failed request, in the words of docs/UX.md §6. */
export const offlineText = () => t('account.errors.offline')
export const noAnswerText = () => t('account.errors.noAnswer')
/** Shown before the request too, where the count is known. */
export const groupLimitText = () => t('account.errors.groupLimit', { max: MAX_GROUPS })

/** The server's answer when no status has a more precise word. */
export function httpErrorText(status: number): string {
  if (status === 429) return t('account.errors.tooMany')
  if (status >= 500) return t('account.errors.server')
  return t('account.errors.rejected')
}

/** The HTTP status of a failed group action: ours (GroupsApiError) or the auth client's. */
function statusOf(e: unknown): number | undefined {
  if (e instanceof GroupsApiError) return e.status
  if (typeof e === 'object' && e !== null && 'status' in e && typeof e.status === 'number' && e.status > 0) return e.status
  return undefined
}

/** A failed group action, in the words of docs/UX.md §6. */
export function groupErrorText(e: unknown): string {
  if (!navigator.onLine) return offlineText()
  if (e instanceof OfflineError) return noAnswerText()
  const status = statusOf(e)
  if (status === undefined) return t('account.errors.app')
  if (status === 401) return t('account.errors.signInAgain')
  if (status === 409) return groupLimitText()
  if (status === 403) return t('account.errors.noGroupAccess')
  return httpErrorText(status)
}
