import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getArticlesServerFn } from '../lib/server/articles'
import { ArticleCard } from '../components/article/ArticleCard'
import type { ArticleSummary } from '../lib/markdown/types'
import { Tag as TagIcon, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/tags/$tag')({
  loader: async ({ params }) => {
    const all: ArticleSummary[] = await getArticlesServerFn()
    const tag = params.tag.toLowerCase()
    const matching = all.filter((a: ArticleSummary) =>
      a.metadata.tags.map((t: string) => t.toLowerCase()).includes(tag)
    )

    if (matching.length === 0) {
      throw notFound()
    }

    return { tag: params.tag, articles: matching }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Articles tagged with #${loaderData?.tag} — Journal` },
      { name: 'description', content: `Articles and research tagged with #${loaderData?.tag}` },
    ],
  }),
  component: TagFilterComponent,
})

function TagFilterComponent() {
  const { tag, articles } = Route.useLoaderData()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="touch-target inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
          <span>Back to Journal</span>
        </Link>
      </div>

      {/* Tag Header */}
      <header className="border-b border-[var(--border-subtle)] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
          <TagIcon className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
          <span>Topic Archive</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-[var(--text-primary)]">
          #{tag}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Showing {articles.length} article{articles.length > 1 ? 's' : ''} categorized under this topic.
        </p>
      </header>

      {/* Articles List */}
      <section className="space-y-6" aria-label={`Articles tagged with #${tag}`}>
        {articles.map((article: ArticleSummary) => (
          <ArticleCard key={article.metadata.slug} article={article} />
        ))}
      </section>
    </div>
  )
}
