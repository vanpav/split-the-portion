import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { parseInviteCode } from '../src/account/inviteCode'
import { SYNC_LIMITS } from '../src/sync/protocol'
import { type Auth, createAuth } from './auth'
import { acceptInvite, inviteCode, previewInvite, revokeInvite, roleIn } from './invites'
import { getMe, setDefaultGroup } from './me'
import { isMember, syncGroup } from './sync'
import { parseSyncRequest } from './syncRequest'

type Session = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>

/**
 * The API of the app (docs/ARCHITECTURE.md §9). Only `/api/*` reaches the worker
 * (`assets.run_worker_first`); everything else is served as static files.
 */
/** Previews also have the Secrets Store binding of the `previews` block (wrangler.jsonc). */
type Bindings = Env & { PREVIEW_AUTH_SECRET?: SecretsStoreSecret }

const app = new Hono<{ Bindings: Bindings; Variables: { auth: Auth; session: Session } }>().basePath('/api')

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

// A code's group and who invited: shown before «Вступить», also before signing in.
app.get('/invites/:code', async (c) => {
  const code = parseInviteCode(c.req.param('code'))
  const invite = code && (await previewInvite(c.env.DB, code, new Date()))
  return invite ? c.json(invite) : c.json({ error: 'not_found' }, 404)
})

// Everything below needs a session.
app.use(async (c, next) => {
  const session = await c.get('auth').api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'unauthorized' }, 401)
  c.set('session', session)
  await next()
})

app.put('/me/default-group', async (c) => {
  const { groupId } = await c.req.json<{ groupId?: unknown }>().catch(() => ({ groupId: undefined }))
  const userId = c.get('session').user.id
  if (typeof groupId !== 'string' || !(await isMember(c.env.DB, groupId, userId))) return c.json({ error: 'forbidden' }, 403)
  await setDefaultGroup(c.env.DB, userId, groupId)
  return c.json({ ok: true })
})

app.post('/invites/:code/accept', async (c) => {
  const code = parseInviteCode(c.req.param('code'))
  const groupId = code && (await acceptInvite(c.get('auth'), c.env.DB, code, c.get('session').user.id, new Date()))
  return groupId ? c.json({ groupId }) : c.json({ error: 'not_found' }, 404)
})

app.post('/groups/:id/invites', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('session').user.id
  if (!(await isMember(c.env.DB, groupId, userId))) return c.json({ error: 'forbidden' }, 403)
  return c.json(await inviteCode(c.env.DB, groupId, userId, new Date()))
})

app.delete('/groups/:id/invites/:code', async (c) => {
  const groupId = c.req.param('id')
  if ((await roleIn(c.env.DB, groupId, c.get('session').user.id)) !== 'owner') return c.json({ error: 'forbidden' }, 403)
  const code = parseInviteCode(c.req.param('code'))
  return code && (await revokeInvite(c.env.DB, groupId, code)) ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404)
})

app.post('/groups/:id/sync', async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('session').user.id
  if (!(await isMember(c.env.DB, groupId, userId))) return c.json({ error: 'forbidden' }, 403)
  if (Number(c.req.header('content-length') ?? 0) > SYNC_LIMITS.requestBytes) return c.json({ error: 'too_large' }, 413)
  const req = parseSyncRequest(await c.req.json().catch(() => null))
  if (typeof req === 'string') return c.json({ error: req }, 400)
  const body = await syncGroup(c.env.DB, groupId, userId, req, new Date().toISOString())
  return c.body(body, 200, { 'content-type': 'application/json' })
})

app.notFound((c) => c.json({ error: 'not_found' }, 404))

export default app
