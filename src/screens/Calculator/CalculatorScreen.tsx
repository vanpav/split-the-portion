import { useParams } from 'react-router'
import { Calculator } from './Calculator'

/**
 * `/d/:id`. The router keeps the same element when going from one dish to another, so the
 * calculator is remounted per dish: its typed numbers must not carry over.
 */
export function CalculatorScreen() {
  const { id } = useParams()
  return <Calculator key={id} id={id} />
}
