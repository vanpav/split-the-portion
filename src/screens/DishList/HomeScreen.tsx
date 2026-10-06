import { Navigate } from 'react-router'
import { dishPath } from '@/app/paths'
import { recentDishes } from '@/domain'
import { useAppStore } from '@/store/store'
import { DishMenuScreen } from './DishMenuScreen'

/** `#/`: the calculator of the dish used last; with no dishes yet, the dish menu's empty state that starts them. */
export function HomeScreen() {
  const latest = useAppStore((s) => recentDishes(s.dishes)[0])
  return latest ? <Navigate to={dishPath(latest.id)} replace /> : <DishMenuScreen home />
}
