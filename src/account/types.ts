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
  /** The signed-in user's role: the owner renames, invites revoke and removes people. */
  role: 'owner' | 'member'
  members: GroupMember[]
}

export interface GroupMember {
  memberId: string
  userId: string
  email: string
  role: 'owner' | 'member'
}

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
