import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { type Auth, createAuth } from './auth'
import { getMe } from './me'

/**
 * The API of the app (docs/ARCHITECTURE.md §9). Only `/api/*` reaches the worker
 * (`assets.run_worker_first`); everything else is served as static files.
 */
/** Previews also have the Secrets Store binding of the `previews` block (wrangler.jsonc). */
type Bindings = Env & { PREVIEW_AUTH_SECRET?: SecretsStoreSecret }

const app = new Hono<{ Bindings: Bindings; Variables: { auth: Auth } }>().basePath('/api')

// One Better Auth instance per address in an isolate: setting it up on every request costs CPU.
const auths = new Map<string, Auth>()

app.use(csrf())
app.use(async (c, next) => {
  const { origin } = new URL(c.req.url)
  let auth = auths.get(origin)
  if (!auth) {
    // Production and `pnpm dev` have BETTER_AUTH_SECRET; a preview reads its own from the Secrets Store.
    const secret = c.env.BETTER_AUTH_SECRET || (await c.env.PREVIEW_AUTH_SECRET?.get())
    // Without these Better Auth would quietly keep accounts in memory: say it out loud instead.
    if (!c.env.DB || !secret) {
      console.error('The worker has no DB binding or no auth secret (docs/CLOUDFLARE.md §14)')
      return c.json({ error: 'misconfigured' }, 500)
    }
    auths.set(origin, (auth = createAuth(c.env, origin, secret)))
  }
  c.set('auth', auth)
  await next()
})

app.on(['GET', 'POST'], '/auth/*', (c) => c.get('auth').handler(c.req.raw))

app.get('/me', async (c) => {
  const me = await getMe(c.get('auth'), c.env.DB, c.req.raw.headers)
  return me ? c.json(me) : c.json({ error: 'unauthorized' }, 401)
})

app.notFound((c) => c.json({ error: 'not_found' }, 404))

export default app
