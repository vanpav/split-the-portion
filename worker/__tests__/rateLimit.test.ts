import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../index'
import { localD1 } from './localD1'

let env: Env
let dispose: () => Promise<void>
beforeAll(async () => {
  ;({ env, dispose } = await localD1())
}, 30_000)
afterAll(() => dispose())

/** A limiter that lets `allowed` calls through, counting per key like the real binding. */
function fakeLimiter(allowed: number): RateLimit {
  const seen = new Map<string, number>()
  return {
    limit: async ({ key }) => {
      const n = (seen.get(key) ?? 0) + 1
      seen.set(key, n)
      return { success: n <= allowed }
    },
  }
}

describe('invite lookup rate limit', () => {
  it('answers 429 past the limit, per IP', async () => {
    const bindings = { ...env, BETTER_AUTH_SECRET: 'test-secret-0123456789abcdef0123456789', INVITES_LIMITER: fakeLimiter(2) }
    const get = (ip: string) => app.request('/api/invites/ABCDEFGH', { headers: { 'cf-connecting-ip': ip } }, bindings)
    expect([(await get('1.1.1.1')).status, (await get('1.1.1.1')).status]).toEqual([404, 404])
    expect((await get('1.1.1.1')).status).toBe(429)
    expect((await get('2.2.2.2')).status).toBe(404)
  })
})
