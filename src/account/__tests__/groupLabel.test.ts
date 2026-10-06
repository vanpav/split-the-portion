import { describe, expect, it } from 'vitest'
import { groupLabel } from '../groupLabel'
import type { AccountGroup } from '../types'

const members: AccountGroup['members'] = [
  { memberId: 'm1', userId: 'v', email: 'vanya@example.test', role: 'owner' },
  { memberId: 'm2', userId: 'k', email: 'ksusha@example.test', role: 'member' },
]

describe('groupLabel', () => {
  it('one’s own group by its name', () => {
    expect(groupLabel({ id: 'g', name: 'Личная', role: 'owner', members })).toBe('Личная')
  })
  it('someone else’s group with its owner', () => {
    expect(groupLabel({ id: 'g', name: 'Личная', role: 'member', members })).toBe('Личная · vanya')
  })
})
