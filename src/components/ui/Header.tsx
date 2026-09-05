import React from 'react'
import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'
import { PenSquare, BookOpen } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md pt-safe">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className="touch-target flex items-center gap-2 text-lg font-serif-title font-semibold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <BookOpen className="w-5 h-5 stroke-[1.5] text-[var(--accent)]" aria-hidden="true" />
            <span>Journal</span>
          </Link>

          {/* Editorial navigation links */}
          <nav className="hidden sm:flex items-center space-x-1" aria-label="Main Navigation">
            <Link
              to="/"
              className="touch-target px-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              activeProps={{ className: 'touch-target px-3 text-sm font-medium text-[var(--text-primary)] font-semibold' }}
            >
              All
            </Link>
            <Link
              to="/"
              search={{ type: 'research' }}
              className="touch-target px-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Research
            </Link>
            <Link
              to="/"
              search={{ type: 'note' }}
              className="touch-target px-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Notes
            </Link>
          </nav>
        </div>

        {/* Actions (Admin / Theme) */}
        <div className="flex items-center space-x-2">
          <Link
            to="/admin"
            className="touch-target px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            title="Publisher Dashboard"
          >
            <PenSquare className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            <span className="hidden xs:inline">Publisher</span>
          </Link>

          <div className="w-[1px] h-5 bg-[var(--border-subtle)] mx-1" aria-hidden="true" />

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
