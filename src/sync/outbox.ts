import { changeKey, type Change } from './records'

/** A change waiting to be sent; `rev` tells a newer edit of the same record from the one in flight. */
export interface PendingChange {
  change: Change
  rev: number
}

/** What a device has not sent yet, and how far it has read the group (`cursor`). Stored per group. */
export interface Outbox {
  cursor: number
  rev: number
  pending: Record<string, PendingChange>
}

export const EMPTY_OUTBOX: Outbox = { cursor: 0, rev: 0, pending: {} }

/** A newer edit of a record replaces the waiting one: only the latest state of a record is sent. */
export function enqueue(outbox: Outbox, changes: readonly Change[]): Outbox {
  if (changes.length === 0) return outbox
  let rev = outbox.rev
  const pending = { ...outbox.pending }
  for (const change of changes) pending[changeKey(change)] = { change, rev: ++rev }
  return { ...outbox, rev, pending }
}

/** The next request: oldest first, within the count and size limits (one record always goes). */
export function takeBatch(
  outbox: Outbox,
  limits: { count: number; bytes: number },
  size: (change: Change) => number,
): PendingChange[] {
  const batch: PendingChange[] = []
  let bytes = 0
  for (const item of Object.values(outbox.pending)) {
    const next = size(item.change)
    if (batch.length > 0 && (batch.length >= limits.count || bytes + next > limits.bytes)) break
    batch.push(item)
    bytes += next
  }
  return batch
}

/** Sent and stored on the server: forgotten, unless the record was edited again meanwhile. */
export function acknowledge(outbox: Outbox, sent: readonly PendingChange[]): Outbox {
  if (sent.length === 0) return outbox
  const pending = { ...outbox.pending }
  for (const { change, rev } of sent) {
    const key = changeKey(change)
    if (pending[key]?.rev === rev) delete pending[key]
  }
  return { ...outbox, pending }
}

export const pendingKeys = (outbox: Outbox): ReadonlySet<string> => new Set(Object.keys(outbox.pending))
export const hasPending = (outbox: Outbox) => Object.keys(outbox.pending).length > 0
