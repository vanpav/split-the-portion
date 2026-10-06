import { del, get, set } from 'idb-keyval'
import type { StateStorage } from 'zustand/middleware'

/**
 * Where the app keeps its data: IndexedDB (docs/ARCHITECTURE.md §5). Unlike localStorage it can be
 * marked persistent (`navigator.storage.persist`) and holds far more. Data written by earlier
 * versions to localStorage is moved over on first read.
 */
export function idbStorage(legacy: Storage | null): StateStorage {
  return {
    getItem: async (name) => {
      const value = await get<string>(name)
      if (value !== undefined) return value
      // Moved over at once, not on the next change: the old copy goes only once the new one is written.
      const old = legacy?.getItem(name) ?? null
      if (old !== null) {
        await set(name, old)
        legacy?.removeItem(name)
      }
      return old
    },
    setItem: async (name, value) => {
      await set(name, value)
      legacy?.removeItem(name)
    },
    removeItem: (name) => del(name),
  }
}

/** Asks the browser not to clear our data when space runs low. Not every browser agrees; nothing breaks if not. */
export function askPersistentStorage() {
  navigator.storage?.persist?.().catch(() => undefined)
}
