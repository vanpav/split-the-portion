import { describe, expect, it } from 'vitest'
import { customName, groupLabel, peopleLabel } from '../groupLabel'
import { EMPTY_PROFILE } from '../profile'
import type { GroupMember } from '../types'

const member = (userId: string, nickname: string, role: GroupMember['role'] = 'member'): GroupMember => ({
  memberId: `m-${userId}`,
  userId,
  email: `${userId}@example.test`,
  role,
  ...EMPTY_PROFILE,
  nickname,
})
const vanya = member('v', 'Ваня', 'owner')
const ksu = member('k', 'Ксю')
const mama = member('m', '')
const lena = member('l', 'Лена')

describe('customName', () => {
  it('is no name for the personal group', () => expect(customName('Личная')).toBeNull())
  it('is no name when blank', () => expect(customName('  ')).toBeNull())
  it('keeps a given name', () => expect(customName(' Дом ')).toBe('Дом'))
})

describe('peopleLabel', () => {
  it('alone', () => expect(peopleLabel([vanya], 'v')).toBe('Только ты'))
  it('the owner sees «Ты и …»', () => expect(peopleLabel([vanya, ksu], 'v')).toBe('Ты и Ксю'))
  it('a member sees the owner first', () => expect(peopleLabel([ksu, vanya], 'k')).toBe('Ваня и ты'))
  it('three names', () => expect(peopleLabel([vanya, ksu, mama], 'k')).toBe('Ваня, ты и m'))
  it('more than three: «и ещё N»', () => expect(peopleLabel([vanya, ksu, mama, lena], 'k')).toBe('Ваня, ты и ещё 2'))
})

describe('groupLabel', () => {
  it('names a personal group by its people', () => {
    expect(groupLabel({ id: 'g', name: 'Личная', role: 'member', members: [vanya, ksu] }, 'k')).toBe('Ваня и ты')
  })
  it('keeps a given name', () => {
    expect(groupLabel({ id: 'g', name: 'Дом', role: 'member', members: [vanya, ksu] }, 'k')).toBe('Дом')
  })
})
