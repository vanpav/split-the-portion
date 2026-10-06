import { CURRENT_VERSION, migrate, STORAGE_KEY, type PersistedState } from './migrations'

/** What a backup file holds: the stored data with its schema version, so any later version can read it. */
interface BackupFile {
  app: typeof STORAGE_KEY
  version: number
  exportedAt: string
  state: PersistedState
}

/** «Скачать копию»: the user's data as a JSON file. */
export function backupFile(state: PersistedState, now: Date): { name: string; text: string } {
  const file: BackupFile = { app: STORAGE_KEY, version: CURRENT_VERSION, exportedAt: now.toISOString(), state }
  return { name: `${STORAGE_KEY}-${now.toISOString().slice(0, 10)}.json`, text: JSON.stringify(file, null, 2) }
}

/**
 * «Загрузить из файла»: reads a backup of any earlier version and brings it to the current one with
 * the same migrations as on load. Throws if the file is not ours, is damaged or comes from a newer version.
 */
export function readBackupFile(text: string): PersistedState {
  const file = JSON.parse(text) as Partial<BackupFile> | null
  if (typeof file !== 'object' || file === null || file.app !== STORAGE_KEY || typeof file.version !== 'number') {
    throw new Error('Not a backup of this app')
  }
  return migrate(file.state, file.version)
}
