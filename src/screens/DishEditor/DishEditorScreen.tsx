import { useLocation, useParams } from 'react-router'
import { DishEditorForm } from './DishEditorForm'

/**
 * `/d/new?kind=…&from=<simple dish>` or `/d/:id/edit`. The router keeps the same element between
 * these routes, so the form is remounted on every navigation: its draft must not leak to another dish.
 * «Из простого блюда» (`…/from-dish`) is not another form: keyed by the dish, not by the path.
 */
export function DishEditorScreen() {
  const { id } = useParams()
  const { search } = useLocation()
  return <DishEditorForm key={(id ?? 'new') + search} />
}
