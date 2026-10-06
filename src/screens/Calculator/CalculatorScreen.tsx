import { useParams } from 'react-router'
import { Calculator } from './Calculator'
import { DishShelf } from './DishShelf'

/**
 * `/d/:id`. The router keeps the same element when going from one dish to another, so the
 * calculator is remounted per dish: its typed numbers must not carry over. The shelf stays,
 * keeping its scroll.
 */
export function CalculatorScreen() {
  const { id } = useParams()
  return (
    <>
      <DishShelf currentId={id} />
      <Calculator key={id} id={id} />
    </>
  )
}
