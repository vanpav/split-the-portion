import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** The branch Workers Builds deploys to production (docs/CLOUDFLARE.md §8). */
const PRODUCTION_BRANCH = 'main'

export interface AppVersionInput {
  /** `version` from package.json; only MAJOR.MINOR is used. */
  base: string
  /** Commits in the history of the built commit; null when git is unavailable. */
  commitCount: number | null
  /** Full or short sha of the built commit; null when unknown. */
  sha: string | null
  /** Branch Workers Builds builds; null outside CI. */
  branch: string | null
  isCi: boolean
}

/**
 * `0.1.312` on production, `0.1.312-b241417` on a branch preview, `0.1.312-b241417-dev` locally.
 * PATCH is the commit count, so every merge into main raises it.
 */
export function formatAppVersion({ base, commitCount, sha, branch, isCi }: AppVersionInput): string {
  const [major = '0', minor = '0'] = base.split('.')
  const version = `${major}.${minor}.${commitCount ?? 0}`
  const shortSha = sha ? sha.slice(0, 7) : 'unknown'
  if (!isCi) return `${version}-${shortSha}-dev`
  if (branch === PRODUCTION_BRANCH && commitCount !== null) return version
  return `${version}-${shortSha}`
}

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

/** Reads the version inputs from package.json, git and the Workers Builds environment. */
export function readAppVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
  const isCi = process.env.WORKERS_CI === '1'
  // Workers Builds may clone shallowly; the count needs the whole history.
  if (git('rev-parse --is-shallow-repository') === 'true') git('fetch --unshallow --quiet')
  const count = Number(git('rev-list --count HEAD'))
  return formatAppVersion({
    base: pkg.version,
    commitCount: Number.isInteger(count) && count > 0 ? count : null,
    sha: (isCi ? process.env.WORKERS_CI_COMMIT_SHA : null) || git('rev-parse HEAD'),
    branch: isCi ? (process.env.WORKERS_CI_BRANCH ?? null) : null,
    isCi,
  })
}
