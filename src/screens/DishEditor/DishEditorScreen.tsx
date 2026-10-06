import { useLocation } from 'react-router'
import { DishEditorForm } from './DishEditorForm'

/**
 * `/d/new?kind=…&from=<simple dish>` or `/d/:id/edit`. The router keeps the same element between
 * these routes, so the form is remounted on every navigation: its draft must not leak to another dish.
 */
export function DishEditorScreen() {
  const { pathname, search } = useLocation()
  return <DishEditorForm key={pathname + search} />
}
