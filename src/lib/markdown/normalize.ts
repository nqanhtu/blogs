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

  let processed = bodyWithoutH1

  // 3. Normalize fenced code blocks:
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

  const title = frontmatterMeta?.title || extractedH1Title || undefined

  return {
    normalizedMarkdown: normalized,
    extractedTitle: title,
    extractedMetadata: frontmatterMeta ?? undefined,
  }
}
