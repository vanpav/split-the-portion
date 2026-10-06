/** Keys of the calculator's number input (docs/SPEC.md §3б). */
export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back' | 'clear'

/** Grams up to 99 999,9: enough for a pot with tare, short enough to stay one line. */
const MAX_INT_DIGITS = 5
const MAX_FRACTION_DIGITS = 1

/**
 * Applies a keypad key to the typed text ("130", "12,5"). `fresh` — the row was just activated:
 * like a calculator, the first digit replaces the old value instead of appending to it.
 */
export function applyKey(text: string, key: KeypadKey, fresh = false): string {
  if (key === 'clear') return ''
  if (key === 'back') return fresh ? '' : text.slice(0, -1)

  const base = fresh ? '' : text
  const [int, fraction] = base.split(',')
  if (key === ',') {
    if (fraction !== undefined) return base
    return `${int || '0'},`
  }
  if (fraction !== undefined) {
    return fraction.length >= MAX_FRACTION_DIGITS ? base : base + key
  }
  if (int === '0') return key
  return int.length >= MAX_INT_DIGITS ? base : base + key
}

/**
 * Text typed or pasted into a calculator field, kept to what the keys allow: digits and one comma
 * (a dot becomes one), at most 99 999,9. Anything else is dropped: «1 240» → «1240», «12.55» → «12,5».
 */
export function typedGrams(input: string): string {
  let text = ''
  for (const char of input) {
    if (/^[0-9]$/.test(char)) text = applyKey(text, char as KeypadKey)
    else if (char === ',' || char === '.') text = applyKey(text, ',')
  }
  return text
}
