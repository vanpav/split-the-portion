import { createAppStore } from './createAppStore'
import { idbStorage } from './idbStorage'

const legacy = (() => {
  try {
    return localStorage
  } catch {
    return null
  }
})()

export const useAppStore = createAppStore(() => idbStorage(legacy))
