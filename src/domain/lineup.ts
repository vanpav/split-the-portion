import { matchingCompany } from './dish'
import type { Company, Id, Lineup } from './types'

/**
 * A company picked in «Кто ест»: its people with its default shares, copied — the slider changes
 * the dish's lineup, never the company (docs/SPEC.md §3б).
 */
export function companyLineup(company: Company): Lineup {
  return { companyId: company.id, members: company.members.map((m) => ({ ...m })) }
}

/**
 * Who eats this dish in the calculator: what was remembered for it; before it is first changed —
 * the first company of the settings; with no companies — nobody yet.
 */
export function dishLineup(lineups: Record<Id, Lineup>, dishId: Id, companies: Company[]): Lineup {
  const remembered = lineups[dishId]
  if (remembered) return remembered
  return companies[0] ? companyLineup(companies[0]) : { companyId: null, members: [] }
}

/**
 * The company shown in the picker: the one picked, while it still exists, however the shares were
 * moved since; none picked — the company with the same people and split, if any.
 */
export function lineupCompany(lineup: Lineup, companies: Company[]): Company | null {
  const picked = lineup.companyId !== null ? companies.find((c) => c.id === lineup.companyId) : undefined
  return picked ?? matchingCompany(lineup.members, companies)
}
