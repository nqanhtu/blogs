import React, { useState } from 'react'
import type { ArticleHeading } from '../../lib/markdown/types'
import { ChevronDown, ListFilter } from 'lucide-react'

interface TableOfContentsProps {
  headings: ArticleHeading[]
  mode?: 'mobile' | 'desktop'
}

export function MobileTableOfContents({ headings }: { headings: ArticleHeading[] }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!headings || headings.length === 0) return null

  const handleLinkClick = (id: string) => {
    setIsOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="lg:hidden my-6 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="touch-target w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-[var(--accent)] stroke-[1.5]" aria-hidden="true" />
          <span>On this page ({headings.length} sections)</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <nav
          className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)] space-y-1 max-h-[60vh] overflow-y-auto"
          aria-label="Table of contents"
        >
          {headings.map((heading, idx) => (
            <button
              key={`${heading.id}-${idx}`}
              type="button"
              onClick={() => handleLinkClick(heading.id)}
              className={`block w-full text-left py-2 px-2 text-sm rounded hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${
                heading.level === 3 ? 'pl-6 text-xs' : ''
              }`}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

export function DesktopTableOfContents({ headings }: { headings: ArticleHeading[] }) {
  if (!headings || headings.length === 0) return null

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.pushState(null, '', `#${id}`)
    }
  }

  return (
    <aside
      className="hidden lg:block w-64 shrink-0 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto p-4 border-l border-[var(--border-subtle)] self-start"
      aria-label="Article Table of Contents"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
        <ListFilter className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
        <span>On this page</span>
      </div>
      <nav className="space-y-1 text-sm">
        {headings.map((heading, idx) => (
          <a
            key={`${heading.id}-${idx}`}
            href={`#${heading.id}`}
            onClick={(e) => handleLinkClick(e, heading.id)}
            className={`block py-1.5 transition-colors line-clamp-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${
              heading.level === 3
                ? 'pl-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                : 'font-medium'
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  )
}
