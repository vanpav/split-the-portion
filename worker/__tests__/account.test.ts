import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAuth } from '../auth'
import { deleteAccount, resetAccount } from '../account'
import { inviteCode, roleIn } from '../invites'
import { saveAvatar, saveProfile } from '../profile'
import { isMember } from '../sync'
import { addMember, addUser, localD1 } from './localD1'

let db: D1Database
let env: Env
let dispose: () => Promise<void>
beforeAll(async () => {
  ;({ db, env, dispose } = await localD1())
}, 30_000)
afterAll(() => dispose())

const NOW = new Date('2026-10-07T12:00:00.000Z')
const AT = NOW.toISOString()
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])

const count = async (sql: string, ...args: unknown[]) =>
  (await db.prepare(`select count(*) as n from ${sql}`).bind(...args).first<{ n: number }>())!.n

/**
 * `who` owns `<who>-own` (alone) and `<who>-shared` (with `<who>-friend`), and is in
 * `<who>-friend`'s group; has a profile, a photo, an invite code, a session, a password and a passkey.
 */
async function seed(who: string) {
  const friend = `${who}-friend`
  await addMember(db, who, `${who}-own`, `${who}-shared`)
  await addMember(db, friend, `${who}-shared`, `${friend}-own`)
  await addMember(db, who, `${friend}-own`)
  for (const group of [`${who}-own`, `${who}-shared`, `${friend}-own`]) {
    await db
      .prepare(`insert into record (group_id, type, id, data, v, seq, updated_by, updated_at) values (?, 'dish', 'd1', '{}', 1, 1, ?, ?)`)
      .bind(group, who, AT)
      .run()
    await db.prepare('insert into group_clock (group_id, seq) values (?, 1)').bind(group).run()
  }
  await saveProfile(db, who, { firstName: 'Иван', lastName: 'Павличенко', nickname: 'Ваня' })
  await saveAvatar(db, who, JPEG, 'image/jpeg', AT)
  await db.prepare('update user set defaultGroupId = ? where id = ?').bind(`${who}-shared`, who).run()
  const { code } = await inviteCode(db, `${who}-shared`, who, NOW)
  await db.batch([
    db
      .prepare('insert into session (id, expiresAt, token, createdAt, updatedAt, userId, activeOrganizationId) values (?, ?, ?, ?, ?, ?, ?)')
      .bind(`${who}-s`, AT, `${who}-token`, AT, AT, who, `${who}-own`),
    db
      .prepare(`insert into account (id, accountId, providerId, userId, password, createdAt, updatedAt) values (?, ?, 'credential', ?, 'hash', ?, ?)`)
      .bind(`${who}-a`, who, who, AT, AT),
    db
      .prepare(`insert into passkey (id, publicKey, userId, credentialID, counter, deviceType, backedUp) values (?, 'pk', ?, ?, 0, 'multiDevice', 1)`)
      .bind(`${who}-p`, who, `${who}-cred`),
  ])
  return { friend, code }
}

/** What both reset and delete leave behind: the others' data whole, nothing of the user's. */
async function expectWiped(who: string, friend: string, code: string) {
  // Its own group with its data is gone.
  expect(await count('organization where id = ?', `${who}-own`)).toBe(0)
  expect(await count('record where group_id = ?', `${who}-own`)).toBe(0)
  expect(await count('group_clock where group_id = ?', `${who}-own`)).toBe(0)
  // The shared group it owned stays with its data; the friend owns it now.
  expect(await count('record where group_id = ?', `${who}-shared`)).toBe(1)
  expect(await roleIn(db, `${who}-shared`, friend)).toBe('owner')
  expect(await isMember(db, `${who}-shared`, who)).toBe(false)
  // The friend's group: left, untouched.
  expect(await isMember(db, `${friend}-own`, who)).toBe(false)
  expect(await roleIn(db, `${friend}-own`, friend)).toBe('owner')
  expect(await count('record where group_id = ?', `${friend}-own`)).toBe(1)
  // Its codes and photo.
  expect(await count('group_invite where code = ?', code)).toBe(0)
  expect(await count('avatar where user_id = ?', who)).toBe(0)
}

describe('resetAccount', () => {
  it('leaves only the sign-in and a new empty group of its own', async () => {
    const { friend, code } = await seed('vanya')
    const groupId = await resetAccount(db, 'vanya', NOW)

    await expectWiped('vanya', friend, code)
    const groups = await db
      .prepare('select o.id, o.name, m.role from member m join organization o on o.id = m.organizationId where m.userId = ?')
      .bind('vanya')
      .all()
    expect(groups.results).toEqual([{ id: groupId, name: 'Личная', role: 'owner' }])
    expect(await count('record where group_id = ?', groupId)).toBe(0)
    expect(
      await db.prepare('select firstName, lastName, nickname, image, defaultGroupId from user where id = ?').bind('vanya').first(),
    ).toEqual({ firstName: null, lastName: null, nickname: null, image: null, defaultGroupId: null })
    // Signs in as before.
    expect(await count('session where userId = ? and activeOrganizationId is null', 'vanya')).toBe(1)
    expect(await count('account where userId = ?', 'vanya')).toBe(1)
    expect(await count('passkey where userId = ?', 'vanya')).toBe(1)
  })

  it('makes the group the way Better Auth does: same date format, room for new members', async () => {
    await seed('lena')
    const groupId = await resetAccount(db, 'lena', NOW)
    const auth = createAuth(env, 'http://localhost', 'test-secret')
    const made = await auth.api.createOrganization({ body: { name: 'Своя', slug: 'lena-made', userId: 'lena' } })
    const createdAt = (id: string) => db.prepare('select createdAt from organization where id = ?').bind(id).first<{ createdAt: string }>()
    expect((await createdAt(groupId))!.createdAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
    expect((await createdAt(made!.id))!.createdAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
    await addUser(db, 'lena-guest')
    await auth.api.addMember({ body: { userId: 'lena-guest', organizationId: groupId, role: 'member' } })
    expect(await roleIn(db, groupId, 'lena')).toBe('owner')
  })
})

describe('deleteAccount', () => {
  it('removes the user with every way to sign in; the others keep their data', async () => {
    const { friend, code } = await seed('ksusha')
    await db
      .prepare(`insert into verification (id, identifier, value, expiresAt, createdAt, updatedAt) values ('v', 'reset-password:t', 'ksusha', ?, ?, ?)`)
      .bind(AT, AT, AT)
      .run()
    await deleteAccount(db, 'ksusha')

    await expectWiped('ksusha', friend, code)
    expect(await count('user where id = ?', 'ksusha')).toBe(0)
    expect(await count('session where userId = ?', 'ksusha')).toBe(0)
    expect(await count('account where userId = ?', 'ksusha')).toBe(0)
    expect(await count('passkey where userId = ?', 'ksusha')).toBe(0)
    expect(await count('verification where value = ?', 'ksusha')).toBe(0)
    expect(await count('member where userId = ?', 'ksusha')).toBe(0)
    // The friend's account is whole.
    expect(await count('user where id = ?', friend)).toBe(1)
  })
})
