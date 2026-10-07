export const LAST_CALCULATOR_KEY = 'split-the-portion:calculator'
export const LAST_CALCULATOR_VERSION = 2

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings the stored last calculator of any earlier version up to LAST_CALCULATOR_VERSION.
 * v2: the composite dish no longer folds its ingredients, so `folded` goes; the input's `weightRow`
 * stays as it was (a row that no longer exists is replaced when the calculator opens).
 */
export function migrateLastCalculator(state: unknown, version: number): unknown {
  if (version >= 2 || !isRecord(state) || !isRecord(state.last) || !isRecord(state.last.input)) return state
  const { folded: _folded, ...input } = state.last.input
  return { ...state, last: { ...state.last, input } }
}
