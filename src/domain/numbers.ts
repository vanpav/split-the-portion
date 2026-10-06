export type ParseResult = { ok: true; value: number | null } | { ok: false }

// Accepts "1240", "1240,5", "1240.5", "1 240", "12," (while typing), ",5". Empty → null.
const NUMBER_RE = /^(\d+(\.\d*)?|\.\d+)$/
const SPACES_RE = /[\s  ]/g

export function parseGrams(input: string): ParseResult {
  const normalized = input.replace(SPACES_RE, '').replace(',', '.')
  if (normalized === '') return { ok: true, value: null }
  if (!NUMBER_RE.test(normalized)) return { ok: false }
  return { ok: true, value: Number(normalized) }
}

/** Round half away from zero. The tiny epsilon absorbs float noise like 1.005 * 100 = 100.49999. */
export function roundHalfUp(x: number, digits = 0): number {
  const factor = 10 ** digits
  const scaled = Math.abs(x) * factor
  const rounded = Math.floor(scaled + 0.5 + 1e-9)
  return (Math.sign(x) * rounded) / factor
}

const gramsFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const kFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const percentFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 })

/** Whole grams. A positive amount that rounds to zero is shown as "< 1". */
export function formatGrams(grams: number): string {
  const rounded = roundHalfUp(grams)
  if (rounded === 0 && grams > 0) return '< 1'
  return gramsFormat.format(rounded === 0 ? 0 : rounded)
}

export function formatK(k: number): string {
  return kFormat.format(roundHalfUp(k, 2))
}

/** share 0.125 → "12,5" */
export function formatPercent(share: number): string {
  return percentFormat.format(roundHalfUp(share * 100, 1))
}

/**
 * The number being typed on the keypad, shown like every other gram on screen: the whole part grouped
 * («3 160»), the comma and the fraction as typed («12,», «1 500,5»). Display only: the text stays as typed.
 */
export function formatTyped(text: string): string {
  const [int, fraction] = text.split(',')
  if (!/^\d+$/.test(int)) return text
  const grouped = gramsFormat.format(Number(int))
  return fraction === undefined ? grouped : `${grouped},${fraction}`
}

/** Value for an editable field: no grouping, comma, up to 1 decimal. null → ''. */
export function formatInput(value: number | null): string {
  if (value === null) return ''
  return String(roundHalfUp(value, 1)).replace('.', ',')
}
