import crypto from 'node:crypto'

export interface SessionPayload {
  role: 'admin'
  expiresAt: number
}

const DEFAULT_SESSION_SECRET = 'antigravity-development-secret-key-replace-in-production'

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export function createSessionToken(payload: SessionPayload): string {
  const secret = getSessionSecret()
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${signature}`
}

/**
 * Verifies and parses a signed session token. Returns null if expired or invalid.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null

  const [data, signature] = token.split('.')
  if (!data || !signature) return null

  const secret = getSessionSecret()
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url')

  try {
    const isSigMatch = crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSig, 'utf-8')
    )
    if (!isSigMatch) return null

    const jsonStr = Buffer.from(data, 'base64url').toString('utf-8')
    const payload = JSON.parse(jsonStr) as SessionPayload

    if (payload.role !== 'admin' || typeof payload.expiresAt !== 'number') {
      return null
    }

    if (Date.now() > payload.expiresAt) {
      return null // Expired
    }

    return payload
  } catch {
    return null
  }
}

export const SESSION_COOKIE_NAME = 'publisher_admin_session'

export function getSessionFromCookieHeader(cookieHeader?: string | null): SessionPayload | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`))
  if (!match || !match[1]) return null
  return verifySessionToken(decodeURIComponent(match[1]))
}

export function createSessionCookieHeader(token: string, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  const isProd = process.env.NODE_ENV === 'production'
  const secure = isProd ? '; Secure' : ''
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
}
