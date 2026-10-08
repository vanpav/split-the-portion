import { call, json } from './groupsApi'

/**
 * «Сбросить аккаунт» and «Удалить аккаунт» (docs/ARCHITECTURE.md §9). The word in the body is what
 * the server waits for: nothing else wipes an account. Errors as in `groupsApi`.
 */
export const accountApi = {
  /** The id of the new, empty group of the account's own. */
  reset: async () =>
    (await json<{ groupId: string }>(await call('/api/me/reset', { method: 'POST', body: JSON.stringify({ confirm: 'reset' }) })))
      .groupId,
  remove: async () => void json(await call('/api/me', { method: 'DELETE', body: JSON.stringify({ confirm: 'delete' }) })),
}
