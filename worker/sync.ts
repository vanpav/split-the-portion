import { SYNC_LIMITS, type SyncRequest } from '../src/sync/protocol'

/**
 * Push and pull of one group in one call (docs/ARCHITECTURE.md §10). Each change gets the next
 * number of the group's clock and overwrites the record: the one that came last wins.
 * The whole push is one D1 batch (a transaction) of five statements, whatever its size: the
 * changes go in as one JSON parameter (`json_each`), because the free plan allows 50 queries a call.
 * Returns the response body: records are passed through as the JSON text D1 keeps, never parsed.
 */
export async function syncGroup(db: D1Database, groupId: string, userId: string, req: SyncRequest, now: string) {
  const clock = db.prepare('select seq from group_clock where group_id = ?').bind(groupId)
  let before: number
  let after: number
  if (req.changes.length > 0) {
    const [, start, , , end] = await db.batch<{ seq: number }>([
      db.prepare('insert or ignore into group_clock (group_id, seq) values (?, 0)').bind(groupId),
      clock,
      db.prepare('update group_clock set seq = seq + ? where group_id = ?').bind(req.changes.length, groupId),
      db.prepare(PUSH).bind(groupId, req.changes.length, userId, now, JSON.stringify(req.changes)),
      clock,
    ])
    before = start.results[0].seq
    after = end.results[0].seq
  } else {
    before = after = (await clock.first<{ seq: number }>())?.seq ?? 0
  }

  // A cursor ahead of the clock means the database was restored to an earlier point: read it all again.
  const cursor = req.cursor > after ? 0 : req.cursor
  const { results } = await db
    .prepare(PULL)
    .bind(groupId, cursor, before, after, SYNC_LIMITS.pullPage + 1)
    .all<{ type: string; id: string; data: string | null; v: number; seq: number }>()
  const more = results.length > SYNC_LIMITS.pullPage
  const rows = more ? results.slice(0, SYNC_LIMITS.pullPage) : results
  const last = rows.at(-1)?.seq ?? 0
  const next = more ? last : Math.max(last, after, cursor)
  const changes = rows.map(
    (r) => `{"type":${JSON.stringify(r.type)},"id":${JSON.stringify(r.id)},"v":${r.v},"data":${r.data ?? 'null'}}`,
  )
  return `{"cursor":${next},"more":${more},"changes":[${changes.join(',')}]}`
}

/** Is the user in the group? Every sync and invite call starts with it. */
export async function isMember(db: D1Database, groupId: string, userId: string) {
  const row = await db
    .prepare('select 1 as ok from member where organizationId = ? and userId = ?')
    .bind(groupId, userId)
    .first<{ ok: number }>()
  return row !== null
}

// ?1 group, ?2 number of changes, ?3 user, ?4 time, ?5 the changes as a JSON array.
// The clock was already moved by ?2, so the change at index k gets (clock − ?2 + k + 1).
// `where true` lets SQLite tell the upsert's ON CONFLICT from a join.
const PUSH = `
insert into record (group_id, type, id, data, v, seq, updated_by, updated_at)
select ?1, j.value ->> '$.type', j.value ->> '$.id', nullif(j.value -> '$.data', 'null'), j.value ->> '$.v',
       (select seq from group_clock where group_id = ?1) - ?2 + j.key + 1, ?3, ?4
from json_each(?5) as j where true
on conflict (group_id, type, id) do update set
  data = excluded.data, v = excluded.v, seq = excluded.seq, updated_by = excluded.updated_by, updated_at = excluded.updated_at`

// ?1 group, ?2 cursor, (?3, ?4] — numbers this call has just written, ?5 page size + 1.
const PULL = `
select type, id, data, v, seq from record
where group_id = ?1 and seq > ?2 and not (seq > ?3 and seq <= ?4)
order by seq limit ?5`
