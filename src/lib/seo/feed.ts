import type { ArticleSummary } from '../markdown/types'

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateRssFeed(articles: ArticleSummary[], siteUrl: string): string {
  const cleanUrl = siteUrl.replace(/\/+$/, '')
  const latestPubDate = articles[0]?.metadata.publishedAt
    ? new Date(articles[0].metadata.publishedAt).toUTCString()
    : new Date().toUTCString()

  const itemsXml = articles
    .map((item) => {
      const { metadata } = item
      const itemUrl = `${cleanUrl}/articles/${metadata.slug}`
      const pubDate = new Date(metadata.publishedAt).toUTCString()

      return `    <item>
      <title>${escapeXml(metadata.title)}</title>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <description>${escapeXml(metadata.description || metadata.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(metadata.type)}</category>
      ${metadata.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Personal Markdown Research Journal</title>
    <link>${cleanUrl}</link>
    <description>Technical research, deep dives, and mental models.</description>
    <language>en</language>
    <lastBuildDate>${latestPubDate}</lastBuildDate>
    <atom:link href="${cleanUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`
}

export function generateSitemap(articles: ArticleSummary[], siteUrl: string): string {
  const cleanUrl = siteUrl.replace(/\/+$/, '')

  // Static routes
  const staticUrls = [
    { loc: `${cleanUrl}/`, changefreq: 'daily', priority: '1.0' },
  ]

  // Dynamic article URLs
  const articleUrls = articles.map((article) => ({
    loc: `${cleanUrl}/articles/${article.metadata.slug}`,
    lastmod: article.metadata.updatedAt || article.metadata.publishedAt,
    changefreq: 'weekly',
    priority: article.metadata.type === 'research' ? '0.8' : '0.6',
  }))

  const allUrls = [...staticUrls, ...articleUrls]

  const urlsXml = allUrls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    ${'lastmod' in u ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`
}

export function generateRobotsTxt(siteUrl: string): string {
  const cleanUrl = siteUrl.replace(/\/+$/, '')
  return `# Robots.txt for Personal Markdown Research Publisher
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin

Sitemap: ${cleanUrl}/sitemap.xml
`
}
