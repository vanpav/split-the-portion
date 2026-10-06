import { useOutlet, useParams } from 'react-router'
import { Calculator } from './Calculator'
import { DishShelf } from './DishShelf'

/**
 * `/d/:id`. The router keeps the same element when going from one dish to another, so the
 * calculator is remounted per dish: its typed numbers must not carry over. The shelf stays,
 * keeping its scroll. Under a screen opened over the calculator (`/d/:id/tare/new`, …) both stay
 * mounted and hidden; the calculator renders that screen.
 */
export function CalculatorScreen() {
  const { id } = useParams()
  const covered = useOutlet() !== null
  return (
    <>
      <div hidden={covered} className="contents">
        <DishShelf currentId={id} />
      </div>
      <Calculator key={id} id={id} />
    </>
  )
}
