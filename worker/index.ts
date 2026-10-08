import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { csrf } from 'hono/csrf'
import { parseInviteCode } from '../src/account/inviteCode'
import { parseProfile } from '../src/account/profile'
import { MAX_AVATAR_BYTES, MAX_GROUP_NAME } from '../src/account/types'
import { SYNC_LIMITS } from '../src/sync/protocol'
import { deleteAccount, resetAccount } from './account'
import { type Auth, createAuth } from './auth'
import { acceptInvite, createGroup, inviteCode, previewInvite, revokeInvite, roleIn } from './invites'
import { getMe, setDefaultGroup } from './me'
import { imageType, readAvatar, removeAvatar, saveAvatar, saveProfile } from './profile'
import { isMember, syncGroup } from './sync'
import { parseSyncRequest } from './syncRequest'

type Session = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>

/**
 * The API of the app (docs/ARCHITECTURE.md §9). Only `/api/*` reaches the worker
 * (`assets.run_worker_first`); everything else is served as static files.
 */
/** Previews also have the Secrets Store binding of the `previews` block (wrangler.jsonc). */
type Bindings = Env & {
  PREVIEW_AUTH_SECRET?: SecretsStoreSecret
  INVITES_LIMITER?: RateLimit
  SYNC_LIMITER?: RateLimit
}

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
// Limited per IP so that codes cannot be guessed (no session to key the limit on).
app.get('/invites/:code', async (c) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown'
  if (c.env.INVITES_LIMITER && !(await c.env.INVITES_LIMITER.limit({ key: ip })).success) return c.json({ error: 'rate_limited' }, 429)
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

app.put('/me/profile', async (c) => {
  const profile = parseProfile(await c.req.json().catch(() => null))
  if (!profile) return c.json({ error: 'bad_profile' }, 400)
  await saveProfile(c.env.DB, c.get('session').user.id, profile)
  return c.json({ ok: true })
})

// The photo arrives as the bytes of a 256×256 image cut on the phone (docs/SPEC.md §13.2).
const avatarBodyLimit = bodyLimit({ maxSize: MAX_AVATAR_BYTES, onError: (c) => c.json({ error: 'too_large' }, 413) })

app.put('/me/avatar', avatarBodyLimit, async (c) => {
  const bytes = new Uint8Array(await c.req.arrayBuffer())
  const type = imageType(bytes)
  if (!type) return c.json({ error: 'bad_image' }, 400)
  const image = await saveAvatar(c.env.DB, c.get('session').user.id, bytes, type, new Date().toISOString())
  return c.json({ image })
})

app.delete('/me/avatar', async (c) => {
  await removeAvatar(c.env.DB, c.get('session').user.id)
  return c.json({ ok: true })
})

// «Сбросить аккаунт» and «Удалить аккаунт» (docs/SPEC.md §13.2): only one's own, by the session, and
// only with the word for it in the body — a stray request with the cookie wipes nothing.
const confirmed = async (req: Request, word: 'reset' | 'delete') =>
  ((await req.json().catch(() => null)) as { confirm?: unknown } | null)?.confirm === word

app.post('/me/reset', async (c) => {
  if (!(await confirmed(c.req.raw, 'reset'))) return c.json({ error: 'not_confirmed' }, 400)
  const groupId = await resetAccount(c.env.DB, c.get('session').user.id, new Date())
  return c.json({ groupId })
})

app.delete('/me', async (c) => {
  if (!(await confirmed(c.req.raw, 'delete'))) return c.json({ error: 'not_confirmed' }, 400)
  await deleteAccount(c.env.DB, c.get('session').user.id)
  return c.json({ ok: true })
})

// Seen by its owner and by the people in their groups. The address carries the version: cached for good.
app.get('/avatars/:userId', async (c) => {
  const avatar = await readAvatar(c.env.DB, c.get('session').user.id, c.req.param('userId'))
  if (!avatar) return c.json({ error: 'not_found' }, 404)
  return c.body(avatar.bytes, 200, {
    'content-type': avatar.type,
    'cache-control': 'private, max-age=31536000, immutable',
    'x-content-type-options': 'nosniff',
  })
})

app.post('/invites/:code/accept', async (c) => {
  const code = parseInviteCode(c.req.param('code'))
  const groupId = code && (await acceptInvite(c.get('auth'), c.env.DB, code, c.get('session').user.id, new Date()))
  if (groupId === 'limit') return c.json({ error: 'group_limit' }, 409)
  return groupId ? c.json({ groupId }) : c.json({ error: 'not_found' }, 404)
})

app.post('/groups', async (c) => {
  const { name } = await c.req.json<{ name?: unknown }>().catch(() => ({ name: undefined }))
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed || trimmed.length > MAX_GROUP_NAME) return c.json({ error: 'bad_name' }, 400)
  const groupId = await createGroup(c.get('auth'), c.env.DB, c.get('session').user.id, trimmed)
  return groupId === 'limit' ? c.json({ error: 'group_limit' }, 409) : c.json({ groupId })
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

// Checks the bytes actually read, not the `Content-Length` header: chunked bodies have none.
const syncBodyLimit = bodyLimit({ maxSize: SYNC_LIMITS.requestBytes, onError: (c) => c.json({ error: 'too_large' }, 413) })

app.post('/groups/:id/sync', syncBodyLimit, async (c) => {
  const groupId = c.req.param('id')
  const userId = c.get('session').user.id
  if (c.env.SYNC_LIMITER && !(await c.env.SYNC_LIMITER.limit({ key: userId })).success) return c.json({ error: 'rate_limited' }, 429)
  if (!(await isMember(c.env.DB, groupId, userId))) return c.json({ error: 'forbidden' }, 403)
  const req = parseSyncRequest(await c.req.json().catch(() => null))
  if (typeof req === 'string') return c.json({ error: req }, 400)
  const body = await syncGroup(c.env.DB, groupId, userId, req, new Date().toISOString())
  return c.body(body, 200, { 'content-type': 'application/json' })
})

app.notFound((c) => c.json({ error: 'not_found' }, 404))

export default app
