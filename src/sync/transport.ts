import { SyncFailure } from './engine'
import type { SyncRequest, SyncResponse } from './protocol'

/** `POST /api/groups/:id/sync` (docs/ARCHITECTURE.md §9); failures become statuses, not exceptions to show. */
export async function sendSync(groupId: string, request: SyncRequest): Promise<SyncResponse> {
  let res: Response
  try {
    res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'same-origin',
    })
  } catch {
    throw new SyncFailure('offline')
  }
  if (res.status === 401) throw new SyncFailure('needsLogin')
  if (res.status === 403) throw new SyncFailure('forbidden')
  if (!res.ok) throw new SyncFailure('failed')
  return (await res.json()) as SyncResponse
}
