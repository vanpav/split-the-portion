import type { Company, Id, Tare } from '@/domain'

/**
 * What the calculator gives the screens opened over it (`#/d/:id/…`, docs/UX.md §3а). It stays
 * mounted under them, hidden, so a result goes straight into it — the way picking from its own list does.
 */
export interface CalculatorOutlet {
  dishId: Id
  /** A tare to weigh this dish in: the first one added on «Новая тара», or one tapped in «Добавлено». */
  onTare: (tare: Tare) => void
  /** A company just added on «Новая компания»: picked for this dish, focus to «+ Имя» on the way back. */
  onCompany: (company: Company) => void
}
