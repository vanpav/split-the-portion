import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { type Auth, createAuth } from './auth'
import { getMe } from './me'

/**
 * The API of the app (docs/ARCHITECTURE.md §9). Only `/api/*` reaches the worker
 * (`assets.run_worker_first`); everything else is served as static files.
 */
const app = new Hono<{ Bindings: Env; Variables: { auth: Auth } }>().basePath('/api')

// One Better Auth instance per address in an isolate: setting it up on every request costs CPU.
const auths = new Map<string, Auth>()

app.use(csrf())
app.use(async (c, next) => {
  // Without these Better Auth would quietly keep accounts in memory: say it out loud instead.
  if (!c.env.DB || !c.env.BETTER_AUTH_SECRET) {
    console.error('The worker has no DB binding or no BETTER_AUTH_SECRET (docs/CLOUDFLARE.md §14)')
    return c.json({ error: 'misconfigured' }, 500)
  }
  const { origin } = new URL(c.req.url)
  let auth = auths.get(origin)
  if (!auth) auths.set(origin, (auth = createAuth(c.env, origin)))
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
