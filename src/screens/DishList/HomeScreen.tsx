import { Navigate } from 'react-router'
import { dishPath, WELCOME_PATH } from '@/app/paths'
import { recentDishes } from '@/domain'
import { showWelcome } from '@/onboarding/hints'
import { usePrefsStore } from '@/store/prefs'
import { useAppStore } from '@/store/store'
import { DishMenuScreen } from './DishMenuScreen'

/**
 * `#/`: the calculator of the dish used last; with no dishes yet, the dish menu's empty state that starts them —
 * on a new device after the welcome screen (docs/UX.md §3г).
 */
export function HomeScreen() {
  const latest = useAppStore((s) => recentDishes(s.dishes)[0])
  const welcome = usePrefsStore((s) => showWelcome(s.hints, latest !== undefined))
  if (latest) return <Navigate to={dishPath(latest.id)} replace />
  return welcome ? <Navigate to={WELCOME_PATH} replace /> : <DishMenuScreen home />
}
