import React, { useState, useEffect, useTransition, useId } from 'react'
import { normalizeMarkdown } from '../../lib/markdown/normalize'
import { validateArticle } from '../../lib/markdown/validate'
import { generateSlug } from '../../lib/markdown/slug'
import { calculateReadingTime } from '../../lib/markdown/reading-time'
import type { ArticleHealth, ArticleMetadata, ArticleType } from '../../lib/markdown/types'
import { ArticleMarkdown } from '../markdown/ArticleMarkdown'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Send,
  Eye,
  Edit3,
} from 'lucide-react'

interface MarkdownPublisherProps {
  initialMarkdown?: string
  initialMetadata?: Partial<ArticleMetadata>
  isEditing?: boolean
  onPublish: (data: {
    markdown: string
    metadata: ArticleMetadata
  }) => Promise<{ success: boolean; slug: string; url: string; error?: string }>
}

const DRAFT_STORAGE_KEY = 'publisher_draft_v1'

export function MarkdownPublisher({
  initialMarkdown = '',
  initialMetadata = {},
  isEditing = false,
  onPublish,
}: MarkdownPublisherProps) {
  // Input states
  const [rawMarkdown, setRawMarkdown] = useState(initialMarkdown)
  const [title, setTitle] = useState(initialMetadata.title || '')
  const [slug, setSlug] = useState(initialMetadata.slug || '')
  const [description, setDescription] = useState(initialMetadata.description || '')
  const [type, setType] = useState<ArticleType>(initialMetadata.type || 'research')
  const [tagsInput, setTagsInput] = useState((initialMetadata.tags || []).join(', '))

  // View state: 'edit' vs 'preview' (for mobile tabbed view)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  // Validation & Processing states
  const [isPending, startTransition] = useTransition()
  const [health, setHealth] = useState<ArticleHealth>({
    valid: false,
    items: [],
    stats: { codeBlocks: 0, externalLinks: 0, wordCount: 0, readingTimeMinutes: 1, headingsCount: 0 },
  })
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle')
  const [publishResult, setPublishResult] = useState<{ url: string; slug: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [autosavedTime, setAutosavedTime] = useState<string | null>(null)

  // Generate unique form IDs for a11y labels
  const titleId = useId()
  const slugId = useId()
  const typeId = useId()
  const descId = useId()
  const tagsId = useId()
  const markdownId = useId()

  // 1. Restore draft on mount if creating new article
  useEffect(() => {
    if (!isEditing) {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') {
            if (parsed.rawMarkdown && !initialMarkdown) setRawMarkdown(parsed.rawMarkdown)
            if (parsed.title && !initialMetadata.title) setTitle(parsed.title)
            if (parsed.slug && !initialMetadata.slug) setSlug(parsed.slug)
            if (parsed.description && !initialMetadata.description) setDescription(parsed.description)
            if (parsed.type) setType(parsed.type)
            if (parsed.tagsInput) setTagsInput(parsed.tagsInput)
          }
        }
      } catch {
        // Ignore corrupted storage
      }
    }
  }, [isEditing, initialMarkdown, initialMetadata])

  // 2. Autosave draft to localStorage
  useEffect(() => {
    if (isEditing) return
    const timeout = setTimeout(() => {
      try {
        const draft = { rawMarkdown, title, slug, description, type, tagsInput }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        const now = new Date()
        setAutosavedTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        )
      } catch {
        // Storage quota full or unavailable
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [rawMarkdown, title, slug, description, type, tagsInput, isEditing])

  // 3. Re-validate article health on content change
  useEffect(() => {
    startTransition(() => {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const meta: Partial<ArticleMetadata> = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        type,
        tags,
      }

      const h = validateArticle(rawMarkdown, meta)
      setHealth(h)
    })
  }, [rawMarkdown, title, slug, description, type, tagsInput])

  // 4. Auto-normalize pasted ChatGPT Markdown
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setRawMarkdown(val)

    // If title or slug are empty, attempt automatic detection from input
    if (!title) {
      const norm = normalizeMarkdown(val)
      if (norm.extractedTitle) {
        setTitle(norm.extractedTitle)
        if (!slug) {
          setSlug(generateSlug(norm.extractedTitle))
        }
      }
      if (norm.extractedMetadata?.description && !description) {
        setDescription(norm.extractedMetadata.description)
      }
    }
  }

  // Handle explicit Auto-Format button
  const handleAutoNormalize = () => {
    const norm = normalizeMarkdown(rawMarkdown)
    setRawMarkdown(norm.normalizedMarkdown)
    if (norm.extractedTitle && !title) {
      setTitle(norm.extractedTitle)
      if (!slug) setSlug(generateSlug(norm.extractedTitle))
    }
  }

  // Auto-generate slug from title
  const handleGenerateSlug = () => {
    if (title) {
      setSlug(generateSlug(title))
    }
  }

  // Clear draft action
  const handleClearDraft = () => {
    if (confirm('Clear the current draft? All unsaved text will be removed.')) {
      setRawMarkdown('')
      setTitle('')
      setSlug('')
      setDescription('')
      setTagsInput('')
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setAutosavedTime(null)
    }
  }

  // Copy published URL
  const handleCopyUrl = async () => {
    if (publishResult?.url) {
      try {
        await navigator.clipboard.writeText(publishResult.url)
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2500)
      } catch {
        // Fallback
      }
    }
  }

  // Handle Publish Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!health.valid) {
      setErrorMessage('Please resolve article health errors before publishing.')
      return
    }

    setPublishStatus('publishing')
    setErrorMessage(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const publishedAt =
      initialMetadata.publishedAt || new Date().toISOString().slice(0, 10)
    const updatedAt = isEditing ? new Date().toISOString().slice(0, 10) : undefined

    const metadata: ArticleMetadata = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      type,
      tags,
      publishedAt,
      updatedAt,
    }

    try {
      const result = await onPublish({
        markdown: rawMarkdown,
        metadata,
      })

      if (result.success) {
        setPublishStatus('success')
        setPublishResult({ url: result.url, slug: result.slug })
        if (!isEditing) {
          localStorage.removeItem(DRAFT_STORAGE_KEY)
        }
      } else {
        setPublishStatus('error')
        setErrorMessage(result.error || 'Publication failed.')
      }
    } catch (err: any) {
      setPublishStatus('error')
      setErrorMessage(err.message || 'Server error occurred during publication.')
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif-title font-bold text-[var(--text-primary)]">
            {isEditing ? `Edit: ${initialMetadata.title || 'Article'}` : 'Markdown Research Publisher'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Optimized for pasting research directly from ChatGPT / Deep Research.
          </p>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={handleClearDraft}
              aria-label="Clear current draft content"
              className="touch-target px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--error)]"
              title="Clear draft"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              <span>Clear draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAutoNormalize}
            aria-label="Clean and normalize Markdown structure"
            className="touch-target px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md transition-colors flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="Clean formatting, strip H1, format code blocks"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>Normalize</span>
          </button>
        </div>
      </div>

      {/* Success Banner when published */}
      {publishStatus === 'success' && publishResult && (
        <div
          role="region"
          aria-live="polite"
          className="p-5 border border-[var(--success)]/40 rounded-xl bg-[var(--success)]/10 space-y-3"
        >
          <div className="flex items-center gap-2 text-[var(--success)] font-semibold text-base">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span>{isEditing ? 'Article updated successfully!' : 'Article published successfully!'}</span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Canonical URL is live and immediately accessible:
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={publishResult.url}
              aria-label="Published canonical URL"
              className="w-full sm:flex-1 px-3 py-2 text-sm bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg font-mono text-[var(--text-primary)]"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="touch-target px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5 transition-opacity"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>Copy link</span>
                </>
              )}
            </button>
            <a
              href={publishResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target px-4 py-2 border border-[var(--border-strong)] text-sm font-medium rounded-lg hover:bg-[var(--bg-secondary)] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View article</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 border border-[var(--error)]/40 rounded-xl bg-[var(--error)]/10 text-[var(--error)] text-sm flex items-start gap-2"
        >
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold">Publication Error</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Safari iPhone First: Mobile Tab Switcher [Edit] [Preview] */}
      <div className="lg:hidden flex items-center border border-[var(--border-subtle)] rounded-lg p-1 bg-[var(--bg-secondary)]">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`touch-target flex-1 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'edit'
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Edit3 className="w-4 h-4" aria-hidden="true" />
          <span>Edit & Metadata</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`touch-target flex-1 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'preview'
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Main Workspace (Split on Desktop, Tabbed on Mobile) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN: Input & Metadata (Visible if mobile 'edit' or desktop) */}
          <div className={`space-y-6 ${activeTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
            {/* Metadata Section */}
            <div className="p-4 sm:p-5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-secondary)]/40 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Article Metadata
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label htmlFor={titleId} className="block text-xs font-medium text-[var(--text-secondary)]">
                  Title <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  id={titleId}
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (!slug) setSlug(generateSlug(e.target.value))
                  }}
                  placeholder="e.g. Docker Images and Containers — A Mental Model"
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all"
                />
              </div>

              {/* Slug Input with Auto button */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor={slugId} className="block text-xs font-medium text-[var(--text-secondary)]">
                    URL Slug <span className="text-[var(--error)]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="touch-target px-2 py-0.5 text-xs text-[var(--accent)] hover:underline"
                  >
                    Auto-generate
                  </button>
                </div>
                <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]">
                  <span className="px-3 py-2 text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] select-none">
                    /articles/
                  </span>
                  <input
                    id={slugId}
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="docker-images-and-containers"
                    className="flex-1 px-3 py-2.5 bg-transparent text-[var(--text-primary)] outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={typeId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Article Type
                  </label>
                  <select
                    id={typeId}
                    value={type}
                    onChange={(e) => setType(e.target.value as ArticleType)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none"
                  >
                    <option value="research">Research (Deep Dive)</option>
                    <option value="note">Note (Quick Take)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={tagsId} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    id={tagsId}
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="docker, devops, linux"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label htmlFor={descId} className="block text-xs font-medium text-[var(--text-secondary)]">
                  Description (Summary for SEO & Previews)
                </label>
                <textarea
                  id={descId}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A clear 1-2 sentence overview of this research article…"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none resize-none"
                />
              </div>
            </div>

            {/* Markdown Editor Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <label htmlFor={markdownId} className="font-semibold uppercase tracking-wider">
                  Markdown Content
                </label>
                <div className="flex items-center gap-3 font-mono">
                  {autosavedTime && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Draft saved {autosavedTime}
                    </span>
                  )}
                  <span>{health.stats.wordCount} words</span>
                  <span>&middot;</span>
                  <span>{health.stats.readingTimeMinutes} min read</span>
                </div>
              </div>

              <textarea
                id={markdownId}
                required
                rows={16}
                value={rawMarkdown}
                onChange={handleMarkdownChange}
                placeholder="Paste Markdown copied from ChatGPT or Deep Research here...

## 1. Introduction
Key concepts explained in structured prose...

```typescript
// Code blocks and tables render with high precision
```"
                className="w-full p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-relaxed focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-y min-h-[350px]"
              />
            </div>

            {/* Article Health Card */}
            <div className="p-4 sm:p-5 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-secondary)]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>Article Health</span>
                  {health.valid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--success)]/20 text-[var(--success)] font-medium">
                      Ready to Publish
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--error)]/20 text-[var(--error)] font-medium">
                      Action Required
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  {health.stats.headingsCount} headings &middot; {health.stats.codeBlocks} code blocks
                </div>
              </div>

              <ul className="space-y-1.5 text-xs">
                {health.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {item.type === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {item.type === 'warning' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)] shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    {item.type === 'error' && (
                      <XCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span
                      className={
                        item.type === 'error'
                          ? 'text-[var(--error)] font-medium'
                          : item.type === 'warning'
                          ? 'text-[var(--warning)]'
                          : 'text-[var(--text-secondary)]'
                      }
                    >
                      {item.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Publish CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!health.valid || publishStatus === 'publishing'}
                className="touch-target w-full py-3.5 px-6 rounded-xl bg-[var(--accent)] text-white font-medium text-base hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {publishStatus === 'publishing' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Publishing…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>{isEditing ? 'Publish Update' : 'Publish Article'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Reading Preview (Visible if mobile 'preview' or desktop) */}
          <div
            className={`p-6 sm:p-8 border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] shadow-xs min-h-[500px] ${
              activeTab === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-3 mb-6 flex items-center justify-between">
              <span>Live Reading Preview</span>
              <span className="font-mono text-[11px]">{calculateReadingTime(rawMarkdown)} min read</span>
            </div>

            {/* Article Preview Header */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] uppercase tracking-wide">
                <span className="font-medium text-[var(--accent)]">{type}</span>
                <span>&middot;</span>
                <time>{initialMetadata.publishedAt || new Date().toISOString().slice(0, 10)}</time>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif-title font-bold text-[var(--text-primary)] leading-tight">
                {title || 'Untitled Article'}
              </h1>

              {description && (
                <p className="text-base text-[var(--text-secondary)] italic leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Article Markdown Body */}
            {rawMarkdown.trim() ? (
              <ArticleMarkdown content={rawMarkdown} />
            ) : (
              <div className="py-16 text-center text-sm text-[var(--text-muted)] italic">
                Paste or type Markdown on the left to see the live editorial presentation here.
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
