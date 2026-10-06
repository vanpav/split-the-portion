import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuth } from '../auth'
import { acceptInvite, inviteCode, previewInvite, revokeInvite, roleIn } from '../invites'
import { isMember } from '../sync'
import { addMember, addUser, localD1 } from './localD1'

let db: D1Database
let env: Env
let dispose: () => Promise<void>
beforeAll(async () => {
  ;({ db, env, dispose } = await localD1())
  await addMember(db, 'vanya', 'home')
  await addUser(db, 'ksusha')
}, 30_000)
afterAll(() => dispose())

const NOW = new Date('2026-10-06T12:00:00.000Z')
const LATER = new Date('2026-10-14T12:00:00.000Z')

describe('invites', () => {
  it('one working code a group; it shows the group and who invited', async () => {
    const first = await inviteCode(db, 'home', 'vanya', NOW)
    expect(first.code).toMatch(/^[2-9A-HJKMNP-Z]{8}$/)
    expect(first.expiresAt).toBe('2026-10-13T12:00:00.000Z')
    expect(await inviteCode(db, 'home', 'vanya', NOW)).toEqual(first)
    expect(await previewInvite(db, first.code, NOW)).toEqual({ groupId: 'home', groupName: 'home', invitedBy: 'vanya' })
  })

  it('a code joins the group once; again — nothing changes', async () => {
    const { code } = await inviteCode(db, 'home', 'vanya', NOW)
    const auth = createAuth(env, 'http://localhost', 'test-secret')
    expect(await acceptInvite(auth, db, code, 'ksusha', NOW)).toBe('home')
    expect(await isMember(db, 'home', 'ksusha')).toBe(true)
    expect(await roleIn(db, 'home', 'ksusha')).toBe('member')
    expect(await acceptInvite(auth, db, code, 'ksusha', NOW)).toBe('home')
  })

  it('an expired, revoked or unknown code leads nowhere', async () => {
    const { code } = await inviteCode(db, 'home', 'vanya', NOW)
    expect(await previewInvite(db, code, LATER)).toBeNull()
    expect(await previewInvite(db, 'ZZZZZZZZ', NOW)).toBeNull()
    expect(await revokeInvite(db, 'home', code)).toBe(true)
    expect(await previewInvite(db, code, NOW)).toBeNull()
    expect((await inviteCode(db, 'home', 'vanya', NOW)).code).not.toBe(code)
  })

  it('the owner is the one who made the group', async () => {
    expect(await roleIn(db, 'home', 'vanya')).toBe('owner')
    expect(await roleIn(db, 'nowhere', 'vanya')).toBeNull()
  })
})
