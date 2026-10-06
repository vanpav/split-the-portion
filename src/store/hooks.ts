import { useMemo } from 'react'
import { computeCooking, type Id } from '@/domain'
import { useAppStore } from './store'

export function useCooking(id: Id | undefined) {
  return useAppStore((s) => s.cookings.find((c) => c.id === id))
}

/** Derived values; recomputed only when the cooking object changes. */
export function useCookingResult(id: Id | undefined) {
  const cooking = useCooking(id)
  return useMemo(() => (cooking ? computeCooking(cooking) : undefined), [cooking])
}
