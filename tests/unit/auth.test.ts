import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createSessionToken,
  verifySessionToken,
  getSessionFromCookieHeader,
  createSessionCookieHeader,
  clearSessionCookieHeader,
  SESSION_COOKIE_NAME,
} from '../../src/lib/auth/session'
import { verifyAdminPassword } from '../../src/lib/auth/verify'
import crypto from 'node:crypto'

describe('Auth Session & Token', () => {
  it('creates and verifies a valid session token', () => {
    const payload = {
      role: 'admin' as const,
      expiresAt: Date.now() + 1000 * 60 * 60,
    }
    const token = createSessionToken(payload)
    expect(token).toBeDefined()
    expect(token).toContain('.')

    const verified = verifySessionToken(token)
    expect(verified).not.toBeNull()
    expect(verified?.role).toBe('admin')
  })

  it('rejects an expired session token', () => {
    const payload = {
      role: 'admin' as const,
      expiresAt: Date.now() - 1000, // already expired
    }
    const token = createSessionToken(payload)
    const verified = verifySessionToken(token)
    expect(verified).toBeNull()
  })

  it('rejects a tampered session token', () => {
    const payload = {
      role: 'admin' as const,
      expiresAt: Date.now() + 10000,
    }
    const token = createSessionToken(payload)
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(verifySessionToken(tampered)).toBeNull()
  })

  it('extracts session from Cookie header', () => {
    const token = createSessionToken({
      role: 'admin',
      expiresAt: Date.now() + 50000,
    })
    const cookieHeader = `theme=dark; ${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; other=123`
    const session = getSessionFromCookieHeader(cookieHeader)
    expect(session).not.toBeNull()
    expect(session?.role).toBe('admin')
  })

  it('formats session cookie headers correctly', () => {
    const header = createSessionCookieHeader('my-token')
    expect(header).toContain(`${SESSION_COOKIE_NAME}=my-token`)
    expect(header).toContain('HttpOnly')
    expect(header).toContain('SameSite=Lax')

    const clearHeader = clearSessionCookieHeader()
    expect(clearHeader).toContain('Max-Age=0')
  })
})

describe('Password Verification', () => {
  const originalHash = process.env.ADMIN_PASSWORD_HASH

  beforeEach(() => {
    // Generate known hash for 'correct-horse-battery'
    const salt = '1234567890abcdef1234567890abcdef'
    const hash = crypto.pbkdf2Sync('correct-horse-battery', salt, 100000, 32, 'sha512').toString('hex')
    process.env.ADMIN_PASSWORD_HASH = `${hash}:${salt}`
  })

  afterEach(() => {
    process.env.ADMIN_PASSWORD_HASH = originalHash
  })

  it('accepts correct password', () => {
    expect(verifyAdminPassword('correct-horse-battery')).toBe(true)
  })

  it('rejects incorrect password', () => {
    expect(verifyAdminPassword('wrong-password')).toBe(false)
    expect(verifyAdminPassword('')).toBe(false)
  })
})
