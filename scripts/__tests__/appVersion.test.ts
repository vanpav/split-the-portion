import { describe, expect, it } from 'vitest'
import { formatAppVersion } from '../appVersion'

const sha = 'b241417f00d1e2c3'

describe('formatAppVersion', () => {
  it('production build: MAJOR.MINOR from package.json, PATCH from the commit count', () => {
    expect(formatAppVersion({ base: '0.1.0', commitCount: 312, sha, branch: 'main', isCi: true })).toBe('0.1.312')
  })

  it('branch preview: adds the short sha', () => {
    expect(formatAppVersion({ base: '0.1.0', commitCount: 312, sha, branch: 'claude/feature', isCi: true })).toBe(
      '0.1.312-b241417',
    )
  })

  it('local build: short sha and -dev, even on main', () => {
    expect(formatAppVersion({ base: '0.1.0', commitCount: 312, sha, branch: null, isCi: false })).toBe(
      '0.1.312-b241417-dev',
    )
  })

  it('no git: PATCH 0 and an unknown sha, never a bare production version', () => {
    expect(formatAppVersion({ base: '0.1.0', commitCount: null, sha: null, branch: 'main', isCi: true })).toBe(
      '0.1.0-unknown',
    )
  })

  it('ignores the patch written in package.json', () => {
    expect(formatAppVersion({ base: '2.3.9', commitCount: 5, sha, branch: 'main', isCi: true })).toBe('2.3.5')
  })
})
