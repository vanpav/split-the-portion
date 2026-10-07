/** `GET /api/me`: who is signed in and in which groups (docs/ARCHITECTURE.md §9). Shared with the worker. */
export interface Me {
  user: { id: string; email: string } & Profile
  groups: AccountGroup[]
  /** The group opened on launch: the chosen one while the user is still in it, else the first one joined. */
  defaultGroupId: string | null
}

export interface AccountGroup {
  id: string
  name: string
  /** The signed-in user's role: the owner renames, invites revoke and removes people. */
  role: 'owner' | 'member'
  members: GroupMember[]
}

export interface GroupMember extends Profile {
  memberId: string
  userId: string
  email: string
  role: 'owner' | 'member'
}

/**
 * What a person tells about themselves (Настройки → Аккаунт). Every field may be empty: without a
 * nickname the others see the part of the email before @.
 */
export interface Profile {
  firstName: string
  lastName: string
  /** The short name others see in the group: «vanya», «Ксю». */
  nickname: string
  /** `/api/avatars/<userId>?v=<time>`; null — no photo. */
  image: string | null
}

/** Longest first or last name, and nickname. */
export const PROFILE_LIMITS = { name: 40, nickname: 24 } as const

/** Largest avatar the server takes; the phone sends a 256×256 JPEG of 15–40 KB. */
export const MAX_AVATAR_BYTES = 256 * 1024

/** The side of the square the avatar is cut to on the phone. */
export const AVATAR_SIZE = 256

/** `POST /api/groups/:id/invites`. */
export interface Invite {
  code: string
  expiresAt: string
}

/** `GET /api/invites/:code`: shown before «Вступить». `invitedBy` — the part of the email before @. */
export interface InvitePreview {
  groupId: string
  groupName: string
  invitedBy: string
}

/** The group every account gets at sign-up (docs/SPEC.md §13.2). */
export const PERSONAL_GROUP_NAME = 'Личная'

/** How many groups one account may be in, its own and joined ones together (docs/SPEC.md §13.3). */
export const MAX_GROUPS = 3

/** Longest group name; the personal one and typed ones are cut the same way. */
export const MAX_GROUP_NAME = 40
