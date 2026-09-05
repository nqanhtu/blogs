import { extractFirstH1, parseFrontmatter } from './metadata'
import type { ArticleMetadata } from './types'

export interface NormalizationResult {
  normalizedMarkdown: string
  extractedTitle?: string
  extractedMetadata?: Partial<ArticleMetadata>
}

/**
 * Normalizes code fence language tags (e.g., "js" -> "javascript", "ts" -> "typescript")
 */
export function normalizeLanguageTag(lang: string): string {
  const map: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yml: 'yaml',
    md: 'markdown',
    golang: 'go',
  }
  const clean = lang.trim().toLowerCase()
  return map[clean] || clean
}

/**
 * Strips or escapes dangerous raw HTML tags (<script>, <iframe, <object>, <embed>, <applet>, <meta>, on* attributes).
 * Preserves standard markdown and code block contents.
 */
export function sanitizeDangerousHtml(text: string): string {
  // Disarm script, iframe, object, embed, form, input, textarea tags
  let result = text.replace(/<\s*(script|iframe|object|embed|applet|form|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  result = result.replace(/<\s*(script|iframe|object|embed|applet|form|style)[^>]*\/?>/gi, '')
  // Disarm inline event handlers like onclick=, onerror=, onload=
  result = result.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // Disarm javascript: URLs in html attributes
  result = result.replace(/(href|src)\s*=\s*["']?javascript:[^"'>\s]+/gi, '$1="#"')
  return result
}

/**
 * Auto-links bare URLs (https://...) that are not inside code blocks or already formatted as markdown links.
 */
export function linkifyBareUrls(markdown: string): string {
  // Split markdown by code blocks so we never alter code blocks
  const parts = markdown.split(/(```[\s\S]*?```|`[^`]+`)/g)

  const transformed = parts.map((part) => {
    // If it's a code block or inline code, leave untouched
    if (part.startsWith('`')) {
      return part
    }

    // Match bare http/https URLs that are NOT preceded by ( or [ or " or '
    return part.replace(
      /(^|[\s(])(https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'*+,;=%]+)(?=$|[\s)])/g,
      (match, prefix, url) => {
        // If url ends with punctuation like period or comma at sentence end, trim it
        let cleanUrl = url
        let trailing = ''
        if (/[.,;:!?]$/.test(cleanUrl)) {
          trailing = cleanUrl.slice(-1)
          cleanUrl = cleanUrl.slice(0, -1)
        }
        return `${prefix}<${cleanUrl}>${trailing}`
      }
    )
  })

  return transformed.join('')
}

/**
 * Fixes duplicate H1 headings in markdown body.
 * 1. Protects code blocks (fenced ``` and inline `).
 * 2. If the first H1 matches the document title, removes that H1 line.
 * 3. Demotes any other H1 headings (# Heading) to H2 (## Heading).
 * 4. Restores code blocks cleanly.
 */
export function fixDuplicateH1Headings(markdown: string, documentTitle?: string): string {
  if (!markdown || typeof markdown !== 'string') return ''

  // Protect code blocks (fenced and inline)
  const codeSegments: string[] = []
  const placeholder = '___CODE_SEGMENT_H1_PROTECT___'

  const textWithoutCode = markdown.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
    codeSegments.push(match)
    return `${placeholder}${codeSegments.length - 1}___`
  })

  const lines = textWithoutCode.split(/\r?\n/)
  const cleanTitle = documentTitle
    ? documentTitle.toLowerCase().replace(/[\s\-_:]+/g, ' ').trim()
    : null

  let hasHandledMatchingTitle = false
  const resultLines: string[] = []

  for (const line of lines) {
    if (typeof line !== 'string') continue
    // Match H1 heading: starts with '# ' (not '##')
    const h1Match = line.match(/^(\s*)#\s+([^\n\r]+)$/)

    if (h1Match && h1Match[2]) {
      const indent = h1Match[1] ?? ''
      const headingText = h1Match[2].trim()
      const cleanHeading = headingText.toLowerCase().replace(/[\s\-_:]+/g, ' ').trim()

      // If matches the document title, drop this line to avoid duplicate title in body
      if (!hasHandledMatchingTitle && cleanTitle && cleanHeading === cleanTitle) {
        hasHandledMatchingTitle = true
        continue
      }

      // Demote to H2
      resultLines.push(`${indent}## ${headingText}`)
    } else {
      resultLines.push(line)
    }
  }

  let processed = resultLines.join('\n')

  // Restore code blocks
  processed = processed.replace(
    /___CODE_SEGMENT_H1_PROTECT___(\d+)___/g,
    (_, idx) => codeSegments[Number(idx)] ?? ''
  )

  return processed
}

/**
 * Normalizes Markdown input copied from ChatGPT / Deep Research.
 */
export function normalizeMarkdown(raw: string): NormalizationResult {
  if (!raw || typeof raw !== 'string') {
    return { normalizedMarkdown: '' }
  }

  // 1. Extract existing frontmatter if any
  const { metadata: frontmatterMeta, content: withoutFrontmatter } = parseFrontmatter(raw)

  // 2. Extract first H1 heading
  const { title: extractedH1Title, remainingMarkdown: bodyWithoutH1 } =
    extractFirstH1(withoutFrontmatter)

  const title = frontmatterMeta?.title || extractedH1Title || undefined

  // 3. Demote any remaining H1 headings to H2 to prevent duplicate H1 errors
  let processed = fixDuplicateH1Headings(bodyWithoutH1, title)

  // 4. Normalize fenced code blocks:
  // - Ensure trailing code fences are properly closed
  const codeBlockRegex = /(```)([a-zA-Z0-9_\-\.]+)?([^\n]*\n)([\s\S]*?)(```|$)/g
  processed = processed.replace(codeBlockRegex, (match, open, lang, restOfFirstLine, code, close) => {
    const normalizedLang = lang ? normalizeLanguageTag(lang) : ''
    const ensureClose = close === '```' ? '```' : '\n```\n'
    return `${open}${normalizedLang}${restOfFirstLine}${code}${ensureClose}`
  })

  // 4. Sanitize dangerous HTML tags while preserving code contents
  const codeSegments: string[] = []
  const placeholder = '___CODE_SEGMENT_BLOCK___'

  // Temporarily replace code blocks to protect their exact content
  const textWithoutCode = processed.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
    codeSegments.push(match)
    return `${placeholder}${codeSegments.length - 1}___`
  })

  // Sanitize non-code content
  let sanitizedText = sanitizeDangerousHtml(textWithoutCode)

  // Linkify bare URLs in text
  sanitizedText = linkifyBareUrls(sanitizedText)

  // Restore code blocks with exact contents
  sanitizedText = sanitizedText.replace(
    /___CODE_SEGMENT_BLOCK___(\d+)___/g,
    (_, idx) => codeSegments[Number(idx)] ?? ''
  )

  // 5. Normalize excessive blank lines (collapse 3+ newlines to 2)
  let normalized = sanitizedText.replace(/\r\n/g, '\n')
  normalized = normalized.replace(/\n{3,}/g, '\n\n')

  // 6. Ensure trailing single newline
  normalized = normalized.trim() + '\n'

  return {
    normalizedMarkdown: normalized,
    extractedTitle: title,
    extractedMetadata: frontmatterMeta ?? undefined,
  }
}
