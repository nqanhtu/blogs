import React, { useState } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getArticleBySlugServerFn } from '../lib/server/articles'
import { ArticleMarkdown } from '../components/markdown/ArticleMarkdown'
import {
  MobileTableOfContents,
  DesktopTableOfContents,
} from '../components/article/TableOfContents'
import { generateStructuredData } from '../lib/seo/meta'
import { Clock, Tag as TagIcon, ArrowLeft, Share2, Check, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/articles/$slug')({
  loader: async ({ params }) => {
    const article = await getArticleBySlugServerFn({ data: params.slug })
    if (!article) {
      throw notFound()
    }
    return { article }
  },
  head: ({ loaderData, params }) => {
    if (!loaderData?.article) {
      return { meta: [{ title: 'Article Not Found' }] }
    }
    const { metadata } = loaderData.article
    const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
    const canonicalUrl = `${siteUrl.replace(/\/+$/, '')}/articles/${params.slug}`
    const ogImageUrl = `${siteUrl.replace(/\/+$/, '')}/og.svg?title=${encodeURIComponent(metadata.title)}&desc=${encodeURIComponent(metadata.description || '')}`
    const jsonLd = generateStructuredData(metadata, canonicalUrl)

    return {
      meta: [
        { title: `${metadata.title} — Journal` },
        { name: 'description', content: metadata.description || metadata.title },
        { name: 'keywords', content: metadata.tags.join(', ') },
        // Open Graph
        { property: 'og:title', content: metadata.title },
        { property: 'og:description', content: metadata.description || metadata.title },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:image', content: ogImageUrl },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: metadata.title },
        { name: 'twitter:description', content: metadata.description || metadata.title },
        { name: 'twitter:image', content: ogImageUrl },
      ],
      links: [{ rel: 'canonical', href: canonicalUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(jsonLd),
        },
      ],
    }
  },
  component: ArticleViewComponent,
})

function ArticleViewComponent() {
  const { article } = Route.useLoaderData()
  const { metadata, markdown, readingTimeMinutes, headings } = article
  const [copiedLink, setCopiedLink] = useState(false)

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: metadata.title,
          text: metadata.description,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch {
      // User cancelled share
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button & share toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 text-xs text-[var(--text-muted)]">
        <Link
          to="/"
          className="touch-target inline-flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded"
        >
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          <span>Back to Journal</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          aria-label={copiedLink ? 'Link copied' : 'Share article'}
          className="touch-target px-3 py-1.5 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
              <span className="text-[var(--success)] font-medium">Link Copied</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Share</span>
            </>
          )}
        </button>
      </div>

      {/* Main Two-Column Layout (Article prose + Sticky desktop TOC) */}
      <div className="lg:flex lg:gap-12 lg:items-start">
        {/* Main Article Content Container (Keeps readable max width) */}
        <div className="flex-1 min-w-0 max-w-prose lg:max-w-3xl">
          {/* Article Header (Safari iPhone: fast access to content) */}
          <header className="space-y-3 pb-6 border-b border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
              <span className="px-2 py-0.5 rounded uppercase font-semibold text-[11px] bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
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
              <span>&middot;</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 stroke-[1.5]" aria-hidden="true" />
                <span>{readingTimeMinutes} min read</span>
              </span>
            </div>

            {/* Exactly One Page H1 */}
            <h1 className="text-2xl sm:text-4xl font-serif-title font-bold tracking-tight text-[var(--text-primary)] leading-[1.2]">
              {metadata.title}
            </h1>

            {/* Description */}
            {metadata.description && (
              <p className="text-base sm:text-lg text-[var(--text-secondary)] italic leading-relaxed pt-1">
                {metadata.description}
              </p>
            )}

            {/* Tags Pills */}
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {metadata.tags.map((tag) => (
                  <Link
                    key={tag}
                    to="/tags/$tag"
                    params={{ tag }}
                    className="touch-target px-2.5 py-0.5 text-xs rounded bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                  >
                    <TagIcon className="w-2.5 h-2.5 opacity-60" aria-hidden="true" />
                    <span>#{tag}</span>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Mobile Table of Contents (Compact dropdown for iPhone) */}
          <MobileTableOfContents headings={headings} />

          {/* Article Markdown Body */}
          <div className="pt-6">
            <ArticleMarkdown content={markdown} />
          </div>

          {/* Article Footer & Return link */}
          <footer className="mt-16 pt-8 border-t border-[var(--border-subtle)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[var(--text-muted)]">
                Published on {metadata.publishedAt}
                {metadata.updatedAt && ` · Updated on ${metadata.updatedAt}`}
              </div>
              <Link
                to="/"
                className="touch-target text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Return to all articles</span>
              </Link>
            </div>
          </footer>
        </div>

        {/* Desktop Sticky Table of Contents */}
        <DesktopTableOfContents headings={headings} />
      </div>
    </div>
  )
}
