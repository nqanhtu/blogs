import { defineHandler } from 'nitro'
import { getContentRepository } from '../../src/lib/content'
import { generateRssFeed } from '../../src/lib/seo/feed'

export default defineHandler(async () => {
  const repo = getContentRepository()
  const articles = await repo.listArticles()
  const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
  const xml = generateRssFeed(articles, siteUrl)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
})
