/** `GET /api/me`: who is signed in and in which groups (docs/ARCHITECTURE.md §9). Shared with the worker. */
export interface Me {
  user: { id: string; email: string }
  groups: AccountGroup[]
  /** The group opened on launch: the chosen one while the user is still in it, else the first one joined. */
  defaultGroupId: string | null
}

export interface AccountGroup {
  id: string
  name: string
  role: 'owner' | 'member'
}

/** The group every account gets at sign-up (docs/SPEC.md §13.2). */
export const PERSONAL_GROUP_NAME = 'Личная'
