import { call, json } from './groupsApi'
import type { Profile } from './types'

/** The profile and the photo (docs/ARCHITECTURE.md §9). Errors as in `groupsApi`. */
export const profileApi = {
  save: async (profile: Omit<Profile, 'image'>) =>
    void json(await call('/api/me/profile', { method: 'PUT', body: JSON.stringify(profile) })),
  /** The new address of the photo. */
  uploadAvatar: async (image: Blob) =>
    (await json<{ image: string }>(await call('/api/me/avatar', { method: 'PUT', body: image }))).image,
  removeAvatar: async () => void json(await call('/api/me/avatar', { method: 'DELETE' })),
}
