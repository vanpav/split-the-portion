/**
 * Invite codes (docs/SPEC.md §13.3): 8 characters without look-alikes (0/O, 1/I/L), shown as
 * K7MR-Q2XD. 31⁸ ≈ 8.5·10¹¹ codes against 100 000 requests a day of the free plan: guessing one
 * is out of reach without a rate limit of our own.
 */
export const INVITE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const INVITE_LENGTH = 8
/** How long a code works. */
export const INVITE_DAYS = 7

/** `K7MRQ2XD` → `K7MR-Q2XD`: easier to read aloud and to type from a screen. */
export const formatInviteCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`

/** Whatever was typed or pasted (case, spaces, dashes, the whole link) → the code, or null. */
export function parseInviteCode(input: string): string | null {
  const tail = input.trim().split('/').pop() ?? ''
  const code = tail.toUpperCase().replace(/[\s-]/g, '')
  if (code.length !== INVITE_LENGTH) return null
  return [...code].every((ch) => INVITE_ALPHABET.includes(ch)) ? code : null
}
