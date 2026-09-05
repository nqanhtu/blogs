import { parseMarkdown } from '@tanstack/markdown/parser'
import { collectMarkdownHeadings } from '@tanstack/markdown/extensions/headings'
import { ArticleMetadataSchema, parseFrontmatter } from './metadata'
import { calculateReadingTime } from './reading-time'
import type { Article } from './types'

/**
 * Parses canonical Markdown with YAML frontmatter into a complete Article object.
 */
export function parseArticle(rawMarkdown: string): Article {
  const { metadata: parsedMeta, content: body } = parseFrontmatter(rawMarkdown)
  if (!parsedMeta || !parsedMeta.title || !parsedMeta.slug) {
    throw new Error('Invalid article format: missing title or slug in frontmatter')
  }

  const validatedMeta = ArticleMetadataSchema.parse({
    title: parsedMeta.title,
    slug: parsedMeta.slug,
    description: parsedMeta.description || '',
    type: parsedMeta.type || 'research',
    tags: parsedMeta.tags || [],
    publishedAt: parsedMeta.publishedAt || new Date().toISOString().slice(0, 10),
    updatedAt: parsedMeta.updatedAt,
  })

  const cleanBody = body.trim()
  const ast = parseMarkdown(cleanBody)
  const collected = collectMarkdownHeadings(ast)

  const headings = collected.map((h) => ({
    id: h.id || '',
    text: h.text || '',
    level: h.level || 2,
  }))

  const readingTimeMinutes = calculateReadingTime(cleanBody)

  return {
    metadata: validatedMeta,
    markdown: cleanBody,
    readingTimeMinutes,
    headings,
  }
}
