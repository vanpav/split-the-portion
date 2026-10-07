import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { imageType, readAvatar, removeAvatar, saveAvatar, saveProfile } from '../profile'
import { addMember, addUser, localD1 } from './localD1'

let db: D1Database
let dispose: () => Promise<void>

beforeAll(async () => {
  ;({ db, dispose } = await localD1())
  await addMember(db, 'vanya', 'kitchen')
  await addMember(db, 'ksusha', 'kitchen')
  await addUser(db, 'stranger')
})
afterAll(() => dispose())

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const AT = '2026-10-07T10:00:00.000Z'

describe('imageType', () => {
  it('knows JPEG, PNG and WebP by their bytes', () => {
    expect(imageType(JPEG)).toBe('image/jpeg')
    expect(imageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png')
    expect(imageType(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
  })
  it('refuses anything else', () => {
    expect(imageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
    expect(imageType(new Uint8Array())).toBeNull()
  })
})

describe('saveProfile', () => {
  it('keeps the names, empty ones as null', async () => {
    await saveProfile(db, 'vanya', { firstName: 'Иван', lastName: '', nickname: 'vanya' })
    const row = await db.prepare('select firstName, lastName, nickname from user where id = ?').bind('vanya').first()
    expect(row).toEqual({ firstName: 'Иван', lastName: null, nickname: 'vanya' })
  })
})

describe('avatars', () => {
  it('saves the photo and points the user at a versioned address', async () => {
    const url = await saveAvatar(db, 'vanya', JPEG, 'image/jpeg', AT)
    expect(url).toBe(`/api/avatars/vanya?v=${Date.parse(AT)}`)
    const row = await db.prepare('select image from user where id = ?').bind('vanya').first<{ image: string }>()
    expect(row?.image).toBe(url)
  })
  it('is seen by its owner and by the people of their groups only', async () => {
    expect((await readAvatar(db, 'vanya', 'vanya'))?.bytes).toEqual(JPEG)
    expect((await readAvatar(db, 'ksusha', 'vanya'))?.type).toBe('image/jpeg')
    expect(await readAvatar(db, 'stranger', 'vanya')).toBeNull()
  })
  it('is gone after removing', async () => {
    await removeAvatar(db, 'vanya')
    expect(await readAvatar(db, 'vanya', 'vanya')).toBeNull()
    const row = await db.prepare('select image from user where id = ?').bind('vanya').first<{ image: string | null }>()
    expect(row?.image).toBeNull()
  })
})
