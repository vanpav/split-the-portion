import { describe, expect, it } from 'vitest'
import { formatInviteCode, parseInviteCode } from '../inviteCode'

describe('invite codes', () => {
  it('shows a code in two halves', () => {
    expect(formatInviteCode('K7MRQ2XD')).toBe('K7MR-Q2XD')
  })

  it.each([
    ['K7MR-Q2XD', 'K7MRQ2XD'],
    ['k7mr q2xd', 'K7MRQ2XD'],
    [' k7mrq2xd ', 'K7MRQ2XD'],
    ['https://example.test/#/join/K7MRQ2XD', 'K7MRQ2XD'],
  ])('reads %s', (input, code) => {
    expect(parseInviteCode(input)).toBe(code)
  })

  it.each(['K7MR-Q2X', 'K7MR-Q2XDD', 'O7MR-Q2XD', 'I7MR-Q2XD', ''])('refuses %s', (input) => {
    expect(parseInviteCode(input)).toBeNull()
  })
})
