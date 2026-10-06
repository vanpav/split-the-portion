import { OfflineError } from './groupsApi'

/** A failed group action, in the words of docs/UX.md §6. */
export const groupErrorText = (e: unknown) =>
  e instanceof OfflineError || !navigator.onLine ? 'Нет сети — попробуйте, когда она появится' : 'Не получилось — попробуйте ещё раз'
