import { parseMarkdown } from '@tanstack/markdown/parser'
import { collectMarkdownHeadings } from '@tanstack/markdown/extensions/headings'
import { detectChatGPTCitations, CHATGPT_CITATION_ERROR_MESSAGE } from './citations'
import { isValidSlug } from './slug'
import type { ArticleHealth, ArticleHealthItem, ArticleMetadata } from './types'

export interface ValidationContext {
  existingSlugs?: string[]
  currentSlug?: string
}

/**
 * Validates article metadata, body markdown, headings, links, code blocks, and citations.
 * Returns an ArticleHealth report with success, warning, and error items.
 */
export function validateArticle(
  markdown: string,
  metadata: Partial<ArticleMetadata>,
  context: ValidationContext = {}
): ArticleHealth {
  const items: ArticleHealthItem[] = []
  let hasError = false

  const addError = (message: string) => {
    hasError = true
    items.push({ type: 'error', message })
  }

  const addWarning = (message: string) => {
    items.push({ type: 'warning', message })
  }

  const addSuccess = (message: string) => {
    items.push({ type: 'success', message })
  }

  // 1. Title validation
  const title = metadata.title?.trim()
  if (!title) {
    addError('Title is missing. Provide a title or include an H1 heading in your markdown.')
  } else {
    addSuccess('Title detected')
  }

  // 2. Slug validation
  const slug = metadata.slug?.trim()
  if (!slug) {
    addError('Slug is required')
  } else if (!isValidSlug(slug)) {
    addError('Slug is invalid (must be lowercase alphanumeric with hyphens)')
  } else {
    const existingSlugs = context.existingSlugs || []
    const isConflict = existingSlugs.includes(slug) && slug !== context.currentSlug
    if (isConflict) {
      addError(`Slug "${slug}" is already in use by another article`)
    } else {
      addSuccess(`Slug valid: ${slug}`)
    }
  }

  // 3. Body presence
  if (!markdown || !markdown.trim()) {
    addError('Article body is empty')
  }

  // 4. Description check
  if (!metadata.description?.trim()) {
    addWarning('Description is missing (recommended for SEO and social sharing)')
  } else {
    addSuccess('Description present')
  }

  // 5. Tags check
  if (!metadata.tags || metadata.tags.length === 0) {
    addWarning('No tags specified (helps organize research by topic)')
  }

  // 6. ChatGPT Citation Artifacts check
  const citationCheck = detectChatGPTCitations(markdown)
  if (citationCheck.hasUnresolved) {
    addError(
      `${CHATGPT_CITATION_ERROR_MESSAGE} Found: ${citationCheck.artifacts.slice(0, 3).join(', ')}`
    )
  } else {
    addSuccess('No unresolved citations')
  }

  // 7. Parse AST to inspect headings, code blocks, and links
  let codeBlocksCount = 0
  let externalLinksCount = 0
  let headingsCount = 0
  let duplicateH1Found = false
  let headingHierarchyBroken = false

  try {
    const ast = parseMarkdown(markdown || '')
    const headings = collectMarkdownHeadings(ast)
    headingsCount = headings.length

    // Check for H1 in body (the website renders the single page H1 from metadata)
    const h1Headings = headings.filter((h) => h.level === 1)
    if (h1Headings.length > 0) {
      duplicateH1Found = true
      addError(
        'Duplicate H1 found in article body. The title is automatically rendered as the page H1; use H2 or H3 inside the article.'
      )
    }

    // Check heading hierarchy progression (no jumping e.g. H2 -> H4 without H3)
    let prevLevel = 1
    for (const h of headings) {
      if (h.level > prevLevel + 1) {
        headingHierarchyBroken = true
        break
      }
      prevLevel = h.level
    }

    if (headingHierarchyBroken) {
      addWarning('Heading hierarchy skips levels (e.g. H2 directly to H4 without an H3)')
    } else if (headingsCount > 0 && !duplicateH1Found) {
      addSuccess('Heading hierarchy valid')
    }

    if (headingsCount > 0) {
      addSuccess(`Table of contents generated (${headingsCount} section${headingsCount > 1 ? 's' : ''})`)
    }

    // Traverse AST to count code blocks and inspect links
    const checkNode = (node: any) => {
      if (!node || typeof node !== 'object') return

      if (node.type === 'code_block' || node.type === 'code') {
        codeBlocksCount++
      }

      if (node.type === 'link') {
        const href = String(node.url || node.href || '')
        if (/^(?:javascript|data|vbscript):/i.test(href)) {
          addError(`Unsafe link URL detected: ${href}`)
        }
        if (/^https?:\/\//i.test(href)) {
          externalLinksCount++
        }
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          checkNode(child)
        }
      }
    }

    checkNode(ast)
  } catch (err: any) {
    addError(`Markdown parsing error: ${err.message || String(err)}`)
  }

  if (codeBlocksCount > 0) {
    addSuccess(`${codeBlocksCount} code block${codeBlocksCount > 1 ? 's' : ''}`)
  }
  if (externalLinksCount > 0) {
    addSuccess(`${externalLinksCount} external link${externalLinksCount > 1 ? 's' : ''}`)
  }

  // Word count & reading time
  const words = (markdown || '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))

  return {
    valid: !hasError,
    items,
    stats: {
      codeBlocks: codeBlocksCount,
      externalLinks: externalLinksCount,
      wordCount: words,
      readingTimeMinutes,
      headingsCount,
    },
  }
}
