import { useLocation, useNavigate } from 'react-router'

/** Marks an entry opened in place of a missing previous screen: there is no screen of the app before it either. */
export const NO_PREVIOUS = { noPrevious: true }

function marked(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'noPrevious' in state
}

/**
 * «←» and «Отмена» (docs/UX.md «Назад»): a step back in history, the same as the system «назад»,
 * so it adds no entries. With no previous screen of the app — a direct link, the first entry of the
 * tab (`location.key` is `'default'`) — `fallback` replaces the current entry.
 * `noPreviousState` goes with any other `replace` that keeps «no previous screen» for the new entry.
 */
export function useBack(fallback: string) {
  const location = useLocation()
  const navigate = useNavigate()
  const hasPrevious = location.key !== 'default' && !marked(location.state)
  const back = () => {
    if (hasPrevious) navigate(-1)
    else navigate(fallback, { replace: true, state: NO_PREVIOUS })
  }
  return { hasPrevious, back, noPreviousState: NO_PREVIOUS }
}
