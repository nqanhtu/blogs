import React from 'react'
import { Link } from '@tanstack/react-router'
import { Rss } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 mt-20 pb-safe">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center space-x-2">
          <span>Editorial Technology Journal</span>
          <span>&middot;</span>
          <span>Markdown as canonical truth</span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="RSS 2.0 Feed"
          >
            <Rss className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            <span>RSS</span>
          </a>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Sitemap
          </a>
          <Link
            to="/admin/login"
            className="touch-target hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
