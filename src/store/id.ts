import { nanoid } from 'nanoid'
import type { Id } from '@/domain'

/** The only source of ids. Not crypto.randomUUID: it is missing outside a secure context (phone over LAN http). */
export function newId(): Id {
  return nanoid()
}
