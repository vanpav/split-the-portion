import { describe, expect, it } from 'vitest'
import type { AccountGroup } from '../../src/account/types'
import { defaultGroupOf } from '../me'

const personal: AccountGroup = { id: 'p', name: 'Личная', role: 'owner' }
const shared: AccountGroup = { id: 's', name: 'Ванина кухня', role: 'member' }

describe('defaultGroupOf', () => {
  it('keeps the chosen group while the user is in it', () => {
    expect(defaultGroupOf([personal, shared], 's')).toBe('s')
  })
  it('falls back to the first group joined when nothing is chosen', () => {
    expect(defaultGroupOf([personal, shared], null)).toBe('p')
    expect(defaultGroupOf([personal, shared], undefined)).toBe('p')
  })
  it('falls back when the user has left the chosen group', () => {
    expect(defaultGroupOf([personal], 's')).toBe('p')
  })
  it('is null without groups', () => {
    expect(defaultGroupOf([], 's')).toBeNull()
  })
})
