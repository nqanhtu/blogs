import { defineHandler, getQuery } from 'nitro'

export default defineHandler(async (event) => {
  const query = getQuery(event)
  const title = String(query.title || 'Personal Markdown Research Journal')
  const description = String(query.desc || 'A personal journal of technical research, deep dives, and mental models.')
  const siteUrl = (process.env.PUBLIC_SITE_URL || 'http://localhost:3000').replace(/^https?:\/\//, '')

  // Escape XML characters
  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const safeTitle = escapeXml(title)
  const safeDesc = escapeXml(description.slice(0, 140) + (description.length > 140 ? '…' : ''))
  const safeDomain = escapeXml(siteUrl)

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: "Newsreader", Georgia, serif; font-size: 56px; font-weight: bold; fill: #191817; }
      .desc { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 26px; fill: #5c5852; line-height: 1.5; }
      .brand { font-family: ui-monospace, "SF Mono", monospace; font-size: 18px; font-weight: 600; letter-spacing: 0.15em; fill: #2e4a62; }
      .domain { font-family: ui-monospace, "SF Mono", monospace; font-size: 18px; fill: #8c867d; }
    </style>
  </defs>

  <!-- Background Warm Archival Paper -->
  <rect width="1200" height="630" fill="#fcfbf9" />

  <!-- Subtle Border Frame -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#e2ded4" stroke-width="2" rx="12" />

  <!-- Top Brand Label -->
  <text x="80" y="110" class="brand">EDITORIAL TECHNOLOGY JOURNAL</text>
  <line x1="80" y1="135" x2="1120" y2="135" stroke="#e2ded4" stroke-width="1.5" />

  <!-- Main Article Title -->
  <foreignObject x="80" y="180" width="1040" height="240">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Newsreader', Georgia, serif; font-size: 52px; font-weight: 700; color: #191817; line-height: 1.25; word-wrap: break-word;">
      ${safeTitle}
    </div>
  </foreignObject>

  <!-- Description Summary -->
  <foreignObject x="80" y="430" width="1040" height="90">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; color: #5c5852; font-style: italic; line-height: 1.4;">
      ${safeDesc}
    </div>
  </foreignObject>

  <!-- Bottom Divider & Domain -->
  <line x1="80" y1="520" x2="1120" y2="520" stroke="#e2ded4" stroke-width="1.5" />
  <text x="80" y="555" class="domain">${safeDomain}</text>
  <text x="1120" y="555" class="domain" text-anchor="end">Markdown Canonical</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
})
