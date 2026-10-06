import { passkey } from '@better-auth/passkey'
import { type BetterAuthOptions, betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { nanoid } from 'nanoid'
import { PERSONAL_GROUP_NAME } from '../src/account/types'

/**
 * Sign-in (docs/ARCHITECTURE.md §9): email and password, a passkey (Face ID) on top, groups as
 * Better Auth organizations. The address comes from the request, so production, branch previews
 * and localhost each work as themselves; a passkey belongs to the host it was made on.
 * The password hash is native scrypt under `nodejs_compat` (`@better-auth/utils` picks
 * `node:crypto` for workerd), which fits the CPU limit of the free plan.
 */
/** Everything except the database, the secret and the hooks: shared with `pnpm db:auth-schema`. */
export function authOptions(origin: string) {
  return {
    appName: 'Порции',
    baseURL: origin,
    basePath: '/api/auth',
    trustedOrigins: [origin],
    telemetry: { enabled: false },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // No emails yet (backlog): the owner reads the link in `wrangler tail` and passes it on
      // (docs/CLOUDFLARE.md §10). Replaced by a real email together with the mailing.
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        console.log(`Password reset link for ${user.email}: ${url}`)
      },
    },
    // A phone may stay offline for days: the session lives 60 days and is extended on use.
    session: { expiresIn: 60 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
    // Each isolate has its own memory, so the counters live in D1.
    rateLimit: { enabled: true, storage: 'database' },
    user: {
      additionalFields: {
        // Opened on launch (stage 14); null — the first group the user joined.
        defaultGroupId: { type: 'string', required: false, input: false },
      },
    },
    plugins: [organization(), passkey({ rpID: new URL(origin).hostname, rpName: 'Порции', origin })],
  } satisfies BetterAuthOptions
}

export function createAuth(env: Env, origin: string) {
  const auth = betterAuth({
    ...authOptions(origin),
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    databaseHooks: {
      user: {
        create: {
          // Every account starts with its own group; the data on the device moves there at first sign-in.
          after: async (user) => {
            await auth.api.createOrganization({ body: { name: PERSONAL_GROUP_NAME, slug: nanoid(), userId: user.id } })
          },
        },
      },
    },
  })
  return auth
}

export type Auth = ReturnType<typeof createAuth>
