import type { Invite, InvitePreview } from './types'

/** No answer at all: offline, or the server is unreachable (looks the same). */
export class OfflineError extends Error {}

/** The server answered with an error status. */
export class GroupsApiError extends Error {
  status: number
  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    })
  } catch {
    throw new OfflineError()
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new GroupsApiError(res.status)
  return (await res.json()) as T
}

/** The API of groups (docs/ARCHITECTURE.md §9). Errors: OfflineError, or GroupsApiError with the status. */
export const groupsApi = {
  invite: async (groupId: string) => json<Invite>(await call(`/api/groups/${groupId}/invites`, { method: 'POST' })),
  revoke: async (groupId: string, code: string) =>
    void json(await call(`/api/groups/${groupId}/invites/${code}`, { method: 'DELETE' })),
  /** The id of the new group (the user owns it). */
  create: async (name: string) =>
    (await json<{ groupId: string }>(await call('/api/groups', { method: 'POST', body: JSON.stringify({ name }) }))).groupId,
  /** null — the code is unknown, expired or revoked. */
  preview: async (code: string) => {
    const res = await call(`/api/invites/${code}`)
    return res.status === 404 ? null : json<InvitePreview>(res)
  },
  /** The group joined; null — the code no longer works. */
  accept: async (code: string) => {
    const res = await call(`/api/invites/${code}/accept`, { method: 'POST' })
    return res.status === 404 ? null : (await json<{ groupId: string }>(res)).groupId
  },
  setDefault: async (groupId: string) =>
    void json(await call('/api/me/default-group', { method: 'PUT', body: JSON.stringify({ groupId }) })),
}
