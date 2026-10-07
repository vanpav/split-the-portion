import { useLocation, useParams } from 'react-router'
import { DishEditorForm } from './DishEditorForm'

/**
 * `/d/new?from=<simple dish>`, `/d/new?text=…` or `/d/:id/edit`. The router keeps the same element between
 * these routes, so the form is remounted on every navigation: its draft must not leak to another dish.
 * «Из блюда» (`…/from-dish`) and «Новая тара» (`…/tare/new`) are not another form: keyed by
 * the dish, not by the path.
 */
export function DishEditorScreen() {
  const { id } = useParams()
  const { search } = useLocation()
  return <DishEditorForm key={(id ?? 'new') + search} />
}
