import { defineHandler } from 'nitro'
import { generateRobotsTxt } from '../../src/lib/seo/feed'

export default defineHandler(async () => {
  const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:3000'
  const text = generateRobotsTxt(siteUrl)

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
})
