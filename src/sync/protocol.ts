/**
 * Sync between a device and the server (docs/ARCHITECTURE.md §10). Shared by the app and the worker:
 * the worker does not look inside `data`, it only checks the envelope.
 */

/** Every kind of stored record; one record is the unit of sync and of conflict. */
export const RECORD_TYPES = ['dish', 'cooking', 'tare', 'company', 'lineup', 'settings'] as const
export type RecordType = (typeof RECORD_TYPES)[number]

/** A record as it travels: `data: null` — removed. `v` — the app's schema version it was written by. */
export interface WireChange {
  type: RecordType
  id: string
  data: object | null
  v: number
}

export interface SyncRequest {
  /** The last `seq` of the group this device has seen. */
  cursor: number
  v: number
  changes: WireChange[]
}

export interface SyncResponse {
  cursor: number
  /** Records changed by others since `cursor`, oldest first; the device's own just-sent ones are left out. */
  changes: WireChange[]
  /** Not everything fit: ask again. */
  more: boolean
}

/** Limits keep a request within the free plan: 10 ms CPU and 50 D1 queries per call. */
export const SYNC_LIMITS = {
  changesPerRequest: 200,
  requestBytes: 512 * 1024,
  recordBytes: 64 * 1024,
  pullPage: 200,
} as const

/** Ids are nanoids (and `settings`); anything else is not ours. */
export const RECORD_ID = /^[A-Za-z0-9_-]{1,64}$/

export const recordKey = (type: RecordType, id: string) => `${type}:${id}`
