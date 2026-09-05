import { createRootRoute, Outlet, ScrollRestoration, HeadContent, Scripts } from '@tanstack/react-router'
import { Header } from '../components/ui/Header'
import { Footer } from '../components/ui/Footer'
import styles from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Personal Markdown Research Journal' },
      { name: 'description', content: 'Lightweight personal research journal and markdown publisher.' },
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'alternate', type: 'application/rss+xml', title: 'RSS Feed', href: '/feed.xml' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold mb-2">404 Error</div>
      <h1 className="text-3xl font-serif-title font-bold text-[var(--text-primary)] mb-3">Article Not Found</h1>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
        The research article, note, or document you are looking for has been moved, unpublished, or does not exist.
      </p>
      <a
        href="/"
        className="touch-target px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        Return to Journal
      </a>
    </div>
  ),
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-white focus:rounded-lg focus:shadow-md focus:outline-none"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1 w-full">
          <Outlet />
        </main>
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
