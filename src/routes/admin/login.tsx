import React, { useState } from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { loginServerFn, checkAuthSessionServerFn } from '../../lib/server/auth'
import { Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'

export const Route = createFileRoute('/admin/login')({
  loader: async () => {
    const session = await checkAuthSessionServerFn()
    if (session.authenticated) {
      throw redirect({ to: '/admin' })
    }
    return {}
  },
  head: () => ({
    meta: [
      { title: 'Sign In — Publisher Admin' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: LoginComponent,
})

function LoginComponent() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await loginServerFn({ data: { password } })
      if (res.success) {
        navigate({ to: '/admin' })
      } else {
        setError(res.error || 'Invalid credentials.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mx-auto flex items-center justify-center border border-[var(--accent)]/20">
            <KeyRound className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-serif-title font-bold text-[var(--text-primary)]">
            Publisher Sign In
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Enter your admin password to publish or edit articles.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Form: iOS Safari friendly: >=16px text size */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password…"
              className="w-full px-3.5 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="touch-target w-full py-3 px-4 rounded-lg bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
