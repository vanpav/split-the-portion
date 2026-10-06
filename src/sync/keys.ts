import { STORAGE_KEY } from '@/store/migrations'

/** A group's own copy of the data on the device (docs/ARCHITECTURE.md §5.2). */
export const groupDataKey = (groupId: string) => `${STORAGE_KEY}:group:${groupId}`
/** A group's unsent changes and how far it has been read. */
export const outboxKey = (groupId: string) => `${STORAGE_KEY}:sync:${groupId}`
