import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuth } from '../auth'
import { acceptInvite, createGroup, inviteCode, previewInvite, revokeInvite, roleIn } from '../invites'
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

  it('three groups at most: joining and creating the fourth is refused, a group already joined is not', async () => {
    const auth = createAuth(env, 'http://localhost', 'test-secret')
    await addMember(db, 'lena', 'g1', 'g2', 'g3')
    const { code } = await inviteCode(db, 'home', 'vanya', NOW)
    expect(await acceptInvite(auth, db, code, 'lena', NOW)).toBe('limit')
    expect(await isMember(db, 'home', 'lena')).toBe(false)
    expect(await createGroup(auth, db, 'lena', 'Четвёртая')).toBe('limit')
    // The backstop for Better Auth's own routes.
    await expect(auth.api.addMember({ body: { userId: 'lena', organizationId: 'home', role: 'member' } })).rejects.toThrow()
    const { code: g1 } = await inviteCode(db, 'g1', 'lena', NOW)
    expect(await acceptInvite(auth, db, g1, 'lena', NOW)).toBe('g1')
  })

  it('a new group is owned by its maker', async () => {
    const auth = createAuth(env, 'http://localhost', 'test-secret')
    await addUser(db, 'petya')
    const id = await createGroup(auth, db, 'petya', 'Семья')
    expect(await roleIn(db, id, 'petya')).toBe('owner')
  })
})
