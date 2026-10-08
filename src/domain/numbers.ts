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

/** BCP 47 locale the UI shows numbers in, e.g. `ru-RU`, `en-US`. Passed in to keep the domain pure. */
export type Locale = string

const formats = new Map<string, Intl.NumberFormat>()

/** Cached: building an Intl.NumberFormat is slow and formatting runs on every render. */
function numberFormat(locale: Locale, maximumFractionDigits: number): Intl.NumberFormat {
  const key = `${locale}|${maximumFractionDigits}`
  let format = formats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, { maximumFractionDigits })
    formats.set(key, format)
  }
  return format
}

/** «,» for `ru-RU` and `es-ES`, «.» for `en-US`. */
export function decimalSeparator(locale: Locale): string {
  return numberFormat(locale, 1).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? '.'
}

/** Whole grams. A positive amount that rounds to zero is shown as "< 1". */
export function formatGrams(grams: number, locale: Locale): string {
  const rounded = roundHalfUp(grams)
  if (rounded === 0 && grams > 0) return '< 1'
  return numberFormat(locale, 0).format(rounded === 0 ? 0 : rounded)
}

export function formatK(k: number, locale: Locale): string {
  return numberFormat(locale, 2).format(roundHalfUp(k, 2))
}

/** share 0.125 → "12,5" (`ru-RU`), "12.5" (`en-US`) */
export function formatPercent(share: number, locale: Locale): string {
  return numberFormat(locale, 1).format(roundHalfUp(share * 100, 1))
}

/**
 * The number being typed on the keypad, shown like every other gram on screen: the whole part grouped
 * («3 160»), the separator and the fraction as typed («12,», «1 500,5»). The typed text always uses a
 * comma (see `keypad.ts`); the locale's separator is shown in its place. Display only.
 */
export function formatTyped(text: string, locale: Locale): string {
  const [int, fraction] = text.split(',')
  if (!/^\d+$/.test(int)) return text
  const grouped = numberFormat(locale, 0).format(Number(int))
  return fraction === undefined ? grouped : `${grouped}${decimalSeparator(locale)}${fraction}`
}

/** Value for an editable field: no grouping, the locale's separator, up to 1 decimal. null → ''. */
export function formatInput(value: number | null, locale: Locale): string {
  if (value === null) return ''
  return String(roundHalfUp(value, 1)).replace('.', decimalSeparator(locale))
}
