import { passkeyClient } from '@better-auth/passkey/client'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

/** Better Auth on the app's own address, `/api/auth` (docs/ARCHITECTURE.md §9). */
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [organizationClient(), passkeyClient()],
})
