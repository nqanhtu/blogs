import React, { useState } from 'react'
import { createFileRoute, redirect, Link, useRouter } from '@tanstack/react-router'
import { checkAuthSessionServerFn, logoutServerFn } from '../../lib/server/auth'
import { getArticlesServerFn, deleteArticleServerFn } from '../../lib/server/articles'
import { ArticleCard } from '../../components/article/ArticleCard'
import { Plus, LogOut, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    const session = await checkAuthSessionServerFn()
    if (!session.authenticated) {
      throw redirect({ to: '/admin/login' })
    }
    const articles = await getArticlesServerFn()
    return { articles }
  },
  head: () => ({
    meta: [
      { title: 'Publisher Dashboard — Admin' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminDashboardComponent,
})

function AdminDashboardComponent() {
  const router = useRouter()
  const { articles: initialArticles } = Route.useLoaderData()
  const [articles, setArticles] = useState(initialArticles)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogout = async () => {
    await logoutServerFn()
    window.location.href = '/'
  }

  const handleDelete = async (slug: string) => {
    setErrorMessage(null)
    setActionMessage(null)
    try {
      const res = await deleteArticleServerFn({ data: slug })
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.metadata.slug !== slug))
        setActionMessage(`Article "${slug}" unpublished successfully.`)
        router.invalidate()
      } else {
        setErrorMessage(res.error || 'Failed to unpublish article.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while unpublishing.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-[var(--accent)] mb-1">
            Admin Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-title font-bold text-[var(--text-primary)]">
            Articles & Research
          </h1>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/new"
            className="touch-target px-4 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>New article</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out of publisher"
            className="touch-target px-3 py-2 border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div
          role="region"
          aria-live="polite"
          className="p-3.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Touch-Friendly Article Card Rows (iPhone-first) */}
      <section className="space-y-4" aria-label="Published articles">
        {articles.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--border-strong)] rounded-xl p-8 space-y-3">
            <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto stroke-[1.5]" aria-hidden="true" />
            <p className="text-base font-serif-title font-medium text-[var(--text-primary)]">
              No articles published yet
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Paste your first ChatGPT research document into the publisher to create a canonical article.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/new"
                className="touch-target inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-lg hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Write first article</span>
              </Link>
            </div>
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.metadata.slug}
              article={article}
              isAdmin={true}
              onDelete={handleDelete}
            />
          ))
        )}
      </section>
    </div>
  )
}
