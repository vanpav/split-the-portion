import { MAX_GROUPS } from './types'
import { GroupsApiError, OfflineError } from './groupsApi'

/** One text per cause of a failed request, in the words of docs/UX.md §6. */
export const OFFLINE_TEXT = 'Нет сети — попробуй, когда она появится'
export const NO_ANSWER_TEXT = 'Сервер не отвечает — попробуй через минуту'
/** Shown before the request too, where the count is known. */
export const GROUP_LIMIT_TEXT = `Ты уже в ${MAX_GROUPS} группах — выйди из одной, чтобы создать или вступить в другую`
const SERVER_TEXT = 'Сбой на сервере — попробуй через минуту'
const TOO_MANY_TEXT = 'Слишком много попыток — подожди минуту'
const REJECTED_TEXT = 'Запрос не принят — обнови приложение и попробуй снова'
const APP_TEXT = 'Сбой в приложении — обнови страницу и попробуй снова'

/** The server's answer when no status has a more precise word. */
export function httpErrorText(status: number): string {
  if (status === 429) return TOO_MANY_TEXT
  if (status >= 500) return SERVER_TEXT
  return REJECTED_TEXT
}

/** The HTTP status of a failed group action: ours (GroupsApiError) or the auth client's. */
function statusOf(e: unknown): number | undefined {
  if (e instanceof GroupsApiError) return e.status
  if (typeof e === 'object' && e !== null && 'status' in e && typeof e.status === 'number' && e.status > 0) return e.status
  return undefined
}

/** A failed group action, in the words of docs/UX.md §6. */
export function groupErrorText(e: unknown): string {
  if (!navigator.onLine) return OFFLINE_TEXT
  if (e instanceof OfflineError) return NO_ANSWER_TEXT
  const status = statusOf(e)
  if (status === undefined) return APP_TEXT
  if (status === 401) return 'Войди снова'
  if (status === 409) return GROUP_LIMIT_TEXT
  if (status === 403) return 'Нет доступа к группе — попроси новое приглашение'
  return httpErrorText(status)
}
