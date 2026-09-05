import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { getArticlesServerFn } from '../lib/server/articles'
import { ArticleCard } from '../components/article/ArticleCard'
import { Tag as TagIcon, Sparkles } from 'lucide-react'

const searchSchema = z.object({
  type: z.enum(['research', 'note']).optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async () => {
    const articles = await getArticlesServerFn()
    return { articles }
  },
  component: HomeComponent,
})

function HomeComponent() {
  const { articles } = Route.useLoaderData()
  const { type: activeType } = Route.useSearch()

  // Filter articles based on search params
  const filteredArticles = activeType
    ? articles.filter((a) => a.metadata.type === activeType)
    : articles

  const researchArticles = articles.filter((a) => a.metadata.type === 'research')
  const noteArticles = articles.filter((a) => a.metadata.type === 'note')

  // Collect all unique tags and counts
  const tagCounts: Record<string, number> = {}
  for (const a of articles) {
    for (const t of a.metadata.tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }
  const tagsList = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
      {/* Editorial Journal Statement */}
      <section className="space-y-4 border-b border-[var(--border-subtle)] pb-10">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Research Journal & Mental Models</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif-title font-bold tracking-tight text-[var(--text-primary)] leading-[1.15]">
          A personal journal of technical research, deep dives, and mental models.
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Turning ChatGPT and Deep Research sessions into canonical, beautifully typeset Markdown articles with zero formatting friction.
        </p>

        {/* Tab Filters */}
        <div className="pt-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Article type filter">
          <Link
            to="/"
            className={`touch-target px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              !activeType
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All Work ({articles.length})
          </Link>
          <Link
            to="/"
            search={{ type: 'research' }}
            className={`touch-target px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeType === 'research'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Research ({researchArticles.length})
          </Link>
          <Link
            to="/"
            search={{ type: 'note' }}
            className={`touch-target px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeType === 'note'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Notes ({noteArticles.length})
          </Link>
        </div>
      </section>

      {/* Articles List */}
      <section className="space-y-6" aria-label="Articles list">
        {filteredArticles.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] space-y-3">
            <p className="text-base font-serif-title">No articles found for this filter.</p>
            <Link to="/" className="touch-target text-xs text-[var(--accent)] hover:underline">
              View all articles
            </Link>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard key={article.metadata.slug} article={article} />
          ))
        )}
      </section>

      {/* Browse by Topic / Tags section */}
      {tagsList.length > 0 && (
        <section className="pt-8 border-t border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <TagIcon className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>Browse Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tagsList.map(([tag, count]) => (
              <Link
                key={tag}
                to="/tags/$tag"
                params={{ tag }}
                className="touch-target px-3 py-1.5 text-xs rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <span>#{tag}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-tertiary)] font-mono text-[var(--text-muted)]">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
