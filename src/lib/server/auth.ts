import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { verifyAdminPassword } from '../auth/verify'
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '../auth/session'

export const checkAuthSessionServerFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const cookie = getCookie(SESSION_COOKIE_NAME)
    if (!cookie) return { authenticated: false }

    const session = verifySessionToken(cookie)
    return { authenticated: Boolean(session && session.role === 'admin') }
  }
)

export const loginServerFn = createServerFn({ method: 'POST' })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const isValid = verifyAdminPassword(data.password)
    if (!isValid) {
      return { success: false, error: 'Invalid password. Please try again.' }
    }

    const token = createSessionToken({
      role: 'admin',
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    const isProd = process.env.NODE_ENV === 'production'
    setCookie(SESSION_COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true }
  })

export const logoutServerFn = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
  })
  return { success: true }
})
