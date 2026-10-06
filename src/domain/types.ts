export type Id = string

// ---- Stored input (see docs/ARCHITECTURE.md §3) ----

export interface Tare {
  id: Id
  name: string
  grams: number
  /** Order in lists, the same on every device of a group (since v10). */
  createdAt: string
}

export interface Ingredient {
  id: Id
  name: string
  rawGrams: number | null
  /** «Не учитывать»: water, salt, spices. Counts towards dish weight, never towards the tracker list. */
  excluded: boolean
}

export interface TareSnapshot {
  id: Id | null
  name: string
  grams: number
}

/** Cooked weight input. weighings[0] is "after cooking", the rest are re-weighings of the leftover. */
export type Weighing =
  | { id: Id; at: string; kind: 'food'; grams: number | null }
  | { id: Id; at: string; kind: 'withTare'; grams: number | null; tare: TareSnapshot }

export type PortionInput =
  /** Not chosen yet: follows the dish (raw of the only counted ingredient, otherwise cooked). */
  | { basis: 'default'; grams: null }
  | { basis: 'cooked'; grams: number | null }
  | { basis: 'raw'; ingredientId: Id; grams: number | null }
  /** A company member: splits what is left after gram portions, in proportion to weight (docs/SPEC.md §5). */
  | { basis: 'share'; weight: number }
  /** An own portion as a percent of what is in the pot in this phase: «мне 50 %». */
  | { basis: 'part'; percent: number }

/** A portion input with basis 'default' resolved against the dish. */
export type ResolvedPortionInput = Exclude<PortionInput, { basis: 'default' }>

/** A portion entered in grams (cooked or raw of an ingredient). */
export type GramsPortionInput = Exclude<ResolvedPortionInput, { basis: 'share' } | { basis: 'part' }>

export interface Portion {
  id: Id
  name: string
  /** Phase (weighing) the portion was taken from. */
  weighingId: Id
  input: PortionInput
}

/** simple — one product (exactly one ingredient, not excluded); composite — a list of ingredients. */
export type CookingKind = 'simple' | 'composite'

export interface CompanyMember {
  id: Id
  name: string
  /** Share weight: any positive number, only the ratio matters (1 : 1, 70 : 60). */
  weight: number
}

/** People who usually eat together: «Ваня и Ксюша», «С тёщей». */
export interface Company {
  id: Id
  name: string
  members: CompanyMember[]
  /** Order in lists, the same on every device of a group: the first company is a dish's default lineup (since v10). */
  createdAt: string
}

/**
 * «Кто ест» of one dish in the calculator: the company picked (a template, never changed from here)
 * and the people with today's shares after the slider, «+ Имя» and × (docs/SPEC.md §3б).
 */
export interface Lineup {
  /** null — none picked: the company was deleted, or the lineup came from v8. */
  companyId: Id | null
  members: CompanyMember[]
}

/**
 * How the calculator splits a dish (docs/SPEC.md §3б «Режим долей»): between the people of «Кто ест»
 * or into anonymous portions («Доли»). A setting of this device for all dishes, not group data.
 */
export type SplitMode = 'people' | 'shares'

/**
 * One anonymous portion of a dish in «Доли»: a share like a person's, without a name — portions are
 * numbered by place («Порция 1»). Kept per dish on this device only, never in the group data.
 */
export interface PortionShare {
  id: Id
  /** Positive; the dish is split in proportion, as between people. */
  weight: number
}

/**
 * The last cooked weight typed for a dish (docs/SPEC.md §3а): on the scale, in this tare, at this time.
 * Shown again only the same day and in the same tare (`cookedToday`); seen by the whole group.
 */
export interface CookedWeight {
  grams: number
  tareId: Id | null
  at: string
}

/**
 * A dish is a preset (docs/SPEC.md §3а): what is cooked and what was typed last time — the raw weights,
 * the tare, the last cooked weight. The calculator writes them as they are typed.
 */
export interface Dish {
  id: Id
  kind: CookingKind
  name: string
  createdAt: string
  updatedAt: string
  /** rawGrams — the weight typed last time. */
  ingredients: Ingredient[]
  /** The tare it is weighed in; null — without tare. Who eats — `lineups`. */
  tareId: Id | null
  /** Since v11; null — not weighed yet. */
  cooked: CookedWeight | null
  /**
   * Days the dish was used, «YYYY-MM-DD» local, in order, the last 30 (since v12): a raw weight, the
   * tare or the cooked weight typed in the calculator. «Частые» in the dish menu (docs/SPEC.md §3б).
   */
  usedOn: string[]
}

/**
 * One time the dish is cooked: today's weights and how it is split. The calculator's draft
 * (`cookingDraft`), the input of `computeCooking`; not stored since v11.
 */
export interface Cooking {
  id: Id
  dishId: Id
  kind: CookingKind
  title: string
  createdAt: string
  updatedAt: string
  ingredients: Ingredient[]
  /** Always at least one element. */
  weighings: Weighing[]
  portions: Portion[]
  equalSplitN: number | null
  /**
   * «На завтра»: percent of the whole dish set aside before sharing (docs/SPEC.md §5).
   * Share portions split what is left after own portions and this; null — nothing set aside.
   */
  keepPercent: number | null
  /** Company chosen for this cooking; its members were added as share portions. */
  companyId: Id | null
}

// ---- Computed results (full precision, never stored) ----

export interface RawAmount {
  ingredientId: Id
  grams: number
}

export type PortionIssue =
  | 'empty'
  | 'missingIngredient'
  | 'noCookedWeight'
  | 'nothingLeft'

export interface PortionResult {
  portionId: Id
  /** The input with basis 'default' resolved: what the row shows and edits. */
  input: ResolvedPortionInput
  /** Share of the whole dish; null when the portion cannot be computed. */
  share: number | null
  cookedGrams: number | null
  /** Counted ingredients only, in ingredient order. */
  raw: RawAmount[]
  issue?: PortionIssue
}

export type WeighingError = 'empty' | 'tareExceeds'

export type ReconcileStatus = 'ok' | 'over' | 'under' | 'incomplete'

export interface Reconciliation {
  /** 'raw' — grams of the base ingredient, 'cooked' — grams of the dish in this phase. */
  basis: 'raw' | 'cooked'
  distributed: number
  total: number
  /** distributed − total */
  diff: number
  status: ReconcileStatus
}

export interface YieldK {
  kind: 'base' | 'dish'
  value: number
}

export interface PhaseResult {
  weighingId: Id
  /** A_j: share of the dish available in this phase. */
  available: number
  /** W_j: food weight (without tare); null if not entered or invalid. */
  foodGrams: number | null
  weighingError: WeighingError | null
  k: YieldK | null
  portions: PortionResult[]
  remainder: {
    /** 'over' — portions exceed what was available. */
    state: 'some' | 'none' | 'over'
    share: number
    cookedGrams: number | null
    raw: RawAmount[]
  }
  reconcile: Reconciliation | null
}

export interface CookingResult {
  /** The only counted ingredient, if there is exactly one. */
  baseIngredientId: Id | null
  /** Counted ingredients with a valid raw weight, in order. */
  countedIngredientIds: Id[]
  /** Σ raw of all valid ingredients, excluded ones included. */
  rawTotal: number
  phases: PhaseResult[]
}
