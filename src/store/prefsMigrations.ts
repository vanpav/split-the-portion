import { isValidSplitN, type Id, type PortionShare, type SplitMode } from '@/domain'
import { EMPTY_HINTS, readHints, type HintPrefs } from '@/onboarding/hints'

export const PREFS_KEY = 'split-the-portion:prefs'
export const PREFS_VERSION = 4

/** Settings of this device (docs/ARCHITECTURE.md §5.2): never in the group data or the backup file. */
export interface PersistedPrefs {
  /** People of «Кто ест» or «Доли»: how the calculator splits every dish. */
  splitMode: SplitMode
  /** The portions of each dish in «Доли», by dish id; a dish not here starts with two equal ones. */
  portions: Record<Id, PortionShare[]>
  /** Hints for new people: the welcome and the tour (docs/UX.md §3б). */
  hints: HintPrefs
  /** «По категориям» in the dish menu (docs/SPEC.md §3б): remembered on this device until switched again. */
  dishesByCategory: boolean
}

export const EMPTY_PREFS: PersistedPrefs = { splitMode: 'people', portions: {}, hints: EMPTY_HINTS, dishesByCategory: false }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Brings stored prefs of any earlier version up to PREFS_VERSION.
 * v1 (stage 16 before review): `splitMode: 'people' | 'portions'` and `portionCounts` — N equal
 * portions per dish. v2: `'portions'` is «Доли», N equal portions become N shares of weight 1.
 * v3 (stage 18): `hints`; earlier versions start with none shown — main.tsx settles them by the dishes.
 * v4: `dishesByCategory`; earlier versions start with the flat list.
 */
export function migratePrefs(state: unknown, version: number, makeId: () => Id): PersistedPrefs {
  if (!isRecord(state)) return EMPTY_PREFS
  if (version < 2) {
    const counts = isRecord(state.portionCounts) ? state.portionCounts : {}
    const portions: Record<Id, PortionShare[]> = {}
    for (const [dishId, n] of Object.entries(counts)) {
      if (typeof n === 'number' && isValidSplitN(n)) portions[dishId] = Array.from({ length: n }, () => ({ id: makeId(), weight: 1 }))
    }
    return { splitMode: state.splitMode === 'portions' ? 'shares' : 'people', portions, hints: EMPTY_HINTS, dishesByCategory: false }
  }
  return {
    splitMode: state.splitMode === 'shares' ? 'shares' : 'people',
    portions: isRecord(state.portions) ? (state.portions as Record<Id, PortionShare[]>) : {},
    hints: version < 3 ? EMPTY_HINTS : readHints(state.hints),
    dishesByCategory: version >= 4 && state.dishesByCategory === true,
  }
}
