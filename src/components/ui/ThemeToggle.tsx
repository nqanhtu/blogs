import React, { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme_preference') as ThemeMode | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      applyTheme('system')
    }
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else if (mode === 'light') {
      root.classList.remove('dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  const cycleTheme = () => {
    const next: ThemeMode = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    localStorage.setItem('theme_preference', next)
    applyTheme(next)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="touch-target p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <span className="w-5 h-5 block" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      className="touch-target p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />}
      {theme === 'dark' && <Moon className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />}
      {theme === 'system' && <Monitor className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />}
    </button>
  )
}
