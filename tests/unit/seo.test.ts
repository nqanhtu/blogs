import { describe, it, expect } from 'vitest'
import { generateRssFeed, generateSitemap, generateRobotsTxt } from '../../src/lib/seo/feed'
import { generateStructuredData } from '../../src/lib/seo/meta'

describe('SEO & Feed Utilities', () => {
  const sampleArticles = [
    {
      metadata: {
        title: 'Docker Images & Containers',
        slug: 'docker-images-and-containers',
        description: 'A mental model for containers.',
        type: 'research' as const,
        tags: ['docker', 'devops'],
        publishedAt: '2026-09-05',
      },
      readingTimeMinutes: 5,
    },
  ]

  it('generates valid RSS 2.0 feed', () => {
    const xml = generateRssFeed(sampleArticles, 'https://example.com')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>Docker Images &amp; Containers</title>')
    expect(xml).toContain('<link>https://example.com/articles/docker-images-and-containers</link>')
    expect(xml).toContain('<category>docker</category>')
  })

  it('generates valid Sitemap XML', () => {
    const sitemap = generateSitemap(sampleArticles, 'https://example.com')
    expect(sitemap).toContain('<urlset')
    expect(sitemap).toContain('<loc>https://example.com/articles/docker-images-and-containers</loc>')
    expect(sitemap).toContain('<lastmod>2026-09-05</lastmod>')
  })

  it('generates Robots.txt protecting /admin', () => {
    const robots = generateRobotsTxt('https://example.com')
    expect(robots).toContain('Disallow: /admin')
    expect(robots).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('generates structured data for TechArticle', () => {
    const jsonLd = generateStructuredData(sampleArticles[0]!.metadata, 'https://example.com/article')
    expect(jsonLd['@type']).toBe('TechArticle')
    expect(jsonLd.headline).toBe('Docker Images & Containers')
    expect(jsonLd.url).toBe('https://example.com/article')
  })
})
