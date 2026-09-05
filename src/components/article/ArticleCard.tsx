import React from 'react'
import { Link } from '@tanstack/react-router'
import type { ArticleSummary } from '../../lib/markdown/types'
import { Clock, Tag as TagIcon, ArrowUpRight, Edit3, Trash2 } from 'lucide-react'

interface ArticleCardProps {
  article: ArticleSummary
  isAdmin?: boolean
  onDelete?: (slug: string) => void
}

export function ArticleCard({ article, isAdmin, onDelete }: ArticleCardProps) {
  const { metadata, readingTimeMinutes } = article
  const isResearch = metadata.type === 'research'

  return (
    <article className="group p-5 sm:p-6 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] hover:border-[var(--border-strong)] transition-all">
      {/* Top Metadata row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${
              isResearch
                ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            {metadata.type}
          </span>
          <span>&middot;</span>
          <time dateTime={metadata.publishedAt}>{metadata.publishedAt}</time>
          {metadata.updatedAt && (
            <>
              <span>&middot;</span>
              <span className="italic">Updated {metadata.updatedAt}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
          <span>{readingTimeMinutes} min read</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-serif-title font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
        <Link
          to="/articles/$slug"
          params={{ slug: metadata.slug }}
          className="focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
        >
          {metadata.title}
        </Link>
      </h2>

      {/* Description */}
      {metadata.description && (
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
          {metadata.description}
        </p>
      )}

      {/* Bottom Footer row (Tags + Admin actions) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]/60 text-xs">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {metadata.tags.map((tag) => (
            <Link
              key={tag}
              to="/tags/$tag"
              params={{ tag }}
              className="touch-target px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors text-[11px] flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <TagIcon className="w-2.5 h-2.5 opacity-60" aria-hidden="true" />
              <span>{tag}</span>
            </Link>
          ))}
        </div>

        {/* Read link or Admin controls */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Link
              to="/admin/edit/$slug"
              params={{ slug: metadata.slug }}
              className="touch-target px-2.5 py-1 text-xs rounded border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Edit</span>
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to unpublish "${metadata.title}"?`)) {
                    onDelete(metadata.slug)
                  }
                }}
                className="touch-target px-2.5 py-1 text-xs rounded border border-[var(--border-subtle)] hover:border-[var(--error)] hover:bg-[var(--error)]/10 text-[var(--error)] flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--error)]"
                aria-label={`Unpublish ${metadata.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Unpublish</span>
              </button>
            )}
            <Link
              to="/articles/$slug"
              params={{ slug: metadata.slug }}
              className="touch-target px-2.5 py-1 text-xs rounded text-[var(--accent)] hover:underline flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <span>View</span>
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <Link
            to="/articles/$slug"
            params={{ slug: metadata.slug }}
            className="touch-target inline-flex items-center gap-1 text-[var(--accent)] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <span>Read article</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  )
}
