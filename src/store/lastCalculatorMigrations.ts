export const LAST_CALCULATOR_KEY = 'split-the-portion:calculator'
export const LAST_CALCULATOR_VERSION = 3

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings the stored last calculator of any earlier version up to LAST_CALCULATOR_VERSION.
 * v2: the composite dish no longer folds its ingredients, so `folded` goes; the input's `weightRow`
 * stays as it was (a row that no longer exists is replaced when the calculator opens).
 * v3: no percent in the interface: `unit`, `barUnit` and `shown` go, an own portion is grams — one typed
 * in percent is dropped (that person shares again), the others lose their `unit`.
 */
export function migrateLastCalculator(state: unknown, version: number): unknown {
  if (version >= LAST_CALCULATOR_VERSION || !isRecord(state) || !isRecord(state.last) || !isRecord(state.last.input)) return state
  let input: Record<string, unknown> = state.last.input
  if (version < 2) {
    const { folded: _folded, ...rest } = input
    input = rest
  }
  if (version < 3) {
    const { unit: _unit, barUnit: _barUnit, shown: _shown, fixed, ...rest } = input
    const grams = Object.entries(isRecord(fixed) ? fixed : {}).flatMap(([id, own]) => {
      if (!isRecord(own) || own.unit === '%' || typeof own.value !== 'number') return []
      return [[id, typeof own.raw === 'string' ? { value: own.value, raw: own.raw } : { value: own.value }]]
    })
    input = { ...rest, fixed: Object.fromEntries(grams) }
  }
  return { ...state, last: { ...state.last, input } }
}
