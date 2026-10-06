import { RECORD_ID, RECORD_TYPES, SYNC_LIMITS, type SyncRequest, type WireChange } from '../src/sync/protocol'

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0

/** The body of `POST /api/groups/:id/sync`, checked; a string — why it was refused. */
export function parseSyncRequest(body: unknown): SyncRequest | string {
  if (typeof body !== 'object' || body === null) return 'not an object'
  const { cursor, v, changes } = body as Record<string, unknown>
  if (!isCount(cursor) || !isCount(v)) return 'bad cursor or version'
  if (!Array.isArray(changes)) return 'no changes'
  if (changes.length > SYNC_LIMITS.changesPerRequest) return 'too many changes'
  const checked: WireChange[] = []
  for (const change of changes as unknown[]) {
    const c = change as Record<string, unknown> | null
    if (typeof c !== 'object' || c === null) return 'bad change'
    if (!RECORD_TYPES.includes(c.type as never)) return 'bad record type'
    if (typeof c.id !== 'string' || !RECORD_ID.test(c.id)) return 'bad record id'
    if (!isCount(c.v)) return 'bad record version'
    const data = c.data
    if (data !== null && (typeof data !== 'object' || Array.isArray(data))) return 'bad record data'
    if (data !== null && JSON.stringify(data).length > SYNC_LIMITS.recordBytes) return 'record too large'
    checked.push({ type: c.type as WireChange['type'], id: c.id, data: data as object | null, v: c.v })
  }
  return { cursor, v, changes: checked }
}
