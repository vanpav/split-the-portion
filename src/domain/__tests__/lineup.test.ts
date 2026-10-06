import { describe, expect, it } from 'vitest'
import { companyLineup, dishLineup, lineupCompany } from '../lineup'
import type { Company, Lineup } from '../types'

const us: Company = {
  id: 'us',
  name: 'Ваня и Ксюша',
  createdAt: '2026-10-01T08:00:00.000Z',
  members: [
    { id: 'v', name: 'Ваня', weight: 70 },
    { id: 'k', name: 'Ксюша', weight: 60 },
  ],
}
const withMom: Company = {
  id: 'mom',
  name: 'С тёщей',
  createdAt: '2026-10-01T09:00:00.000Z',
  members: [...us.members, { id: 't', name: 'Тёща', weight: 60 }],
}

describe('companyLineup', () => {
  it('takes the company with its default shares', () => {
    expect(companyLineup(us)).toEqual({ companyId: 'us', members: us.members })
  })

  it('is a copy: changing the lineup leaves the company as it was', () => {
    const lineup = companyLineup(us)
    lineup.members[0].weight = 50
    expect(us.members[0].weight).toBe(70)
  })
})

describe('dishLineup', () => {
  const pasta: Lineup = { companyId: 'mom', members: [{ id: 'v', name: 'Ваня', weight: 54 }] }

  it('remembers each dish on its own', () => {
    const lineups = { pasta }
    expect(dishLineup(lineups, 'pasta', [us, withMom])).toBe(pasta)
    expect(dishLineup(lineups, 'soup', [us, withMom])).toEqual(companyLineup(us))
  })

  it('starts with the first company, or nobody without companies', () => {
    expect(dishLineup({}, 'soup', [withMom, us])).toEqual(companyLineup(withMom))
    expect(dishLineup({}, 'soup', [])).toEqual({ companyId: null, members: [] })
  })
})

describe('lineupCompany', () => {
  it('keeps the picked company when the shares were moved or people added', () => {
    const moved: Lineup = {
      companyId: 'us',
      members: [
        { id: 'v', name: 'Ваня', weight: 30 },
        { id: 'k', name: 'Ксюша', weight: 70 },
        { id: 'g', name: 'Гость', weight: 50 },
      ],
    }
    expect(lineupCompany(moved, [us, withMom])).toBe(us)
  })

  it('none picked: the company with the same people and split', () => {
    const same: Lineup = { companyId: null, members: [{ id: 'a', name: 'ваня', weight: 54 }, { id: 'b', name: 'Ксюша', weight: 46 }] }
    expect(lineupCompany(same, [withMom, us])).toBe(us)
    expect(lineupCompany({ companyId: null, members: [] }, [us])).toBeNull()
  })

  it('a deleted company is not shown; the matching one is, if any', () => {
    expect(lineupCompany({ companyId: 'gone', members: withMom.members }, [us, withMom])).toBe(withMom)
    expect(lineupCompany({ companyId: 'gone', members: [{ id: 'x', name: 'Гость', weight: 1 }] }, [us])).toBeNull()
  })
})
