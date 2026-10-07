import { describe, expect, it } from 'vitest'
import { fullName, initials, parseProfile, shortName, withProfiles } from '../profile'
import type { Me } from '../types'

const vanya = { firstName: 'Иван', lastName: 'Павличенко', nickname: 'vanya', email: 'ivan@example.test' }
const bare = { firstName: '', lastName: '', nickname: '', email: 'ksusha@example.test' }

describe('shortName', () => {
  it('is the nickname', () => expect(shortName(vanya)).toBe('vanya'))
  it('falls back to the email before @', () => expect(shortName(bare)).toBe('ksusha'))
  it('ignores a blank nickname', () => expect(shortName({ ...bare, nickname: '  ' })).toBe('ksusha'))
})

describe('fullName', () => {
  it('joins first and last name', () => expect(fullName(vanya)).toBe('Иван Павличенко'))
  it('takes what is there', () => expect(fullName({ firstName: '', lastName: 'Павличенко' })).toBe('Павличенко'))
  it('is empty without names', () => expect(fullName(bare)).toBe(''))
})

describe('initials', () => {
  it('from first and last name', () => expect(initials(vanya)).toBe('ИП'))
  it('from the short name without names', () => expect(initials(bare)).toBe('K'))
  it('from the nickname', () => expect(initials({ ...bare, nickname: 'ксю' })).toBe('К'))
})

describe('parseProfile', () => {
  it('trims the fields', () => {
    expect(parseProfile({ firstName: ' Иван ', lastName: '', nickname: 'vanya ' })).toEqual({
      firstName: 'Иван',
      lastName: '',
      nickname: 'vanya',
    })
  })
  it('rejects missing or non-string fields', () => {
    expect(parseProfile({ firstName: 'Иван', lastName: '' })).toBeNull()
    expect(parseProfile({ firstName: 1, lastName: '', nickname: '' })).toBeNull()
    expect(parseProfile(null)).toBeNull()
  })
  it('rejects too long fields', () => {
    expect(parseProfile({ firstName: 'а'.repeat(41), lastName: '', nickname: '' })).toBeNull()
    expect(parseProfile({ firstName: '', lastName: '', nickname: 'n'.repeat(25) })).toBeNull()
    expect(parseProfile({ firstName: 'а'.repeat(40), lastName: '', nickname: 'n'.repeat(24) })).not.toBeNull()
  })
})

describe('withProfiles', () => {
  it('fills the fields an old cached account lacks', () => {
    const old = {
      user: { id: 'u', email: 'ivan@example.test' },
      groups: [{ id: 'g', name: 'Личная', role: 'owner', members: [{ memberId: 'm', userId: 'u', email: 'ivan@example.test', role: 'owner' }] }],
      defaultGroupId: 'g',
    } as unknown as Me
    const me = withProfiles(old)
    expect(me.user).toEqual({ id: 'u', email: 'ivan@example.test', firstName: '', lastName: '', nickname: '', image: null })
    expect(me.groups[0].members[0].nickname).toBe('')
  })
  it('keeps what is there', () => {
    const me = withProfiles({ user: { id: 'u', ...vanya, image: '/api/avatars/u?v=1' }, groups: [], defaultGroupId: null })
    expect(me.user.nickname).toBe('vanya')
    expect(me.user.image).toBe('/api/avatars/u?v=1')
  })
})
