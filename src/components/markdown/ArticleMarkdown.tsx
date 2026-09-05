import React, { useState } from 'react'
import { Markdown } from '@tanstack/markdown/react'
import { highlightToHtml, normalizeLanguage } from '@tanstack/highlight'
import { generateSlug } from '../../lib/markdown/slug'
import { Check, Copy, ExternalLink, Hash } from 'lucide-react'

interface ArticleMarkdownProps {
  content: string
}

export function ArticleCodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  // Extract raw text from children
  let rawCode = ''
  let language = 'plaintext'

  // Extract text and language from code element child if present
  if (React.isValidElement(children)) {
    const codeProps = children.props as { className?: string; children?: React.ReactNode }
    if (codeProps.className) {
      const match = codeProps.className.match(/(?:language-|lang-)([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        language = match[1]
      }
    }
    rawCode = String(codeProps.children || '').replace(/\n$/, '')
  } else if (typeof children === 'string') {
    rawCode = children.replace(/\n$/, '')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is blocked
    }
  }

  // Perform highlight
  let highlightedHtml = ''
  try {
    const normalizedLang = normalizeLanguage(language)
    highlightedHtml = highlightToHtml(rawCode, { lang: normalizedLang })
  } catch {
    highlightedHtml = `<pre class="th-code"><code>${escapeHtml(rawCode)}</code></pre>`
  }

  return (
    <div className="relative group my-6 border border-[var(--border-subtle)] rounded-lg bg-[var(--code-bg)] overflow-hidden">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)]/80 border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)] font-mono">
        <span className="uppercase tracking-wider">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          className="touch-target px-2.5 py-1 text-xs rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--success)] stroke-[2]" aria-hidden="true" />
              <span className="text-[var(--success)] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Horizontal Scroll Containment */}
      <div
        className="code-scroll-container p-4 overflow-x-auto"
        tabIndex={0}
        aria-label={`${language} code block`}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function ArticleHeading({
  level,
  children,
  ...props
}: {
  level: 2 | 3 | 4
  children?: React.ReactNode
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const text = typeof children === 'string' ? children : String(children || '')
  const id = generateSlug(text)

  const anchor = (
    <a
      href={`#${id}`}
      aria-label={`Link to section ${text}`}
      className="touch-target text-[var(--text-muted)] hover:text-[var(--accent)] opacity-60 hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <Hash className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
    </a>
  )

  if (level === 2) {
    return (
      <h2 id={id} className="group relative flex items-center gap-2" {...props}>
        <span>{children}</span>
        {anchor}
      </h2>
    )
  }

  if (level === 3) {
    return (
      <h3 id={id} className="group relative flex items-center gap-2" {...props}>
        <span>{children}</span>
        {anchor}
      </h3>
    )
  }

  return (
    <h4 id={id} className="group relative flex items-center gap-2" {...props}>
      <span>{children}</span>
      {anchor}
    </h4>
  )
}

export function ArticleLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')
  const isUnsafe = /^(?:javascript|data|vbscript):/i.test(href || '')

  if (isUnsafe) {
    return <span className="text-[var(--error)] underline">{children}</span>
  }

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="inline-flex items-baseline gap-0.5 text-[var(--accent)] underline decoration-[var(--accent)]/40 hover:decoration-[var(--accent)] underline-offset-2 transition-colors break-words focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      {...props}
    >
      <span>{children}</span>
      {isExternal && (
        <ExternalLink className="w-3 h-3 inline stroke-[1.5] self-center ml-0.5 opacity-70" aria-hidden="true" />
      )}
    </a>
  )
}

export function ArticleTable({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-scroll-container my-6 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-secondary)]/30 overflow-x-auto">
      <table className="w-full text-left" {...props}>
        {children}
      </table>
    </div>
  )
}

export function ArticleQuote({
  children,
  ...props
}: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="border-l-4 border-[var(--border-strong)] pl-4 py-1 my-6 text-[var(--text-secondary)] italic bg-[var(--bg-secondary)]/40 rounded-r-md"
      {...props}
    >
      {children}
    </blockquote>
  )
}

export function ArticleImage({
  src,
  alt,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        className="max-w-full h-auto rounded-lg border border-[var(--border-subtle)] mx-auto"
        {...props}
      />
      {alt && (
        <figcaption className="text-center text-xs text-[var(--text-muted)] mt-2 italic">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

export function ArticleMarkdown({ content }: ArticleMarkdownProps) {
  return (
    <article className="prose-editorial max-w-none">
      <Markdown
        components={{
          h2: (props) => <ArticleHeading level={2} {...props} />,
          h3: (props) => <ArticleHeading level={3} {...props} />,
          h4: (props) => <ArticleHeading level={4} {...props} />,
          pre: (props) => <ArticleCodeBlock {...props} />,
          a: (props) => <ArticleLink {...props} />,
          table: (props) => <ArticleTable {...props} />,
          blockquote: (props) => <ArticleQuote {...props} />,
          img: (props) => <ArticleImage {...props} />,
        }}
      >
        {content}
      </Markdown>
    </article>
  )
}
